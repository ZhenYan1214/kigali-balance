// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Fixture} from "./utils/Fixture.sol";
import {Roles, Tier} from "../src/Types.sol";
import {EquipmentRegistry} from "../src/EquipmentRegistry.sol";
import {KigaliLedger} from "../src/KigaliLedger.sol";
import {ScaleReading, RecoveryConsent} from "../src/Attestations.sol";

contract EquipmentTest is Fixture {
    bytes32 internal constant EQ_B = keccak256("household-ac/serial-123");

    // ---------------------------------------------------------------- Tier A

    function test_tierA_capIsNameplatePlusTolerance() public view {
        assertEq(equipment.recoveryCap(EQ_A), 10_500);
    }

    function test_tierA_cumulativeRecoveryIsCapped() public {
        _recover(service, SCALE_SERVICE_PK, EQ_A, 6_000, false);
        _recover(service, SCALE_SERVICE_PK, EQ_A, 4_500, false); // total 10.5 kg: allowed
        (RecoveryConsent memory c, bytes memory cs, ScaleReading memory r, bytes memory rs) =
            _recoveryArgs(SCALE_SERVICE_PK, service, EQ_A, bytes32("cyl-3"), 1, false);
        vm.prank(service);
        vm.expectRevert(abi.encodeWithSelector(EquipmentRegistry.RecoveryCapExceeded.selector, 10_500, 10_501));
        ledger.recover(c, cs, r, rs);
    }

    /// M8: a repair (recover, charge the gas back in) must not use up the unit's end-of-life budget.
    function test_tierA_capIncludesLedgerTopUps() public {
        uint256 repaired = _recover(service, SCALE_SERVICE_PK, EQ_A, 4_000, false);
        vm.prank(service);
        ledger.charge(repaired, EQ_A, 4_000);
        assertEq(equipment.recoveryCap(EQ_A), 14_500, "nameplate x 1.05 + 4 kg recharged");

        vm.warp(block.timestamp + 181 days); // the recharged gas has now been in service
        uint256 eol = _recover(service, SCALE_SERVICE_PK, EQ_A, 9_000, true); // 13 kg in total
        assertEq(uint8(ledger.getLot(eol).tier), uint8(Tier.A));
        _assertConservation(R404A);
    }

    /// Round 12: a leaky unit's top-ups replace gas that already leaked out. They raise the
    /// lifetime total but never let a single recovery take more than one charge.
    function test_tierA_singleRecoveryNeverExceedsOneCharge() public {
        uint256 v = _mint(30_000);
        uint256 atService = _move(v, importer, service, SCALE_SERVICE_PK, 30_000);
        vm.startPrank(service);
        ledger.charge(atService, EQ_A, 10_000); // years of top-ups on a leaky unit
        ledger.charge(atService, EQ_A, 10_000);
        vm.stopPrank();
        assertEq(equipment.recoveryCap(EQ_A), 30_500, "lifetime: one charge + 20 kg of top-ups");
        assertEq(equipment.maxPerRecovery(EQ_A), 10_500, "per recovery: one charge");

        vm.warp(block.timestamp + 181 days);
        (RecoveryConsent memory c, bytes memory cs, ScaleReading memory r, bytes memory rs) =
            _recoveryArgs(SCALE_SERVICE_PK, service, EQ_A, bytes32("cyl-padded"), 10_501, true);
        vm.prank(service);
        vm.expectRevert(abi.encodeWithSelector(EquipmentRegistry.RecoveryExceedsCharge.selector, 10_500, 10_501));
        ledger.recover(c, cs, r, rs);

        _recover(service, SCALE_SERVICE_PK, EQ_A, 10_500, true); // a full charge is still accepted
        _assertConservation(R404A);
    }

    function test_tierB_singleRecoveryCappedAtModelCharge() public {
        _registerB(EQ_B, service);
        assertEq(equipment.maxPerRecovery(EQ_B), 1_200);
    }

    function test_decommissionedUnitCannotYieldMore() public {
        _recover(service, SCALE_SERVICE_PK, EQ_A, 3_000, true);
        assertEq(uint8(equipment.equipment(EQ_A).status), uint8(EquipmentRegistry.Status.DECOMMISSIONED));
        (RecoveryConsent memory c, bytes memory cs, ScaleReading memory r, bytes memory rs) =
            _recoveryArgs(SCALE_SERVICE_PK, service, EQ_A, bytes32("cyl-2"), 1_000, true);
        vm.prank(service);
        vm.expectRevert(EquipmentRegistry.NotActive.selector);
        ledger.recover(c, cs, r, rs);
    }

    function test_revert_unknownEquipment() public {
        bytes32 ghost = keccak256("never-registered");
        (RecoveryConsent memory c, bytes memory cs, ScaleReading memory r, bytes memory rs) =
            _recoveryArgs(SCALE_SERVICE_PK, service, ghost, bytes32("cyl"), 1_000, true);
        vm.prank(service);
        vm.expectRevert(EquipmentRegistry.UnknownEquipment.selector);
        ledger.recover(c, cs, r, rs);
    }

    function test_revert_onlyRegistrarRegistersTierA() public {
        address owner = vm.addr(OWNER_PK);
        vm.prank(service);
        vm.expectRevert(abi.encodeWithSelector(EquipmentRegistry.NotRole.selector, Roles.EQUIPMENT_REGISTRAR));
        equipment.registerTierA(keccak256("fake"), R404A, 50_000, 0, bytes32(0), owner);
    }

    function test_revert_cannotRegisterTwice() public {
        address owner = vm.addr(OWNER_PK);
        vm.prank(registrar);
        vm.expectRevert(EquipmentRegistry.AlreadyRegistered.selector);
        equipment.registerTierA(EQ_A, R404A, NAMEPLATE, 0, bytes32(0), owner);
    }

    function test_revert_tierAOwnerNeedsOwnerRole() public {
        vm.prank(registrar);
        vm.expectRevert(abi.encodeWithSelector(EquipmentRegistry.NotEquipmentOwner.selector, service));
        equipment.registerTierA(keccak256("unit"), R404A, 5_000, INSTALLED_LONG_AGO, bytes32("rec"), service);
    }

    function test_unitIsBoundToItsOwner() public view {
        assertEq(equipment.equipment(EQ_A).owner, vm.addr(OWNER_PK));
    }

    // ---------------------------------------------------------------- Tier B (unregistered small units)

    function test_tierB_registeredAtDecommissioningWithModelCharge() public {
        _registerB(EQ_B, service);
        EquipmentRegistry.Equipment memory e = equipment.equipment(EQ_B);
        assertEq(uint8(e.tier), uint8(Tier.B));
        assertEq(e.nameplateGrams, 1_200);
        assertEq(e.owner, vm.addr(TAKEBACK_PK));
        assertEq(equipment.recoveryCap(EQ_B), 1_200, "no tolerance for tier B");

        uint256 lotId = _recover(service, SCALE_SERVICE_PK, EQ_B, 1_100, true);
        assertEq(uint8(ledger.getLot(lotId).tier), uint8(Tier.B));
    }

    function test_tierB_revert_unknownModel() public {
        address owner = vm.addr(TAKEBACK_PK);
        vm.prank(service);
        vm.expectRevert(EquipmentRegistry.UnknownModel.selector);
        equipment.registerTierB(EQ_B, keccak256("model/not-in-database"), bytes32("photo"), owner);
    }

    /// H2 (partial): a service company cannot name itself as the owner that vouches for its recoveries.
    function test_tierB_revert_serviceCannotOwnItsOwnUnit() public {
        _grant(service, Roles.EQUIPMENT_OWNER);
        vm.prank(service);
        vm.expectRevert(abi.encodeWithSelector(EquipmentRegistry.OwnerNotIndependent.selector, service));
        equipment.registerTierB(EQ_B, MODEL_SPLIT_AC, bytes32("photo"), service);
    }

    function test_tierB_monthlyCapPerServiceCompany() public {
        equipment.setParams(500, 3_000, 180 days); // 3 kg of Tier B recovery per company per 30 days
        for (uint256 i; i < 2; ++i) {
            bytes32 id = keccak256(abi.encode("ac", i));
            _registerB(id, service);
            _recover(service, SCALE_SERVICE_PK, id, 1_200, true); // 2.4 kg used
        }
        bytes32 third = keccak256(abi.encode("ac", uint256(2)));
        _registerB(third, service);
        (RecoveryConsent memory c, bytes memory cs, ScaleReading memory r, bytes memory rs) =
            _recoveryArgs(SCALE_SERVICE_PK, service, third, bytes32("cyl-x"), 1_000, true);
        vm.prank(service);
        vm.expectRevert(abi.encodeWithSelector(EquipmentRegistry.TierBMonthlyCapExceeded.selector, 3_000, 3_400));
        ledger.recover(c, cs, r, rs);

        // another company has its own budget
        _recover(service2, SCALE_SERVICE2_PK, third, 1_000, true);

        // and the first company's budget resets next period
        bytes32 fourth = keccak256(abi.encode("ac", uint256(3)));
        _registerB(fourth, service);
        vm.warp(block.timestamp + 31 days);
        _recover(service, SCALE_SERVICE_PK, fourth, 1_000, true);
    }

    // ---------------------------------------------------------------- ledger-only hooks

    function test_revert_hooksAreLedgerOnly() public {
        vm.expectRevert(EquipmentRegistry.NotLedger.selector);
        equipment.recordRecovery(EQ_A, R404A, 1_000, service, true);
        vm.expectRevert(EquipmentRegistry.NotLedger.selector);
        equipment.recordCharge(EQ_A, R404A, 1_000, service);
    }

    function test_revert_ledgerCanOnlyBeSetOnce() public {
        vm.expectRevert(EquipmentRegistry.LedgerAlreadySet.selector);
        equipment.setLedger(address(0xBEEF));
    }
}
