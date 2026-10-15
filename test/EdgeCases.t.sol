// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Fixture} from "./utils/Fixture.sol";
import {Roles, Tier, LotStatus} from "../src/Types.sol";
import {IdentityRegistry} from "../src/IdentityRegistry.sol";
import {EquipmentRegistry} from "../src/EquipmentRegistry.sol";
import {DestructionClaims} from "../src/DestructionClaims.sol";
import {FlagRegistry} from "../src/FlagRegistry.sol";
import {KigaliLedger} from "../src/KigaliLedger.sol";
import {ScaleReading, Attestations} from "../src/Attestations.sol";

/// @notice Input validation and parameter bounds.
contract EdgeCasesTest is Fixture {
    // ---------------------------------------------------------------- parameters

    function test_ledgerParamsUpdate() public {
        ledger.setParams(200, 300, 9_900, 9_990, 3 days);
        assertEq(ledger.transferToleranceBps(), 200);
        assertEq(ledger.minReclaimLossBps(), 300);
        assertEq(ledger.minReclaimPurityBps(), 9_900);
        assertEq(ledger.minDreBps(), 9_990);
        assertEq(ledger.maxAttestationAge(), 3 days);
    }

    function test_revert_ledgerParamsOutOfBounds() public {
        vm.expectRevert(KigaliLedger.BadParams.selector);
        ledger.setParams(1_001, 200, 9_950, 9_999, 7 days); // tolerance above 10 %
        vm.expectRevert(KigaliLedger.BadParams.selector);
        ledger.setParams(100, 10_000, 9_950, 9_999, 7 days); // 100 % loss
        vm.expectRevert(KigaliLedger.BadParams.selector);
        ledger.setParams(100, 200, 10_001, 9_999, 7 days);
        vm.expectRevert(KigaliLedger.BadParams.selector);
        ledger.setParams(100, 200, 9_950, 10_001, 7 days);
        vm.expectRevert(KigaliLedger.BadParams.selector);
        ledger.setParams(100, 200, 9_950, 9_999, 0);
    }

    function test_revert_equipmentParamsOutOfBounds() public {
        vm.expectRevert(EquipmentRegistry.BadParams.selector);
        equipment.setParams(2_001, 1_000, 180 days);
        vm.expectRevert(EquipmentRegistry.BadParams.selector);
        equipment.setParams(500, 0, 180 days);
    }

    // ---------------------------------------------------------------- identity

    function test_revert_grantZeroAddress() public {
        vm.expectRevert(IdentityRegistry.ZeroAddress.selector);
        identity.grantRole(address(0), Roles.LAB, bytes32(0));
    }

    function test_revert_revokeNotGranted() public {
        vm.expectRevert(IdentityRegistry.NotGranted.selector);
        identity.revokeRole(makeAddr("nobody"), Roles.LAB, bytes32(0));
    }

    function test_grantRecordsCredentialHash() public view {
        IdentityRegistry.Grant memory g = identity.grant(reclaimer, Roles.RECLAIMER);
        assertTrue(g.active);
        assertEq(g.credentialHash, keccak256(abi.encode("vc", reclaimer, Roles.RECLAIMER)));
    }

    // ---------------------------------------------------------------- signatures

    function test_revert_signatureWrongLength() public {
        bytes32 cyl = bytes32("cyl");
        ScaleReading memory r = _reading(ledger.recoverySubject(EQ_A, cyl), 1_000);
        vm.prank(service);
        vm.expectRevert(Attestations.BadSignature.selector);
        ledger.recover(EQ_A, cyl, false, r, hex"1234");
    }

    function test_revert_signatureBadV() public {
        bytes32 cyl = bytes32("cyl");
        ScaleReading memory r = _reading(ledger.recoverySubject(EQ_A, cyl), 1_000);
        (, bytes32 rr, bytes32 s) = vm.sign(SCALE_SERVICE_PK, ledger.scaleDigest(r));
        vm.prank(service);
        vm.expectRevert(Attestations.BadSignature.selector);
        ledger.recover(EQ_A, cyl, false, r, abi.encodePacked(rr, s, uint8(29)));
    }

    // ---------------------------------------------------------------- lots and quotas

    function test_revert_duplicateQuota() public {
        vm.prank(quotaAuthority);
        vm.expectRevert(KigaliLedger.QuotaExists.selector);
        ledger.registerQuota(QUOTA_ID, importer, R404A, 1);
    }

    function test_revert_zeroAmounts() public {
        vm.prank(importer);
        vm.expectRevert(KigaliLedger.ZeroAmount.selector);
        ledger.mintVirgin(QUOTA_ID, 0, bytes32("c"));
        vm.prank(service);
        vm.expectRevert(KigaliLedger.ZeroAmount.selector);
        ledger.declareUnknown(R404A, 0, bytes32("c"), bytes32("d"));
    }

    function test_revert_declareUnknownByNonOperator() public {
        address stranger = makeAddr("stranger");
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(KigaliLedger.NotOperator.selector, stranger));
        ledger.declareUnknown(R404A, 1_000, bytes32("c"), bytes32("d"));
    }

    function test_revert_unknownLot() public {
        vm.expectRevert(abi.encodeWithSelector(KigaliLedger.UnknownLot.selector, 999));
        ledger.getLot(999);
    }

    function test_revert_selfTransfer() public {
        uint256 id = _mint(1_000);
        vm.prank(importer);
        vm.expectRevert(KigaliLedger.SelfTransfer.selector);
        ledger.send(id, importer, 1_000, bytes32(0));
    }

    function test_revert_onlyPendingRecipientCanReceiveOrReject() public {
        uint256 id = _mint(1_000);
        vm.prank(importer);
        ledger.send(id, distributor, 1_000, bytes32(0));
        vm.prank(service);
        vm.expectRevert(abi.encodeWithSelector(KigaliLedger.NotPendingRecipient.selector, id));
        ledger.rejectLot(id);
    }

    function test_receiptOfZeroGramsConsumesLot() public {
        uint256 id = _mint(1_000);
        vm.prank(importer);
        ledger.send(id, distributor, 1_000, bytes32(0));
        ScaleReading memory r = _reading(ledger.receiptSubject(id), 0); // cylinder arrived empty
        bytes memory sig = _signScale(SCALE_DIST_PK, r);
        vm.prank(distributor);
        ledger.receiveLot(id, r, sig);
        assertEq(uint8(ledger.getLot(id).status), uint8(LotStatus.CONSUMED));
        assertEq(ledger.totals(R404A).handlingLoss, 1_000);
        _assertConservation(R404A);
    }

    function test_revert_emptyInputs() public {
        uint256[] memory none = new uint256[](0);
        ScaleReading memory r = _reading(ledger.destructionSubject(none), 1);
        bytes memory sig = _signScale(SCALE_FACILITY_PK, r);
        vm.prank(facility);
        vm.expectRevert(KigaliLedger.EmptyInputs.selector);
        ledger.destroy(none, r, sig, bytes32("c"), 9_999);
    }

    function test_revert_destroyMixedGases() public {
        uint256 a = _recover(service, SCALE_SERVICE_PK, EQ_A, 4_000, true);
        uint256 fa = _move(a, service, facility, SCALE_FACILITY_PK, 4_000);
        vm.prank(facility);
        uint256 other = ledger.declareUnknown(R134A, 1_000, bytes32("c"), bytes32("d"));
        uint256[] memory inputs = _two(fa, other);
        ScaleReading memory r = _reading(ledger.destructionSubject(inputs), 5_000);
        bytes memory sig = _signScale(SCALE_FACILITY_PK, r);
        vm.prank(facility);
        vm.expectRevert(KigaliLedger.GasMismatch.selector);
        ledger.destroy(inputs, r, sig, bytes32("c"), 9_999);
    }

    // ---------------------------------------------------------------- claims and flags

    function test_revert_unknownDestructionEvent() public {
        vm.prank(registryTW);
        vm.expectRevert(DestructionClaims.UnknownEvent.selector);
        claims.claim(42, bytes32("x"));
        vm.expectRevert(DestructionClaims.UnknownEvent.selector);
        claims.destructionEvent(42);
    }

    function test_revert_nonRegistrySetsPolicy() public {
        vm.prank(facility);
        vm.expectRevert(abi.encodeWithSelector(DestructionClaims.NotRole.selector, Roles.REGISTRY));
        claims.setAcceptedTier(Tier.B);
    }

    function test_revert_unknownFlag() public {
        vm.prank(regulator);
        vm.expectRevert(FlagRegistry.UnknownFlag.selector);
        flags.review(7, FlagRegistry.Outcome.CONFIRMED, bytes32(0));
    }

    function test_revert_reviewToOpenIsInvalid() public {
        vm.prank(aiOracle);
        uint256 id = flags.raise(bytes32("LOT"), bytes32("1"), bytes32("R"), 1, bytes32(0), bytes32(0));
        vm.prank(regulator);
        vm.expectRevert(FlagRegistry.BadOutcome.selector);
        flags.review(id, FlagRegistry.Outcome.OPEN, bytes32(0));
    }
}
