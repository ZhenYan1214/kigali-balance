// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Fixture} from "./utils/Fixture.sol";
import {Tier, LotClass} from "../src/Types.sol";
import {KigaliLedger} from "../src/KigaliLedger.sol";
import {DestructionClaims} from "../src/DestructionClaims.sol";
import {EquipmentRegistry} from "../src/EquipmentRegistry.sol";
import {ScaleReading, LabCertificate} from "../src/Attestations.sol";

/// @notice Charge-and-recover laundering: put virgin gas into a registered unit and take it
///         straight back out, hoping it becomes "RECOVERED". The residence rule stamps it Tier C,
///         which can never be reclaimed or credited.
contract LaunderingTest is Fixture {
    bytes32 internal constant NEW_UNIT = keccak256("EKOMVET/installed-last-month");

    function _virginAtService(uint64 grams) internal returns (uint256) {
        uint256 v = _mint(grams);
        return _move(v, importer, service, SCALE_SERVICE_PK, grams);
    }

    function test_chargeThenImmediateRecoveryIsTierC() public {
        uint256 v = _virginAtService(9_000);
        vm.prank(service);
        ledger.charge(v, EQ_A, 9_000);
        vm.warp(block.timestamp + 1 days);
        uint256 rec = _recover(service, SCALE_SERVICE_PK, EQ_A, 9_000, true);

        KigaliLedger.Lot memory l = ledger.getLot(rec);
        assertEq(uint8(l.cls), uint8(LotClass.RECOVERED));
        assertEq(uint8(l.tier), uint8(Tier.C), "laundered gas is quarantined");
    }

    function test_tierCCannotBeReclaimed() public {
        uint256 v = _virginAtService(9_000);
        vm.prank(service);
        ledger.charge(v, EQ_A, 9_000);
        uint256 rec = _recover(service, SCALE_SERVICE_PK, EQ_A, 9_000, true);
        uint256 atReclaimer = _move(rec, service, reclaimer, SCALE_RECLAIM_PK, 9_000);

        bytes32 outCyl = bytes32("out");
        bytes32 subject = ledger.reclaimSubject(outCyl);
        ScaleReading memory r = _reading(subject, 8_500);
        LabCertificate memory c = _cert(subject, R404A, 9_990);
        bytes memory ss = _signScale(SCALE_RECLAIM_PK, r);
        bytes memory ls = _signLab(LAB_PK, c);
        vm.prank(reclaimer);
        vm.expectRevert(abi.encodeWithSelector(KigaliLedger.TierNotReclaimable.selector, atReclaimer));
        ledger.reclaim(_one(atReclaimer), outCyl, r, ss, c, ls);
    }

    function test_tierCDestructionIsNotCreditEligible() public {
        uint256 v = _virginAtService(9_000);
        vm.prank(service);
        ledger.charge(v, EQ_A, 9_000);
        uint256 rec = _recover(service, SCALE_SERVICE_PK, EQ_A, 9_000, true);
        uint256 atFacility = _move(rec, service, facility, SCALE_FACILITY_PK, 9_000);
        uint256 ev = _destroy(_one(atFacility), 9_000);
        assertFalse(claims.destructionEvent(ev).creditEligible);

        vm.prank(registryTW);
        vm.expectRevert(DestructionClaims.NotCreditEligible.selector);
        claims.claim(ev, bytes32("x"));
    }

    function test_recoveryAfterResidenceIsTierA() public {
        uint256 v = _virginAtService(3_000);
        vm.prank(service);
        ledger.charge(v, EQ_A, 3_000);
        vm.warp(block.timestamp + 181 days);
        uint256 rec = _recover(service, SCALE_SERVICE_PK, EQ_A, 8_000, true);
        assertEq(uint8(ledger.getLot(rec).tier), uint8(Tier.A));
    }

    /// Honest case found while designing the simulator: units are often topped up shortly before
    /// they are scrapped. Only the recent top-up is quarantined; the gas that was in service keeps Tier A.
    function test_recentTopUpBeforeScrappingQuarantinesOnlyThoseGrams() public {
        uint256 v = _virginAtService(500);
        vm.prank(service);
        ledger.charge(v, EQ_A, 500); // 0.5 kg top-up
        vm.warp(block.timestamp + 60 days); // scrapped two months later
        (uint256 inService, uint256 quarantined) = _recoverSplit(service, SCALE_SERVICE_PK, EQ_A, 8_000);

        assertEq(ledger.getLot(inService).grams, 7_500);
        assertEq(uint8(ledger.getLot(inService).tier), uint8(Tier.A));
        assertEq(ledger.getLot(quarantined).grams, 500);
        assertEq(uint8(ledger.getLot(quarantined).tier), uint8(Tier.C));
        _assertConservation(R404A);
    }

    function test_oldChargesAreNotQuarantined() public {
        uint256 v = _virginAtService(2_000);
        vm.prank(service);
        ledger.charge(v, EQ_A, 1_000);
        vm.warp(block.timestamp + 200 days);
        vm.prank(service);
        ledger.charge(v, EQ_A, 300); // only this one is inside the window
        vm.warp(block.timestamp + 30 days);
        (uint256 inService, uint256 quarantined) = _recoverSplit(service, SCALE_SERVICE_PK, EQ_A, 6_000);
        assertEq(ledger.getLot(inService).grams, 5_700);
        assertEq(ledger.getLot(quarantined).grams, 300);
    }

    function test_recentlyInstalledUnitIsTierC() public {
        _registerA(NEW_UNIT, R404A, 5_000, uint64(block.timestamp - 30 days));
        uint256 rec = _recover(service, SCALE_SERVICE_PK, NEW_UNIT, 5_000, true);
        assertEq(uint8(ledger.getLot(rec).tier), uint8(Tier.C));
    }

    function test_tierCCanStillBeChargedBack() public {
        // legitimate repair: recover, fix the leak, put the same gas back into service
        uint256 v = _virginAtService(9_000);
        vm.prank(service);
        ledger.charge(v, EQ_A, 5_000);
        uint256 rec = _recover(service, SCALE_SERVICE_PK, EQ_A, 4_000, false);
        assertEq(uint8(ledger.getLot(rec).tier), uint8(Tier.C));
        vm.prank(service);
        ledger.charge(rec, EQ_A, 4_000);
        _assertConservation(R404A);
    }

    function test_revert_registryCannotAcceptTierC() public {
        vm.prank(registryTW);
        vm.expectRevert(DestructionClaims.BadTier.selector);
        claims.setAcceptedTier(Tier.C);
    }

    function test_revert_installedInFuture() public {
        address owner = vm.addr(OWNER_PK);
        vm.prank(registrar);
        vm.expectRevert(EquipmentRegistry.InstalledInFuture.selector);
        equipment.registerTierA(NEW_UNIT, R404A, 5_000, uint64(block.timestamp + 1 days), bytes32("rec"), owner);
    }
}
