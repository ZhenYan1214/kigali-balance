// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Governed, Roles, LotClass, LotStatus, Tier} from "./Types.sol";
import {IdentityRegistry} from "./IdentityRegistry.sol";
import {EquipmentRegistry} from "./EquipmentRegistry.sol";
import {DestructionClaims} from "./DestructionClaims.sol";
import {Attestations, ScaleReading, LabCertificate, RecoveryConsent, DestructionCertificate} from "./Attestations.sol";

/// @title KigaliLedger
/// @notice Lot ledger that keeps HFC kilograms consistent across organisations.
///
/// Core rule: every kilogram claimed as "reclaimed" or "destroyed for credit" must trace back to a
/// kilogram recovered from a real, registered piece of equipment.
///
///   R1  virgin lots are minted only against a quota document, never above its allowance
///   R2  transfers are two-step; the receiver re-weighs on its own scale and gaps are flagged
///   R3  recovery from a unit never exceeds its charge plus recorded top-ups (EquipmentRegistry),
///       and every recovery is co-signed by the unit's registered owner
///   R4  reclaimed output <= RECOVERED input x (1 - minimum process loss), with a lab certificate
///   R5  VIRGIN and UNKNOWN lots can never enter reclamation (classes are not interchangeable)
///       and neither can Tier C gas (recovered too soon after installation or a charge)
///   R6  a facility destroys only lots it holds, with quantity and DRE certified by an independent
///       verifier; only all-RECOVERED inputs are credit-eligible (and none of them Tier C)
///   R7  each destruction event can be claimed by one registry only (DestructionClaims)
///   Cylinders: every lot names a cylinder, and a cylinder holds one open lot at a time (the two
///       parts of one split recovery excepted), so one physical cylinder cannot back two claims.
///
/// All quantities are integer grams. Mass is conserved per gas:
///   virginMinted + unknownDeclared + recovered == live + charged + destroyed + reclaimLoss + handlingLoss
contract KigaliLedger is Governed {
    // ------------------------------------------------------------------ types

    struct Lot {
        bytes32 gas;
        uint64 grams;
        LotClass cls;
        LotStatus status;
        Tier tier; // for RECOVERED/RECLAIMED: weakest equipment evidence in the lineage
        address holder;
        address pendingTo;
        bytes32 cylinderId;
        bytes32 origin; // VIRGIN: quotaId · RECOVERED: equipmentId · RECLAIMED: batch subject · UNKNOWN: declaration hash
        uint256 parent; // lot this one was split from (0 = none)
        uint64 createdAt;
    }

    struct Quota {
        address importer;
        bytes32 gas;
        uint64 allowedGrams;
        uint64 usedGrams;
    }

    struct Totals {
        uint128 virginMinted;
        uint128 unknownDeclared;
        uint128 recovered;
        uint128 live;
        uint128 charged;
        uint128 destroyed;
        uint128 reclaimLoss;
        uint128 handlingLoss;
    }

    enum Discrepancy {
        UNDERWEIGHT_ON_RECEIPT,
        OVERWEIGHT_ON_RECEIPT,
        UNDERWEIGHT_AT_DESTRUCTION
    }

    // ------------------------------------------------------------------ storage

    IdentityRegistry public immutable identity;
    EquipmentRegistry public immutable equipmentRegistry;
    DestructionClaims public immutable claims;

    uint16 public transferToleranceBps = 100; // 1 %
    uint16 public minReclaimLossBps = 200; // 2 % — placeholder, to be validated with reclaimers
    uint16 public minReclaimPurityBps = 9_950; // 99.5 %, AHRI 700 reclaimed-refrigerant purity
    uint16 public minDreBps = 9_999; // 99.99 %, Isometric protocol requirement
    uint32 public maxAttestationAge = 7 days;

    uint256 public lotCount;
    mapping(uint256 => Lot) internal _lots;
    mapping(uint256 => uint256[]) internal _reclaimInputs;
    mapping(bytes32 => Quota) public quotas;
    mapping(bytes32 => Totals) internal _totals;
    mapping(address => address) public deviceOperator; // scale key => operator that owns the scale
    mapping(address => mapping(bytes32 => bool)) public nonceUsed; // signer => nonce => used
    mapping(bytes32 => uint32) public openLotsInCylinder; // cylinderId => ACTIVE or IN_TRANSIT lots

    // ------------------------------------------------------------------ events

    event ParamsSet(uint16 transferToleranceBps, uint16 minReclaimLossBps, uint16 minReclaimPurityBps, uint16 minDreBps, uint32 maxAttestationAge);
    event DeviceBound(address indexed device, address indexed operator);
    event QuotaRegistered(bytes32 indexed quotaId, address indexed importer, bytes32 gas, uint64 allowedGrams);
    event LotCreated(uint256 indexed lotId, bytes32 indexed gas, LotClass cls, uint64 grams, address indexed holder, bytes32 origin, uint256 parent, bytes32 cylinderId);
    event LotSent(uint256 indexed lotId, address indexed from, address indexed to, uint64 grams);
    event LotReceived(uint256 indexed lotId, address indexed by, uint64 sentGrams, uint64 receivedGrams);
    event LotRejected(uint256 indexed lotId, address indexed by);
    event LotCharged(uint256 indexed lotId, bytes32 indexed equipmentId, uint64 grams);
    event Reclaimed(uint256 indexed outputLot, uint256[] inputs, uint64 inputGrams, uint64 outputGrams, uint16 purityBps);
    event Destroyed(uint256 indexed eventId, uint256[] inputs, uint64 heldGrams, uint64 destroyedGrams, bool creditEligible);
    event DiscrepancyFlagged(uint256 indexed lotId, Discrepancy kind, uint64 expectedGrams, uint64 actualGrams);

    // ------------------------------------------------------------------ errors

    error NotRole(bytes32 role);
    error NotOperator(address account);
    error ZeroAmount();
    error BadParams();
    error QuotaExists();
    error UnknownQuota();
    error NotQuotaHolder();
    error QuotaExceeded(uint64 allowed, uint64 attempted);
    error UnknownLot(uint256 lotId);
    error NotHolder(uint256 lotId);
    error NotActive(uint256 lotId);
    error NotPendingRecipient(uint256 lotId);
    error InsufficientGrams(uint256 lotId, uint64 available, uint64 requested);
    error SelfTransfer();
    error GasMismatch();
    error EmptyInputs();
    error DuplicateInput(uint256 lotId);
    error ClassNotReclaimable(uint256 lotId, LotClass cls);
    error TierNotReclaimable(uint256 lotId);
    error ReclaimExceedsInput(uint64 maxAllowed, uint64 claimed);
    error PurityTooLow(uint16 purityBps, uint16 minimum);
    error DestroyExceedsHeld(uint64 held, uint64 weighed);
    error DreTooLow(uint16 dreBps, uint16 minimum);
    error WrongSubject();
    error NotScaleDevice(address signer);
    error ScaleNotOwnedByCaller(address signer, address operator);
    error NotLab(address signer);
    error LabNotIndependent(address signer);
    error AttestationExpired();
    error AttestationFromFuture();
    error NonceReused(address signer, bytes32 nonce);
    error ZeroCylinder();
    error CylinderInUse(bytes32 cylinderId);
    error ConsentMismatch();
    error NotUnitOwner(address signer);
    error OwnerNotIndependent(address signer);
    error CertificateMismatch();
    error NotVerifier(address signer);
    error VerifierNotIndependent(address signer);

    // ------------------------------------------------------------------ setup

    constructor(address governance_, IdentityRegistry identity_, EquipmentRegistry equipment_, DestructionClaims claims_)
        Governed(governance_)
    {
        identity = identity_;
        equipmentRegistry = equipment_;
        claims = claims_;
    }

    modifier onlyRole(bytes32 role) {
        if (!identity.hasRole(msg.sender, role)) revert NotRole(role);
        _;
    }

    function setParams(
        uint16 transferToleranceBps_,
        uint16 minReclaimLossBps_,
        uint16 minReclaimPurityBps_,
        uint16 minDreBps_,
        uint32 maxAttestationAge_
    ) external onlyGovernance {
        if (
            transferToleranceBps_ > 1_000 || minReclaimLossBps_ >= 10_000 || minReclaimPurityBps_ > 10_000
                || minDreBps_ > 10_000 || maxAttestationAge_ == 0
        ) revert BadParams();
        transferToleranceBps = transferToleranceBps_;
        minReclaimLossBps = minReclaimLossBps_;
        minReclaimPurityBps = minReclaimPurityBps_;
        minDreBps = minDreBps_;
        maxAttestationAge = maxAttestationAge_;
        emit ParamsSet(transferToleranceBps_, minReclaimLossBps_, minReclaimPurityBps_, minDreBps_, maxAttestationAge_);
    }

    /// @notice Bind a scale's device key to the operator that owns it, so a party can only use its own scale.
    function bindDevice(address device, address operator) external onlyGovernance {
        deviceOperator[device] = operator;
        emit DeviceBound(device, operator);
    }

    // ------------------------------------------------------------------ R1: virgin supply

    function registerQuota(bytes32 quotaId, address importer, bytes32 gas, uint64 allowedGrams)
        external
        onlyRole(Roles.QUOTA_AUTHORITY)
    {
        if (quotas[quotaId].importer != address(0)) revert QuotaExists();
        if (allowedGrams == 0) revert ZeroAmount();
        quotas[quotaId] = Quota({importer: importer, gas: gas, allowedGrams: allowedGrams, usedGrams: 0});
        emit QuotaRegistered(quotaId, importer, gas, allowedGrams);
    }

    function mintVirgin(bytes32 quotaId, uint64 grams, bytes32 cylinderId)
        external
        onlyRole(Roles.IMPORTER)
        returns (uint256 lotId)
    {
        if (grams == 0) revert ZeroAmount();
        Quota storage q = quotas[quotaId];
        if (q.importer == address(0)) revert UnknownQuota();
        if (q.importer != msg.sender) revert NotQuotaHolder();
        uint64 used = q.usedGrams + grams;
        if (used > q.allowedGrams) revert QuotaExceeded(q.allowedGrams, used);
        q.usedGrams = used;

        _totals[q.gas].virginMinted += grams;
        lotId = _create(q.gas, grams, LotClass.VIRGIN, Tier.NONE, msg.sender, cylinderId, quotaId, false);
    }

    /// @notice Declare legacy stock of undocumented origin. It can be held, sold or destroyed,
    ///         but never reclaimed or credited.
    function declareUnknown(bytes32 gas, uint64 grams, bytes32 cylinderId, bytes32 declarationHash)
        external
        returns (uint256 lotId)
    {
        _requireOperator(msg.sender);
        if (grams == 0) revert ZeroAmount();
        _totals[gas].unknownDeclared += grams;
        lotId = _create(gas, grams, LotClass.UNKNOWN, Tier.NONE, msg.sender, cylinderId, declarationHash, false);
    }

    // ------------------------------------------------------------------ R2: two-step transfers

    /// @notice Send `grams` of a lot to another operator. A partial send splits the lot.
    function send(uint256 lotId, address to, uint64 grams, bytes32 newCylinderId) external returns (uint256 sentLot) {
        _requireOperator(to);
        if (to == msg.sender) revert SelfTransfer();
        Lot storage lot = _activeLotOf(lotId, msg.sender);
        if (grams == 0) revert ZeroAmount();
        if (grams > lot.grams) revert InsufficientGrams(lotId, lot.grams, grams);

        if (grams == lot.grams) {
            sentLot = lotId;
        } else {
            // split: the parent keeps the remainder in place, the sent part becomes a child lot
            lot.grams -= grams;
            sentLot = _createChild(lotId, grams, newCylinderId);
        }
        Lot storage s = _lots[sentLot];
        s.status = LotStatus.IN_TRANSIT;
        s.pendingTo = to;
        emit LotSent(sentLot, msg.sender, to, grams);
    }

    /// @notice Receiver accepts a lot after weighing it on its own scale.
    ///         Weight gaps beyond tolerance are flagged, never silently absorbed.
    function receiveLot(uint256 lotId, ScaleReading calldata reading, bytes calldata sig) external {
        Lot storage lot = _lot(lotId);
        if (lot.status != LotStatus.IN_TRANSIT || lot.pendingTo != msg.sender) revert NotPendingRecipient(lotId);
        if (reading.subject != receiptSubject(lotId)) revert WrongSubject();
        _verifyScale(reading, sig);

        uint64 sent = lot.grams;
        uint64 received = reading.grams;
        uint64 tolerance = uint64((uint256(sent) * transferToleranceBps) / 10_000);

        if (received < sent) {
            uint64 loss = sent - received;
            lot.grams = received;
            Totals storage t = _totals[lot.gas];
            t.handlingLoss += loss;
            t.live -= loss;
            if (loss > tolerance) emit DiscrepancyFlagged(lotId, Discrepancy.UNDERWEIGHT_ON_RECEIPT, sent, received);
        } else if (received - sent > tolerance) {
            // mass cannot appear in transit: keep the sent amount and flag
            emit DiscrepancyFlagged(lotId, Discrepancy.OVERWEIGHT_ON_RECEIPT, sent, received);
        }

        lot.holder = msg.sender;
        lot.pendingTo = address(0);
        if (lot.grams == 0) _close(lot);
        else lot.status = LotStatus.ACTIVE;
        emit LotReceived(lotId, msg.sender, sent, lot.grams);
    }

    /// @notice Receiver refuses a lot; it returns to the sender unchanged.
    function rejectLot(uint256 lotId) external {
        Lot storage lot = _lot(lotId);
        if (lot.status != LotStatus.IN_TRANSIT || lot.pendingTo != msg.sender) revert NotPendingRecipient(lotId);
        lot.pendingTo = address(0);
        lot.status = LotStatus.ACTIVE;
        emit LotRejected(lotId, msg.sender);
    }

    // ------------------------------------------------------------------ equipment: charge and R3 recovery

    function charge(uint256 lotId, bytes32 equipmentId, uint64 grams) external onlyRole(Roles.SERVICE) {
        Lot storage lot = _activeLotOf(lotId, msg.sender);
        if (grams == 0) revert ZeroAmount();
        if (grams > lot.grams) revert InsufficientGrams(lotId, lot.grams, grams);
        equipmentRegistry.recordCharge(equipmentId, lot.gas, grams, msg.sender);

        lot.grams -= grams;
        if (lot.grams == 0) _close(lot);
        Totals storage t = _totals[lot.gas];
        t.charged += grams;
        t.live -= grams;
        emit LotCharged(lotId, equipmentId, grams);
    }

    /// @notice Recover refrigerant from a registered unit into a recovery cylinder.
    ///         Two independent signatures are required: the weight from the caller's own scale, and
    ///         the consent of the unit's registered owner naming this service company and weight.
    /// @return lotId            the in-service part, stamped with the unit's tier (0 if none)
    /// @return quarantinedLotId the part charged too recently, stamped Tier C (0 if none).
    ///         Both lots describe gas in the same physical cylinder; the split only bounds how
    ///         many of its grams can ever be reclaimed or credited.
    function recover(
        RecoveryConsent calldata consent,
        bytes calldata consentSig,
        ScaleReading calldata reading,
        bytes calldata scaleSig
    ) external onlyRole(Roles.SERVICE) returns (uint256 lotId, uint256 quarantinedLotId) {
        bytes32 equipmentId = consent.equipmentId;
        if (reading.subject != recoverySubject(equipmentId, consent.cylinderId)) revert WrongSubject();
        _verifyScale(reading, scaleSig);
        EquipmentRegistry.Equipment memory unit = equipmentRegistry.equipment(equipmentId);
        (Tier tier, uint64 quarantined) =
            equipmentRegistry.recordRecovery(equipmentId, unit.gas, reading.grams, msg.sender, consent.decommission);
        _verifyConsent(consent, consentSig, reading.grams, unit.owner);

        _totals[unit.gas].recovered += reading.grams;
        uint64 inService = reading.grams - quarantined;
        if (inService > 0) {
            lotId = _create(unit.gas, inService, LotClass.RECOVERED, tier, msg.sender, consent.cylinderId, equipmentId, false);
        }
        if (quarantined > 0) {
            // the quarantined part shares the physical cylinder with the in-service part
            quarantinedLotId = _create(
                unit.gas, quarantined, LotClass.RECOVERED, Tier.C, msg.sender, consent.cylinderId, equipmentId, inService > 0
            );
        }
    }

    // ------------------------------------------------------------------ R4 + R5: reclamation

    function reclaim(
        uint256[] calldata inputs,
        bytes32 outputCylinderId,
        ScaleReading calldata outputReading,
        bytes calldata scaleSig,
        LabCertificate calldata cert,
        bytes calldata labSig
    ) external onlyRole(Roles.RECLAIMER) returns (uint256 outputLot) {
        if (inputs.length == 0) revert EmptyInputs();
        bytes32 subject = reclaimSubject(outputCylinderId);
        if (outputReading.subject != subject || cert.subject != subject) revert WrongSubject();

        (bytes32 gas, uint64 inputGrams, Tier worst) = _consumeReclaimInputs(inputs);

        uint64 maxOut = uint64((uint256(inputGrams) * (10_000 - minReclaimLossBps)) / 10_000);
        if (outputReading.grams == 0) revert ZeroAmount();
        if (outputReading.grams > maxOut) revert ReclaimExceedsInput(maxOut, outputReading.grams);
        if (cert.gas != gas) revert GasMismatch();
        if (cert.purityBps < minReclaimPurityBps) revert PurityTooLow(cert.purityBps, minReclaimPurityBps);
        _verifyScale(outputReading, scaleSig);
        _verifyLab(cert, labSig);

        Totals storage t = _totals[gas];
        t.live -= inputGrams;
        t.reclaimLoss += inputGrams - outputReading.grams;
        t.live += outputReading.grams; // reclaimed mass is not new mass: it moves from inputs to the output lot

        outputLot = _createRaw(gas, outputReading.grams, LotClass.RECLAIMED, worst, msg.sender, outputCylinderId, subject, 0, false);
        _reclaimInputs[outputLot] = inputs;
        emit Reclaimed(outputLot, inputs, inputGrams, outputReading.grams, cert.purityBps);
    }

    // ------------------------------------------------------------------ R6: destruction

    /// @notice Destroy held lots. The facility weighs the intake on its own scale; an independent
    ///         verifier certifies the same quantity and the destruction and removal efficiency.
    function destroy(
        uint256[] calldata inputs,
        ScaleReading calldata intake,
        bytes calldata scaleSig,
        DestructionCertificate calldata cert,
        bytes calldata certSig
    ) external onlyRole(Roles.DESTRUCTION) returns (uint256 eventId) {
        if (inputs.length == 0) revert EmptyInputs();
        bytes32 subject = destructionSubject(inputs);
        if (intake.subject != subject || cert.subject != subject) revert WrongSubject();
        if (cert.grams != intake.grams) revert CertificateMismatch();
        if (cert.dreBps < minDreBps) revert DreTooLow(cert.dreBps, minDreBps);
        _verifyScale(intake, scaleSig);
        _verifyDestruction(cert, certSig);

        bytes32 gas = _lots[inputs[0]].gas;
        uint64 held;
        bool eligible = true;
        Tier worst = Tier.A;
        for (uint256 i; i < inputs.length; ++i) {
            _requireUnique(inputs, i);
            Lot storage lot = _activeLotOf(inputs[i], msg.sender);
            if (lot.gas != gas) revert GasMismatch();
            held += lot.grams;
            if (lot.cls != LotClass.RECOVERED || lot.tier == Tier.C) eligible = false;
            if (uint8(lot.tier) > uint8(worst)) worst = lot.tier;
            _close(lot);
        }
        if (intake.grams == 0) revert ZeroAmount();
        if (intake.grams > held) revert DestroyExceedsHeld(held, intake.grams);
        if (!eligible) worst = Tier.NONE;

        uint64 shortfall = held - intake.grams;
        Totals storage t = _totals[gas];
        t.live -= held;
        t.destroyed += intake.grams;
        t.handlingLoss += shortfall;
        if (shortfall > (uint256(held) * transferToleranceBps) / 10_000) {
            emit DiscrepancyFlagged(inputs[0], Discrepancy.UNDERWEIGHT_AT_DESTRUCTION, held, intake.grams);
        }

        eventId = claims.record(msg.sender, gas, intake.grams, cert.dreBps, eligible, worst, cert.documentHash);
        emit Destroyed(eventId, inputs, held, intake.grams, eligible);
    }

    // ------------------------------------------------------------------ subjects (what a signature is about)

    function receiptSubject(uint256 lotId) public pure returns (bytes32) {
        return keccak256(abi.encode("RECEIPT", lotId));
    }

    function recoverySubject(bytes32 equipmentId, bytes32 cylinderId) public pure returns (bytes32) {
        return keccak256(abi.encode("RECOVERY", equipmentId, cylinderId));
    }

    function reclaimSubject(bytes32 outputCylinderId) public pure returns (bytes32) {
        return keccak256(abi.encode("RECLAIM", outputCylinderId));
    }

    function destructionSubject(uint256[] memory inputs) public pure returns (bytes32) {
        return keccak256(abi.encode("DESTRUCTION", inputs));
    }

    // ------------------------------------------------------------------ views

    function getLot(uint256 lotId) external view returns (Lot memory) {
        return _lot(lotId);
    }

    function reclaimInputs(uint256 lotId) external view returns (uint256[] memory) {
        return _reclaimInputs[lotId];
    }

    function totals(bytes32 gas) external view returns (Totals memory) {
        return _totals[gas];
    }

    function domainSeparator() external view returns (bytes32) {
        return Attestations.domainSeparator(address(this));
    }

    function scaleDigest(ScaleReading calldata r) external view returns (bytes32) {
        return Attestations.digest(Attestations.domainSeparator(address(this)), Attestations.hashScale(r));
    }

    function labDigest(LabCertificate calldata c) external view returns (bytes32) {
        return Attestations.digest(Attestations.domainSeparator(address(this)), Attestations.hashLab(c));
    }

    function consentDigest(RecoveryConsent calldata c) external view returns (bytes32) {
        return Attestations.digest(Attestations.domainSeparator(address(this)), Attestations.hashConsent(c));
    }

    function destructionDigest(DestructionCertificate calldata d) external view returns (bytes32) {
        return Attestations.digest(Attestations.domainSeparator(address(this)), Attestations.hashDestruction(d));
    }

    // ------------------------------------------------------------------ internal: lots

    function _create(
        bytes32 gas,
        uint64 grams,
        LotClass cls,
        Tier tier,
        address holder,
        bytes32 cylinderId,
        bytes32 origin,
        bool joinCylinder
    ) internal returns (uint256 lotId) {
        _totals[gas].live += grams;
        lotId = _createRaw(gas, grams, cls, tier, holder, cylinderId, origin, 0, joinCylinder);
    }

    /// @dev Creates a lot without touching totals (callers account for mass themselves).
    ///      The cylinder must be empty unless `joinCylinder` (the second part of a split recovery).
    function _createRaw(
        bytes32 gas,
        uint64 grams,
        LotClass cls,
        Tier tier,
        address holder,
        bytes32 cylinderId,
        bytes32 origin,
        uint256 parent,
        bool joinCylinder
    ) internal returns (uint256 lotId) {
        if (cylinderId == bytes32(0)) revert ZeroCylinder();
        if (openLotsInCylinder[cylinderId] != 0 && !joinCylinder) revert CylinderInUse(cylinderId);
        ++openLotsInCylinder[cylinderId];
        lotId = ++lotCount;
        _lots[lotId] = Lot({
            gas: gas,
            grams: grams,
            cls: cls,
            status: LotStatus.ACTIVE,
            tier: tier,
            holder: holder,
            pendingTo: address(0),
            cylinderId: cylinderId,
            origin: origin,
            parent: parent,
            createdAt: uint64(block.timestamp)
        });
        emit LotCreated(lotId, gas, cls, grams, holder, origin, parent, cylinderId);
    }

    /// @dev Split child inherits gas, class, tier and origin; mass moves from parent to child.
    function _createChild(uint256 parentId, uint64 grams, bytes32 cylinderId) internal returns (uint256) {
        Lot storage p = _lots[parentId];
        return _createRaw(p.gas, grams, p.cls, p.tier, p.holder, cylinderId, p.origin, parentId, false);
    }

    function _consumeReclaimInputs(uint256[] calldata inputs)
        internal
        returns (bytes32 gas, uint64 inputGrams, Tier worst)
    {
        gas = _lots[inputs[0]].gas;
        worst = Tier.A;
        for (uint256 i; i < inputs.length; ++i) {
            _requireUnique(inputs, i);
            Lot storage lot = _activeLotOf(inputs[i], msg.sender);
            if (lot.cls != LotClass.RECOVERED) revert ClassNotReclaimable(inputs[i], lot.cls);
            if (lot.tier == Tier.C) revert TierNotReclaimable(inputs[i]);
            if (lot.gas != gas) revert GasMismatch();
            inputGrams += lot.grams;
            if (uint8(lot.tier) > uint8(worst)) worst = lot.tier;
            _close(lot);
        }
    }

    /// @dev A lot leaves circulation (emptied, reclaimed or destroyed) and frees its cylinder.
    function _close(Lot storage lot) internal {
        lot.status = LotStatus.CONSUMED;
        --openLotsInCylinder[lot.cylinderId];
    }

    function _requireUnique(uint256[] calldata inputs, uint256 i) internal pure {
        for (uint256 j; j < i; ++j) {
            if (inputs[j] == inputs[i]) revert DuplicateInput(inputs[i]);
        }
    }

    function _lot(uint256 lotId) internal view returns (Lot storage l) {
        l = _lots[lotId];
        if (l.status == LotStatus.NONE) revert UnknownLot(lotId);
    }

    function _activeLotOf(uint256 lotId, address holder) internal view returns (Lot storage l) {
        l = _lot(lotId);
        if (l.status != LotStatus.ACTIVE) revert NotActive(lotId);
        if (l.holder != holder) revert NotHolder(lotId);
    }

    function _requireOperator(address account) internal view {
        if (
            !identity.hasRole(account, Roles.IMPORTER) && !identity.hasRole(account, Roles.DISTRIBUTOR)
                && !identity.hasRole(account, Roles.SERVICE) && !identity.hasRole(account, Roles.RECLAIMER)
                && !identity.hasRole(account, Roles.DESTRUCTION)
        ) revert NotOperator(account);
    }

    // ------------------------------------------------------------------ internal: attestations

    function _verifyScale(ScaleReading calldata r, bytes calldata sig) internal {
        _checkFreshness(r.timestamp);
        address signer =
            Attestations.recover(Attestations.digest(Attestations.domainSeparator(address(this)), Attestations.hashScale(r)), sig);
        if (!identity.hasRole(signer, Roles.SCALE)) revert NotScaleDevice(signer);
        if (deviceOperator[signer] != msg.sender) revert ScaleNotOwnedByCaller(signer, deviceOperator[signer]);
        _useNonce(signer, r.nonce);
    }

    function _verifyLab(LabCertificate calldata c, bytes calldata sig) internal {
        _checkFreshness(c.timestamp);
        address signer =
            Attestations.recover(Attestations.digest(Attestations.domainSeparator(address(this)), Attestations.hashLab(c)), sig);
        if (!identity.hasRole(signer, Roles.LAB)) revert NotLab(signer);
        // a lab must be independent of the party whose batch it certifies
        if (signer == msg.sender || deviceOperator[signer] == msg.sender) revert LabNotIndependent(signer);
        _useNonce(signer, c.nonce);
    }

    /// @dev The unit's registered owner must name this service company and this exact weight.
    function _verifyConsent(RecoveryConsent calldata c, bytes calldata sig, uint64 weighedGrams, address owner)
        internal
    {
        if (c.service != msg.sender || c.grams != weighedGrams) revert ConsentMismatch();
        _checkFreshness(c.timestamp);
        address signer =
            Attestations.recover(Attestations.digest(Attestations.domainSeparator(address(this)), Attestations.hashConsent(c)), sig);
        if (signer != owner || !identity.hasRole(signer, Roles.EQUIPMENT_OWNER)) revert NotUnitOwner(signer);
        if (signer == msg.sender || deviceOperator[signer] == msg.sender) revert OwnerNotIndependent(signer);
        _useNonce(signer, c.nonce);
    }

    function _verifyDestruction(DestructionCertificate calldata d, bytes calldata sig) internal {
        _checkFreshness(d.timestamp);
        address signer = Attestations.recover(
            Attestations.digest(Attestations.domainSeparator(address(this)), Attestations.hashDestruction(d)), sig
        );
        if (!identity.hasRole(signer, Roles.VERIFIER)) revert NotVerifier(signer);
        // a verifier must be independent of the facility whose destruction it certifies
        if (signer == msg.sender || deviceOperator[signer] == msg.sender) revert VerifierNotIndependent(signer);
        _useNonce(signer, d.nonce);
    }

    function _checkFreshness(uint64 timestamp) internal view {
        if (timestamp > block.timestamp) revert AttestationFromFuture();
        if (block.timestamp - timestamp > maxAttestationAge) revert AttestationExpired();
    }

    function _useNonce(address signer, bytes32 nonce) internal {
        if (nonceUsed[signer][nonce]) revert NonceReused(signer, nonce);
        nonceUsed[signer][nonce] = true;
    }
}
