// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Fixture} from "./utils/Fixture.sol";
import {Roles, Tier} from "../src/Types.sol";
import {DestructionClaims} from "../src/DestructionClaims.sol";

contract ClaimsTest is Fixture {
    function _destroyRecovered(bytes32 eqId, uint64 grams) internal returns (uint256 eventId) {
        uint256 rec = _recover(service, SCALE_SERVICE_PK, eqId, grams, true);
        uint256 atFacility = _move(rec, service, facility, SCALE_FACILITY_PK, grams);
        eventId = _destroy(_one(atFacility), grams);
    }

    function test_R7_firstRegistryClaims() public {
        uint256 ev = _destroyRecovered(EQ_A, 5_000);
        vm.prank(registryTW);
        claims.claim(ev, bytes32("TW-VER-2026-0001"));
        DestructionClaims.DestructionEvent memory e = claims.destructionEvent(ev);
        assertEq(e.claimedBy, registryTW);
        assertEq(e.creditBatchRef, bytes32("TW-VER-2026-0001"));
    }

    function test_R7_revert_secondRegistryCannotClaimSameEvent() public {
        uint256 ev = _destroyRecovered(EQ_A, 5_000);
        vm.prank(registryTW);
        claims.claim(ev, bytes32("TW-VER-2026-0001"));
        vm.prank(registryIntl);
        vm.expectRevert(abi.encodeWithSelector(DestructionClaims.AlreadyClaimed.selector, registryTW));
        claims.claim(ev, bytes32("INTL-2026-77"));
    }

    function test_R7_revert_sameRegistryCannotClaimTwice() public {
        uint256 ev = _destroyRecovered(EQ_A, 5_000);
        vm.prank(registryTW);
        claims.claim(ev, bytes32("a"));
        vm.prank(registryTW);
        vm.expectRevert(abi.encodeWithSelector(DestructionClaims.AlreadyClaimed.selector, registryTW));
        claims.claim(ev, bytes32("b"));
    }

    function test_R7_revert_ineligibleEventCannotBeClaimed() public {
        uint256 v = _mint(5_000);
        uint256 atFacility = _move(v, importer, facility, SCALE_FACILITY_PK, 5_000);
        uint256 ev = _destroy(_one(atFacility), 5_000);
        vm.prank(registryTW);
        vm.expectRevert(DestructionClaims.NotCreditEligible.selector);
        claims.claim(ev, bytes32("x"));
    }

    function test_R7_revert_nonRegistryCannotClaim() public {
        uint256 ev = _destroyRecovered(EQ_A, 5_000);
        vm.prank(facility);
        vm.expectRevert(abi.encodeWithSelector(DestructionClaims.NotRole.selector, Roles.REGISTRY));
        claims.claim(ev, bytes32("x"));
    }

    function test_R7_revert_onlyLedgerRecordsEvents() public {
        vm.prank(facility);
        vm.expectRevert(DestructionClaims.NotLedger.selector);
        claims.record(facility, R404A, 1_000_000, 9_999, true, Tier.A, bytes32("forged"));
    }

    // ---------------------------------------------------------------- registry evidence policy

    function test_tierPolicy_defaultAcceptsTierAOnly() public {
        bytes32 eqB = keccak256("household-ac/1");
        vm.prank(service);
        equipment.registerTierB(eqB, MODEL_SPLIT_AC, bytes32("photo"));
        uint256 ev = _destroyRecovered(eqB, 1_000);
        assertEq(uint8(claims.destructionEvent(ev).worstTier), uint8(Tier.B));

        vm.prank(registryIntl);
        vm.expectRevert(abi.encodeWithSelector(DestructionClaims.TierNotAccepted.selector, Tier.B, Tier.A));
        claims.claim(ev, bytes32("x"));

        // a registry that explicitly accepts Tier B evidence can claim it
        vm.prank(registryTW);
        claims.setAcceptedTier(Tier.B);
        vm.prank(registryTW);
        claims.claim(ev, bytes32("TW-B-1"));
    }

    function test_tierPolicy_mixedInputsTakeWeakestTier() public {
        bytes32 eqB = keccak256("household-ac/2");
        vm.prank(service);
        equipment.registerTierB(eqB, MODEL_SPLIT_AC, bytes32("photo"));
        uint256 a = _recover(service, SCALE_SERVICE_PK, EQ_A, 5_000, true);
        uint256 b = _recover(service, SCALE_SERVICE_PK, eqB, 1_000, true);
        uint256 fa = _move(a, service, facility, SCALE_FACILITY_PK, 5_000);
        uint256 fb = _move(b, service, facility, SCALE_FACILITY_PK, 1_000);
        uint256 ev = _destroy(_two(fa, fb), 6_000);
        assertTrue(claims.destructionEvent(ev).creditEligible);
        assertEq(uint8(claims.destructionEvent(ev).worstTier), uint8(Tier.B));
    }
}
