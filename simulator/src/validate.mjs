// Self-checks run after every simulation. Hard failures throw; calibration is reported.

const TIER_RANK = { A: 1, B: 2, C: 3 };

export function validate(result) {
  const { ledger, truth, params } = result;
  const failures = [];
  const check = (cond, msg) => {
    if (!cond) failures.push(msg);
  };

  // 1) ledger identity (same formula as the on-chain invariant)
  for (const [gas, t] of ledger.totals) {
    const lhs = t.virginMinted + t.unknownDeclared + t.recovered;
    const rhs = t.live + t.charged + t.destroyed + t.reclaimLoss + t.handlingLoss;
    check(lhs === rhs, `ledger identity broken for ${gas}: ${lhs} != ${rhs}`);
  }

  // 2) `live` equals the sum of open lots
  const openByGas = {};
  for (const lot of ledger.lots.values()) {
    if (lot.status === 'ACTIVE' || lot.status === 'IN_TRANSIT') openByGas[lot.gas] = (openByGas[lot.gas] ?? 0) + lot.grams;
  }
  for (const [gas, t] of ledger.totals) check((openByGas[gas] ?? 0) === t.live, `live mismatch for ${gas}`);

  // 3) physical mass balance: nothing appears or disappears in the real world either
  const physical = {};
  for (const [gas, ph] of Object.entries(truth.physical)) {
    const t = ledger.totalsOf(gas);
    const inflow = ph.initialInEquipment + t.virginMinted + ph.smuggledIn;
    const stocks = ph.inEquipmentEnd + t.live + ph.leaked + ph.vented + t.destroyed + t.reclaimLoss + t.handlingLoss;
    physical[gas] = { inflow, accountedFor: stocks, difference: inflow - stocks };
    check(inflow === stocks, `physical balance broken for ${gas}: inflow ${inflow} vs ${stocks}`);
  }

  // 4) every accepted event obeys the contract rules
  const accepted = result.observations.events.filter((e) => e.status === 'accepted');
  const recoveredPerUnit = {};
  const claimed = new Set();
  for (const e of accepted) {
    if (e.type === 'RECOVER') {
      recoveredPerUnit[e.equipment] = (recoveredPerUnit[e.equipment] ?? 0) + e.grams;
      check(recoveredPerUnit[e.equipment] <= ledger.recoveryCap(e.equipment), `R3 cap exceeded on ${e.equipment}`);
    }
    if (e.type === 'RECLAIM') {
      check(e.outGrams <= Math.floor((e.inGrams * (10_000 - params.rules.minReclaimLossBps)) / 10_000), `R4 yield exceeded (seq ${e.seq})`);
      check(e.purityBps >= params.rules.minReclaimPurityBps, `R4 purity too low (seq ${e.seq})`);
      for (const id of e.inputs) {
        const lot = ledger.lots.get(id);
        check(lot.cls === 'RECOVERED' && lot.tier !== 'C', `R5 laundering: lot ${id} (${lot.cls}/${lot.tier}) was reclaimed`);
      }
    }
    if (e.type === 'DESTROY') {
      check(e.dreBps >= params.rules.minDreBps, `R6 DRE too low (seq ${e.seq})`);
      if (e.creditEligible) {
        for (const id of e.inputs) {
          const lot = ledger.lots.get(id);
          check(lot.cls === 'RECOVERED' && lot.tier !== 'C', `R6 ineligible lot ${id} in a credit-eligible event`);
        }
      }
    }
    if (e.type === 'CLAIM') {
      check(!claimed.has(e.eventId), `R7 event ${e.eventId} claimed twice`);
      claimed.add(e.eventId);
    }
  }

  // 5) charge-and-recover attempts never yield reclaimable or creditable gas
  for (const a of truth.fraud.chargeAndRecoverUnits) {
    const rec = accepted.find((e) => e.type === 'RECOVER' && e.equipment === a.unit && e.grams === a.grams && !e.decommission);
    if (rec) check(rec.inServiceGrams === 0, `charge-and-recover on ${a.unit} escaped quarantine`);
  }

  // 6) independent second parties: every accepted recovery was consented by the unit's owner and
  //    every accepted destruction was certified by a verifier independent of the facility
  for (const e of accepted) {
    if (e.type === 'RECOVER') {
      const unit = ledger.equipment.get(e.equipment);
      check(e.consentSigner === unit.owner && e.consentSigner !== e.actor && e.consentSigner !== `scale:${e.actor}`,
        `recovery seq ${e.seq} lacks independent owner consent`);
    }
    if (e.type === 'DESTROY') {
      check(ledger.verifiers.has(e.verifier) && e.verifier !== `scale:${e.actor}`, `destruction seq ${e.seq} not independently certified`);
    }
  }
  for (const a of [...truth.fraud.unconsentedRecoveryAttempts, ...truth.fraud.cylinderReuseAttempts, ...truth.fraud.selfCertifiedDestructionAttempts]) {
    check(!a.accepted, `an attack was accepted: ${JSON.stringify(a)}`);
  }

  // 7) cylinders: the mirror's occupancy count matches the open lots, and only a split recovery
  //    (in-service part + quarantined part) shares a cylinder
  const openByCylinder = {};
  for (const lot of ledger.lots.values()) {
    if (lot.status === 'ACTIVE' || lot.status === 'IN_TRANSIT') (openByCylinder[lot.cylinder] ??= []).push(lot);
  }
  for (const [cyl, n] of ledger.cylinders) check((openByCylinder[cyl]?.length ?? 0) === n, `cylinder ${cyl} occupancy ${n} != open lots`);
  for (const [cyl, lots] of Object.entries(openByCylinder)) {
    check(lots.length <= 2, `cylinder ${cyl} backs ${lots.length} open lots`);
    if (lots.length === 2) check(lots.some((l) => l.tier === 'C') && lots[0].origin === lots[1].origin, `cylinder ${cyl} shared by unrelated lots`);
  }

  // calibration (reported, not enforced)
  const calibration = {};
  for (const [gas, ph] of Object.entries(truth.physical)) {
    calibration[gas] = {
      eolMassRecoveryRate: ph.eolRemaining ? round(ph.eolRecovered / ph.eolRemaining) : null,
      targetEolMassRecoveryRate: params.endOfLife.targetMassRecoveryRate,
      shareOfTopUpsRecordedOnLedger: ph.topUpsTrue ? round(ph.topUpsOnLedger / ph.topUpsTrue) : null,
      shareOfTopUpDemandUnmet: ph.topUpsTrue + ph.topUpsUnmet ? round(ph.topUpsUnmet / (ph.topUpsTrue + ph.topUpsUnmet)) : null,
    };
  }
  const all = Object.values(truth.physical).reduce(
    (s, ph) => ({ rem: s.rem + ph.eolRemaining, rec: s.rec + ph.eolRecovered }),
    { rem: 0, rec: 0 },
  );
  calibration.overallEolMassRecoveryRate = all.rem ? round(all.rec / all.rem) : null;

  if (failures.length) {
    const err = new Error(`Simulation failed ${failures.length} self-check(s):\n - ${failures.slice(0, 20).join('\n - ')}`);
    err.failures = failures;
    throw err;
  }
  return { ok: true, physical, calibration };
}

