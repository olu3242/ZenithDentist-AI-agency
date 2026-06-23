# Failure Injection Report — Batch 11-15

## Existing failure-path tests (read before writing anything new)

`/home/user/ZenithDentist-AI-agency/tests/agent-os/execution.test.ts` (read in full, 127 lines) already contains:
1. **Success path** (lines 70-91): `executeRegisteredAutomation` resolves -> verifies `status:"running"` -> `"completed"` transition, `agent_actions`/`agent_results` rows inserted with `status:"completed"`/`success:true`.
2. **Workflow throw** (lines 93-113): `executeRegisteredAutomation` mocked to reject with `Error("workflow exploded")` -> verifies `result.status==="failed"`, `result.success===false`, `result.error` contains the message, `agent_actions` row inserted with `status:"failed"`, `agent_results` row with `success:false`, and `agent_executions` updated to `status:"failed"`. **This is a real, already-passing failure-path test** — ran it as part of the full suite (93/93 passing) and confirmed it specifically exercises `ExecutionEngine.run`'s catch block.
3. **No-workflowId path** (lines 115-126): confirms `executeRegisteredAutomation` is never called when `workflowId` is absent.

`/home/user/ZenithDentist-AI-agency/tests/agent-os/approvals.test.ts` (read in full) tests `ApprovalRuleEngine.checkApproval` directly: fail-open when Supabase unavailable, auto-approve via agent-specific rule, **block when default rule requires approval** (`autoApproved:false`, `riskLevel:"high"`), and auto-approve when no rule matches. This covers the approval-rejection branch at the `ApprovalRuleEngine` level, though not as an end-to-end `ExecutionEngine.run` -> `pending_approval` integration test.

## Gaps identified and closed with new throwaway tests

Two scenarios were NOT covered by existing tests:
1. A Supabase **insert error during bookkeeping** (e.g. the `agent_executions` insert itself fails, returning `error` instead of throwing) — does `ExecutionEngine.run` crash, or degrade gracefully?
2. Whether `recordAttribution` is correctly **skipped** when the workflow throws, even if `revenueImpact` was provided in the input (i.e., no attribution should be written for a failed execution).

A throwaway file `tests/agent-os/_scratch_failure_injection.test.ts` was written and run via `npx vitest run tests/agent-os/_scratch_failure_injection.test.ts`:

**Result: both new tests passed.**
```
Test Files  1 passed (1)
     Tests  2 passed (2)
```

Findings:
- When the `agent_executions` insert returns `{data: null, error: {message: "db down"}}` (not a throw, just a Supabase error response), `ExecutionEngine.run` does NOT crash — `executionRowId` stays `null` (per `data?.id ?? null` at ExecutionEngine.ts:47), and execution proceeds to completion (`status:"completed"`, `success:true`) without attempting further writes keyed on a null row id improperly. This is graceful degradation, not a swallowed failure — the workflow itself still ran successfully.
- When `executeRegisteredAutomation` throws AND `revenueImpact` was set in the input, the catch block correctly returns `status:"failed"` and `AgentRevenueAttributionStore.recordAttribution` is **never called** (verified via a mocked spy that recorded zero invocations) — confirming no revenue is ever attributed for a failed execution, which matches the code read in EXECUTION_PATH_VALIDATION.md (the `recordAttribution` call sits inside the `try` block after the workflow call succeeds, not duplicated into `catch`).

After confirming results, the throwaway file `tests/agent-os/_scratch_failure_injection.test.ts` was **deleted** (per task instructions, since these scenarios are reasonably already adjacent to existing coverage in execution.test.ts and didn't need to become permanent — the existing `execution.test.ts` failure-path test was judged sufficient as the permanent regression test for this behavior class). Full suite re-run after deletion: 93/93 passing, confirming no residue/side effects from the scratch file.

## Verdict

**PASS.** `ExecutionEngine.run`'s catch block genuinely marks `status:"failed"`, records the error message, and does not crash or silently swallow failures — confirmed both by pre-existing tests and by new throwaway injection tests covering two additional edge cases (bookkeeping insert error, and no-attribution-on-failure).
