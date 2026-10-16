// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {Roles, LotClass, Tier} from "../src/Types.sol";
import {IdentityRegistry} from "../src/IdentityRegistry.sol";
import {EquipmentRegistry} from "../src/EquipmentRegistry.sol";
import {DestructionClaims} from "../src/DestructionClaims.sol";
import {FlagRegistry} from "../src/FlagRegistry.sol";
import {Governance} from "../src/Governance.sol";
import {KigaliLedger} from "../src/KigaliLedger.sol";
import {ScaleReading, LabCertificate, RecoveryConsent, DestructionCertificate} from "../src/Attestations.sol";

/// @notice Deploys Kigali Balance and runs the six-step demo on a public testnet.
///
///   forge script script/Deploy.s.sol --rpc-url op_sepolia --broadcast --verify
///
/// Target is OP Sepolia: on Sepolia (Amsterdam gas schedule) deploying KigaliLedger needs about
/// 29.7M gas, above the 16.78M per-transaction cap (EIP-7825). Splitting the ledger into contracts
/// below ~10 KB is on the roadmap; until then the script refuses to run on Sepolia.
///
/// One key from .env (DEPLOYER_PRIVATE_KEY) pays for everything. The demo actors' keys (the four
/// governance seats, importer, distributor, service company, scales, lab, owner, verifier, ...)
/// are derived from it, so the whole demo is reproducible from that single test key. That also
/// means one person holds all four governance seats: on a testnet this demonstrates the 3-of-4
/// mechanics, not real independence. All data is simulated.
///
/// Steps that must be REJECTED (overselling, inflating reclaimed output, mixing in virgin gas,
/// claiming a destruction twice) are checked in local simulation only and logged; a reverting
/// transaction would abort the broadcast.
contract Deploy is Script {
    bytes32 internal constant R404A = bytes32("R-404A");
    uint256 internal constant SECP_N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141;

    uint256 internal deployerPk;
    uint256 internal nonceCounter;

    // deployed contracts
    Governance internal gov;
    IdentityRegistry internal identity;
    EquipmentRegistry internal equipment;
    DestructionClaims internal claims;
    FlagRegistry internal flags;
    KigaliLedger internal ledger;

    struct Actor {
        string label;
        uint256 pk;
        address addr;
    }

    // governance seats (regulator, carbon registry, industry association, civil society)
    Actor[4] internal seats;
    // demo actors
    Actor internal quotaAuthority;
    Actor internal registrar;
    Actor internal regulator;
    Actor internal aiOracle;
    Actor internal importer;
    Actor internal distributor;
    Actor internal service;
    Actor internal reclaimer;
    Actor internal facility;
    Actor internal registryTW;
    Actor internal registryIntl;
    // signers only (never send transactions)
    Actor internal owner;
    Actor internal verifier;
    Actor internal lab;
    Actor internal scaleImporter;
    Actor internal scaleDistributor;
    Actor internal scaleService;
    Actor internal scaleReclaimer;
    Actor internal scaleFacility;

    // demo identifiers (unique per deployment because the contracts are new)
    bytes32 internal constant QUOTA_ID = keccak256("demo/quota/TR/2026/importer/R-404A");
    bytes32 internal constant FREEZER = keccak256("demo/EKOMVET/supermarket-freezer");
    bytes32 internal constant COLD_ROOM = keccak256("demo/EKOMVET/cold-room");
    bytes32 internal constant DISPLAY_CASE = keccak256("demo/EKOMVET/display-case");

    function run() external {
        require(block.chainid != 11155111, "KigaliLedger exceeds Sepolia's per-transaction gas cap; use --rpc-url op_sepolia");
        deployerPk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPk);
        // gas price used to size each actor's float: at least 1 gwei, or 3x the current base fee
        uint256 price = block.basefee * 3 > 1 gwei ? block.basefee * 3 : 1 gwei;
        _deriveActors();

        console.log("chain id        ", block.chainid);
        console.log("deployer        ", deployer);
        console.log("deployer balance", deployer.balance);

        // ------------------------------------------------------------ 1. deploy
        vm.startBroadcast(deployerPk);
        address[] memory members = new address[](4);
        for (uint256 i; i < 4; ++i) {
            members[i] = seats[i].addr;
        }
        gov = new Governance(members, 3);
        identity = new IdentityRegistry(address(gov));
        equipment = new EquipmentRegistry(address(gov), identity);
        claims = new DestructionClaims(address(gov), identity);
        flags = new FlagRegistry(identity);
        ledger = new KigaliLedger(address(gov), identity, equipment, claims);

        // gas for every actor that sends transactions, sized from its expected gas use
        // (measured on a local rehearsal, then roughly doubled)
        Actor[11] memory senders = [
            seats[0], seats[1], seats[2], quotaAuthority, registrar, importer, distributor, service, reclaimer,
            facility, registryTW
        ];
        uint32[11] memory gasBudget = [
            uint32(8_000_000), 3_000_000, 8_000_000, 300_000, 1_000_000, 1_500_000, 800_000, 2_500_000,
            1_500_000, 1_000_000, 300_000
        ];
        uint256 funded;
        for (uint256 i; i < senders.length; ++i) {
            uint256 need = uint256(gasBudget[i]) * price;
            if (senders[i].addr.balance < need) {
                funded += need - senders[i].addr.balance;
                payable(senders[i].addr).transfer(need - senders[i].addr.balance);
            }
        }
        console.log("gas price used for floats (wei)", price);
        console.log("sent to demo actors (wei)      ", funded);
        vm.stopBroadcast();

        // ------------------------------------------------------------ 2. roles, through the 3-of-4 multisig
        _govern(address(equipment), abi.encodeCall(EquipmentRegistry.setLedger, (address(ledger))));
        _govern(address(claims), abi.encodeCall(DestructionClaims.setLedger, (address(ledger))));
        _grant(quotaAuthority, Roles.QUOTA_AUTHORITY);
        _grant(registrar, Roles.EQUIPMENT_REGISTRAR);
        _grant(regulator, Roles.REGULATOR);
        _grant(aiOracle, Roles.AI_ORACLE);
        _grant(importer, Roles.IMPORTER);
        _grant(distributor, Roles.DISTRIBUTOR);
        _grant(service, Roles.SERVICE);
        _grant(reclaimer, Roles.RECLAIMER);
        _grant(facility, Roles.DESTRUCTION);
        _grant(registryTW, Roles.REGISTRY);
        _grant(registryIntl, Roles.REGISTRY);
        _grant(owner, Roles.EQUIPMENT_OWNER);
        _grant(verifier, Roles.VERIFIER);
        _grant(lab, Roles.LAB);
        _scale(scaleImporter, importer);
        _scale(scaleDistributor, distributor);
        _scale(scaleService, service);
        _scale(scaleReclaimer, reclaimer);
        _scale(scaleFacility, facility);

        // ------------------------------------------------------------ 3. demo
        _demo();
        _writeDeployment(deployer);
    }

    // ================================================================ demo (plan section 7.1)

    function _demo() internal {
        uint64 nowTs = uint64(block.timestamp);

        // registry data: a mock FARAVET quota and three units from a mock national registry
        vm.broadcast(quotaAuthority.pk);
        ledger.registerQuota(QUOTA_ID, importer.addr, R404A, 100_000);
        vm.startBroadcast(registrar.pk);
        equipment.registerTierA(FREEZER, R404A, 9_000, nowTs - 6 * 365 days, keccak256("ekomvet-demo-1"), owner.addr);
        equipment.registerTierA(COLD_ROOM, R404A, 6_000, nowTs - 9 * 365 days, keccak256("ekomvet-demo-2"), owner.addr);
        equipment.registerTierA(DISPLAY_CASE, R404A, 4_000, nowTs - 4 * 365 days, keccak256("ekomvet-demo-3"), owner.addr);
        vm.stopBroadcast();

        // Step 1: the importer mints 100 kg of R-404A against its quota
        vm.broadcast(importer.pk);
        uint256 stock = ledger.mintVirgin(QUOTA_ID, 100_000, _id("cyl/import"));
        console.log("step 1  minted lot", stock, "(100 kg VIRGIN)");

        // Step 2: 60 kg to the distributor; overselling 80 kg is rejected
        uint256 dist = _move(stock, importer, distributor, scaleDistributor, 60_000);
        _expectReject(distributor.addr, address(ledger),
            abi.encodeCall(KigaliLedger.send, (dist, service.addr, 80_000, _id("cyl/oversell"))),
            "step 2  overselling 80 kg from a 60 kg lot");

        // Step 3: the service company buys 20 kg and tops up another unit
        uint256 svc = _move(dist, distributor, service, scaleService, 20_000);
        vm.broadcast(service.pk);
        ledger.charge(svc, DISPLAY_CASE, 3_000);
        console.log("step 3  3 kg charged into the display case");

        // Step 4: end of life of the freezer (no recent ledger charge): 8 kg recovered, Tier A,
        //         weighed on the technician's scale AND consented by the supermarket that owns it
        uint256 recovered = _recover(FREEZER, 8_000);
        console.log("step 4  recovered lot", recovered, "tier (1=A)", uint8(ledger.getLot(recovered).tier));
        uint256 atReclaimer = _move(recovered, service, reclaimer, scaleReclaimer, 8_000);

        // Step 5: selling 20 kg as "reclaimed" from 8 kg of input is rejected; mixing in virgin is rejected
        bytes32 outCyl = _id("cyl/reclaimed");
        bytes32 subject = ledger.reclaimSubject(outCyl);
        _expectReject(reclaimer.addr, address(ledger), _reclaimCall(_one(atReclaimer), outCyl, subject, 20_000),
            "step 5  20 kg 'reclaimed' from 8 kg of recovered input");
        uint256 virginAtReclaimer = _move(stock, importer, reclaimer, scaleReclaimer, 12_000);
        _expectReject(reclaimer.addr, address(ledger),
            _reclaimCall(_two(atReclaimer, virginAtReclaimer), outCyl, subject, 19_000),
            "step 5  virgin gas mixed into reclamation");
        bytes memory honest = _reclaimCall(_one(atReclaimer), outCyl, subject, 7_600);
        vm.broadcast(reclaimer.pk);
        (bool ok,) = address(ledger).call(honest);
        require(ok, "honest reclamation failed");
        uint256 reclaimed = ledger.lotCount();
        console.log("step 5  reclaimed lot", reclaimed, "(7.6 kg from 8 kg, lab-certified)");

        // Step 6: the cold room is recovered and destroyed with an independent verifier's
        //         certificate; one registry claims the event, a second one cannot
        uint256 fromColdRoom = _recover(COLD_ROOM, 5_000);
        uint256 atFacility = _move(fromColdRoom, service, facility, scaleFacility, 5_000);
        uint256 eventId = _destroy(_one(atFacility), 5_000);
        vm.broadcast(registryTW.pk);
        claims.claim(eventId, bytes32("TW-HFC-DESTRUCTION-0001"));
        console.log("step 6  destruction event", eventId, "claimed by the Taiwan registry");
        _expectReject(registryIntl.addr, address(claims),
            abi.encodeCall(DestructionClaims.claim, (eventId, bytes32("INTL-HFC-0042"))),
            "step 6  second registry claiming the same destruction");

        KigaliLedger.Totals memory t = ledger.totals(R404A);
        require(
            uint256(t.virginMinted) + t.unknownDeclared + t.recovered
                == uint256(t.live) + t.charged + t.destroyed + t.reclaimLoss + t.handlingLoss,
            "mass conservation violated"
        );
        console.log("books balance: minted", t.virginMinted, "recovered", t.recovered);
        console.log("               charged", t.charged, "destroyed", t.destroyed);
    }

    // ================================================================ helpers: governance

    /// @dev Seat 0 proposes, seats 1 and 2 approve (3 of 4), seat 2 executes.
    function _govern(address target, bytes memory data) internal {
        vm.broadcast(seats[0].pk);
        uint256 id = gov.propose(target, data);
        vm.broadcast(seats[1].pk);
        gov.approve(id);
        vm.startBroadcast(seats[2].pk);
        gov.approve(id);
        gov.execute(id);
        vm.stopBroadcast();
    }

    function _grant(Actor memory a, bytes32 role) internal {
        _govern(address(identity),
            abi.encodeCall(IdentityRegistry.grantRole, (a.addr, role, keccak256(abi.encode("demo-vc", a.addr, role)))));
    }

    function _scale(Actor memory device, Actor memory operator) internal {
        _grant(device, Roles.SCALE);
        _govern(address(ledger), abi.encodeCall(KigaliLedger.bindDevice, (device.addr, operator.addr)));
    }

    // ================================================================ helpers: ledger flows

    function _move(uint256 lotId, Actor memory from, Actor memory to, Actor memory toScale, uint64 grams)
        internal
        returns (uint256 sent)
    {
        vm.broadcast(from.pk);
        sent = ledger.send(lotId, to.addr, grams, _id("cyl/split"));
        ScaleReading memory r = _reading(ledger.receiptSubject(sent), grams);
        bytes memory sig = _sign(toScale.pk, ledger.scaleDigest(r));
        vm.broadcast(to.pk);
        ledger.receiveLot(sent, r, sig);
    }

    function _recover(bytes32 unit, uint64 grams) internal returns (uint256 lotId) {
        bytes32 cyl = _id("cyl/recovery");
        RecoveryConsent memory c = RecoveryConsent({
            equipmentId: unit, cylinderId: cyl, service: service.addr, grams: grams, decommission: true,
            timestamp: _ts(), nonce: _id("consent")
        });
        bytes memory cs = _sign(owner.pk, ledger.consentDigest(c));
        ScaleReading memory r = _reading(ledger.recoverySubject(unit, cyl), grams);
        bytes memory rs = _sign(scaleService.pk, ledger.scaleDigest(r));
        vm.broadcast(service.pk);
        (uint256 inService, uint256 quarantined) = ledger.recover(c, cs, r, rs);
        lotId = inService != 0 ? inService : quarantined;
    }

    function _reclaimCall(uint256[] memory inputs, bytes32 outCyl, bytes32 subject, uint64 grams)
        internal
        returns (bytes memory)
    {
        ScaleReading memory r = _reading(subject, grams);
        LabCertificate memory c = LabCertificate({
            subject: subject, gas: R404A, purityBps: 9_970, sampleId: _id("sample"), timestamp: _ts(), nonce: _id("lab")
        });
        return abi.encodeCall(
            KigaliLedger.reclaim,
            (inputs, outCyl, r, _sign(scaleReclaimer.pk, ledger.scaleDigest(r)), c, _sign(lab.pk, ledger.labDigest(c)))
        );
    }

    function _destroy(uint256[] memory inputs, uint64 grams) internal returns (uint256 eventId) {
        bytes32 subject = ledger.destructionSubject(inputs);
        ScaleReading memory r = _reading(subject, grams);
        DestructionCertificate memory d = DestructionCertificate({
            subject: subject, grams: grams, dreBps: 9_999, documentHash: keccak256("demo/destruction-certificate"),
            timestamp: _ts(), nonce: _id("certificate")
        });
        bytes memory rs = _sign(scaleFacility.pk, ledger.scaleDigest(r));
        bytes memory ds = _sign(verifier.pk, ledger.destructionDigest(d));
        vm.broadcast(facility.pk);
        eventId = ledger.destroy(inputs, r, rs, d, ds);
    }

    /// @dev Simulated only (never broadcast): the call must revert, and the error is logged.
    function _expectReject(address from, address target, bytes memory data, string memory what) internal {
        // a simulated call still bumps the sender's nonce in the script; restore it, or the real
        // transactions that follow would be broadcast with a gap
        uint64 nonce = vm.getNonce(from);
        vm.prank(from);
        (bool ok, bytes memory ret) = target.call(data);
        vm.setNonceUnsafe(from, nonce);
        require(!ok, string.concat("expected a rejection: ", what));
        console.log(string.concat(what, " -> rejected, error selector:"));
        console.logBytes4(bytes4(ret));
    }

    // ================================================================ helpers: keys and signing

    function _deriveActors() internal {
        string[4] memory seatNames = ["seat/regulator", "seat/registry", "seat/industry", "seat/civil-society"];
        for (uint256 i; i < 4; ++i) {
            seats[i] = _actor(seatNames[i]);
        }
        quotaAuthority = _actor("quota-authority");
        registrar = _actor("equipment-registrar");
        regulator = _actor("regulator");
        aiOracle = _actor("ai-oracle");
        importer = _actor("importer");
        distributor = _actor("distributor");
        service = _actor("service-company");
        reclaimer = _actor("reclaimer");
        facility = _actor("destruction-facility");
        registryTW = _actor("registry-taiwan");
        registryIntl = _actor("registry-international");
        owner = _actor("owner-supermarket");
        verifier = _actor("destruction-verifier");
        lab = _actor("lab");
        scaleImporter = _actor("scale/importer");
        scaleDistributor = _actor("scale/distributor");
        scaleService = _actor("scale/service-company");
        scaleReclaimer = _actor("scale/reclaimer");
        scaleFacility = _actor("scale/destruction-facility");
    }

    function _actor(string memory label) internal view returns (Actor memory a) {
        a.label = label;
        a.pk = uint256(keccak256(abi.encode(deployerPk, "kigali-balance-demo", label))) % (SECP_N - 1) + 1;
        a.addr = vm.addr(a.pk);
    }

    function _sign(uint256 pk, bytes32 digest) internal pure returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, digest);
        return abi.encodePacked(r, s, v);
    }

    function _reading(bytes32 subject, uint64 grams) internal returns (ScaleReading memory) {
        return ScaleReading({subject: subject, grams: grams, timestamp: _ts(), nonce: _id("scale")});
    }

    /// @dev A minute in the past: still fresh when the transaction lands, never in the future.
    function _ts() internal view returns (uint64) {
        return uint64(block.timestamp - 60);
    }

    function _id(string memory tag) internal returns (bytes32) {
        // the ledger address makes identifiers unique per deployment (the script's own address is
        // ephemeral and must not be relied upon)
        return keccak256(abi.encode(tag, ++nonceCounter, address(ledger), block.chainid));
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

    // ================================================================ output

    function _writeDeployment(address deployer) internal {
        string memory k = "deployment";
        vm.serializeUint(k, "chainId", block.chainid);
        vm.serializeAddress(k, "deployer", deployer);
        vm.serializeAddress(k, "Governance", address(gov));
        vm.serializeAddress(k, "IdentityRegistry", address(identity));
        vm.serializeAddress(k, "EquipmentRegistry", address(equipment));
        vm.serializeAddress(k, "DestructionClaims", address(claims));
        vm.serializeAddress(k, "FlagRegistry", address(flags));
        vm.serializeAddress(k, "KigaliLedger", address(ledger));
        vm.serializeAddress(k, "importer", importer.addr);
        vm.serializeAddress(k, "distributor", distributor.addr);
        vm.serializeAddress(k, "serviceCompany", service.addr);
        vm.serializeAddress(k, "reclaimer", reclaimer.addr);
        vm.serializeAddress(k, "destructionFacility", facility.addr);
        vm.serializeAddress(k, "registryTaiwan", registryTW.addr);
        vm.serializeAddress(k, "registryInternational", registryIntl.addr);
        vm.serializeAddress(k, "aiOracle", aiOracle.addr);
        string memory json = vm.serializeString(k, "note",
            "Simulated demo actors; keys are derived from the deployer key. One person holds all four governance seats on this testnet.");
        string memory path = string.concat("deployments/", vm.toString(block.chainid), ".json");
        vm.writeJson(json, path);
        console.log("addresses written to", path);
    }
}
