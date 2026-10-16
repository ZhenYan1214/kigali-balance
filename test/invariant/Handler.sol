// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {LotClass, LotStatus, Tier} from "../../src/Types.sol";
import {KigaliLedger} from "../../src/KigaliLedger.sol";
import {EquipmentRegistry} from "../../src/EquipmentRegistry.sol";
import {DestructionClaims} from "../../src/DestructionClaims.sol";
import {ScaleReading, LabCertificate, RecoveryConsent, DestructionCertificate} from "../../src/Attestations.sol";

/// @notice Drives random sequences of honest and dishonest actions. Calls that the ledger
///         rejects are expected; the invariants check that whatever got through kept the books
///         consistent.
contract Handler is Test {
    KigaliLedger internal ledger;
    EquipmentRegistry internal equipment;
    DestructionClaims internal claims;

    bytes32 internal gas;
    bytes32 internal quotaId;

    address[] internal operators; // importer, distributor, service, reclaimer, facility
    mapping(address => uint256) internal scaleKey;
    address internal importer;
    address internal service;
    address internal reclaimer;
    address internal facility;
    address[] internal registries;
    uint256 internal labKey;
    uint256 internal verifierKey;
    uint256 internal rogueKey;
    mapping(bytes32 => uint256) internal ownerKey; // equipment id => owner's signing key

    bytes32[] public equipmentPool;
    uint256[] public allLots;
    uint256[] public reclaimOutputs;
    uint256 internal nonceCounter;

    mapping(uint256 => uint256) public ghostSuccessfulClaims;
    mapping(uint256 => uint64) public outputGramsAtCreation;
    mapping(uint256 => bool) public ghostEligibleEventHadOnlyRecovered;
    uint256[] public eligibleEvents;
    uint256 public ghostUnconsentedRecoveriesAccepted;
    uint256 public ghostOverChargeRecoveriesAccepted; // single recoveries above one nameplate charge
    uint256 public ghostSelfCertifiedDestructionsAccepted;

    // call counters, useful when tuning the fuzzer
    mapping(bytes32 => uint256) public calls;
    mapping(bytes32 => uint256) public outcomes; // e.g. "reclaim.ok", "reclaim.rejected"

    struct Config {
        KigaliLedger ledger;
        EquipmentRegistry equipment;
        DestructionClaims claims;
        bytes32 gas;
        bytes32 quotaId;
        address[] operators;
        uint256[] scaleKeys;
        address[] registries;
        uint256 labKey;
        bytes32[] equipmentPool;
        uint256[] ownerKeys; // parallel to equipmentPool
        uint256 verifierKey;
        uint256 rogueKey;
    }

    constructor(Config memory c) {
        ledger = c.ledger;
        equipment = c.equipment;
        claims = c.claims;
        gas = c.gas;
        quotaId = c.quotaId;
        operators = c.operators;
        for (uint256 i; i < c.operators.length; ++i) {
            scaleKey[c.operators[i]] = c.scaleKeys[i];
        }
        importer = c.operators[0];
        service = c.operators[2];
        reclaimer = c.operators[3];
        facility = c.operators[4];
        registries = c.registries;
        labKey = c.labKey;
        equipmentPool = c.equipmentPool;
        for (uint256 i; i < c.equipmentPool.length; ++i) {
            ownerKey[c.equipmentPool[i]] = c.ownerKeys[i];
        }
        verifierKey = c.verifierKey;
        rogueKey = c.rogueKey;
    }

    // ------------------------------------------------------------ actions

    function mint(uint64 grams) external {
        calls["mint"]++;
        grams = uint64(bound(grams, 1, 50_000));
        vm.prank(importer);
        try ledger.mintVirgin(quotaId, grams, _id("cyl")) returns (uint256 id) {
            allLots.push(id);
        } catch {}
    }

    function move(uint256 lotSeed, uint256 toSeed, uint64 gramsSeed, uint256 weighDeltaSeed) external {
        calls["move"]++;
        (bool found, uint256 lotId, address holder) = _pickActiveLot(lotSeed, address(0));
        if (!found) return;
        address to = operators[toSeed % operators.length];
        if (to == holder) return;
        uint64 available = ledger.getLot(lotId).grams;
        uint64 grams = uint64(bound(gramsSeed, 1, available));

        _sendAndReceive(lotId, holder, to, grams, weighDeltaSeed);
    }

    function _sendAndReceive(uint256 lotId, address from, address to, uint64 grams, uint256 weighDeltaSeed) internal {
        vm.prank(from);
        uint256 sent = ledger.send(lotId, to, grams, _id("split"));
        if (sent != lotId) allLots.push(sent);

        // the receiver's scale reads between 90 % and 110 % of the sent weight
        uint256 deltaBps = bound(weighDeltaSeed, 9_000, 11_000);
        uint64 weighed = uint64((uint256(grams) * deltaBps) / 10_000);
        ScaleReading memory r = _reading(ledger.receiptSubject(sent), weighed);
        bytes memory sig = _signScale(scaleKey[to], r);
        vm.prank(to);
        ledger.receiveLot(sent, r, sig);
    }

    /// @dev Directed flow so reclamation sees RECOVERED inputs (plus whatever else the random moves bring).
    function routeRecoveredToReclaimer(uint256 lotSeed, uint256 weighDeltaSeed) external {
        calls["routeToReclaimer"]++;
        (bool found, uint256 lotId,) = _pickActiveLotOfClass(lotSeed, service, LotClass.RECOVERED);
        if (!found) return;
        _sendAndReceive(lotId, service, reclaimer, ledger.getLot(lotId).grams, weighDeltaSeed);
    }

    /// @dev Directed flow so destruction sees a mix of RECOVERED, RECLAIMED and VIRGIN lots.
    function routeToFacility(uint256 lotSeed, bool fromReclaimer, uint256 weighDeltaSeed) external {
        calls["routeToFacility"]++;
        address from = fromReclaimer ? reclaimer : service;
        (bool found, uint256 lotId,) = _pickActiveLot(lotSeed, from);
        if (!found) return;
        _sendAndReceive(lotId, from, facility, ledger.getLot(lotId).grams, weighDeltaSeed);
    }

    /// @dev Lets the residence period elapse sometimes, so recoveries are a mix of Tier A/B and Tier C.
    function passTime(uint32 secondsSeed) external {
        calls["passTime"]++;
        vm.warp(block.timestamp + bound(secondsSeed, 1 hours, 200 days));
    }

    function chargeUnit(uint256 lotSeed, uint256 eqSeed, uint64 gramsSeed) external {
        calls["charge"]++;
        (bool found, uint256 lotId,) = _pickActiveLot(lotSeed, service);
        if (!found) return;
        bytes32 eq = equipmentPool[eqSeed % equipmentPool.length];
        uint64 grams = uint64(bound(gramsSeed, 1, ledger.getLot(lotId).grams));
        vm.prank(service);
        try ledger.charge(lotId, eq, grams) {} catch {}
    }

    /// @dev Deliberately tries amounts up to 150 % of the lifetime cap (which includes top-ups), so
    ///      many attempts exceed one charge; over-cap and over-charge attempts must be rejected.
    function recoverUnit(uint256 eqSeed, uint64 gramsSeed, bool decommission) external {
        calls["recover"]++;
        bytes32 eq = equipmentPool[eqSeed % equipmentPool.length];
        uint64 cap = equipment.recoveryCap(eq);
        uint64 perRecovery = equipment.maxPerRecovery(eq);
        uint64 grams = uint64(bound(gramsSeed, 1, (uint256(cap) * 15) / 10));
        bytes32 cyl = _id("rec");
        (RecoveryConsent memory c, bytes memory cs) = _consent(eq, cyl, grams, decommission, ownerKey[eq]);
        ScaleReading memory r = _reading(ledger.recoverySubject(eq, cyl), grams);
        bytes memory sig = _signScale(scaleKey[service], r);
        vm.prank(service);
        try ledger.recover(c, cs, r, sig) returns (uint256 id, uint256 qid) {
            if (id != 0) allLots.push(id);
            if (qid != 0) allLots.push(qid);
            if (grams > perRecovery) ghostOverChargeRecoveriesAccepted++;
        } catch {
            outcomes["recover.rejected"]++;
            if (grams > perRecovery) outcomes["recover.overCharge.rejected"]++;
        }
    }

    /// @dev Feeds up to three lots of ANY class and claims 80–120 % of the input as output.
    function reclaimLots(uint256 seed, uint8 count, uint256 outFactorBps) external {
        calls["reclaim"]++;
        uint256[] memory inputs = _collect(reclaimer, seed, uint8(bound(count, 1, 3)));
        if (inputs.length == 0) return;
        uint256 sum;
        for (uint256 i; i < inputs.length; ++i) {
            sum += ledger.getLot(inputs[i]).grams;
        }
        uint64 out = uint64((sum * bound(outFactorBps, 8_000, 12_000)) / 10_000);
        if (out == 0) return;
        bytes32 outCyl = _id("out");
        bytes32 subject = ledger.reclaimSubject(outCyl);
        ScaleReading memory r = _reading(subject, out);
        LabCertificate memory c = LabCertificate({
            subject: subject, gas: gas, purityBps: 9_960, sampleId: _id("sample"), timestamp: uint64(block.timestamp), nonce: _id("n")
        });
        bytes memory ss = _signScale(scaleKey[reclaimer], r);
        bytes memory ls = _signLab(labKey, c);
        vm.prank(reclaimer);
        try ledger.reclaim(inputs, outCyl, r, ss, c, ls) returns (uint256 id) {
            allLots.push(id);
            reclaimOutputs.push(id);
            outcomes["reclaim.ok"]++;
            outputGramsAtCreation[id] = out;
        } catch {
            outcomes["reclaim.rejected"]++;
        }
    }

    /// @dev Honest counterpart of `reclaimLots`: only RECOVERED, non-Tier-C inputs and a valid yield.
    function honestReclaim(uint256 seed, uint256 yieldBps) external {
        calls["honestReclaim"]++;
        (bool found, uint256 lotId,) = _pickActiveLotOfClass(seed, reclaimer, LotClass.RECOVERED);
        if (!found || ledger.getLot(lotId).tier == Tier.C) return;
        uint256[] memory inputs = new uint256[](1);
        inputs[0] = lotId;
        uint64 out = uint64((uint256(ledger.getLot(lotId).grams) * bound(yieldBps, 8_000, 9_800)) / 10_000);
        if (out == 0) return;
        _doReclaim(inputs, out);
    }

    /// @dev Honest end-of-life flow in one step: let time pass, recover a unit, ship to the facility.
    function honestRecoverToFacility(uint256 eqSeed, uint64 gramsSeed) external {
        calls["honestRecoverToFacility"]++;
        vm.warp(block.timestamp + 181 days);
        bytes32 eq = equipmentPool[eqSeed % equipmentPool.length];
        if (equipment.equipment(eq).status != EquipmentRegistry.Status.ACTIVE) return;
        uint64 room = equipment.recoveryCap(eq) - equipment.equipment(eq).recoveredGrams;
        uint64 perRecovery = equipment.maxPerRecovery(eq);
        if (room > perRecovery) room = perRecovery;
        if (room == 0) return;
        uint64 grams = uint64(bound(gramsSeed, 1, room));
        bytes32 cyl = _id("rec");
        (RecoveryConsent memory c, bytes memory cs) = _consent(eq, cyl, grams, false, ownerKey[eq]);
        ScaleReading memory r = _reading(ledger.recoverySubject(eq, cyl), grams);
        bytes memory sig = _signScale(scaleKey[service], r);
        vm.prank(service);
        try ledger.recover(c, cs, r, sig) returns (uint256 id, uint256 qid) {
            if (id != 0) {
                allLots.push(id);
                _sendAndReceive(id, service, facility, ledger.getLot(id).grams, 10_000);
            }
            if (qid != 0) allLots.push(qid);
        } catch {}
    }

    function _doReclaim(uint256[] memory inputs, uint64 out) internal {
        bytes32 outCyl = _id("out");
        bytes32 subject = ledger.reclaimSubject(outCyl);
        ScaleReading memory r = _reading(subject, out);
        LabCertificate memory c = LabCertificate({
            subject: subject, gas: gas, purityBps: 9_960, sampleId: _id("sample"), timestamp: uint64(block.timestamp), nonce: _id("n")
        });
        bytes memory ss = _signScale(scaleKey[reclaimer], r);
        bytes memory ls = _signLab(labKey, c);
        vm.prank(reclaimer);
        try ledger.reclaim(inputs, outCyl, r, ss, c, ls) returns (uint256 id) {
            allLots.push(id);
            reclaimOutputs.push(id);
            outputGramsAtCreation[id] = out;
            outcomes["reclaim.ok"]++;
        } catch {
            outcomes["reclaim.rejected"]++;
        }
    }

    /// @dev Weighs intake between 95 % and 105 % of what is held; over-weight intakes must be rejected.
    function destroyLots(uint256 seed, uint8 count, uint256 intakeFactorBps) external {
        calls["destroy"]++;
        uint256[] memory inputs = _collect(facility, seed, uint8(bound(count, 1, 3)));
        if (inputs.length == 0) return;
        uint256 held;
        bool allRecovered = true;
        for (uint256 i; i < inputs.length; ++i) {
            KigaliLedger.Lot memory l = ledger.getLot(inputs[i]);
            held += l.grams;
            if (l.cls != LotClass.RECOVERED || l.tier == Tier.C) allRecovered = false;
        }
        uint64 intake = uint64((held * bound(intakeFactorBps, 9_500, 10_500)) / 10_000);
        if (intake == 0) return;
        bytes32 subject = ledger.destructionSubject(inputs);
        ScaleReading memory r = _reading(subject, intake);
        bytes memory sig = _signScale(scaleKey[facility], r);
        (DestructionCertificate memory d, bytes memory ds) = _certificate(subject, intake, verifierKey);
        vm.prank(facility);
        try ledger.destroy(inputs, r, sig, d, ds) returns (uint256 eventId) {
            if (claims.destructionEvent(eventId).creditEligible) {
                eligibleEvents.push(eventId);
                ghostEligibleEventHadOnlyRecovered[eventId] = allRecovered;
            }
            outcomes["destroy.ok"]++;
        } catch {
            outcomes["destroy.rejected"]++;
        }
    }

    /// @dev Attack: book gas as recovered from a unit without its owner's consent. The consent is
    ///      signed by the service company's own scale key or by an unregistered key. Must always fail.
    function recoverWithoutOwnerConsent(uint256 eqSeed, uint64 gramsSeed, bool useOwnScale) external {
        calls["recoverUnconsented"]++;
        bytes32 eq = equipmentPool[eqSeed % equipmentPool.length];
        uint64 grams = uint64(bound(gramsSeed, 1, 5_000));
        bytes32 cyl = _id("rec");
        (RecoveryConsent memory c, bytes memory cs) =
            _consent(eq, cyl, grams, false, useOwnScale ? scaleKey[service] : rogueKey);
        ScaleReading memory r = _reading(ledger.recoverySubject(eq, cyl), grams);
        bytes memory sig = _signScale(scaleKey[service], r);
        vm.prank(service);
        try ledger.recover(c, cs, r, sig) returns (uint256 id, uint256 qid) {
            ghostUnconsentedRecoveriesAccepted++;
            if (id != 0) allLots.push(id);
            if (qid != 0) allLots.push(qid);
        } catch {
            outcomes["recover.unconsented.rejected"]++;
        }
    }

    /// @dev Attack: the facility certifies its own destruction (own scale key or unregistered key).
    ///      Must always fail.
    function destroyWithSelfCertificate(uint256 seed, bool useOwnScale) external {
        calls["destroySelfCertified"]++;
        uint256[] memory inputs = _collect(facility, seed, 1);
        if (inputs.length == 0) return;
        uint64 grams = ledger.getLot(inputs[0]).grams;
        bytes32 subject = ledger.destructionSubject(inputs);
        ScaleReading memory r = _reading(subject, grams);
        bytes memory sig = _signScale(scaleKey[facility], r);
        (DestructionCertificate memory d, bytes memory ds) =
            _certificate(subject, grams, useOwnScale ? scaleKey[facility] : rogueKey);
        vm.prank(facility);
        try ledger.destroy(inputs, r, sig, d, ds) {
            ghostSelfCertifiedDestructionsAccepted++;
        } catch {
            outcomes["destroy.selfcertified.rejected"]++;
        }
    }

    function claim(uint256 eventSeed, uint256 registrySeed) external {
        calls["claim"]++;
        uint256 n = claims.eventCount();
        if (n == 0) return;
        uint256 eventId = eventSeed % n;
        address registry = registries[registrySeed % registries.length];
        vm.prank(registry);
        try claims.claim(eventId, _id("batch")) {
            ghostSuccessfulClaims[eventId]++;
            outcomes["claim.ok"]++;
        } catch {
            outcomes["claim.rejected"]++;
        }
    }

    // ------------------------------------------------------------ views for invariants

    function lotCount() external view returns (uint256) {
        return allLots.length;
    }

    function reclaimOutputCount() external view returns (uint256) {
        return reclaimOutputs.length;
    }

    function eligibleEventCount() external view returns (uint256) {
        return eligibleEvents.length;
    }

    function equipmentCount() external view returns (uint256) {
        return equipmentPool.length;
    }

    // ------------------------------------------------------------ internal

    function _pickActiveLot(uint256 seed, address requiredHolder)
        internal
        view
        returns (bool found, uint256 lotId, address holder)
    {
        uint256 n = allLots.length;
        for (uint256 k; k < n; ++k) {
            uint256 id = allLots[(seed + k) % n];
            KigaliLedger.Lot memory l = ledger.getLot(id);
            if (l.status != LotStatus.ACTIVE || l.grams == 0) continue;
            if (requiredHolder != address(0) && l.holder != requiredHolder) continue;
            return (true, id, l.holder);
        }
    }

    function _pickActiveLotOfClass(uint256 seed, address requiredHolder, LotClass cls)
        internal
        view
        returns (bool found, uint256 lotId, address holder)
    {
        uint256 n = allLots.length;
        for (uint256 k; k < n; ++k) {
            uint256 id = allLots[(seed + k) % n];
            KigaliLedger.Lot memory l = ledger.getLot(id);
            if (l.status != LotStatus.ACTIVE || l.grams == 0 || l.cls != cls || l.holder != requiredHolder) continue;
            return (true, id, l.holder);
        }
    }

    function _collect(address holder, uint256 seed, uint8 count) internal view returns (uint256[] memory out) {
        uint256[] memory tmp = new uint256[](count);
        uint256 found;
        uint256 n = allLots.length;
        for (uint256 k; k < n && found < count; ++k) {
            uint256 id = allLots[(seed + k) % n];
            KigaliLedger.Lot memory l = ledger.getLot(id);
            if (l.status == LotStatus.ACTIVE && l.holder == holder && l.grams > 0) tmp[found++] = id;
        }
        out = new uint256[](found);
        for (uint256 i; i < found; ++i) {
            out[i] = tmp[i];
        }
    }

    function _id(string memory tag) internal returns (bytes32) {
        return keccak256(abi.encode(tag, ++nonceCounter));
    }

    function _reading(bytes32 subject, uint64 grams) internal returns (ScaleReading memory) {
        return ScaleReading({subject: subject, grams: grams, timestamp: uint64(block.timestamp), nonce: _id("nonce")});
    }

    function _signScale(uint256 pk, ScaleReading memory r) internal view returns (bytes memory) {
        (uint8 v, bytes32 rr, bytes32 s) = vm.sign(pk, ledger.scaleDigest(r));
        return abi.encodePacked(rr, s, v);
    }

    function _signLab(uint256 pk, LabCertificate memory c) internal view returns (bytes memory) {
        (uint8 v, bytes32 rr, bytes32 s) = vm.sign(pk, ledger.labDigest(c));
        return abi.encodePacked(rr, s, v);
    }

    function _consent(bytes32 eq, bytes32 cyl, uint64 grams, bool decommission, uint256 signerKey)
        internal
        returns (RecoveryConsent memory c, bytes memory sig)
    {
        c = RecoveryConsent({
            equipmentId: eq,
            cylinderId: cyl,
            service: service,
            grams: grams,
            decommission: decommission,
            timestamp: uint64(block.timestamp),
            nonce: _id("consent")
        });
        (uint8 v, bytes32 rr, bytes32 s) = vm.sign(signerKey, ledger.consentDigest(c));
        sig = abi.encodePacked(rr, s, v);
    }

    function _certificate(bytes32 subject, uint64 grams, uint256 signerKey)
        internal
        returns (DestructionCertificate memory d, bytes memory sig)
    {
        d = DestructionCertificate({
            subject: subject,
            grams: grams,
            dreBps: 9_999,
            documentHash: _id("certificate"),
            timestamp: uint64(block.timestamp),
            nonce: _id("cert-nonce")
        });
        (uint8 v, bytes32 rr, bytes32 s) = vm.sign(signerKey, ledger.destructionDigest(d));
        sig = abi.encodePacked(rr, s, v);
    }
}
