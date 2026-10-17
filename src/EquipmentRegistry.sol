// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Governed, Roles, Tier} from "./Types.sol";
import {IdentityRegistry} from "./IdentityRegistry.sol";

/// @title EquipmentRegistry
/// @notice Equipment accounts, the recovery cap (rule R3) and the residence rule.
///
///   R3         A unit can only yield what is booked inside it. Its booked content starts at one
///              nameplate charge (Tier A with a tolerance for overcharging), every recovery draws it
///              down, and only a top-up recorded through the ledger refills it, never above one
///              charge. So gas recovered during a repair and charged back in can come out again, but
///              neither one oversized recovery nor several smaller ones can take more than the unit
///              could hold. (Leaky units matter here: their top-ups replace gas that already leaked
///              out, so a lifetime total of nameplate plus top-ups would leave room to book gas that
///              never was.) The lifetime total is kept as a second, coarser check.
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
    /// @dev How far each unit's booked content is below one full charge (0 = full). Kept outside
    ///      `Equipment` so the struct, and the `equipment()` view, keep their layout.
    mapping(bytes32 => uint64) internal _drawnBelowFull;
    mapping(bytes32 => Model) public models;
    mapping(address => mapping(uint256 => uint64)) public tierBRecoveredByPeriod;
    mapping(bytes32 => ChargeRecord[]) internal _charges;
    /// @dev UNKNOWN-origin grams charged into each unit and not yet recovered (always Tier C).
    mapping(bytes32 => uint64) internal _untraceableGrams;
    /// @dev Nameplate photos already used for a Tier B registration: one photo, one unit.
    mapping(bytes32 => bool) public nameplatePhotoUsed;

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
    error RecoveryExceedsContent(uint64 bookedContent, uint64 attempted);
    error RecoveryCapExceeded(uint64 cap, uint64 attempted);
    error TierBMonthlyCapExceeded(uint64 cap, uint64 attempted);
    error BadParams();
    error NotEquipmentOwner(address account);
    error OwnerNotIndependent(address owner);
    error DuplicateNameplatePhoto();

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
        if (nameplatePhotoUsed[nameplatePhotoHash]) revert DuplicateNameplatePhoto();
        nameplatePhotoUsed[nameplatePhotoHash] = true;
        _register(id, Tier.B, m.gas, m.chargeGrams, 0, nameplatePhotoHash, modelId, owner);
    }

    // ---------------------------------------------------------------- ledger hooks

    /// @param untraceable true when the charged lot is UNKNOWN (undocumented origin): those grams stay
    ///        quarantined whenever they come back out, however long they were in service.
    function recordCharge(bytes32 id, bytes32 gas, uint64 grams, address by, bool untraceable) external onlyLedger {
        Equipment storage e = _activeUnit(id, gas);
        e.chargedGrams = _addCapped(e.chargedGrams, grams);
        e.lastChargeAt = uint64(block.timestamp);
        // a recorded top-up refills the booked content, never above one charge
        uint64 drawn = _drawnBelowFull[id];
        _drawnBelowFull[id] = drawn > grams ? drawn - grams : 0;
        if (untraceable) {
            uint64 u = _addCapped(_untraceableGrams[id], grams);
            uint64 full = maxPerRecovery(id);
            _untraceableGrams[id] = u > full ? full : u;
        }
        // charges on the same day share one record (stamped with the latest charge, so the residence
        // window only gets longer). This bounds the records inside the window to one per day, so a
        // flood of tiny charges cannot make the residence check run out of gas.
        // (timestamps never go backwards, so `>=` on the day number means "the same day")
        uint256 n = _charges[id].length;
        if (n > 0 && _charges[id][n - 1].at / 1 days >= block.timestamp / 1 days) {
            _charges[id][n - 1].grams = _addCapped(_charges[id][n - 1].grams, grams);
            _charges[id][n - 1].at = uint64(block.timestamp);
        } else {
            _charges[id].push(ChargeRecord({at: uint64(block.timestamp), grams: grams}));
        }
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
        uint64 content = bookedContent(id);
        if (grams > content) revert RecoveryExceedsContent(content, grams);
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
        _drawnBelowFull[id] += grams;
        if (decommission) e.status = Status.DECOMMISSIONED;
        tier = e.tier;
        quarantined = _quarantinedGrams(id, e, grams);
        // undocumented gas charged into the unit is assumed to come out first and stays Tier C
        uint64 untraceable = _untraceableGrams[id];
        if (untraceable > 0) {
            uint64 fromUnknown = untraceable < grams ? untraceable : grams;
            _untraceableGrams[id] = untraceable - fromUnknown;
            uint256 q = uint256(quarantined) + fromUnknown;
            quarantined = q > grams ? grams : uint64(q);
        }
        emit Recovered(id, by, grams, total, tier, quarantined, decommission);
    }

    // ---------------------------------------------------------------- views

    /// @notice What the unit can physically hold: one nameplate charge (Tier A with tolerance for
    ///         overcharging, Tier B the model charge).
    function maxPerRecovery(bytes32 id) public view returns (uint64) {
        Equipment storage e = _equipment[id];
        return e.tier == Tier.A
            ? uint64((uint256(e.nameplateGrams) * (10_000 + toleranceBps)) / 10_000)
            : e.nameplateGrams;
    }

    /// @notice What can still be recovered from the unit now: one charge, minus everything
    ///         recovered since, plus recorded top-ups, never above one charge.
    function bookedContent(bytes32 id) public view returns (uint64) {
        uint64 full = maxPerRecovery(id);
        uint64 drawn = _drawnBelowFull[id];
        return drawn >= full ? 0 : full - drawn;
    }

    /// @notice Lifetime recovery cap: one charge plus every top-up charged through the ledger. A
    ///         coarser second check; `bookedContent` is the binding one.
    function recoveryCap(bytes32 id) public view returns (uint64) {
        return _addCapped(maxPerRecovery(id), _equipment[id].chargedGrams);
    }

    /// @notice Grams of undocumented (UNKNOWN) gas charged into the unit that have not yet come out.
    function untraceableGrams(bytes32 id) external view returns (uint64) {
        return _untraceableGrams[id];
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
        uint256 recent = 0;
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

    /// @dev Saturating addition: an absurd amount can never overflow and lock a unit's accounting.
    function _addCapped(uint64 a, uint64 b) internal pure returns (uint64) {
        uint256 s = uint256(a) + b;
        return s > type(uint64).max ? type(uint64).max : uint64(s);
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
