// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @notice A weighing signed by the device key of a calibrated scale (physical anchor).
struct ScaleReading {
    bytes32 subject; // what was weighed, e.g. keccak256("RECOVERY", equipmentId, cylinderId)
    uint64 grams;
    uint64 timestamp;
    bytes32 nonce;
}

/// @notice A composition result signed by an accredited laboratory (physical anchor).
struct LabCertificate {
    bytes32 subject; // same subject as the batch it certifies
    bytes32 gas;
    uint16 purityBps;
    bytes32 sampleId;
    uint64 timestamp;
    bytes32 nonce;
}

/// @notice EIP-712 typed-data hashing and strict ECDSA recovery.
///         Signing is kept behind this library so the scheme can be swapped (crypto agility),
///         e.g. for a post-quantum signature verified by a precompile or a verifier contract.
library Attestations {
    bytes32 internal constant DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 internal constant SCALE_TYPEHASH =
        keccak256("ScaleReading(bytes32 subject,uint64 grams,uint64 timestamp,bytes32 nonce)");
    bytes32 internal constant LAB_TYPEHASH = keccak256(
        "LabCertificate(bytes32 subject,bytes32 gas,uint16 purityBps,bytes32 sampleId,uint64 timestamp,bytes32 nonce)"
    );

    /// @dev Half the secp256k1 curve order; higher `s` values are rejected to prevent malleability.
    uint256 internal constant HALF_N = 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0;

    error BadSignature();

    function domainSeparator(address verifyingContract) internal view returns (bytes32) {
        return keccak256(
            abi.encode(
                DOMAIN_TYPEHASH, keccak256("KigaliBalance"), keccak256("1"), block.chainid, verifyingContract
            )
        );
    }

    function digest(bytes32 domain, bytes32 structHash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19\x01", domain, structHash));
    }

    function hashScale(ScaleReading memory r) internal pure returns (bytes32) {
        return keccak256(abi.encode(SCALE_TYPEHASH, r.subject, r.grams, r.timestamp, r.nonce));
    }

    function hashLab(LabCertificate memory c) internal pure returns (bytes32) {
        return keccak256(abi.encode(LAB_TYPEHASH, c.subject, c.gas, c.purityBps, c.sampleId, c.timestamp, c.nonce));
    }

    function recover(bytes32 hash, bytes memory sig) internal pure returns (address signer) {
        if (sig.length != 65) revert BadSignature();
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly ("memory-safe") {
            r := mload(add(sig, 0x20))
            s := mload(add(sig, 0x40))
            v := byte(0, mload(add(sig, 0x60)))
        }
        if (uint256(s) > HALF_N || (v != 27 && v != 28)) revert BadSignature();
        signer = ecrecover(hash, v, r, s);
        if (signer == address(0)) revert BadSignature();
    }
}
