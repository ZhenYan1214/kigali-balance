// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Governed, Roles, Tier} from "./Types.sol";
import {IdentityRegistry} from "./IdentityRegistry.sol";

/// @title EquipmentRegistry
/// @notice Equipment accounts, the recovery cap (rule R3) and the residence rule.
///
///   R3         A single recovery can never exceed what the unit can physically hold: one nameplate
///              charge (Tier A with a tolerance for overcharging). Over its lifetime a unit can never
///              yield more than its nameplate charge plus every top-up recorded through the ledger
///              (so gas recovered during a repair and charged back in can come out again). The
///              per-recovery limit matters for leaky units: their top-ups replace gas that already
///              leaked out, so the lifetime total alone would leave room to book gas that never was.
///   Owner      Every unit is bound to an EQUIPMENT_OWNER who must co-sign each recovery (checked
///              by the ledger), so a service company alone cannot book gas as recovered from it.
///   Residence  Gas recovered too soon after the unit was installed or last charged through the
///              ledger is stamped Tier C. Otherwise virgin gas could be "laundered" by charging it
///              into a registered unit and recovering it the next day as RECOVERED.
///
///   Tier A  units come from a national registry (e.g. EKOMVET) with an installation date.
///   Tier B  units are below the national registration threshold (e.g. household ACs) and are
///           registered at decommissioning from a signed nameplate photo; their charge comes from a
///           model database and each service company has a monthly Tier B volume cap.
contract EquipmentRegistry is Governed {
    enum Status {
        NONE,
        ACTIVE,
        DECOMMISSIONED
    }

    struct Equipment {
        bytes32 gas;
        uint64 nameplateGrams;
        uint64 chargedGrams; // cumulative top-ups recorded through the ledger
        uint64 recoveredGrams; // cumulative recovery
        uint64 installedAt; // Tier A: from the national record; Tier B: unknown (0)
        uint64 lastChargeAt; // last ledger charge (0 = none)
        uint64 registeredAt;
        Tier tier;
        Status status;
        bytes32 sourceRef; // Tier A: hash of the national registry record; Tier B: hash of the nameplate photo
        bytes32 modelId; // Tier B only
        address registeredBy;
        address owner; // must co-sign every recovery
    }

    struct ChargeRecord {
        uint64 at;
        uint64 grams;
    }

    struct Model {
        bytes32 gas;
        uint64 chargeGrams;
        bool exists;
    }

    uint256 internal constant MONTH = 30 days;

    IdentityRegistry public immutable identity;
    address public ledger;

    /// @notice Allowed overshoot on the Tier A nameplate charge, in basis points (overcharging happens in practice).
    uint16 public toleranceBps = 500;
    /// @notice Maximum Tier B grams one service company may recover per 30-day period.
    uint64 public tierBMonthlyCapGrams = 50_000;
    /// @notice Minimum time gas must have been in service to count as end-of-life recovery.
    uint32 public minResidence = 180 days;

    mapping(bytes32 => Equipment) internal _equipment;
    mapping(bytes32 => Model) public models;
    mapping(address => mapping(uint256 => uint64)) public tierBRecoveredByPeriod;
    mapping(bytes32 => ChargeRecord[]) internal _charges;

    event LedgerSet(address ledger);
    event ParamsSet(uint16 toleranceBps, uint64 tierBMonthlyCapGrams, uint32 minResidence);
    event ModelSet(bytes32 indexed modelId, bytes32 gas, uint64 chargeGrams);
    event EquipmentRegistered(bytes32 indexed id, Tier tier, bytes32 gas, uint64 nameplateGrams, bytes32 sourceRef, address registeredBy, address owner);
    event Charged(bytes32 indexed id, address indexed by, uint64 grams, uint64 chargedTotal);
    event Recovered(bytes32 indexed id, address indexed by, uint64 grams, uint64 recoveredTotal, Tier tier, uint64 quarantinedGrams, bool decommissioned);

    error NotRole(bytes32 role);
    error NotLedger();
    error LedgerAlreadySet();
    error ZeroLedger();
    error AlreadyRegistered();
    error UnknownEquipment();
    error UnknownModel();
    error NotActive();
    error GasMismatch();
    error ZeroAmount();
    error InstalledInFuture();
    error RecoveryExceedsCharge(uint64 maxPerRecovery, uint64 attempted);
    error RecoveryCapExceeded(uint64 cap, uint64 attempted);
    error TierBMonthlyCapExceeded(uint64 cap, uint64 attempted);
    error BadParams();
    error NotEquipmentOwner(address account);
    error OwnerNotIndependent(address owner);

    constructor(address governance_, IdentityRegistry identity_) Governed(governance_) {
        identity = identity_;
    }

    modifier onlyRole(bytes32 role) {
        if (!identity.hasRole(msg.sender, role)) revert NotRole(role);
        _;
    }

    modifier onlyLedger() {
        if (msg.sender != ledger) revert NotLedger();
        _;
    }

    // ---------------------------------------------------------------- governance

    function setLedger(address ledger_) external onlyGovernance {
        if (ledger_ == address(0)) revert ZeroLedger();
        if (ledger != address(0)) revert LedgerAlreadySet();
        ledger = ledger_;
        emit LedgerSet(ledger_);
    }

    function setParams(uint16 toleranceBps_, uint64 tierBMonthlyCapGrams_, uint32 minResidence_) external onlyGovernance {
        if (toleranceBps_ > 2_000 || tierBMonthlyCapGrams_ == 0) revert BadParams();
        toleranceBps = toleranceBps_;
        tierBMonthlyCapGrams = tierBMonthlyCapGrams_;
        minResidence = minResidence_;
        emit ParamsSet(toleranceBps_, tierBMonthlyCapGrams_, minResidence_);
    }

    // ---------------------------------------------------------------- registration

    /// @notice Register a Tier A unit imported from a national registry, bound to the operator
    ///         recorded there as its owner.
    function registerTierA(
        bytes32 id,
        bytes32 gas,
        uint64 nameplateGrams,
        uint64 installedAt,
        bytes32 registryRecordHash,
        address owner
    ) external onlyRole(Roles.EQUIPMENT_REGISTRAR) {
        if (nameplateGrams == 0) revert ZeroAmount();
        if (installedAt > block.timestamp) revert InstalledInFuture();
        _requireOwner(owner);
        _register(id, Tier.A, gas, nameplateGrams, installedAt, registryRecordHash, bytes32(0), owner);
    }

    /// @notice Maintain the model database used to look up Tier B nameplate charges.
    function setModel(bytes32 modelId, bytes32 gas, uint64 chargeGrams) external onlyRole(Roles.EQUIPMENT_REGISTRAR) {
        if (chargeGrams == 0) revert ZeroAmount();
        models[modelId] = Model({gas: gas, chargeGrams: chargeGrams, exists: true});
        emit ModelSet(modelId, gas, chargeGrams);
    }

    /// @notice Register a Tier B unit at decommissioning (no national record exists). The owner (or
    ///         the take-back point receiving the scrapped unit) must be a separate EQUIPMENT_OWNER:
    ///         the service company cannot vouch for its own recoveries.
    function registerTierB(bytes32 id, bytes32 modelId, bytes32 nameplatePhotoHash, address owner)
        external
        onlyRole(Roles.SERVICE)
    {
        Model memory m = models[modelId];
        if (!m.exists) revert UnknownModel();
        _requireOwner(owner);
        if (owner == msg.sender) revert OwnerNotIndependent(owner);
        _register(id, Tier.B, m.gas, m.chargeGrams, 0, nameplatePhotoHash, modelId, owner);
    }

    // ---------------------------------------------------------------- ledger hooks

    function recordCharge(bytes32 id, bytes32 gas, uint64 grams, address by) external onlyLedger {
        Equipment storage e = _activeUnit(id, gas);
        e.chargedGrams += grams;
        e.lastChargeAt = uint64(block.timestamp);
        _charges[id].push(ChargeRecord({at: uint64(block.timestamp), grams: grams}));
        emit Charged(id, by, grams, e.chargedGrams);
    }

    /// @notice Rule R3 plus the residence rule.
    /// @return tier          tier to stamp on the in-service part of the recovered gas
    /// @return quarantined   grams that must be stamped Tier C: everything if the unit was installed
    ///                       less than `minResidence` ago, otherwise up to the grams charged through
    ///                       the ledger within the last `minResidence`
    function recordRecovery(bytes32 id, bytes32 gas, uint64 grams, address by, bool decommission)
        external
        onlyLedger
        returns (Tier tier, uint64 quarantined)
    {
        if (grams == 0) revert ZeroAmount();
        Equipment storage e = _activeUnit(id, gas);
        uint64 perRecovery = maxPerRecovery(id);
        if (grams > perRecovery) revert RecoveryExceedsCharge(perRecovery, grams);
        uint64 cap = recoveryCap(id);
        uint64 total = e.recoveredGrams + grams;
        if (total > cap) revert RecoveryCapExceeded(cap, total);

        if (e.tier == Tier.B) {
            uint256 period = block.timestamp / MONTH;
            uint64 used = tierBRecoveredByPeriod[by][period] + grams;
            if (used > tierBMonthlyCapGrams) revert TierBMonthlyCapExceeded(tierBMonthlyCapGrams, used);
            tierBRecoveredByPeriod[by][period] = used;
        }

        e.recoveredGrams = total;
        if (decommission) e.status = Status.DECOMMISSIONED;
        tier = e.tier;
        quarantined = _quarantinedGrams(id, e, grams);
        emit Recovered(id, by, grams, total, tier, quarantined, decommission);
    }

    // ---------------------------------------------------------------- views

    /// @notice Most a single recovery can take: what the unit can physically hold, i.e. one
    ///         nameplate charge (Tier A with tolerance for overcharging, Tier B the model charge).
    function maxPerRecovery(bytes32 id) public view returns (uint64) {
        Equipment storage e = _equipment[id];
        return e.tier == Tier.A
            ? uint64((uint256(e.nameplateGrams) * (10_000 + toleranceBps)) / 10_000)
            : e.nameplateGrams;
    }

    /// @notice Lifetime recovery cap: one charge plus every top-up charged through the ledger. Gas
    ///         recovered during a repair and charged back in can therefore come out again at end
    ///         of life; each single recovery is still limited by `maxPerRecovery`.
    function recoveryCap(bytes32 id) public view returns (uint64) {
        return maxPerRecovery(id) + _equipment[id].chargedGrams;
    }

    function equipment(bytes32 id) external view returns (Equipment memory) {
        return _equipment[id];
    }

    // ---------------------------------------------------------------- internal

    /// @dev Recently installed unit: all of it. Otherwise: the grams charged within the residence
    ///      window (gas that has not been in service long enough), capped at the amount recovered.
    ///      Counting the same recent charges again on a later partial recovery only quarantines more,
    ///      never less, so the rule stays conservative.
    function _quarantinedGrams(bytes32 id, Equipment storage e, uint64 grams) internal view returns (uint64) {
        if (e.installedAt != 0 && block.timestamp - e.installedAt < minResidence) return grams;
        ChargeRecord[] storage c = _charges[id];
        uint256 recent;
        for (uint256 i = c.length; i > 0; --i) {
            if (block.timestamp - c[i - 1].at >= minResidence) break;
            recent += c[i - 1].grams;
        }
        return recent >= grams ? grams : uint64(recent);
    }

    function _register(
        bytes32 id,
        Tier tier,
        bytes32 gas,
        uint64 nameplateGrams,
        uint64 installedAt,
        bytes32 sourceRef,
        bytes32 modelId,
        address owner
    ) internal {
        if (_equipment[id].status != Status.NONE) revert AlreadyRegistered();
        _equipment[id] = Equipment({
            gas: gas,
            nameplateGrams: nameplateGrams,
            chargedGrams: 0,
            recoveredGrams: 0,
            installedAt: installedAt,
            lastChargeAt: 0,
            registeredAt: uint64(block.timestamp),
            tier: tier,
            status: Status.ACTIVE,
            sourceRef: sourceRef,
            modelId: modelId,
            registeredBy: msg.sender,
            owner: owner
        });
        emit EquipmentRegistered(id, tier, gas, nameplateGrams, sourceRef, msg.sender, owner);
    }

    function _requireOwner(address owner) internal view {
        if (!identity.hasRole(owner, Roles.EQUIPMENT_OWNER)) revert NotEquipmentOwner(owner);
    }

    function _activeUnit(bytes32 id, bytes32 gas) internal view returns (Equipment storage e) {
        e = _equipment[id];
        if (e.status == Status.NONE) revert UnknownEquipment();
        if (e.status != Status.ACTIVE) revert NotActive();
        if (e.gas != gas) revert GasMismatch();
    }
}
