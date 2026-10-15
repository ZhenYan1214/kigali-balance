// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Fixture} from "./utils/Fixture.sol";
import {Roles, Tier} from "../src/Types.sol";
import {EquipmentRegistry} from "../src/EquipmentRegistry.sol";
import {KigaliLedger} from "../src/KigaliLedger.sol";
import {ScaleReading} from "../src/Attestations.sol";

contract EquipmentTest is Fixture {
    bytes32 internal constant EQ_B = keccak256("household-ac/serial-123");

    function _registerB(bytes32 id) internal {
        vm.prank(service);
        equipment.registerTierB(id, MODEL_SPLIT_AC, keccak256(abi.encode("nameplate-photo", id)));
    }

    // ---------------------------------------------------------------- Tier A

    function test_tierA_capIsNameplatePlusTolerance() public view {
        assertEq(equipment.recoveryCap(EQ_A), 10_500);
    }

    function test_tierA_cumulativeRecoveryIsCapped() public {
        _recover(service, SCALE_SERVICE_PK, EQ_A, 6_000, false);
        _recover(service, SCALE_SERVICE_PK, EQ_A, 4_500, false); // total 10.5 kg: allowed
        bytes32 cyl = bytes32("cyl-3");
        ScaleReading memory r = _reading(ledger.recoverySubject(EQ_A, cyl), 1);
        bytes memory sig = _signScale(SCALE_SERVICE_PK, r);
        vm.prank(service);
        vm.expectRevert(); // RecoveryCapExceeded(10_500, 10_501)
        ledger.recover(EQ_A, cyl, false, r, sig);
    }

    function test_decommissionedUnitCannotYieldMore() public {
        _recover(service, SCALE_SERVICE_PK, EQ_A, 3_000, true);
        assertEq(uint8(equipment.equipment(EQ_A).status), uint8(EquipmentRegistry.Status.DECOMMISSIONED));
        bytes32 cyl = bytes32("cyl-2");
        ScaleReading memory r = _reading(ledger.recoverySubject(EQ_A, cyl), 1_000);
        bytes memory sig = _signScale(SCALE_SERVICE_PK, r);
        vm.prank(service);
        vm.expectRevert(EquipmentRegistry.NotActive.selector);
        ledger.recover(EQ_A, cyl, true, r, sig);
    }

    function test_revert_unknownEquipment() public {
        bytes32 ghost = keccak256("never-registered");
        bytes32 cyl = bytes32("cyl");
        ScaleReading memory r = _reading(ledger.recoverySubject(ghost, cyl), 1_000);
        bytes memory sig = _signScale(SCALE_SERVICE_PK, r);
        vm.prank(service);
        vm.expectRevert(EquipmentRegistry.UnknownEquipment.selector);
        ledger.recover(ghost, cyl, true, r, sig);
    }

    function test_revert_onlyRegistrarRegistersTierA() public {
        vm.prank(service);
        vm.expectRevert(abi.encodeWithSelector(EquipmentRegistry.NotRole.selector, Roles.EQUIPMENT_REGISTRAR));
        equipment.registerTierA(keccak256("fake"), R404A, 50_000, 0, bytes32(0));
    }

    function test_revert_cannotRegisterTwice() public {
        vm.prank(registrar);
        vm.expectRevert(EquipmentRegistry.AlreadyRegistered.selector);
        equipment.registerTierA(EQ_A, R404A, NAMEPLATE, 0, bytes32(0));
    }

    // ---------------------------------------------------------------- Tier B (unregistered small units)

    function test_tierB_registeredAtDecommissioningWithModelCharge() public {
        _registerB(EQ_B);
        EquipmentRegistry.Equipment memory e = equipment.equipment(EQ_B);
        assertEq(uint8(e.tier), uint8(Tier.B));
        assertEq(e.nameplateGrams, 1_200);
        assertEq(equipment.recoveryCap(EQ_B), 1_200, "no tolerance for tier B");

        uint256 lotId = _recover(service, SCALE_SERVICE_PK, EQ_B, 1_100, true);
        assertEq(uint8(ledger.getLot(lotId).tier), uint8(Tier.B));
    }

    function test_tierB_revert_unknownModel() public {
        vm.prank(service);
        vm.expectRevert(EquipmentRegistry.UnknownModel.selector);
        equipment.registerTierB(EQ_B, keccak256("model/not-in-database"), bytes32("photo"));
    }

    function test_tierB_monthlyCapPerServiceCompany() public {
        equipment.setParams(500, 3_000, 180 days); // 3 kg of Tier B recovery per company per 30 days
        for (uint256 i; i < 2; ++i) {
            bytes32 id = keccak256(abi.encode("ac", i));
            _registerB(id);
            _recover(service, SCALE_SERVICE_PK, id, 1_200, true); // 2.4 kg used
        }
        bytes32 third = keccak256(abi.encode("ac", uint256(2)));
        _registerB(third);
        bytes32 cyl = bytes32("cyl-x");
        ScaleReading memory r = _reading(ledger.recoverySubject(third, cyl), 1_000);
        bytes memory sig = _signScale(SCALE_SERVICE_PK, r);
        vm.prank(service);
        vm.expectRevert(abi.encodeWithSelector(EquipmentRegistry.TierBMonthlyCapExceeded.selector, 3_000, 3_400));
        ledger.recover(third, cyl, true, r, sig);

        // another company has its own budget
        _recover(service2, SCALE_SERVICE2_PK, third, 1_000, true);

        // and the first company's budget resets next period
        bytes32 fourth = keccak256(abi.encode("ac", uint256(3)));
        _registerB(fourth);
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
