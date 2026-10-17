// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Fixture} from "./utils/Fixture.sol";
import {Roles, Tier, LotClass} from "../src/Types.sol";
import {KigaliLedger} from "../src/KigaliLedger.sol";
import {EquipmentRegistry} from "../src/EquipmentRegistry.sol";
import {DestructionClaims} from "../src/DestructionClaims.sol";
import {ScaleReading, LabCertificate, RecoveryConsent} from "../src/Attestations.sol";

/// @notice Regression tests for the findings of the 2026-10-17 red-team review (a pre-audit review of
///         the contracts against the security claims in the technical annex). Each test is the
///         reviewer's proof of concept, turned around: it must now fail for the attacker.
contract RedTeamTest is Fixture {
    function _virginAtService(uint64 grams) internal returns (uint256) {
        uint256 v = _mint(grams);
        return _move(v, importer, service, SCALE_SERVICE_PK, grams);
    }

    function _unknownAtService(uint64 grams) internal returns (uint256) {
        vm.prank(quotaAuthority);
        return ledger.declareUnknown(service, R404A, grams, keccak256(abi.encode("legacy", grams)), bytes32("inventory"));
    }

    /// F1 (High): UNKNOWN gas charged into a unit came back out as credit-eligible Tier A after the
    /// 180-day residence period. Undocumented grams now stay Tier C however long they were in service.
    function test_F1_unknownChargedIntoUnitNeverBecomesCreditable() public {
        uint256 u = _unknownAtService(10_000);
        vm.prank(service);
        ledger.charge(u, EQ_A, 10_000);
        assertEq(equipment.untraceableGrams(EQ_A), 10_000);

        vm.warp(block.timestamp + 400 days);
        (uint256 inService, uint256 quarantined) = _recoverSplit(service, SCALE_SERVICE_PK, EQ_A, 10_000);
        assertEq(inService, 0, "no part of undocumented gas comes out as Tier A");
        assertEq(uint8(ledger.getLot(quarantined).tier), uint8(Tier.C));
        assertEq(ledger.getLot(quarantined).grams, 10_000);
        assertEq(equipment.untraceableGrams(EQ_A), 0);
    }

    /// F1, the honest counterpart: documented (virgin, quota-backed) gas that served 180 days is
    /// genuinely recovered gas, and undocumented grams are counted out first, never twice.
    function test_F1_unknownGramsAreCountedOutFirst() public {
        uint256 u = _unknownAtService(3_000);
        vm.prank(service);
        ledger.charge(u, EQ_A, 3_000);
        vm.warp(block.timestamp + 400 days);
        (uint256 inService, uint256 quarantined) = _recoverSplit(service, SCALE_SERVICE_PK, EQ_A, 8_000);
        assertEq(ledger.getLot(quarantined).grams, 3_000, "the undocumented grams");
        assertEq(ledger.getLot(inService).grams, 5_000, "the rest is recovered gas of the unit's own charge");
        assertEq(uint8(ledger.getLot(inService).tier), uint8(Tier.A));
    }

    /// F3 (Medium): charging an absurd amount overflowed the lifetime cap and locked the unit for good.
    function test_F3_absurdChargeCannotLockAUnit() public {
        uint256 u = _unknownAtService(type(uint64).max - 5_000);
        vm.prank(service);
        ledger.charge(u, EQ_A, type(uint64).max - 5_000);
        assertEq(equipment.recoveryCap(EQ_A), type(uint64).max, "the cap saturates instead of overflowing");
        vm.warp(block.timestamp + 400 days);
        uint256 rec = _recover(service, SCALE_SERVICE_PK, EQ_A, 4_000, false);
        assertEq(uint8(ledger.getLot(rec).tier), uint8(Tier.C), "and the undocumented gas stays quarantined");
    }

    /// F4 (Medium): another reclaimer could reuse an honest reclaimer's lab certificate. The subject
    /// now names the reclaimer and its exact input lots.
    function test_F4_labCertificateCannotBeReusedByAnotherReclaimer() public {
        _grant(service2, Roles.RECLAIMER);
        uint256 honestInput = _move(_recover(service, SCALE_SERVICE_PK, EQ_A, 8_000, false), service, reclaimer, SCALE_RECLAIM_PK, 8_000);
        bytes32 outCyl = bytes32("reclaimed-out");
        bytes32 honestSubject = ledger.reclaimSubject(reclaimer, _one(honestInput), outCyl);
        LabCertificate memory stolen = _cert(honestSubject, R404A, 9_990);
        bytes memory stolenSig = _signLab(LAB_PK, stolen);

        // the thief holds its own recovered input and copies the certificate's subject into its reading
        bytes32 eqB = keccak256("tierB/thief");
        _registerB(eqB, service2);
        uint256 thiefInput = _recover(service2, SCALE_SERVICE2_PK, eqB, 1_000, true);
        ScaleReading memory r = _reading(honestSubject, 900);
        bytes memory rs = _signScale(SCALE_SERVICE2_PK, r);
        vm.prank(service2);
        vm.expectRevert(KigaliLedger.WrongSubject.selector);
        ledger.reclaim(_one(thiefInput), outCyl, r, rs, stolen, stolenSig);
    }

    /// F5 (Low/Medium): a flood of tiny charges made the residence check loop unboundedly. Charges on
    /// the same day now share one record.
    function test_F5_floodOfChargesStaysCheap() public {
        uint256 v = _virginAtService(600);
        vm.startPrank(service);
        for (uint256 i; i < 500; ++i) {
            ledger.charge(v, EQ_A, 1);
        }
        vm.stopPrank();
        vm.warp(block.timestamp + 1 days);
        (RecoveryConsent memory c, bytes memory cs, ScaleReading memory r, bytes memory rs) =
            _recoveryArgs(SCALE_SERVICE_PK, service, EQ_A, bytes32("flood-cyl"), 4_000, false);
        uint256 before = gasleft();
        vm.prank(service);
        ledger.recover(c, cs, r, rs);
        assertLt(before - gasleft(), 600_000, "recovery cost does not grow with the number of charges");
    }

    /// F7 (Low): a revoked operator could still pass its lots to an accomplice.
    function test_F7_revokedOperatorsLotsAreFrozen() public {
        uint256 v = _virginAtService(5_000);
        identity.revokeRole(service, Roles.SERVICE, keccak256("licence withdrawn"));
        vm.prank(service);
        vm.expectRevert(abi.encodeWithSelector(KigaliLedger.NotOperator.selector, service));
        ledger.send(v, distributor, 5_000, bytes32("x"));
    }

    /// F8 (Low/Medium): one nameplate photo could register many Tier B units, each worth one charge.
    function test_F8_onePhotoRegistersOneUnit() public {
        bytes32 photo = keccak256("one-photo");
        vm.prank(service);
        equipment.registerTierB(keccak256("unit-1"), MODEL_SPLIT_AC, photo, vm.addr(TAKEBACK_PK));
        vm.prank(service);
        vm.expectRevert(EquipmentRegistry.DuplicateNameplatePhoto.selector);
        equipment.registerTierB(keccak256("unit-2"), MODEL_SPLIT_AC, photo, vm.addr(TAKEBACK_PK));
    }

    /// F2 (Medium): any service company could charge its gas into a competitor's unit and so
    /// quarantine the competitor's next recovery. Only the unit's service company of record can
    /// charge it now; the owner can change that company.
    function test_F2_onlyTheServiceCompanyOfRecordCharges() public {
        uint256 v = _mint(2_000);
        uint256 atRival = _move(v, importer, service2, SCALE_SERVICE2_PK, 2_000);
        vm.prank(service2);
        vm.expectRevert(abi.encodeWithSelector(EquipmentRegistry.ServiceNotAuthorized.selector, service2));
        ledger.charge(atRival, EQ_A, 2_000);

        // a new maintenance contract: the owner names service2, which can then charge
        vm.prank(vm.addr(OWNER_PK));
        equipment.setServiceCompany(EQ_A, service2);
        vm.prank(service2);
        ledger.charge(atRival, EQ_A, 2_000);
        assertEq(equipment.serviceCompanyOf(EQ_A), service2);
    }

    function test_F2_revert_onlyTheOwnerChangesTheServiceCompany() public {
        vm.prank(service2);
        vm.expectRevert(abi.encodeWithSelector(EquipmentRegistry.NotEquipmentOwner.selector, service2));
        equipment.setServiceCompany(EQ_A, service2);
    }

    /// F10 (Low/Medium): a rogue or stolen registry key could claim any eligible event first. The
    /// facility now designates the registry, and may re-designate until the event is claimed.
    function test_F10_onlyTheDesignatedRegistryClaims() public {
        uint256 rec = _recover(service, SCALE_SERVICE_PK, EQ_A, 5_000, true);
        uint256 ev = _destroy(_one(_move(rec, service, facility, SCALE_FACILITY_PK, 5_000)), 5_000);
        _designate(ev, registryTW);
        vm.prank(registryIntl);
        vm.expectRevert(abi.encodeWithSelector(DestructionClaims.NotDesignated.selector, registryTW));
        claims.claim(ev, bytes32("front-run"));
        vm.prank(registryTW);
        claims.claim(ev, bytes32("TW-1"));
        // once claimed, the facility cannot move it
        vm.prank(facility);
        vm.expectRevert(abi.encodeWithSelector(DestructionClaims.AlreadyClaimed.selector, registryTW));
        claims.designate(ev, registryIntl);
    }

    function test_F10_revert_onlyTheFacilityDesignates() public {
        uint256 rec = _recover(service, SCALE_SERVICE_PK, EQ_A, 5_000, true);
        uint256 ev = _destroy(_one(_move(rec, service, facility, SCALE_FACILITY_PK, 5_000)), 5_000);
        vm.prank(registryIntl);
        vm.expectRevert(abi.encodeWithSelector(DestructionClaims.NotFacility.selector, registryIntl));
        claims.designate(ev, registryIntl);
    }

    /// F12 (Low): a unit's owner could never change. The owner can hand it over, and the old
    /// owner's consent then no longer counts.
    function test_F12_ownershipTransferMovesTheConsent() public {
        address newOwner = vm.addr(TAKEBACK_PK);
        vm.prank(vm.addr(OWNER_PK));
        equipment.transferOwnership(EQ_A, newOwner);
        assertEq(equipment.equipment(EQ_A).owner, newOwner);
        // the old owner's consent is now rejected
        (RecoveryConsent memory c, bytes memory cs, ScaleReading memory r, bytes memory rs) =
            _recoveryArgs(SCALE_SERVICE_PK, service, EQ_A, bytes32("after-sale"), 4_000, false);
        cs = _signConsent(OWNER_PK, c);
        vm.prank(service);
        vm.expectRevert(abi.encodeWithSelector(KigaliLedger.NotUnitOwner.selector, vm.addr(OWNER_PK)));
        ledger.recover(c, cs, r, rs);
    }

    function test_F12_governanceReassignsALostOwner() public {
        equipment.reassignOwner(EQ_A, vm.addr(TAKEBACK_PK)); // this test contract is governance
        assertEq(equipment.equipment(EQ_A).owner, vm.addr(TAKEBACK_PK));
        vm.prank(vm.addr(OWNER_PK));
        vm.expectRevert(); // only governance
        equipment.reassignOwner(EQ_A, vm.addr(OWNER_PK));
    }

    // ================================================================ second review (2026-10-17)

    /// S1 (High): the F1 fix could be bypassed. Undocumented gas came out as an ordinary Tier C lot;
    /// charging that lot back and waiting 180 days turned it into credit-eligible Tier A. The lot now
    /// stays marked, and charging it marks the grams in the unit again.
    function test_S1_undocumentedGasStaysMarkedThroughARecharge() public {
        uint256 u = _unknownAtService(5_000);
        vm.prank(service);
        ledger.charge(u, EQ_A, 5_000);
        vm.warp(block.timestamp + 1 days);
        // a "repair": the gas is taken out (the unit stays in service) ...
        (RecoveryConsent memory c, bytes memory cs, ScaleReading memory r, bytes memory rs) =
            _recoveryArgs(SCALE_SERVICE_PK, service, EQ_A, bytes32("s1-repair"), 5_000, false);
        vm.prank(service);
        (uint256 inService, uint256 tierC) = ledger.recover(c, cs, r, rs);
        assertEq(inService, 0);
        assertTrue(ledger.untraceable(tierC), "the lot holding undocumented gas is marked");

        // charge the marked lot back, wait well past the residence period, recover again
        vm.prank(service);
        ledger.charge(tierC, EQ_A, 5_000);
        assertEq(equipment.untraceableGrams(EQ_A), 5_000, "the grams are untraceable in the unit again");
        vm.warp(block.timestamp + 400 days);
        (inService, tierC) = _recoverSplit(service, SCALE_SERVICE_PK, EQ_A, 5_000);
        assertEq(inService, 0, "still never Tier A");
        assertEq(uint8(ledger.getLot(tierC).tier), uint8(Tier.C));
    }

    function test_S1_markSurvivesASplitAndAnotherUnit() public {
        bytes32 eqB = keccak256("second-freezer");
        _registerA(eqB, R404A, NAMEPLATE, INSTALLED_LONG_AGO);
        uint256 u = _unknownAtService(4_000);
        vm.prank(service);
        ledger.charge(u, EQ_A, 4_000);
        (, uint256 tierC) = _recoverSplit(service, SCALE_SERVICE_PK, EQ_A, 4_000);
        // split the marked lot by sending part of it away and back
        uint256 part = _move(tierC, service, distributor, SCALE_DIST_PK, 1_500);
        assertTrue(ledger.untraceable(part), "a split-off child inherits the mark");
        uint256 back = _move(part, distributor, service, SCALE_SERVICE_PK, 1_500);
        vm.prank(service);
        ledger.charge(back, eqB, 1_500);
        assertEq(equipment.untraceableGrams(eqB), 1_500);
    }

    /// S2 (Low): a revoked owner key could still hand the unit over or switch its service company.
    function test_S2_revokedOwnerLosesControlOfTheUnit() public {
        address owner = vm.addr(OWNER_PK);
        identity.revokeRole(owner, Roles.EQUIPMENT_OWNER, keccak256("key stolen"));
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(EquipmentRegistry.NotEquipmentOwner.selector, owner));
        equipment.transferOwnership(EQ_A, vm.addr(TAKEBACK_PK));
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(EquipmentRegistry.NotEquipmentOwner.selector, owner));
        equipment.setServiceCompany(EQ_A, service2);
    }

    /// S2 (Low): a revoked facility key could still steer its events; governance can step in.
    function test_S2_revokedFacilityCannotDesignate() public {
        uint256 rec = _recover(service, SCALE_SERVICE_PK, EQ_A, 5_000, true);
        uint256 ev = _destroy(_one(_move(rec, service, facility, SCALE_FACILITY_PK, 5_000)), 5_000);
        identity.revokeRole(facility, Roles.DESTRUCTION, keccak256("key stolen"));
        vm.prank(facility);
        vm.expectRevert(abi.encodeWithSelector(DestructionClaims.NotFacility.selector, facility));
        claims.designate(ev, registryIntl);
        claims.designateByGovernance(ev, registryTW); // this test contract is governance
        vm.prank(registryTW);
        claims.claim(ev, bytes32("TW-1"));
    }

    /// S3 (Low): a Tier A record without an installation date skipped the recently-installed quarantine.
    function test_S3_tierANeedsAnInstallationDate() public {
        vm.prank(registrar);
        vm.expectRevert(EquipmentRegistry.UnknownInstallDate.selector);
        equipment.registerTierA(keccak256("no-date"), R404A, 5_000, 0, bytes32("rec"), vm.addr(OWNER_PK), service);
    }

    /// S6 (Info): governance could set parameters that switch rules off.
    function test_S6_parametersCannotSwitchRulesOff() public {
        vm.expectRevert(EquipmentRegistry.BadParams.selector);
        equipment.setParams(500, 50_000, 0); // no residence period
        vm.expectRevert(KigaliLedger.BadParams.selector);
        ledger.setParams(100, 0, 9_950, 9_999, 7 days); // no reclamation loss
        vm.expectRevert(KigaliLedger.BadParams.selector);
        ledger.setParams(100, 200, 9_950, 0, 7 days); // no destruction efficiency
    }
}
