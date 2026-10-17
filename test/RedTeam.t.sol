// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Fixture} from "./utils/Fixture.sol";
import {Roles, Tier, LotClass} from "../src/Types.sol";
import {KigaliLedger} from "../src/KigaliLedger.sol";
import {EquipmentRegistry} from "../src/EquipmentRegistry.sol";
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
}
