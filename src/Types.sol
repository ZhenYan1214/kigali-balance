// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @notice Provenance class of a lot. Classes are never interchangeable (no "free allocation").
enum LotClass {
    NONE,
    VIRGIN, // backed by an import quota document
    RECOVERED, // recovered from a registered piece of equipment
    RECLAIMED, // produced by reclaiming RECOVERED lots
    UNKNOWN // origin not documented (e.g. legacy stock); can be held or destroyed, never reclaimed or credited
}

enum LotStatus {
    NONE,
    ACTIVE,
    IN_TRANSIT,
    CONSUMED
}

/// @notice Trust tier of recovered refrigerant. Lower value = stronger evidence.
enum Tier {
    NONE,
    A, // from a national equipment registry, with service history
    B, // registered at decommissioning from a signed nameplate photo + model lookup
    C // recovered too soon after installation or a ledger charge: indistinguishable from virgin gas
        // passed through a unit ("charge-and-recover laundering"). May be held, recharged or
        // destroyed, but never reclaimed and never credit-eligible.
}

/// @notice Shared role identifiers used by IdentityRegistry.
library Roles {
    bytes32 internal constant QUOTA_AUTHORITY = keccak256("QUOTA_AUTHORITY");
    bytes32 internal constant EQUIPMENT_REGISTRAR = keccak256("EQUIPMENT_REGISTRAR");
    bytes32 internal constant IMPORTER = keccak256("IMPORTER");
    bytes32 internal constant DISTRIBUTOR = keccak256("DISTRIBUTOR");
    bytes32 internal constant SERVICE = keccak256("SERVICE");
    bytes32 internal constant RECLAIMER = keccak256("RECLAIMER");
    bytes32 internal constant DESTRUCTION = keccak256("DESTRUCTION");
    bytes32 internal constant REGISTRY = keccak256("REGISTRY");
    bytes32 internal constant REGULATOR = keccak256("REGULATOR");
    bytes32 internal constant AI_ORACLE = keccak256("AI_ORACLE");
    bytes32 internal constant SCALE = keccak256("SCALE"); // device key of a calibrated scale
    bytes32 internal constant LAB = keccak256("LAB"); // accredited laboratory signing key
}

/// @notice Base for contracts whose privileged functions are executed by the consortium Governance contract.
abstract contract Governed {
    address public immutable governance;

    error NotGovernance();
    error ZeroGovernance();

    constructor(address governance_) {
        if (governance_ == address(0)) revert ZeroGovernance();
        governance = governance_;
    }

    modifier onlyGovernance() {
        if (msg.sender != governance) revert NotGovernance();
        _;
    }
}
