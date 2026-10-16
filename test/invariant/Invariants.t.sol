// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {console} from "forge-std/console.sol";
import {Fixture} from "../utils/Fixture.sol";
import {LotClass, LotStatus, Tier} from "../../src/Types.sol";
import {KigaliLedger} from "../../src/KigaliLedger.sol";
import {Handler} from "./Handler.sol";

/// @notice Properties that must hold after ANY sequence of actions, honest or not.
contract InvariantsTest is Fixture {
    Handler internal handler;
    bytes32 internal constant BIG_QUOTA = keccak256("quota/invariant");
    uint256 internal constant IMPORTER_SCALE_PK = 0xA10;

    function setUp() public override {
        super.setUp();
        vm.prank(quotaAuthority);
        ledger.registerQuota(BIG_QUOTA, importer, R404A, 2_000_000); // 2 t

        bytes32[] memory pool = new bytes32[](6);
        uint256[] memory ownerKeys = new uint256[](6);
        for (uint256 i; i < 4; ++i) {
            pool[i] = keccak256(abi.encode("inv-tierA", i));
            _registerA(pool[i], R404A, uint64(5_000 + i * 5_000), INSTALLED_LONG_AGO);
            ownerKeys[i] = OWNER_PK;
        }
        for (uint256 i = 4; i < 6; ++i) {
            pool[i] = keccak256(abi.encode("inv-tierB", i));
            _registerB(pool[i], service);
            ownerKeys[i] = TAKEBACK_PK;
        }

        _bindScale(IMPORTER_SCALE_PK, importer); // the importer also receives returned lots
        address[] memory ops = new address[](5);
        ops[0] = importer;
        ops[1] = distributor;
        ops[2] = service;
        ops[3] = reclaimer;
        ops[4] = facility;
        uint256[] memory keys = new uint256[](5);
        keys[0] = IMPORTER_SCALE_PK;
        keys[1] = SCALE_DIST_PK;
        keys[2] = SCALE_SERVICE_PK;
        keys[3] = SCALE_RECLAIM_PK;
        keys[4] = SCALE_FACILITY_PK;
        address[] memory regs = new address[](2);
        regs[0] = registryTW;
        regs[1] = registryIntl;

        // both registries accept Tier B so that claims are exercised on every eligible event
        vm.prank(registryTW);
        claims.setAcceptedTier(Tier.B);
        vm.prank(registryIntl);
        claims.setAcceptedTier(Tier.B);

        handler = new Handler(
            Handler.Config({
                ledger: ledger,
                equipment: equipment,
                claims: claims,
                gas: R404A,
                quotaId: BIG_QUOTA,
                operators: ops,
                scaleKeys: keys,
                registries: regs,
                labKey: LAB_PK,
                equipmentPool: pool,
                ownerKeys: ownerKeys,
                verifierKey: VERIFIER_PK,
                rogueKey: ROGUE_PK
            })
        );
        targetContract(address(handler));
    }

    /// 1. Every gram is accounted for: nothing is created or lost off the books.
    function invariant_massConservation() public view {
        _assertConservation(R404A);
    }

    /// 2. The `live` total equals the sum of all lots still active or in transit.
    function invariant_liveEqualsSumOfOpenLots() public view {
        uint256 sum;
        uint256 n = ledger.lotCount();
        for (uint256 id = 1; id <= n; ++id) {
            KigaliLedger.Lot memory l = ledger.getLot(id);
            if (l.status == LotStatus.ACTIVE || l.status == LotStatus.IN_TRANSIT) sum += l.grams;
        }
        assertEq(sum, ledger.totals(R404A).live);
    }

    /// 3. R3: no unit ever yields more than it can hold.
    function invariant_recoveryNeverExceedsCap() public view {
        uint256 n = handler.equipmentCount();
        for (uint256 i; i < n; ++i) {
            bytes32 eq = handler.equipmentPool(i);
            assertLe(equipment.equipment(eq).recoveredGrams, equipment.recoveryCap(eq));
        }
    }

    /// 3b. R3 per recovery (round 12): no single recovery takes more than one charge, however many
    ///     top-ups a leaky unit has received.
    function invariant_noRecoveryAboveOneCharge() public view {
        assertEq(handler.ghostOverChargeRecoveriesAccepted(), 0);
    }

    /// 4. R4 + R5: reclaimed lots descend only from RECOVERED lots, and the output at creation
    ///    never exceeds the input minus the minimum process loss.
    function invariant_reclaimedOnlyFromRecovered() public view {
        uint256 n = handler.reclaimOutputCount();
        uint16 minLoss = ledger.minReclaimLossBps();
        for (uint256 i; i < n; ++i) {
            uint256 out = handler.reclaimOutputs(i);
            uint256[] memory inputs = ledger.reclaimInputs(out);
            uint256 inputGrams;
            for (uint256 j; j < inputs.length; ++j) {
                KigaliLedger.Lot memory l = ledger.getLot(inputs[j]);
                assertEq(uint8(l.cls), uint8(LotClass.RECOVERED), "virgin or unknown gas was laundered");
                assertTrue(l.tier != Tier.C, "charge-and-recover gas was laundered");
                assertEq(uint8(l.status), uint8(LotStatus.CONSUMED), "reclaim input still spendable");
                inputGrams += l.grams; // consumed lots keep their weight at consumption
            }
            assertLe(handler.outputGramsAtCreation(out), (inputGrams * (10_000 - minLoss)) / 10_000);
        }
    }

    /// 5. R7: a destruction event is never credited by more than one registry.
    function invariant_claimedAtMostOnce() public view {
        uint256 n = claims.eventCount();
        for (uint256 id; id < n; ++id) {
            assertLe(handler.ghostSuccessfulClaims(id), 1);
        }
    }

    /// 6. R6: credit-eligible destruction events consumed only RECOVERED lots.
    function invariant_eligibleEventsOnlyFromRecovered() public view {
        uint256 n = handler.eligibleEventCount();
        for (uint256 i; i < n; ++i) {
            assertTrue(handler.ghostEligibleEventHadOnlyRecovered(handler.eligibleEvents(i)));
        }
    }

    /// 7. R1: quota is never exceeded.
    function invariant_quotaNeverExceeded() public view {
        (,, uint64 allowed, uint64 used) = ledger.quotas(BIG_QUOTA);
        assertLe(used, allowed);
    }

    /// 8. R3: no recovery is ever booked without the consent of the unit's registered owner.
    function invariant_noRecoveryWithoutOwnerConsent() public view {
        assertEq(handler.ghostUnconsentedRecoveriesAccepted(), 0);
    }

    /// 9. R6: no destruction is ever recorded on a certificate the facility signed itself.
    function invariant_noSelfCertifiedDestruction() public view {
        assertEq(handler.ghostSelfCertifiedDestructionsAccepted(), 0);
    }

    function afterInvariant() external {
        KigaliLedger.Totals memory t = ledger.totals(R404A);
        console.log("lots", ledger.lotCount(), "destruction events", claims.eventCount());
        console.log("virgin minted g", t.virginMinted, "recovered g", t.recovered);
        console.log("destroyed g", t.destroyed, "reclaim outputs", handler.reclaimOutputCount());
        console.log("reclaim ok", handler.outcomes("reclaim.ok"), "rejected", handler.outcomes("reclaim.rejected"));
        console.log("destroy ok", handler.outcomes("destroy.ok"), "rejected", handler.outcomes("destroy.rejected"));
        console.log("claim ok", handler.outcomes("claim.ok"), "rejected", handler.outcomes("claim.rejected"));
        console.log("recover rejected (over cap)", handler.outcomes("recover.rejected"));
        console.log("unconsented recoveries rejected", handler.outcomes("recover.unconsented.rejected"));
        console.log("self-certified destructions rejected", handler.outcomes("destroy.selfcertified.rejected"));
        console.log("recoveries above one charge rejected", handler.outcomes("recover.overCharge.rejected"));
        // columns: reclaim.ok, reclaim.rejected, destroy.ok, claim.ok, claim.rejected, recover.rejected,
        //          recover.unconsented.rejected, destroy.selfcertified.rejected, recover.overCharge.rejected
        //          (the ninth column was added on 2026-10-16; older rows have eight)
        vm.writeLine(
            "reports/invariant-metrics.csv",
            string.concat(
                vm.toString(handler.outcomes("reclaim.ok")), ",",
                vm.toString(handler.outcomes("reclaim.rejected")), ",",
                vm.toString(handler.outcomes("destroy.ok")), ",",
                vm.toString(handler.outcomes("claim.ok")), ",",
                vm.toString(handler.outcomes("claim.rejected")), ",",
                vm.toString(handler.outcomes("recover.rejected")), ",",
                vm.toString(handler.outcomes("recover.unconsented.rejected")), ",",
                vm.toString(handler.outcomes("destroy.selfcertified.rejected")), ",",
                vm.toString(handler.outcomes("recover.overCharge.rejected"))
            )
        );
    }
}
