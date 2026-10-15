// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {Roles, Tier, LotClass, LotStatus} from "../../src/Types.sol";
import {IdentityRegistry} from "../../src/IdentityRegistry.sol";
import {EquipmentRegistry} from "../../src/EquipmentRegistry.sol";
import {DestructionClaims} from "../../src/DestructionClaims.sol";
import {FlagRegistry} from "../../src/FlagRegistry.sol";
import {KigaliLedger} from "../../src/KigaliLedger.sol";
import {ScaleReading, LabCertificate, RecoveryConsent, DestructionCertificate} from "../../src/Attestations.sol";

/// @notice Shared deployment and helpers. In unit tests the test contract itself acts as
///         governance so privileged calls stay readable; Governance.t.sol covers the multisig.
abstract contract Fixture is Test {
    bytes32 internal constant R404A = bytes32("R-404A");
    bytes32 internal constant R134A = bytes32("R-134a");

    IdentityRegistry internal identity;
    EquipmentRegistry internal equipment;
    DestructionClaims internal claims;
    FlagRegistry internal flags;
    KigaliLedger internal ledger;

    // authorities
    address internal quotaAuthority = makeAddr("quotaAuthority");
    address internal registrar = makeAddr("equipmentRegistrar");
    address internal regulator = makeAddr("regulator");
    address internal aiOracle = makeAddr("aiOracle");

    // operators
    address internal importer = makeAddr("importer");
    address internal distributor = makeAddr("distributor");
    address internal service = makeAddr("serviceCo");
    address internal service2 = makeAddr("serviceCo2");
    address internal reclaimer = makeAddr("reclaimer");
    address internal facility = makeAddr("destructionFacility");

    // carbon registries
    address internal registryTW = makeAddr("registryTaiwan");
    address internal registryIntl = makeAddr("registryInternational");

    // device / lab keys (private keys so tests can sign)
    uint256 internal constant SCALE_DIST_PK = 0xA11;
    uint256 internal constant SCALE_SERVICE_PK = 0xA12;
    uint256 internal constant SCALE_SERVICE2_PK = 0xA13;
    uint256 internal constant SCALE_RECLAIM_PK = 0xA14;
    uint256 internal constant SCALE_FACILITY_PK = 0xA15;
    uint256 internal constant LAB_PK = 0xB01;
    uint256 internal constant ROGUE_PK = 0xBAD;
    uint256 internal constant OWNER_PK = 0xC01; // operator of the Tier A units (e.g. a supermarket chain)
    uint256 internal constant TAKEBACK_PK = 0xC02; // take-back point that owns scrapped Tier B units
    uint256 internal constant VERIFIER_PK = 0xD01; // independent destruction verifier

    bytes32 internal constant QUOTA_ID = keccak256("quota/TR/2026/importer/R-404A");
    bytes32 internal constant EQ_A = keccak256("EKOMVET/supermarket-freezer-001");
    bytes32 internal constant MODEL_SPLIT_AC = keccak256("model/split-ac-3.5kW");
    uint64 internal constant NAMEPLATE = 10_000; // 10 kg
    uint64 internal constant INSTALLED_LONG_AGO = 1_600_000_000; // 2020: well past the residence period

    uint256 private _nonce;
    mapping(bytes32 => uint256) internal ownerPkOf; // equipment id => private key of its owner

    function setUp() public virtual {
        vm.warp(1_790_000_000); // a realistic timestamp (Sept 2026)

        identity = new IdentityRegistry(address(this));
        equipment = new EquipmentRegistry(address(this), identity);
        claims = new DestructionClaims(address(this), identity);
        flags = new FlagRegistry(identity);
        ledger = new KigaliLedger(address(this), identity, equipment, claims);
        equipment.setLedger(address(ledger));
        claims.setLedger(address(ledger));

        _grant(quotaAuthority, Roles.QUOTA_AUTHORITY);
        _grant(registrar, Roles.EQUIPMENT_REGISTRAR);
        _grant(regulator, Roles.REGULATOR);
        _grant(aiOracle, Roles.AI_ORACLE);
        _grant(importer, Roles.IMPORTER);
        _grant(distributor, Roles.DISTRIBUTOR);
        _grant(service, Roles.SERVICE);
        _grant(service2, Roles.SERVICE);
        _grant(reclaimer, Roles.RECLAIMER);
        _grant(facility, Roles.DESTRUCTION);
        _grant(registryTW, Roles.REGISTRY);
        _grant(registryIntl, Roles.REGISTRY);

        _bindScale(SCALE_DIST_PK, distributor);
        _bindScale(SCALE_SERVICE_PK, service);
        _bindScale(SCALE_SERVICE2_PK, service2);
        _bindScale(SCALE_RECLAIM_PK, reclaimer);
        _bindScale(SCALE_FACILITY_PK, facility);
        _grant(vm.addr(LAB_PK), Roles.LAB);
        _grant(vm.addr(OWNER_PK), Roles.EQUIPMENT_OWNER);
        _grant(vm.addr(TAKEBACK_PK), Roles.EQUIPMENT_OWNER);
        _grant(vm.addr(VERIFIER_PK), Roles.VERIFIER);

        vm.prank(quotaAuthority);
        ledger.registerQuota(QUOTA_ID, importer, R404A, 100_000); // 100 kg
        _registerA(EQ_A, R404A, NAMEPLATE, INSTALLED_LONG_AGO);
        vm.prank(registrar);
        equipment.setModel(MODEL_SPLIT_AC, R404A, 1_200); // 1.2 kg household unit
    }

    // ------------------------------------------------------------ setup helpers

    function _grant(address account, bytes32 role) internal {
        identity.grantRole(account, role, keccak256(abi.encode("vc", account, role)));
    }

    function _bindScale(uint256 pk, address operator) internal {
        address device = vm.addr(pk);
        _grant(device, Roles.SCALE);
        ledger.bindDevice(device, operator);
    }

    /// @dev Registers a Tier A unit owned by OWNER_PK, as imported from a national registry.
    function _registerA(bytes32 id, bytes32 gas, uint64 nameplateGrams, uint64 installedAt) internal {
        vm.prank(registrar);
        equipment.registerTierA(
            id, gas, nameplateGrams, installedAt, keccak256(abi.encode("registry-record", id)), vm.addr(OWNER_PK)
        );
        ownerPkOf[id] = OWNER_PK;
    }

    /// @dev Registers a Tier B unit at decommissioning; the take-back point is its owner.
    function _registerB(bytes32 id, address svc) internal {
        vm.prank(svc);
        equipment.registerTierB(id, MODEL_SPLIT_AC, keccak256(abi.encode("nameplate-photo", id)), vm.addr(TAKEBACK_PK));
        ownerPkOf[id] = TAKEBACK_PK;
    }

    // ------------------------------------------------------------ signing helpers

    function _nextNonce() internal returns (bytes32) {
        return keccak256(abi.encode("nonce", ++_nonce));
    }

    function _reading(bytes32 subject, uint64 grams) internal returns (ScaleReading memory) {
        return ScaleReading({subject: subject, grams: grams, timestamp: uint64(block.timestamp), nonce: _nextNonce()});
    }

    function _signScale(uint256 pk, ScaleReading memory r) internal view returns (bytes memory) {
        (uint8 v, bytes32 rr, bytes32 s) = vm.sign(pk, ledger.scaleDigest(r));
        return abi.encodePacked(rr, s, v);
    }

    function _cert(bytes32 subject, bytes32 gas, uint16 purityBps) internal returns (LabCertificate memory) {
        return LabCertificate({
            subject: subject,
            gas: gas,
            purityBps: purityBps,
            sampleId: keccak256(abi.encode("sample", subject)),
            timestamp: uint64(block.timestamp),
            nonce: _nextNonce()
        });
    }

    function _signLab(uint256 pk, LabCertificate memory c) internal view returns (bytes memory) {
        (uint8 v, bytes32 rr, bytes32 s) = vm.sign(pk, ledger.labDigest(c));
        return abi.encodePacked(rr, s, v);
    }

    function _consent(bytes32 eqId, bytes32 cyl, address svc, uint64 grams, bool decommission)
        internal
        returns (RecoveryConsent memory)
    {
        return RecoveryConsent({
            equipmentId: eqId,
            cylinderId: cyl,
            service: svc,
            grams: grams,
            decommission: decommission,
            timestamp: uint64(block.timestamp),
            nonce: _nextNonce()
        });
    }

    function _signConsent(uint256 pk, RecoveryConsent memory c) internal view returns (bytes memory) {
        (uint8 v, bytes32 rr, bytes32 s) = vm.sign(pk, ledger.consentDigest(c));
        return abi.encodePacked(rr, s, v);
    }

    /// @dev Consent signed by the unit's registered owner.
    function _ownerSigned(RecoveryConsent memory c) internal view returns (bytes memory) {
        return _signConsent(ownerPkOf[c.equipmentId], c);
    }

    function _destCert(bytes32 subject, uint64 grams, uint16 dreBps) internal returns (DestructionCertificate memory) {
        return DestructionCertificate({
            subject: subject,
            grams: grams,
            dreBps: dreBps,
            documentHash: keccak256(abi.encode("destruction-certificate", subject)),
            timestamp: uint64(block.timestamp),
            nonce: _nextNonce()
        });
    }

    function _signDestruction(uint256 pk, DestructionCertificate memory d) internal view returns (bytes memory) {
        (uint8 v, bytes32 rr, bytes32 s) = vm.sign(pk, ledger.destructionDigest(d));
        return abi.encodePacked(rr, s, v);
    }

    // ------------------------------------------------------------ flow helpers

    function _mint(uint64 grams) internal returns (uint256 lotId) {
        vm.prank(importer);
        lotId = ledger.mintVirgin(QUOTA_ID, grams, keccak256(abi.encode("cyl", grams, _nonce)));
    }

    /// @dev send + receive at the exact sent weight; returns the lot id now held by `to`.
    function _move(uint256 lotId, address from, address to, uint256 toScalePk, uint64 grams)
        internal
        returns (uint256 sent)
    {
        vm.prank(from);
        sent = ledger.send(lotId, to, grams, keccak256(abi.encode("split", lotId, grams)));
        ScaleReading memory r = _reading(ledger.receiptSubject(sent), grams);
        bytes memory sig = _signScale(toScalePk, r);
        vm.prank(to);
        ledger.receiveLot(sent, r, sig);
    }

    function _recover(address svc, uint256 svcScalePk, bytes32 eqId, uint64 grams, bool decommission)
        internal
        returns (uint256 lotId)
    {
        bytes32 cyl = keccak256(abi.encode("recovery-cyl", eqId, _nonce));
        RecoveryConsent memory c = _consent(eqId, cyl, svc, grams, decommission);
        bytes memory cs = _ownerSigned(c);
        ScaleReading memory r = _reading(ledger.recoverySubject(eqId, cyl), grams);
        bytes memory sig = _signScale(svcScalePk, r);
        vm.prank(svc);
        (uint256 inService, uint256 quarantined) = ledger.recover(c, cs, r, sig);
        lotId = inService != 0 ? inService : quarantined;
    }

    /// @dev Like `_recover` but returns both parts of a split recovery.
    function _recoverSplit(address svc, uint256 svcScalePk, bytes32 eqId, uint64 grams)
        internal
        returns (uint256 inService, uint256 quarantined)
    {
        bytes32 cyl = keccak256(abi.encode("recovery-cyl", eqId, _nonce));
        RecoveryConsent memory c = _consent(eqId, cyl, svc, grams, true);
        bytes memory cs = _ownerSigned(c);
        ScaleReading memory r = _reading(ledger.recoverySubject(eqId, cyl), grams);
        bytes memory sig = _signScale(svcScalePk, r);
        vm.prank(svc);
        (inService, quarantined) = ledger.recover(c, cs, r, sig);
    }

    /// @dev Owner consent for `service` to recover `grams` from `eqId` into `cyl`.
    function _ownerConsentFor(bytes32 eqId, bytes32 cyl, uint64 grams, bool decommission)
        internal
        returns (RecoveryConsent memory c, bytes memory cs)
    {
        c = _consent(eqId, cyl, service, grams, decommission);
        cs = _ownerSigned(c);
    }

    /// @dev Builds a fully signed recovery (owner consent + service scale) without submitting it,
    ///      so a test can put `vm.expectRevert` directly in front of `ledger.recover`.
    function _recoveryArgs(uint256 svcScalePk, address svc, bytes32 eqId, bytes32 cyl, uint64 grams, bool decommission)
        internal
        returns (RecoveryConsent memory c, bytes memory cs, ScaleReading memory r, bytes memory rs)
    {
        c = _consent(eqId, cyl, svc, grams, decommission);
        cs = _signConsent(ownerPkOf[eqId] != 0 ? ownerPkOf[eqId] : OWNER_PK, c);
        r = _reading(ledger.recoverySubject(eqId, cyl), grams);
        rs = _signScale(svcScalePk, r);
    }

    function _reclaim(uint256[] memory inputs, uint64 outGrams, uint16 purityBps) internal returns (uint256) {
        bytes32 outCyl = keccak256(abi.encode("reclaim-cyl", _nonce));
        bytes32 subject = ledger.reclaimSubject(outCyl);
        ScaleReading memory r = _reading(subject, outGrams);
        LabCertificate memory c = _cert(subject, R404A, purityBps);
        bytes memory ss = _signScale(SCALE_RECLAIM_PK, r);
        bytes memory ls = _signLab(LAB_PK, c);
        vm.prank(reclaimer);
        return ledger.reclaim(inputs, outCyl, r, ss, c, ls);
    }

    function _destroy(uint256[] memory inputs, uint64 grams) internal returns (uint256) {
        bytes32 subject = ledger.destructionSubject(inputs);
        ScaleReading memory r = _reading(subject, grams);
        bytes memory sig = _signScale(SCALE_FACILITY_PK, r);
        DestructionCertificate memory d = _destCert(subject, grams, 9_999);
        bytes memory ds = _signDestruction(VERIFIER_PK, d);
        vm.prank(facility);
        return ledger.destroy(inputs, r, sig, d, ds);
    }

    function _one(uint256 a) internal pure returns (uint256[] memory arr) {
        arr = new uint256[](1);
        arr[0] = a;
    }

    function _two(uint256 a, uint256 b) internal pure returns (uint256[] memory arr) {
        arr = new uint256[](2);
        arr[0] = a;
        arr[1] = b;
    }

    /// @dev Mass-balance identity that must hold for every gas at all times.
    function _assertConservation(bytes32 gas) internal view {
        KigaliLedger.Totals memory t = ledger.totals(gas);
        assertEq(
            uint256(t.virginMinted) + t.unknownDeclared + t.recovered,
            uint256(t.live) + t.charged + t.destroyed + t.reclaimLoss + t.handlingLoss,
            "mass conservation violated"
        );
    }
}
