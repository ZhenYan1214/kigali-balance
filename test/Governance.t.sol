// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {Roles, Governed} from "../src/Types.sol";
import {Governance} from "../src/Governance.sol";
import {IdentityRegistry} from "../src/IdentityRegistry.sol";
import {FlagRegistry} from "../src/FlagRegistry.sol";

/// @notice Consortium governance (threat T10): no single camp can grant roles alone.
contract GovernanceTest is Test {
    Governance internal gov;
    IdentityRegistry internal identity;

    address internal regulatorSeat = makeAddr("regulatorSeat");
    address internal registrySeat = makeAddr("registrySeat");
    address internal industrySeat = makeAddr("industrySeat");
    address internal civilSeat = makeAddr("civilSocietySeat");
    address internal newReclaimer = makeAddr("newReclaimer");

    function setUp() public {
        address[] memory members = new address[](4);
        members[0] = regulatorSeat;
        members[1] = registrySeat;
        members[2] = industrySeat;
        members[3] = civilSeat;
        gov = new Governance(members, 3);
        identity = new IdentityRegistry(address(gov));
    }

    function _grantCall() internal view returns (bytes memory) {
        return abi.encodeCall(IdentityRegistry.grantRole, (newReclaimer, Roles.RECLAIMER, keccak256("licence")));
    }

    function test_threeOfFourGrantsRole() public {
        vm.prank(industrySeat);
        uint256 id = gov.propose(address(identity), _grantCall());
        vm.prank(regulatorSeat);
        gov.approve(id);
        vm.prank(civilSeat);
        gov.approve(id);
        vm.prank(registrySeat);
        gov.execute(id);
        assertTrue(identity.hasRole(newReclaimer, Roles.RECLAIMER));
    }

    function test_revert_twoOfFourIsNotEnough() public {
        vm.prank(industrySeat);
        uint256 id = gov.propose(address(identity), _grantCall());
        vm.prank(registrySeat);
        gov.approve(id);
        vm.prank(industrySeat);
        vm.expectRevert(Governance.NotEnoughApprovals.selector);
        gov.execute(id);
    }

    function test_revert_memberCannotApproveTwice() public {
        vm.prank(industrySeat);
        uint256 id = gov.propose(address(identity), _grantCall());
        vm.prank(industrySeat);
        vm.expectRevert(Governance.AlreadyApproved.selector);
        gov.approve(id);
    }

    function test_revert_cannotExecuteTwice() public {
        vm.prank(industrySeat);
        uint256 id = gov.propose(address(identity), _grantCall());
        vm.prank(regulatorSeat);
        gov.approve(id);
        vm.prank(civilSeat);
        gov.approve(id);
        vm.prank(civilSeat);
        gov.execute(id);
        vm.prank(civilSeat);
        vm.expectRevert(Governance.AlreadyExecuted.selector);
        gov.execute(id);
    }

    function test_revert_outsiderCannotPropose() public {
        vm.prank(newReclaimer);
        vm.expectRevert(Governance.NotMember.selector);
        gov.propose(address(identity), _grantCall());
    }

    function test_revert_nobodyBypassesGovernance() public {
        vm.prank(regulatorSeat); // even a member cannot call the registry directly
        vm.expectRevert(Governed.NotGovernance.selector);
        identity.grantRole(newReclaimer, Roles.RECLAIMER, bytes32(0));
    }

    function test_revert_badThreshold() public {
        address[] memory members = new address[](2);
        members[0] = regulatorSeat;
        members[1] = registrySeat;
        vm.expectRevert(Governance.BadThreshold.selector);
        new Governance(members, 3);
    }

    function test_revert_duplicateMember() public {
        address[] memory members = new address[](2);
        members[0] = regulatorSeat;
        members[1] = regulatorSeat;
        vm.expectRevert(Governance.DuplicateMember.selector);
        new Governance(members, 1);
    }

    function test_revocationViaGovernance() public {
        // grant, then revoke through two separate proposals
        vm.prank(industrySeat);
        uint256 g = gov.propose(address(identity), _grantCall());
        vm.prank(regulatorSeat);
        gov.approve(g);
        vm.prank(civilSeat);
        gov.approve(g);
        vm.prank(civilSeat);
        gov.execute(g);

        bytes memory revoke =
            abi.encodeCall(IdentityRegistry.revokeRole, (newReclaimer, Roles.RECLAIMER, keccak256("licence suspended")));
        vm.prank(regulatorSeat);
        uint256 r = gov.propose(address(identity), revoke);
        vm.prank(registrySeat);
        gov.approve(r);
        vm.prank(civilSeat);
        gov.approve(r);
        vm.prank(regulatorSeat);
        gov.execute(r);
        assertFalse(identity.hasRole(newReclaimer, Roles.RECLAIMER));
    }

    // ---------------------------------------------------------------- seat rotation (red-team F11)

    function _passed(address target, bytes memory data) internal returns (uint256 id) {
        vm.prank(industrySeat);
        id = gov.propose(target, data);
        vm.prank(regulatorSeat);
        gov.approve(id);
        vm.prank(civilSeat);
        gov.approve(id);
    }

    function test_F11_lostSeatIsRotatedByTheOthers() public {
        address newRegistrySeat = makeAddr("newRegistrySeat");
        uint256 id = _passed(address(gov), abi.encodeCall(Governance.replaceMember, (registrySeat, newRegistrySeat)));
        vm.prank(industrySeat);
        gov.execute(id);
        assertFalse(gov.isMember(registrySeat));
        assertTrue(gov.isMember(newRegistrySeat));
        assertEq(gov.membershipEpoch(), 1);
    }

    function test_F11_rotationVoidsOpenProposals() public {
        // the old key approved a proposal before it was rotated out: that approval must not count
        vm.prank(registrySeat);
        uint256 stale = gov.propose(address(identity), _grantCall());
        uint256 rotate = _passed(address(gov), abi.encodeCall(Governance.replaceMember, (registrySeat, makeAddr("n"))));
        vm.prank(industrySeat);
        gov.execute(rotate);
        vm.prank(regulatorSeat);
        vm.expectRevert(Governance.MembershipChanged.selector);
        gov.approve(stale);
    }

    function test_F11_revert_replaceMemberOnlyThroughGovernance() public {
        vm.prank(regulatorSeat);
        vm.expectRevert(Governance.OnlyThroughGovernance.selector);
        gov.replaceMember(registrySeat, regulatorSeat);
    }

    function test_F11_proposalsExpire() public {
        uint256 id = _passed(address(identity), _grantCall());
        vm.warp(block.timestamp + 31 days);
        vm.prank(industrySeat);
        vm.expectRevert(Governance.ProposalExpired.selector);
        gov.execute(id);
    }

    /// S4 (Low): governance could seat itself, which loses a seat for good.
    function test_S4_contractCannotHoldASeat() public {
        uint256 id = _passed(address(gov), abi.encodeCall(Governance.replaceMember, (registrySeat, address(gov))));
        vm.prank(industrySeat);
        vm.expectRevert(); // CallFailed(BadMember)
        gov.execute(id);
    }

    /// S5 (Info): a proposal to an address without code looked executed.
    function test_S5_emptyTargetIsRejected() public {
        uint256 id = _passed(makeAddr("typo"), hex"");
        vm.prank(industrySeat);
        vm.expectRevert(abi.encodeWithSelector(Governance.NoCode.selector, makeAddr("typo")));
        gov.execute(id);
    }

    function test_F11_approvalCanBeWithdrawn() public {
        uint256 id = _passed(address(identity), _grantCall());
        vm.prank(civilSeat);
        gov.withdrawApproval(id);
        vm.prank(industrySeat);
        vm.expectRevert(Governance.NotEnoughApprovals.selector);
        gov.execute(id);
    }
}

