// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Fixture} from "./utils/Fixture.sol";
import {Roles, Tier, LotClass, LotStatus} from "../src/Types.sol";
import {KigaliLedger} from "../src/KigaliLedger.sol";
import {ScaleReading, LabCertificate, Attestations} from "../src/Attestations.sol";

contract LedgerTest is Fixture {
    // ================================================================ R1 quota-backed virgin supply

    function test_R1_mintWithinQuota() public {
        uint256 id = _mint(60_000);
        KigaliLedger.Lot memory l = ledger.getLot(id);
        assertEq(uint8(l.cls), uint8(LotClass.VIRGIN));
        assertEq(l.grams, 60_000);
        assertEq(l.origin, QUOTA_ID);
        (,,, uint64 used) = ledger.quotas(QUOTA_ID);
        assertEq(used, 60_000);
        _assertConservation(R404A);
    }

    function test_R1_revert_mintAboveQuota() public {
        _mint(60_000);
        vm.prank(importer);
        vm.expectRevert(abi.encodeWithSelector(KigaliLedger.QuotaExceeded.selector, 100_000, 100_001));
        ledger.mintVirgin(QUOTA_ID, 40_001, bytes32("c"));
    }

    function test_R1_revert_mintByNonHolder() public {
        address other = makeAddr("otherImporter");
        _grant(other, Roles.IMPORTER);
        vm.prank(other);
        vm.expectRevert(KigaliLedger.NotQuotaHolder.selector);
        ledger.mintVirgin(QUOTA_ID, 1, bytes32("c"));
    }

    function test_R1_revert_unknownQuota() public {
        vm.prank(importer);
        vm.expectRevert(KigaliLedger.UnknownQuota.selector);
        ledger.mintVirgin(keccak256("no-such-quota"), 1, bytes32("c"));
    }

    function test_R1_revert_onlyQuotaAuthorityRegisters() public {
        vm.prank(importer);
        vm.expectRevert(abi.encodeWithSelector(KigaliLedger.NotRole.selector, Roles.QUOTA_AUTHORITY));
        ledger.registerQuota(keccak256("self-issued"), importer, R404A, 1_000_000);
    }

    // ================================================================ R2 two-step transfers

    function test_R2_partialSendSplitsLot() public {
        uint256 id = _mint(100_000);
        uint256 sent = _move(id, importer, distributor, SCALE_DIST_PK, 30_000);
        assertTrue(sent != id, "partial send creates a child lot");
        assertEq(ledger.getLot(id).grams, 70_000);
        assertEq(ledger.getLot(sent).grams, 30_000);
        assertEq(ledger.getLot(sent).holder, distributor);
        assertEq(ledger.getLot(sent).parent, id);
        assertEq(uint8(ledger.getLot(sent).cls), uint8(LotClass.VIRGIN), "class is inherited");
        _assertConservation(R404A);
    }

    function test_R2_fullSendKeepsLotId() public {
        uint256 id = _mint(5_000);
        uint256 sent = _move(id, importer, distributor, SCALE_DIST_PK, 5_000);
        assertEq(sent, id);
        assertEq(ledger.getLot(id).holder, distributor);
    }

    function test_R2_revert_cannotSendMoreThanHeld() public {
        uint256 id = _mint(10_000);
        vm.prank(importer);
        vm.expectRevert(abi.encodeWithSelector(KigaliLedger.InsufficientGrams.selector, id, 10_000, 10_001));
        ledger.send(id, distributor, 10_001, bytes32(0));
    }

    function test_R2_revert_cannotSendToNonOperator() public {
        uint256 id = _mint(10_000);
        address stranger = makeAddr("stranger");
        vm.prank(importer);
        vm.expectRevert(abi.encodeWithSelector(KigaliLedger.NotOperator.selector, stranger));
        ledger.send(id, stranger, 1_000, bytes32(0));
    }

    function test_R2_revert_lotInTransitCannotBeSpent() public {
        uint256 id = _mint(10_000);
        vm.prank(importer);
        ledger.send(id, distributor, 10_000, bytes32(0));
        vm.prank(importer);
        vm.expectRevert(abi.encodeWithSelector(KigaliLedger.NotActive.selector, id));
        ledger.send(id, service, 1_000, bytes32(0));
    }

    function test_R2_underweightReceiptIsRecordedAsLossAndFlagged() public {
        uint256 id = _mint(10_000);
        vm.prank(importer);
        ledger.send(id, distributor, 10_000, bytes32(0));

        ScaleReading memory r = _reading(ledger.receiptSubject(id), 9_500); // 5 % short, tolerance is 1 %
        bytes memory sig = _signScale(SCALE_DIST_PK, r);
        vm.expectEmit(true, false, false, true, address(ledger));
        emit KigaliLedger.DiscrepancyFlagged(id, KigaliLedger.Discrepancy.UNDERWEIGHT_ON_RECEIPT, 10_000, 9_500);
        vm.prank(distributor);
        ledger.receiveLot(id, r, sig);

        assertEq(ledger.getLot(id).grams, 9_500);
        assertEq(ledger.totals(R404A).handlingLoss, 500);
        _assertConservation(R404A);
    }

    function test_R2_overweightReceiptCannotCreateMass() public {
        uint256 id = _mint(10_000);
        vm.prank(importer);
        ledger.send(id, distributor, 10_000, bytes32(0));
        ScaleReading memory r = _reading(ledger.receiptSubject(id), 12_000);
        bytes memory sig = _signScale(SCALE_DIST_PK, r);
        vm.expectEmit(true, false, false, true, address(ledger));
        emit KigaliLedger.DiscrepancyFlagged(id, KigaliLedger.Discrepancy.OVERWEIGHT_ON_RECEIPT, 10_000, 12_000);
        vm.prank(distributor);
        ledger.receiveLot(id, r, sig);
        assertEq(ledger.getLot(id).grams, 10_000, "mass cannot appear in transit");
        _assertConservation(R404A);
    }

    function test_R2_receiverMustUseOwnScale() public {
        uint256 id = _mint(10_000);
        vm.prank(importer);
        ledger.send(id, distributor, 10_000, bytes32(0));
        ScaleReading memory r = _reading(ledger.receiptSubject(id), 10_000);
        bytes memory sig = _signScale(SCALE_SERVICE_PK, r); // someone else's scale
        vm.prank(distributor);
        vm.expectRevert(
            abi.encodeWithSelector(KigaliLedger.ScaleNotOwnedByCaller.selector, vm.addr(SCALE_SERVICE_PK), service)
        );
        ledger.receiveLot(id, r, sig);
    }

    function test_R2_rejectReturnsLotToSender() public {
        uint256 id = _mint(10_000);
        vm.prank(importer);
        ledger.send(id, distributor, 10_000, bytes32(0));
        vm.prank(distributor);
        ledger.rejectLot(id);
        assertEq(uint8(ledger.getLot(id).status), uint8(LotStatus.ACTIVE));
        assertEq(ledger.getLot(id).holder, importer);
    }

    // ================================================================ charging

    function test_chargeMovesMassIntoEquipment() public {
        uint256 id = _mint(20_000);
        uint256 atService = _move(id, importer, service, SCALE_SERVICE_PK, 5_000);
        vm.prank(service);
        ledger.charge(atService, EQ_A, 3_000);
        assertEq(ledger.getLot(atService).grams, 2_000);
        assertEq(equipment.equipment(EQ_A).chargedGrams, 3_000);
        assertEq(ledger.totals(R404A).charged, 3_000);
        _assertConservation(R404A);
    }

    function test_revert_chargeWrongGas() public {
        vm.prank(service);
        uint256 other = ledger.declareUnknown(R134A, 5_000, bytes32("c"), bytes32("decl"));
        vm.prank(service);
        vm.expectRevert(); // EquipmentRegistry.GasMismatch bubbles up
        ledger.charge(other, EQ_A, 1_000);
    }

    // ================================================================ R3 recovery

    function test_R3_recoveryCreatesRecoveredLot() public {
        uint256 id = _recover(service, SCALE_SERVICE_PK, EQ_A, 8_000, true);
        KigaliLedger.Lot memory l = ledger.getLot(id);
        assertEq(uint8(l.cls), uint8(LotClass.RECOVERED));
        assertEq(uint8(l.tier), uint8(Tier.A));
        assertEq(l.origin, EQ_A);
        assertEq(ledger.totals(R404A).recovered, 8_000);
        _assertConservation(R404A);
    }

    function test_R3_revert_recoveryAboveNameplate() public {
        // nameplate 10 kg + 5 % tolerance = 10.5 kg cap
        bytes32 cyl = bytes32("cyl");
        ScaleReading memory r = _reading(ledger.recoverySubject(EQ_A, cyl), 10_501);
        bytes memory sig = _signScale(SCALE_SERVICE_PK, r);
        vm.prank(service);
        vm.expectRevert(); // RecoveryCapExceeded(10_500, 10_501)
        ledger.recover(EQ_A, cyl, true, r, sig);
    }

    // ================================================================ R4 + R5 reclamation

    function test_R4_reclaimWithinInput() public {
        uint256 rec = _recover(service, SCALE_SERVICE_PK, EQ_A, 8_000, true);
        uint256 atReclaimer = _move(rec, service, reclaimer, SCALE_RECLAIM_PK, 8_000);
        uint256 out = _reclaim(_one(atReclaimer), 7_500, 9_960);
        KigaliLedger.Lot memory l = ledger.getLot(out);
        assertEq(uint8(l.cls), uint8(LotClass.RECLAIMED));
        assertEq(l.grams, 7_500);
        assertEq(ledger.reclaimInputs(out)[0], atReclaimer);
        assertEq(ledger.totals(R404A).reclaimLoss, 500);
        _assertConservation(R404A);
    }

    function test_R4_revert_reclaimMoreThanInput() public {
        uint256 rec = _recover(service, SCALE_SERVICE_PK, EQ_A, 8_000, true);
        uint256 atReclaimer = _move(rec, service, reclaimer, SCALE_RECLAIM_PK, 8_000);
        // 8 kg in, 2 % minimum loss => at most 7.84 kg out
        bytes32 outCyl = bytes32("out");
        bytes32 subject = ledger.reclaimSubject(outCyl);
        ScaleReading memory r = _reading(subject, 20_000);
        LabCertificate memory c = _cert(subject, R404A, 9_960);
        bytes memory ss = _signScale(SCALE_RECLAIM_PK, r);
        bytes memory ls = _signLab(LAB_PK, c);
        vm.prank(reclaimer);
        vm.expectRevert(abi.encodeWithSelector(KigaliLedger.ReclaimExceedsInput.selector, 7_840, 20_000));
        ledger.reclaim(_one(atReclaimer), outCyl, r, ss, c, ls);
    }

    function test_R4_revert_purityBelowAhri700() public {
        uint256 rec = _recover(service, SCALE_SERVICE_PK, EQ_A, 8_000, true);
        uint256 atReclaimer = _move(rec, service, reclaimer, SCALE_RECLAIM_PK, 8_000);
        bytes32 outCyl = bytes32("out");
        bytes32 subject = ledger.reclaimSubject(outCyl);
        ScaleReading memory r = _reading(subject, 7_000);
        LabCertificate memory c = _cert(subject, R404A, 9_900);
        bytes memory ss = _signScale(SCALE_RECLAIM_PK, r);
        bytes memory ls = _signLab(LAB_PK, c);
        vm.prank(reclaimer);
        vm.expectRevert(abi.encodeWithSelector(KigaliLedger.PurityTooLow.selector, 9_900, 9_950));
        ledger.reclaim(_one(atReclaimer), outCyl, r, ss, c, ls);
    }

    function test_R5_revert_virginCannotBeReclaimed() public {
        uint256 v = _mint(20_000);
        uint256 atReclaimer = _move(v, importer, reclaimer, SCALE_RECLAIM_PK, 20_000);
        bytes32 outCyl = bytes32("out");
        bytes32 subject = ledger.reclaimSubject(outCyl);
        ScaleReading memory r = _reading(subject, 19_000);
        LabCertificate memory c = _cert(subject, R404A, 9_990);
        bytes memory ss = _signScale(SCALE_RECLAIM_PK, r);
        bytes memory ls = _signLab(LAB_PK, c);
        vm.prank(reclaimer);
        vm.expectRevert(abi.encodeWithSelector(KigaliLedger.ClassNotReclaimable.selector, atReclaimer, LotClass.VIRGIN));
        ledger.reclaim(_one(atReclaimer), outCyl, r, ss, c, ls);
    }

    function test_R5_revert_unknownCannotBeReclaimed() public {
        vm.prank(reclaimer);
        uint256 u = ledger.declareUnknown(R404A, 20_000, bytes32("legacy"), bytes32("decl"));
        bytes32 outCyl = bytes32("out");
        bytes32 subject = ledger.reclaimSubject(outCyl);
        ScaleReading memory r = _reading(subject, 19_000);
        LabCertificate memory c = _cert(subject, R404A, 9_990);
        bytes memory ss = _signScale(SCALE_RECLAIM_PK, r);
        bytes memory ls = _signLab(LAB_PK, c);
        vm.prank(reclaimer);
        vm.expectRevert(abi.encodeWithSelector(KigaliLedger.ClassNotReclaimable.selector, u, LotClass.UNKNOWN));
        ledger.reclaim(_one(u), outCyl, r, ss, c, ls);
    }

    function test_R5_revert_mixingVirginWithRecoveredIsRejected() public {
        uint256 rec = _recover(service, SCALE_SERVICE_PK, EQ_A, 8_000, true);
        uint256 a = _move(rec, service, reclaimer, SCALE_RECLAIM_PK, 8_000);
        uint256 v = _mint(20_000);
        uint256 b = _move(v, importer, reclaimer, SCALE_RECLAIM_PK, 20_000);
        bytes32 outCyl = bytes32("out");
        bytes32 subject = ledger.reclaimSubject(outCyl);
        ScaleReading memory r = _reading(subject, 7_000);
        LabCertificate memory c = _cert(subject, R404A, 9_990);
        bytes memory ss = _signScale(SCALE_RECLAIM_PK, r);
        bytes memory ls = _signLab(LAB_PK, c);
        vm.prank(reclaimer);
        vm.expectRevert(abi.encodeWithSelector(KigaliLedger.ClassNotReclaimable.selector, b, LotClass.VIRGIN));
        ledger.reclaim(_two(a, b), outCyl, r, ss, c, ls);
    }

    function test_R4_revert_duplicateInputCannotDoubleCountMass() public {
        uint256 rec = _recover(service, SCALE_SERVICE_PK, EQ_A, 8_000, true);
        uint256 a = _move(rec, service, reclaimer, SCALE_RECLAIM_PK, 8_000);
        bytes32 outCyl = bytes32("out");
        bytes32 subject = ledger.reclaimSubject(outCyl);
        ScaleReading memory r = _reading(subject, 15_000);
        LabCertificate memory c = _cert(subject, R404A, 9_990);
        bytes memory ss = _signScale(SCALE_RECLAIM_PK, r);
        bytes memory ls = _signLab(LAB_PK, c);
        vm.prank(reclaimer);
        vm.expectRevert(abi.encodeWithSelector(KigaliLedger.DuplicateInput.selector, a));
        ledger.reclaim(_two(a, a), outCyl, r, ss, c, ls);
    }

    function test_R4_revert_reclaimerCannotCertifyItself() public {
        // a lab key bound to the reclaimer is not independent
        uint256 captiveLab = 0xC0FFEE;
        _grant(vm.addr(captiveLab), Roles.LAB);
        ledger.bindDevice(vm.addr(captiveLab), reclaimer);

        uint256 rec = _recover(service, SCALE_SERVICE_PK, EQ_A, 8_000, true);
        uint256 a = _move(rec, service, reclaimer, SCALE_RECLAIM_PK, 8_000);
        bytes32 outCyl = bytes32("out");
        bytes32 subject = ledger.reclaimSubject(outCyl);
        ScaleReading memory r = _reading(subject, 7_000);
        LabCertificate memory c = _cert(subject, R404A, 9_990);
        bytes memory ss = _signScale(SCALE_RECLAIM_PK, r);
        bytes memory ls = _signLab(captiveLab, c);
        vm.prank(reclaimer);
        vm.expectRevert(abi.encodeWithSelector(KigaliLedger.LabNotIndependent.selector, vm.addr(captiveLab)));
        ledger.reclaim(_one(a), outCyl, r, ss, c, ls);
    }

    // ================================================================ R6 destruction

    function test_R6_destroyRecoveredIsCreditEligible() public {
        uint256 rec = _recover(service, SCALE_SERVICE_PK, EQ_A, 8_000, true);
        uint256 atFacility = _move(rec, service, facility, SCALE_FACILITY_PK, 8_000);
        uint256 ev = _destroy(_one(atFacility), 8_000);
        assertTrue(claims.destructionEvent(ev).creditEligible);
        assertEq(uint8(claims.destructionEvent(ev).worstTier), uint8(Tier.A));
        assertEq(ledger.totals(R404A).destroyed, 8_000);
        _assertConservation(R404A);
    }

    function test_R6_destroyVirginIsAllowedButNotCreditEligible() public {
        uint256 v = _mint(5_000);
        uint256 atFacility = _move(v, importer, facility, SCALE_FACILITY_PK, 5_000);
        uint256 ev = _destroy(_one(atFacility), 5_000);
        assertFalse(claims.destructionEvent(ev).creditEligible, "virgin stock must not earn credits");
        _assertConservation(R404A);
    }

    function test_R6_destroyReclaimedIsNotCreditEligible() public {
        uint256 rec = _recover(service, SCALE_SERVICE_PK, EQ_A, 8_000, true);
        uint256 a = _move(rec, service, reclaimer, SCALE_RECLAIM_PK, 8_000);
        uint256 out = _reclaim(_one(a), 7_500, 9_960);
        uint256 atFacility = _move(out, reclaimer, facility, SCALE_FACILITY_PK, 7_500);
        uint256 ev = _destroy(_one(atFacility), 7_500);
        assertFalse(claims.destructionEvent(ev).creditEligible);
    }

    function test_R6_revert_destroyMoreThanHeld() public {
        uint256 rec = _recover(service, SCALE_SERVICE_PK, EQ_A, 8_000, true);
        uint256 atFacility = _move(rec, service, facility, SCALE_FACILITY_PK, 8_000);
        uint256[] memory inputs = _one(atFacility);
        ScaleReading memory r = _reading(ledger.destructionSubject(inputs), 9_000);
        bytes memory sig = _signScale(SCALE_FACILITY_PK, r);
        vm.prank(facility);
        vm.expectRevert(abi.encodeWithSelector(KigaliLedger.DestroyExceedsHeld.selector, 8_000, 9_000));
        ledger.destroy(inputs, r, sig, bytes32("cert"), 9_999);
    }

    function test_R6_revert_dreBelowIsometric() public {
        uint256 rec = _recover(service, SCALE_SERVICE_PK, EQ_A, 8_000, true);
        uint256 atFacility = _move(rec, service, facility, SCALE_FACILITY_PK, 8_000);
        uint256[] memory inputs = _one(atFacility);
        ScaleReading memory r = _reading(ledger.destructionSubject(inputs), 8_000);
        bytes memory sig = _signScale(SCALE_FACILITY_PK, r);
        vm.prank(facility);
        vm.expectRevert(abi.encodeWithSelector(KigaliLedger.DreTooLow.selector, 9_990, 9_999));
        ledger.destroy(inputs, r, sig, bytes32("cert"), 9_990);
    }

    function test_R6_revert_cannotDestroyOthersLots() public {
        uint256 rec = _recover(service, SCALE_SERVICE_PK, EQ_A, 8_000, true); // still held by service
        uint256[] memory inputs = _one(rec);
        ScaleReading memory r = _reading(ledger.destructionSubject(inputs), 8_000);
        bytes memory sig = _signScale(SCALE_FACILITY_PK, r);
        vm.prank(facility);
        vm.expectRevert(abi.encodeWithSelector(KigaliLedger.NotHolder.selector, rec));
        ledger.destroy(inputs, r, sig, bytes32("cert"), 9_999);
    }

    // ================================================================ attestation security (threats T2, T3, T6)

    function test_sec_revert_signatureFromUnregisteredDevice() public {
        bytes32 cyl = bytes32("cyl");
        ScaleReading memory r = _reading(ledger.recoverySubject(EQ_A, cyl), 8_000);
        bytes memory sig = _signScale(ROGUE_PK, r);
        vm.prank(service);
        vm.expectRevert(abi.encodeWithSelector(KigaliLedger.NotScaleDevice.selector, vm.addr(ROGUE_PK)));
        ledger.recover(EQ_A, cyl, true, r, sig);
    }

    function test_sec_revert_replayedReading() public {
        bytes32 cyl = bytes32("cyl");
        ScaleReading memory r = _reading(ledger.recoverySubject(EQ_A, cyl), 4_000);
        bytes memory sig = _signScale(SCALE_SERVICE_PK, r);
        vm.prank(service);
        ledger.recover(EQ_A, cyl, false, r, sig);
        vm.prank(service);
        vm.expectRevert(abi.encodeWithSelector(KigaliLedger.NonceReused.selector, vm.addr(SCALE_SERVICE_PK), r.nonce));
        ledger.recover(EQ_A, cyl, false, r, sig);
    }

    function test_sec_revert_readingForAnotherSubject() public {
        ScaleReading memory r = _reading(ledger.recoverySubject(EQ_A, bytes32("cyl-1")), 4_000);
        bytes memory sig = _signScale(SCALE_SERVICE_PK, r);
        vm.prank(service);
        vm.expectRevert(KigaliLedger.WrongSubject.selector);
        ledger.recover(EQ_A, bytes32("cyl-2"), false, r, sig);
    }

    function test_sec_revert_tamperedWeight() public {
        bytes32 cyl = bytes32("cyl");
        ScaleReading memory r = _reading(ledger.recoverySubject(EQ_A, cyl), 4_000);
        bytes memory sig = _signScale(SCALE_SERVICE_PK, r);
        r.grams = 9_000; // edited after signing => recovers a different (unregistered) signer
        vm.prank(service);
        vm.expectRevert(); // NotScaleDevice(<random address>)
        ledger.recover(EQ_A, cyl, false, r, sig);
    }

    function test_sec_revert_expiredReading() public {
        bytes32 cyl = bytes32("cyl");
        ScaleReading memory r = _reading(ledger.recoverySubject(EQ_A, cyl), 4_000);
        bytes memory sig = _signScale(SCALE_SERVICE_PK, r);
        vm.warp(block.timestamp + 8 days);
        vm.prank(service);
        vm.expectRevert(KigaliLedger.AttestationExpired.selector);
        ledger.recover(EQ_A, cyl, false, r, sig);
    }

    function test_sec_revert_futureReading() public {
        bytes32 cyl = bytes32("cyl");
        ScaleReading memory r = _reading(ledger.recoverySubject(EQ_A, cyl), 4_000);
        r.timestamp = uint64(block.timestamp + 1 hours);
        bytes memory sig = _signScale(SCALE_SERVICE_PK, r);
        vm.prank(service);
        vm.expectRevert(KigaliLedger.AttestationFromFuture.selector);
        ledger.recover(EQ_A, cyl, false, r, sig);
    }

    function test_sec_revert_revokedDeviceStopsImmediately() public {
        identity.revokeRole(vm.addr(SCALE_SERVICE_PK), Roles.SCALE, keccak256("calibration expired"));
        bytes32 cyl = bytes32("cyl");
        ScaleReading memory r = _reading(ledger.recoverySubject(EQ_A, cyl), 4_000);
        bytes memory sig = _signScale(SCALE_SERVICE_PK, r);
        vm.prank(service);
        vm.expectRevert(abi.encodeWithSelector(KigaliLedger.NotScaleDevice.selector, vm.addr(SCALE_SERVICE_PK)));
        ledger.recover(EQ_A, cyl, false, r, sig);
    }

    function test_sec_revert_malleableHighS() public {
        bytes32 cyl = bytes32("cyl");
        ScaleReading memory r = _reading(ledger.recoverySubject(EQ_A, cyl), 4_000);
        (uint8 v, bytes32 rr, bytes32 s) = vm.sign(SCALE_SERVICE_PK, ledger.scaleDigest(r));
        // flip to the equivalent high-s signature
        uint256 n = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141;
        bytes memory sig = abi.encodePacked(rr, bytes32(n - uint256(s)), v == 27 ? uint8(28) : uint8(27));
        vm.prank(service);
        vm.expectRevert(Attestations.BadSignature.selector);
        ledger.recover(EQ_A, cyl, false, r, sig);
    }

    function test_sec_revert_signatureFromOtherDeployment() public {
        // same reading, but signed under the EIP-712 domain of chain 999 => must not verify here
        bytes32 cyl = bytes32("cyl");
        ScaleReading memory r = _reading(ledger.recoverySubject(EQ_A, cyl), 4_000);
        bytes32 foreignDomain = keccak256(
            abi.encode(
                Attestations.DOMAIN_TYPEHASH, keccak256("KigaliBalance"), keccak256("1"), uint256(999), address(ledger)
            )
        );
        bytes32 foreignDigest = Attestations.digest(foreignDomain, Attestations.hashScale(r));
        assertTrue(foreignDigest != ledger.scaleDigest(r));
        (uint8 v, bytes32 rr, bytes32 s) = vm.sign(SCALE_SERVICE_PK, foreignDigest);
        vm.prank(service);
        vm.expectRevert(); // recovers an unregistered address => NotScaleDevice
        ledger.recover(EQ_A, cyl, false, r, abi.encodePacked(rr, s, v));
    }

    // ================================================================ access control

    function test_revert_onlyGovernanceSetsParams() public {
        vm.prank(regulator);
        vm.expectRevert();
        ledger.setParams(100, 200, 9_950, 9_999, 7 days);
    }

    function test_revert_onlyGovernanceBindsDevices() public {
        vm.prank(reclaimer);
        vm.expectRevert();
        ledger.bindDevice(vm.addr(ROGUE_PK), reclaimer);
    }
}
