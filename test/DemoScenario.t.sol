// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Fixture} from "./utils/Fixture.sol";
import {LotClass, Tier} from "../src/Types.sol";
import {KigaliLedger} from "../src/KigaliLedger.sol";
import {DestructionClaims} from "../src/DestructionClaims.sol";
import {ScaleReading, LabCertificate} from "../src/Attestations.sol";

/// @notice The six-step story shown in the demo video (plan section 7.1), end to end.
///         All actors, quotas and equipment are simulated.
contract DemoScenarioTest is Fixture {
    bytes32 internal constant FREEZER = keccak256("EKOMVET/demo-supermarket-freezer");
    bytes32 internal constant COLD_ROOM = keccak256("EKOMVET/demo-cold-room");

    function test_demo_sixSteps() public {
        // both units come from the (mock) national registry, bound to the supermarket that operates them
        _registerA(FREEZER, R404A, 9_000, uint64(block.timestamp - 6 * 365 days));
        _registerA(COLD_ROOM, R404A, 6_000, uint64(block.timestamp - 9 * 365 days));

        // Step 1 — a Turkish importer mints 100 kg of R-404A against its (mock) FARAVET quota.
        uint256 stock = _mint(100_000);
        assertEq(uint8(ledger.getLot(stock).cls), uint8(LotClass.VIRGIN));

        // Step 2 — the distributor receives 60 kg, then tries to sell 80 kg: rejected by conservation.
        uint256 dist = _move(stock, importer, distributor, SCALE_DIST_PK, 60_000);
        vm.prank(distributor);
        vm.expectRevert(abi.encodeWithSelector(KigaliLedger.InsufficientGrams.selector, dist, 60_000, 80_000));
        ledger.send(dist, service, 80_000, bytes32("oversell"));

        // Step 3 — the service company charges the freezer and tops it up over three years.
        uint256 svc = _move(dist, distributor, service, SCALE_SERVICE_PK, 20_000);
        vm.startPrank(service);
        ledger.charge(svc, FREEZER, 3_000);
        vm.warp(block.timestamp + 365 days);
        ledger.charge(svc, FREEZER, 2_500);
        vm.warp(block.timestamp + 365 days);
        ledger.charge(svc, FREEZER, 2_800);
        vm.stopPrank();
        // 8.3 kg of top-ups on a 9 kg unit: the off-chain leak model (AI module A) flags this unit.
        assertEq(equipment.equipment(FREEZER).chargedGrams, 8_300);

        // Step 4 — end of life, months after the last top-up: 8 kg recovered on a signed scale.
        vm.warp(block.timestamp + 200 days);
        uint256 recovered = _recover(service, SCALE_SERVICE_PK, FREEZER, 8_000, true);
        assertEq(uint8(ledger.getLot(recovered).tier), uint8(Tier.A), "gas in service long enough");
        uint256 atReclaimer = _move(recovered, service, reclaimer, SCALE_RECLAIM_PK, 8_000);

        // Step 5 — the reclaimer tries to sell 20 kg as "reclaimed" from 8 kg of documented input.
        bytes32 outCyl = bytes32("demo-reclaimed-cyl");
        bytes32 subject = ledger.reclaimSubject(reclaimer, _one(atReclaimer), outCyl);
        {
            ScaleReading memory r = _reading(subject, 20_000);
            LabCertificate memory c = _cert(subject, R404A, 9_970);
            bytes memory ss = _signScale(SCALE_RECLAIM_PK, r);
            bytes memory ls = _signLab(LAB_PK, c);
            vm.prank(reclaimer);
            vm.expectRevert(abi.encodeWithSelector(KigaliLedger.ReclaimExceedsInput.selector, 7_840, 20_000));
            ledger.reclaim(_one(atReclaimer), outCyl, r, ss, c, ls);
        }
        // ...and the shortcut of topping up with virgin gas is rejected too (classes never mix).
        uint256 virginAtReclaimer = _move(stock, importer, reclaimer, SCALE_RECLAIM_PK, 12_000);
        {
            bytes32 mixed = ledger.reclaimSubject(reclaimer, _two(atReclaimer, virginAtReclaimer), outCyl);
            ScaleReading memory r = _reading(mixed, 19_000);
            LabCertificate memory c = _cert(mixed, R404A, 9_970);
            bytes memory ss = _signScale(SCALE_RECLAIM_PK, r);
            bytes memory ls = _signLab(LAB_PK, c);
            vm.prank(reclaimer);
            vm.expectRevert(
                abi.encodeWithSelector(KigaliLedger.ClassNotReclaimable.selector, virginAtReclaimer, LotClass.VIRGIN)
            );
            ledger.reclaim(_two(atReclaimer, virginAtReclaimer), outCyl, r, ss, c, ls);
        }
        // The honest batch goes through: 7.6 kg reclaimed from 8 kg, with a lab certificate.
        uint256 reclaimed = _reclaim(_one(atReclaimer), 7_600, 9_970);
        assertEq(uint8(ledger.getLot(reclaimed).cls), uint8(LotClass.RECLAIMED));
        assertEq(ledger.reclaimInputs(reclaimed)[0], atReclaimer, "buyers can walk the provenance chain");

        // Step 6 — a second unit is recovered and destroyed; one registry claims it, a second cannot.
        uint256 fromColdRoom = _recover(service, SCALE_SERVICE_PK, COLD_ROOM, 5_000, true);
        uint256 atFacility = _move(fromColdRoom, service, facility, SCALE_FACILITY_PK, 5_000);
        uint256 eventId = _destroy(_one(atFacility), 5_000);
        DestructionClaims.DestructionEvent memory ev = claims.destructionEvent(eventId);
        assertTrue(ev.creditEligible);
        assertEq(uint8(ev.worstTier), uint8(Tier.A));

        _designate(eventId, registryTW);
        vm.prank(registryTW);
        claims.claim(eventId, bytes32("TW-HFC-DESTRUCTION-0001"));
        vm.prank(registryIntl);
        vm.expectRevert(abi.encodeWithSelector(DestructionClaims.AlreadyClaimed.selector, registryTW));
        claims.claim(eventId, bytes32("INTL-HFC-0042"));

        // The books balance for every gram.
        _assertConservation(R404A);
        KigaliLedger.Totals memory t = ledger.totals(R404A);
        assertEq(t.virginMinted, 100_000);
        assertEq(t.recovered, 13_000);
        assertEq(t.charged, 8_300);
        assertEq(t.destroyed, 5_000);
        assertEq(t.reclaimLoss, 400);
    }
}