/// @notice AI findings are audit-trailed and only humans close them.
contract FlagRegistryTest is Test {
    IdentityRegistry internal identity;
    FlagRegistry internal flags;
    address internal ai = makeAddr("aiOracle");
    address internal regulator = makeAddr("regulator");

    function setUp() public {
        identity = new IdentityRegistry(address(this));
        flags = new FlagRegistry(identity);
        identity.grantRole(ai, Roles.AI_ORACLE, bytes32("model-service"));
        identity.grantRole(regulator, Roles.REGULATOR, bytes32("ozone-unit"));
    }

    function _raise() internal returns (uint256) {
        vm.prank(ai);
        return flags.raise(
            bytes32("ACTOR"), bytes32("reclaimer-x"), bytes32("YIELD_ANOMALY"), 9_100, keccak256("model:v0.1"), keccak256("snapshot")
        );
    }

    function test_flagLifecycle() public {
        uint256 id = _raise();
        assertEq(uint8(flags.flag(id).outcome), uint8(FlagRegistry.Outcome.OPEN));
        vm.prank(regulator);
        flags.review(id, FlagRegistry.Outcome.CONFIRMED, keccak256("site inspection report"));
        FlagRegistry.Flag memory f = flags.flag(id);
        assertEq(uint8(f.outcome), uint8(FlagRegistry.Outcome.CONFIRMED));
        assertEq(f.reviewedBy, regulator);
        assertEq(f.modelHash, keccak256("model:v0.1"), "model version is pinned for re-runs");
    }

    function test_revert_aiCannotReviewItsOwnFlag() public {
        uint256 id = _raise();
        vm.prank(ai);
        vm.expectRevert(abi.encodeWithSelector(FlagRegistry.NotRole.selector, Roles.REGULATOR));
        flags.review(id, FlagRegistry.Outcome.CONFIRMED, bytes32(0));
    }

    function test_revert_onlyAiOracleRaises() public {
        vm.prank(regulator);
        vm.expectRevert(abi.encodeWithSelector(FlagRegistry.NotRole.selector, Roles.AI_ORACLE));
        flags.raise(bytes32("ACTOR"), bytes32("x"), bytes32("R"), 1, bytes32(0), bytes32(0));
    }

    function test_revert_reviewOnce() public {
        uint256 id = _raise();
        vm.prank(regulator);
        flags.review(id, FlagRegistry.Outcome.DISMISSED, bytes32(0));
        vm.prank(regulator);
        vm.expectRevert(FlagRegistry.AlreadyReviewed.selector);
        flags.review(id, FlagRegistry.Outcome.CONFIRMED, bytes32(0));
    }

    function test_revert_scoreAbove100Percent() public {
        vm.prank(ai);
        vm.expectRevert(FlagRegistry.BadScore.selector);
        flags.raise(bytes32("ACTOR"), bytes32("x"), bytes32("R"), 10_001, bytes32(0), bytes32(0));
    }
}
