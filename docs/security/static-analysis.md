# Static analysis (Slither)

[Slither](https://github.com/crytic/slither) 0.11.6 runs 102 detectors on the six contracts in `src/`; tests, scripts and `forge-std` are excluded by `slither.config.json`. The CI job `static-analysis` in [`verify.yml`](../../.github/workflows/verify.yml) reruns it on every push and **fails on any Medium or High finding**.

```bash
pip install slither-analyzer==0.11.6
slither .                 # full report
slither . --fail-medium   # what CI enforces
```

## Result (2026-10-17, after both rounds of red-team fixes)

| Severity | Count | Notes |
|---|---:|---|
| High | 0 | One transient false positive came up while fixing the red-team findings (see below) |
| Medium | 0 | Three on the first run: two false positives, initialised explicitly for clarity, and one reentrancy shown to be unexploitable and documented in place. One transient finding came up during the red-team fixes and was rewritten |
| Low | 20 | Triaged below |
| Informational | 5 | Reviewed below |
| Optimization | 0 | `Governance.memberCount` is now `immutable` |

Slither looks for known code patterns. The most serious issues in this code base came from AI-assisted red-team passes (AI agents told to break the contracts; not a human audit), not from Slither: undocumented gas could be laundered into creditable gas, and lab certificates could be reused. Those are listed in the [technical annex](../proposal/technical_annex.html), section B.3. Every one of them has a regression test in [`test/RedTeam.t.sol`](../../test/RedTeam.t.sol).

## Triage

| Detector | Where | Verdict | Why |
|---|---|---|---|
| `reentrancy-no-eth` (Medium, first run) | `KigaliLedger.recover` calls `EquipmentRegistry.recordRecovery` before spending the owner's consent nonce | **Not exploitable; kept, with a note in place** | The registry is set once in the constructor (`immutable`). `recordRecovery` is `onlyLedger` and makes no external calls, so no outside code can run between the call and the nonce write. Reordering would change which error a rejected attempt reports first (unit rules before consent). That order is mirrored by the simulator and checked event by event in the differential test. |
| `uninitialized-local` (Medium ×2, first run) | `KigaliLedger.destroy.held`, `EquipmentRegistry._quarantinedGrams.recent` | **False positive; initialised explicitly for clarity** | Solidity zero-initialises locals, and both are accumulators. |
| `uninitialized-state` (High, transient) | `EquipmentRegistry._charges` after the per-day merge of charge records | **False positive; rewritten** | The mapping was written through a storage pointer, which Slither did not track. It is now written directly. |
| `incorrect-equality` (Medium, transient) | Same-day test in `recordCharge` | **Rewritten** | `==` on day numbers became `>=`. Timestamps never go backwards, so the two are equivalent. |
| `reentrancy-benign`, `reentrancy-events` (Low) | `KigaliLedger.charge` → `recordCharge`; `KigaliLedger.destroy` → `DestructionClaims.record` | **Not exploitable** | Both callees are immutable system contracts restricted to the ledger. A revert in either reverts the whole call. |
| `reentrancy-events` (Low) | `Governance.execute` | **By design** | `executed` is set before the call (checks-effects-interactions). The call was approved by 3 of 4 members. |
| `timestamp` (Low ×16) | various | **6 real uses, accepted; 10 false positives** | The real uses: the 7-day attestation validity window; the 180-day residence rule; rejecting installation dates in the future; the one-record-per-day merge of charges; the 30-day Tier B period; and the 30-day expiry of governance proposals. Sequencer timestamp drift is seconds, against windows of days. The Tier B period is a fixed bucket, so a company can recover up to twice the cap across a boundary; the annex lists this. The 10 false positives compare array indices or gram amounts in functions that also read the clock. |
| `assembly` (Info) | `Attestations.recover` | **Reviewed** | Reads `r, s, v` from a 65-byte signature (`memory-safe`). Rejects high-`s` (malleable) signatures, `v ∉ {27, 28}` and the zero address. Tests: `test_sec_revert_malleableHighS`, `test_revert_signatureBadV`, `test_revert_signatureWrongLength`. |
| `low-level-calls` (Info) | `Governance.execute` | **By design** | The multisig executes approved calls; a failure bubbles up as `CallFailed`. |
| `cyclomatic-complexity` (Info) | `KigaliLedger.destroy` (13) | **Noted** | A candidate for the planned split of `KigaliLedger` into contracts below about 10 KB. |
| `unindexed-event-address` (Info ×2) | `LedgerSet` events | **Cosmetic** | Emitted once, at deployment. |

## What static analysis does not cover

Slither cannot tell whether the rules are the right rules. That is checked by:
- unit tests, including the red-team regressions;
- fuzzed invariants;
- the differential test against the simulator's separately written rule mirror;
- a manual review.

A third-party audit is still needed before any production use.
