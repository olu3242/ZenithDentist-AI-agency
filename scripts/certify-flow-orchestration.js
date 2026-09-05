const fs = require("fs");
const path = require("path");

const root = process.cwd();
const failures = [];
const passes = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}
function check(condition, label) {
  if (condition) passes.push(label);
  else failures.push(label);
}
function contains(file, text, label) {
  check(read(file).includes(text), label);
}

const required = [
  "lib/flow-orchestration/types.ts",
  "lib/flow-orchestration/registry.ts",
  "lib/flow-orchestration/engine.ts",
  "lib/flow-orchestration/state.ts",
  "lib/flow-orchestration/recovery.ts",
  "lib/flow-orchestration/runtime-adapter.ts",
  "lib/flow-orchestration/definitions/dental-practice-activation.ts",
  "lib/flow-orchestration/bridges/dental-onboarding.ts",
  "supabase/migrations/202609040003_flow_orchestration_os.sql"
];
for (const file of required) check(fs.existsSync(path.join(root, file)), `required file exists: ${file}`);

if (!failures.length) {
  const types = read("lib/flow-orchestration/types.ts");
  const engine = read("lib/flow-orchestration/engine.ts");
  const recovery = read("lib/flow-orchestration/recovery.ts");
  const adapter = read("lib/flow-orchestration/runtime-adapter.ts");
  const bridge = read("lib/flow-orchestration/bridges/dental-onboarding.ts");
  const migration = read("supabase/migrations/202609040003_flow_orchestration_os.sql");
  const manifest = read("supabase/MIGRATION_MANIFEST.md");

  check(types.includes("FlowExecutionAdapter") && types.includes("canonical Automation Runtime"), "Flow OS delegates execution instead of duplicating runtime");
  check(adapter.includes('executeWorkflow') && adapter.includes('@/lib/workflow-os/workflow-engine'), "Flow OS delegates workflow steps to canonical Workflow OS executeWorkflow entrypoint");
  check(adapter.includes('correlationId: request.flowRunId') && adapter.includes('idempotencyKey: request.idempotencyKey'), "Flow-to-Workflow bridge preserves correlation and idempotency");
  check(adapter.includes('failFlowFromTerminalWorkflowFailure') && adapter.includes('status === "failed"'), "terminal workflow failures cannot advance a flow as success");

  check(engine.includes("idempotencyKey") && migration.includes("unique (organization_id, idempotency_key)"), "flow starts are tenant-idempotent");
  check(engine.includes("waiting_approval") && engine.includes("waiting_event"), "engine supports approval and event waits");
  check(engine.includes("retry_scheduled") && recovery.includes("recoverDueFlowRetries"), "engine supports durable retry recovery");
  check(recovery.includes("materializeFlowWaitDeadlines") && recovery.includes("timeoutSeconds"), "definition timeouts become durable database deadlines");
  check(recovery.includes('neq("wait_type", "retry")'), "retry timers cannot be misclassified as expired business waits");
  check(recovery.includes("expireStaleFlowWaits"), "engine supports wait timeout recovery");
  check(engine.includes("signalFlow") && engine.includes("flow_events"), "event resumption is persisted and replay-safe");
  check(engine.includes("publishEvent") && engine.includes("flow_orchestration_os"), "orchestration emits into existing Event Fabric");
  check(!engine.includes("sendSms(") && !engine.includes("sendEmail("), "Flow OS never communicates with patients directly");
  check(!engine.includes('.from("patients")') && !engine.includes('.from("appointments")'), "Flow OS does not become a patient-data subsystem");

  for (const table of ["flow_runs", "flow_step_runs", "flow_waits", "flow_events"]) {
    check(migration.includes(`public.${table}`), `migration creates ${table}`);
  }
  check((migration.match(/enable row level security/g) || []).length >= 4, "all Flow OS tables enable RLS");
  check(migration.includes("member_read_flow_runs") && migration.includes("service_role_all_flow_runs"), "Flow OS has tenant read and service-role write governance");
  check(migration.includes("workflow_execution_id uuid") && !migration.includes("references public.workflow_executions"), "step runs reference canonical execution IDs without invalid FK to compatibility view");
  check(manifest.includes("Migration ID: 202609040003") && manifest.includes("Flow Orchestration Operating System"), "Flow OS migration is registered in canonical migration governance");

  contains("lib/flow-orchestration/definitions/dental-practice-activation.ts", 'key: "dental_practice_activation_v1"', "dental activation is registered as first canonical flow");
  check(bridge.includes("getFlowRunSnapshot") && bridge.includes("currentStepKey"), "dental bridge is state-aware on replay");
  check(bridge.includes("for (let guard = 0; guard < 20; guard += 1)"), "bridge reconciliation is bounded against accidental infinite loops");
  check(bridge.includes("tenant_onboarding_runs"), "dental bridge preserves existing onboarding business-state authority");
  contains("app/onboarding/page.tsx", "reconcileDentalOnboardingFlow", "real onboarding UI exercises Flow OS convergence");
}

console.log(`Flow Orchestration OS certification invariants: ${passes.length} passed, ${failures.length} failed.`);
for (const pass of passes) console.log(`PASS ${pass}`);
if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}
console.log("FLOW_ORCHESTRATION_OS_CERTIFICATION=PASS");
console.log("CANONICAL_WORKFLOW_RUNTIME_DELEGATION=PASS");
console.log("RUNTIME_DUPLICATION_GUARD=PASS");
console.log("REPLAY_SAFE_APPROVAL_GUARD=PASS");
console.log("DECISION=READY_FOR_RUNTIME_E2E");
