// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Governed, Roles, Tier} from "./Types.sol";
import {IdentityRegistry} from "./IdentityRegistry.sol";

/// @title DestructionClaims
/// @notice Claim lock (rule R7). A destruction event is ledger state created only by the
///         destruction facility that held the lots, and it can be claimed by exactly one carbon
///         registry. Unlike comparing hashes submitted by each registry, this cannot be dodged by
///         editing a field of a lab report: there is only one event to claim.
///         The facility that destroyed the gas designates which registry may claim it, so a rogue
///         or stolen registry key cannot lock someone else's event first. It can re-designate
///         until the event is claimed (for example when a registry refuses the event's tier).
contract DestructionClaims is Governed {
    struct DestructionEvent {
        address facility;
        bytes32 gas;
        uint64 grams;
        uint64 destroyedAt;
        uint16 dreBps; // destruction and removal efficiency, basis points
        bool creditEligible; // every input lot was RECOVERED from registered equipment
        Tier worstTier; // weakest equipment evidence among the inputs
        bytes32 certificateHash; // destruction certificate (off-chain)
        address claimedBy;
        bytes32 creditBatchRef; // the registry's own reference for the issued credits
        uint64 claimedAt;
    }

    IdentityRegistry public immutable identity;
    address public ledger;

    DestructionEvent[] internal _events;
    /// @notice Weakest equipment tier each registry accepts (registry-defined policy). NONE = not configured.
    mapping(address => Tier) public acceptedTier;
    /// @notice The registry the facility has designated to claim each event (kept outside the
    ///         struct so `destructionEvent()` keeps its layout).
    mapping(uint256 => address) public designatedRegistry;

    event LedgerSet(address ledger);
    event DestructionRecorded(uint256 indexed eventId, address indexed facility, bytes32 gas, uint64 grams, bool creditEligible, Tier worstTier);
    event AcceptedTierSet(address indexed registry, Tier tier);
    event Claimed(uint256 indexed eventId, address indexed registry, bytes32 creditBatchRef);
    event Designated(uint256 indexed eventId, address indexed registry);

    error NotLedger();
    error LedgerAlreadySet();
    error ZeroLedger();
    error NotRole(bytes32 role);
    error UnknownEvent();
    error NotCreditEligible();
    error AlreadyClaimed(address by);
    error TierNotAccepted(Tier eventTier, Tier accepted);
    error BadTier();
    error NotFacility(address account);
    error NotRegistry(address account);
    error NotDesignated(address designated);

    constructor(address governance_, IdentityRegistry identity_) Governed(governance_) {
        identity = identity_;
    }

    function setLedger(address ledger_) external onlyGovernance {
        if (ledger_ == address(0)) revert ZeroLedger();
        if (ledger != address(0)) revert LedgerAlreadySet();
        ledger = ledger_;
        emit LedgerSet(ledger_);
    }

    function record(
        address facility,
        bytes32 gas,
        uint64 grams,
        uint16 dreBps,
        bool creditEligible,
        Tier worstTier,
        bytes32 certificateHash
    ) external returns (uint256 eventId) {
        if (msg.sender != ledger) revert NotLedger();
        eventId = _events.length;
        _events.push(
            DestructionEvent({
                facility: facility,
                gas: gas,
                grams: grams,
                destroyedAt: uint64(block.timestamp),
                dreBps: dreBps,
                creditEligible: creditEligible,
                worstTier: worstTier,
                certificateHash: certificateHash,
                claimedBy: address(0),
                creditBatchRef: bytes32(0),
                claimedAt: 0
            })
        );
        emit DestructionRecorded(eventId, facility, gas, grams, creditEligible, worstTier);
    }

    /// @notice A registry declares the weakest equipment evidence it accepts (A only, or A and B).
    function setAcceptedTier(Tier tier) external {
        if (!identity.hasRole(msg.sender, Roles.REGISTRY)) revert NotRole(Roles.REGISTRY);
        if (tier != Tier.A && tier != Tier.B) revert BadTier(); // Tier C is never creditable
        acceptedTier[msg.sender] = tier;
        emit AcceptedTierSet(msg.sender, tier);
    }

    /// @notice The facility that destroyed the gas names the registry that may claim the event.
    function designate(uint256 eventId, address registry) external {
        if (eventId >= _events.length) revert UnknownEvent();
        // a revoked facility key can no longer steer its events
        if (msg.sender != _events[eventId].facility || !identity.hasRole(msg.sender, Roles.DESTRUCTION)) {
            revert NotFacility(msg.sender);
        }
        _designate(eventId, registry);
    }

    /// @notice Governance designates for a facility that lost its key.
    function designateByGovernance(uint256 eventId, address registry) external onlyGovernance {
        if (eventId >= _events.length) revert UnknownEvent();
        _designate(eventId, registry);
    }

    function _designate(uint256 eventId, address registry) internal {
        DestructionEvent storage ev = _events[eventId];
        if (ev.claimedBy != address(0)) revert AlreadyClaimed(ev.claimedBy);
        if (!identity.hasRole(registry, Roles.REGISTRY)) revert NotRegistry(registry);
        designatedRegistry[eventId] = registry;
        emit Designated(eventId, registry);
    }

    /// @notice Rule R7: lock a destruction event to one registry before it issues credits.
    function claim(uint256 eventId, bytes32 creditBatchRef) external {
        if (!identity.hasRole(msg.sender, Roles.REGISTRY)) revert NotRole(Roles.REGISTRY);
        if (eventId >= _events.length) revert UnknownEvent();
        DestructionEvent storage ev = _events[eventId];
        if (!ev.creditEligible) revert NotCreditEligible();
        if (ev.claimedBy != address(0)) revert AlreadyClaimed(ev.claimedBy);
        if (designatedRegistry[eventId] != msg.sender) revert NotDesignated(designatedRegistry[eventId]);
        Tier accepted = acceptedTier[msg.sender];
        if (accepted == Tier.NONE) accepted = Tier.A; // default policy: strongest evidence only
        if (uint8(ev.worstTier) > uint8(accepted)) revert TierNotAccepted(ev.worstTier, accepted);

        ev.claimedBy = msg.sender;
        ev.creditBatchRef = creditBatchRef;
        ev.claimedAt = uint64(block.timestamp);
        emit Claimed(eventId, msg.sender, creditBatchRef);
    }

    function eventCount() external view returns (uint256) {
        return _events.length;
    }

    function destructionEvent(uint256 eventId) external view returns (DestructionEvent memory) {
        if (eventId >= _events.length) revert UnknownEvent();
        return _events[eventId];
    }
}