export function summarize(result, validation) {
  const { ledger, truth, params, observations } = result;
  const gwp = (gas) => params.gases[gas].gwpAR4;
  const t = (grams, gas) => round((grams / 1e6) * gwp(gas), 1); // tCO2e

  const byGas = {};
  for (const [gas, ph] of Object.entries(truth.physical)) {
    const tot = ledger.totalsOf(gas);
    byGas[gas] = {
      kg: {
        initialInEquipment: kg(ph.initialInEquipment), virginMinted: kg(tot.virginMinted), smuggledIn: kg(ph.smuggledIn),
        leaked: kg(ph.leaked), vented: kg(ph.vented), recoveredOnLedger: kg(tot.recovered), destroyed: kg(tot.destroyed),
        reclaimLoss: kg(tot.reclaimLoss), inEquipmentEnd: kg(ph.inEquipmentEnd), inCylindersEnd: kg(tot.live),
      },
      tCO2e: { leaked: t(ph.leaked, gas), vented: t(ph.vented, gas), destroyed: t(tot.destroyed, gas) },
    };
  }

  const counts = {};
  const rejected = {};
  for (const e of observations.events) {
    counts[e.type] = (counts[e.type] ?? 0) + 1;
    if (e.status === 'rejected') rejected[e.reason] = (rejected[e.reason] ?? 0) + 1;
  }
  const claimedTco2e = ledger.destructionEvents.filter((e) => e.claimedBy).reduce((s, e) => s + t(e.grams, e.gas), 0);
  const eligible = ledger.destructionEvents.filter((e) => e.eligible).length;

  return {
    note: 'All figures are simulated. Parameters and their sources: params.json.',
    seed: params.simulation.seed,
    period: result.period,
    actors: observations.actors.length,
    registeredEquipment: observations.equipment.length,
    byGas,
    destruction: {
      events: ledger.destructionEvents.length, creditEligible: eligible,
      claimed: ledger.destructionEvents.filter((e) => e.claimedBy).length, claimedTco2e: round(claimedTco2e, 1),
    },
    eventCounts: counts,
    rejectedByReason: rejected,
    injectedFraud: {
      offLedgerTopUpServices: truth.fraud.offLedgerTopUpServices.length,
      phantomTierBServices: truth.fraud.phantomTierBServices.length,
      phantomUnits: truth.fraud.phantomUnits.length,
      colludingTakeBackPoints: truth.fraud.colludingTakeBackPoints.length,
      unconsentedRecoveryAttempts: truth.fraud.unconsentedRecoveryAttempts.length,
      cylinderReuseAttempts: truth.fraud.cylinderReuseAttempts.length,
      selfCertifiedDestructionAttempts: truth.fraud.selfCertifiedDestructionAttempts.length,
      oversellingDistributors: truth.fraud.oversellingDistributors.length,
      inflatedYieldReclaimers: truth.fraud.inflatedYieldReclaimers.length,
      chargeAndRecoverAttempts: truth.fraud.chargeAndRecoverUnits.length,
    },
    selfChecks: { ok: validation.ok, physicalBalance: validation.physical },
    calibration: validation.calibration,
  };
}

const kg = (g) => round(g / 1000, 1);
function round(x, d = 3) {
  const f = 10 ** d;
  return Math.round(x * f) / f;
}
