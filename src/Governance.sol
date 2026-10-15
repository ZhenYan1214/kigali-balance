// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title Governance
/// @notice M-of-N consortium multisig. Members are meant to come from different camps
///         (regulator, carbon registry, industry association, civil society) so that no single
///         party controls roles or parameters (threat T10 in the plan).
contract Governance {
    struct Proposal {
        address target;
        bytes data;
        uint256 approvals;
        bool executed;
    }

    mapping(address => bool) public isMember;
    uint256 public memberCount;
    uint256 public immutable threshold;

    Proposal[] internal _proposals;
    mapping(uint256 => mapping(address => bool)) public approved;

    event Proposed(uint256 indexed id, address indexed proposer, address target, bytes data);
    event Approved(uint256 indexed id, address indexed member, uint256 approvals);
    event Executed(uint256 indexed id);

    error NotMember();
    error BadThreshold();
    error DuplicateMember();
    error AlreadyApproved();
    error AlreadyExecuted();
    error NotEnoughApprovals();
    error CallFailed(bytes reason);
    error UnknownProposal();

    constructor(address[] memory members, uint256 threshold_) {
        if (threshold_ == 0 || threshold_ > members.length) revert BadThreshold();
        for (uint256 i; i < members.length; ++i) {
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
        _proposals.push(Proposal({target: target, data: data, approvals: 0, executed: false}));
        emit Proposed(id, msg.sender, target, data);
        _approve(id);
    }

    function approve(uint256 id) external onlyMember {
        if (id >= _proposals.length) revert UnknownProposal();
        _approve(id);
    }

    function execute(uint256 id) external onlyMember {
        if (id >= _proposals.length) revert UnknownProposal();
        Proposal storage p = _proposals[id];
        if (p.executed) revert AlreadyExecuted();
        if (p.approvals < threshold) revert NotEnoughApprovals();
        p.executed = true;
        (bool ok, bytes memory ret) = p.target.call(p.data);
        if (!ok) revert CallFailed(ret);
        emit Executed(id);
    }

    function proposal(uint256 id) external view returns (Proposal memory) {
        return _proposals[id];
    }

    function _approve(uint256 id) internal {
        Proposal storage p = _proposals[id];
        if (p.executed) revert AlreadyExecuted();
        if (approved[id][msg.sender]) revert AlreadyApproved();
        approved[id][msg.sender] = true;
        p.approvals += 1;
        emit Approved(id, msg.sender, p.approvals);
    }
}
