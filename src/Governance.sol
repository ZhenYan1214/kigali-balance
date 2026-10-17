// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title Governance
/// @notice M-of-N consortium multisig. Members are meant to come from different camps
///         (regulator, carbon registry, industry association, civil society) so that no single
///         party controls roles or parameters (threat T10 in the plan).
///
///         A seat whose key is lost or compromised can be rotated by the other members
///         (`replaceMember`, itself a governance proposal). Any change of membership invalidates
///         every open proposal, so an approval given by a removed key can never count. Proposals
///         expire after `PROPOSAL_TTL`, and a member can withdraw an approval before execution.
contract Governance {
    struct Proposal {
        address target;
        bytes data;
        uint256 approvals;
        bool executed;
        uint64 createdAt;
        uint64 membershipEpoch; // membership version the proposal was made under
    }

    uint64 public constant PROPOSAL_TTL = 30 days;

    mapping(address => bool) public isMember;
    uint256 public immutable memberCount; // rotation replaces a seat; the number of seats is fixed
    uint256 public immutable threshold;
    uint64 public membershipEpoch;

    Proposal[] internal _proposals;
    mapping(uint256 => mapping(address => bool)) public approved;

    event Proposed(uint256 indexed id, address indexed proposer, address target, bytes data);
    event Approved(uint256 indexed id, address indexed member, uint256 approvals);
    event ApprovalWithdrawn(uint256 indexed id, address indexed member, uint256 approvals);
    event Executed(uint256 indexed id);
    event MemberReplaced(address indexed oldMember, address indexed newMember, uint64 membershipEpoch);

    error NotMember();
    error BadThreshold();
    error DuplicateMember();
    error AlreadyApproved();
    error NotApproved();
    error AlreadyExecuted();
    error NotEnoughApprovals();
    error CallFailed(bytes reason);
    error UnknownProposal();
    error ProposalExpired();
    error MembershipChanged();
    error OnlyThroughGovernance();
    error BadMember();
    error NoCode(address target);

    constructor(address[] memory members, uint256 threshold_) {
        if (threshold_ == 0 || threshold_ > members.length) revert BadThreshold();
        for (uint256 i; i < members.length; ++i) {
            if (members[i] == address(0)) revert BadMember();
            if (isMember[members[i]]) revert DuplicateMember();
            isMember[members[i]] = true;
        }
        memberCount = members.length;
        threshold = threshold_;
    }

    modifier onlyMember() {
        if (!isMember[msg.sender]) revert NotMember();
        _;
    }

    /// @notice Propose a call; the proposer's approval is counted immediately.
    function propose(address target, bytes calldata data) external onlyMember returns (uint256 id) {
        id = _proposals.length;
        _proposals.push(
            Proposal({
                target: target,
                data: data,
                approvals: 0,
                executed: false,
                createdAt: uint64(block.timestamp),
                membershipEpoch: membershipEpoch
            })
        );
        emit Proposed(id, msg.sender, target, data);
        _approve(id);
    }

    function approve(uint256 id) external onlyMember {
        _approve(id);
    }

    /// @notice Withdraw an approval before the proposal is executed.
    function withdrawApproval(uint256 id) external onlyMember {
        Proposal storage p = _open(id);
        if (!approved[id][msg.sender]) revert NotApproved();
        approved[id][msg.sender] = false;
        p.approvals -= 1;
        emit ApprovalWithdrawn(id, msg.sender, p.approvals);
    }

    function execute(uint256 id) external onlyMember {
        Proposal storage p = _open(id);
        if (p.approvals < threshold) revert NotEnoughApprovals();
        if (p.target.code.length == 0) revert NoCode(p.target); // a mistyped target must not look executed
        p.executed = true;
        (bool ok, bytes memory ret) = p.target.call(p.data);
        if (!ok) revert CallFailed(ret);
        emit Executed(id);
    }

    /// @notice Rotate a seat: only callable by this contract, i.e. through an approved proposal.
    function replaceMember(address oldMember, address newMember) external {
        if (msg.sender != address(this)) revert OnlyThroughGovernance();
        // the contract itself can never hold a seat: it cannot sign, so a seat it held would be lost
        if (!isMember[oldMember] || newMember == address(0) || newMember == address(this) || isMember[newMember]) {
            revert BadMember();
        }
        isMember[oldMember] = false;
        isMember[newMember] = true;
        membershipEpoch += 1; // every open proposal, with any approval by the old key, is now void
        emit MemberReplaced(oldMember, newMember, membershipEpoch);
    }

    function proposal(uint256 id) external view returns (Proposal memory) {
        if (id >= _proposals.length) revert UnknownProposal();
        return _proposals[id];
    }

    function proposalCount() external view returns (uint256) {
        return _proposals.length;
    }

    function _approve(uint256 id) internal {
        Proposal storage p = _open(id);
        if (approved[id][msg.sender]) revert AlreadyApproved();
        approved[id][msg.sender] = true;
        p.approvals += 1;
        emit Approved(id, msg.sender, p.approvals);
    }

    /// @dev A proposal that can still be approved or executed.
    function _open(uint256 id) internal view returns (Proposal storage p) {
        if (id >= _proposals.length) revert UnknownProposal();
        p = _proposals[id];
        if (p.executed) revert AlreadyExecuted();
        if (p.membershipEpoch != membershipEpoch) revert MembershipChanged();
        if (block.timestamp > p.createdAt + PROPOSAL_TTL) revert ProposalExpired();
    }
}
