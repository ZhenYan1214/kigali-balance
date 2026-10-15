// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Roles} from "./Types.sol";
import {IdentityRegistry} from "./IdentityRegistry.sol";

/// @title FlagRegistry
/// @notice Audit trail for AI findings. The AI never sanctions anyone: it raises a flag that pins
///         the model version and the exact input snapshot, so anyone can re-run it, and a human
///         regulator records the outcome of the review.
contract FlagRegistry {
    enum Outcome {
        OPEN,
        CONFIRMED,
        DISMISSED
    }

    struct Flag {
        bytes32 subjectType; // e.g. "EQUIPMENT", "ACTOR", "LOT"
        bytes32 subjectId;
        bytes32 reasonCode; // e.g. "LEAK_GAP", "YIELD_ANOMALY", "RECOVERY_IMPLAUSIBLE"
        uint16 scoreBps; // anomaly score in basis points
        bytes32 modelHash; // hash of the model artefact and version
        bytes32 inputHash; // hash of the input snapshot the model scored
        address raisedBy;
        uint64 raisedAt;
        Outcome outcome;
        address reviewedBy;
        bytes32 reviewNoteHash;
    }

    IdentityRegistry public immutable identity;
    Flag[] internal _flags;

    event FlagRaised(uint256 indexed flagId, bytes32 indexed subjectType, bytes32 indexed subjectId, bytes32 reasonCode, uint16 scoreBps);
    event FlagReviewed(uint256 indexed flagId, Outcome outcome, address reviewer, bytes32 reviewNoteHash);

    error NotRole(bytes32 role);
    error UnknownFlag();
    error AlreadyReviewed();
    error BadOutcome();
    error BadScore();

    constructor(IdentityRegistry identity_) {
        identity = identity_;
    }

    function raise(
        bytes32 subjectType,
        bytes32 subjectId,
        bytes32 reasonCode,
        uint16 scoreBps,
        bytes32 modelHash,
        bytes32 inputHash
    ) external returns (uint256 flagId) {
        if (!identity.hasRole(msg.sender, Roles.AI_ORACLE)) revert NotRole(Roles.AI_ORACLE);
        if (scoreBps > 10_000) revert BadScore();
        flagId = _flags.length;
        _flags.push(
            Flag({
                subjectType: subjectType,
                subjectId: subjectId,
                reasonCode: reasonCode,
                scoreBps: scoreBps,
                modelHash: modelHash,
                inputHash: inputHash,
                raisedBy: msg.sender,
                raisedAt: uint64(block.timestamp),
                outcome: Outcome.OPEN,
                reviewedBy: address(0),
                reviewNoteHash: bytes32(0)
            })
        );
        emit FlagRaised(flagId, subjectType, subjectId, reasonCode, scoreBps);
    }

    function review(uint256 flagId, Outcome outcome, bytes32 reviewNoteHash) external {
        if (!identity.hasRole(msg.sender, Roles.REGULATOR)) revert NotRole(Roles.REGULATOR);
        if (flagId >= _flags.length) revert UnknownFlag();
        if (outcome == Outcome.OPEN) revert BadOutcome();
        Flag storage f = _flags[flagId];
        if (f.outcome != Outcome.OPEN) revert AlreadyReviewed();
        f.outcome = outcome;
        f.reviewedBy = msg.sender;
        f.reviewNoteHash = reviewNoteHash;
        emit FlagReviewed(flagId, outcome, msg.sender, reviewNoteHash);
    }

    function flagCount() external view returns (uint256) {
        return _flags.length;
    }

    function flag(uint256 flagId) external view returns (Flag memory) {
        if (flagId >= _flags.length) revert UnknownFlag();
        return _flags[flagId];
    }
}
