// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Governed} from "./Types.sol";

/// @title IdentityRegistry
/// @notice Maps on-chain keys to roles backed by off-chain W3C Verifiable Credentials.
///         Only a hash of the credential is stored; personal data stays off-chain (threat T11).
///         Revocation takes effect immediately for every contract that checks `hasRole` (threat T6).
contract IdentityRegistry is Governed {
    struct Grant {
        bool active;
        bytes32 credentialHash; // hash of the VC that justifies this role (e.g. a technician licence)
        uint64 grantedAt;
    }

    mapping(address => mapping(bytes32 => Grant)) internal _grants;

    event RoleGranted(address indexed account, bytes32 indexed role, bytes32 credentialHash);
    event RoleRevoked(address indexed account, bytes32 indexed role, bytes32 reasonHash);

    error ZeroAddress();
    error NotGranted();

    constructor(address governance_) Governed(governance_) {}

    function grantRole(address account, bytes32 role, bytes32 credentialHash) external onlyGovernance {
        if (account == address(0)) revert ZeroAddress();
        _grants[account][role] = Grant({active: true, credentialHash: credentialHash, grantedAt: uint64(block.timestamp)});
        emit RoleGranted(account, role, credentialHash);
    }

    function revokeRole(address account, bytes32 role, bytes32 reasonHash) external onlyGovernance {
        if (!_grants[account][role].active) revert NotGranted();
        _grants[account][role].active = false;
        emit RoleRevoked(account, role, reasonHash);
    }

    function hasRole(address account, bytes32 role) public view returns (bool) {
        return _grants[account][role].active;
    }

    function grant(address account, bytes32 role) external view returns (Grant memory) {
        return _grants[account][role];
    }
}
