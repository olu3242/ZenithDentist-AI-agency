const fs = require("fs");
const path = require("path");

const root = process.cwd();
const failures = [];
const passes = [];

function file(relativePath) {
  return path.join(root, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(file(relativePath), "utf8");
}

function check(condition, label) {
  if (condition) passes.push(label);
  else failures.push(label);
}

function contains(relativePath, text, label) {
  check(read(relativePath).includes(text), label);
}

const requiredFiles = [
  "app/onboarding/page.tsx",
  "app/onboarding/actions.ts",
  "components/onboarding/dental-practice-onboarding.tsx",
  "lib/onboarding/bootstrap.ts",
  "lib/onboarding/dental-practice.ts",
  "lib/onboarding/dental-sandbox.ts",
  "supabase/migrations/202609040001_dental_practice_onboarding_convergence.sql",
  "supabase/migrations/202609040002_dental_onboarding_sandbox.sql"
];

for (const relativePath of requiredFiles) {
  check(fs.existsSync(file(relativePath)), `required file exists: ${relativePath}`);
}

if (failures.length === 0) {
  const onboarding = read("lib/onboarding/dental-practice.ts");
  const sandbox = read("lib/onboarding/dental-sandbox.ts");
  const actions = read("app/onboarding/actions.ts");
  const ui = read("components/onboarding/dental-practice-onboarding.tsx");
  const convergenceMigration = read("supabase/migrations/202609040001_dental_practice_onboarding_convergence.sql");
  const sandboxMigration = read("supabase/migrations/202609040002_dental_onboarding_sandbox.sql");

  const orderedSteps = [
    "practice_created",
    "goals_captured",
    "systems_connected",
    "data_validated",
    "baseline_generated",
    "opportunities_identified",
    "governance_configured",
    "playbooks_selected",
    "simulation_passed",
    "readiness_certified",
    "activated",
    "value_measurement_active"
  ];

  let lastIndex = -1;
  for (const step of orderedSteps) {
    const index = onboarding.indexOf(`\"${step}\"`);
    check(index > lastIndex, `state machine includes ordered step: ${step}`);
    lastIndex = index;
  }

  contains("lib/onboarding/dental-practice.ts", "DENTAL_ONBOARDING_KEY = \"dental_practice_activation_v1\"", "canonical dental onboarding key exists");
  contains("lib/onboarding/dental-practice.ts", "integration_installations", "onboarding reuses Integration OS installation evidence");
  contains("lib/onboarding/dental-practice.ts", "integration_health", "onboarding reuses Integration OS health evidence");
  contains("lib/onboarding/dental-practice.ts", "revenue_recovery_events", "onboarding reuses revenue recovery evidence");
  contains("lib/onboarding/dental-practice.ts", "workflow_executions", "onboarding reuses automation runtime evidence");

  check(sandbox.includes("SYNTH-") && sandbox.includes('deliveryMode: \"suppressed\"'), "sandbox uses synthetic patients with suppressed delivery");
  check(sandbox.includes("liveDispatchCount: 0") && !sandbox.includes("sendSms(") && !sandbox.includes("sendEmail(") && !sandbox.includes("dispatchWorkflow("), "sandbox has no live communication dispatcher");
  check(sandbox.includes('createHash("sha256")'), "sandbox creates deterministic SHA-256 evidence");
  check(sandbox.includes("dental_onboarding_simulation_runs"), "sandbox persists evidence only to simulation evidence table");
  check(!sandbox.includes('.from("patients")') && !sandbox.includes('.from("appointments")'), "sandbox does not query live patient or appointment tables");

  check(onboarding.includes("hasValidSimulationEvidence") && onboarding.includes("liveDispatchCount === 0"), "readiness validates zero-dispatch sandbox evidence");
  check(onboarding.includes("simulationEvidence: undefined") && onboarding.includes("simulationPassed: false"), "governance/playbook changes invalidate prior simulation evidence");
  check(onboarding.includes("readinessScore < 100 || !hasValidSimulationEvidence"), "certification requires readiness 100 and valid sandbox evidence");
  check(onboarding.includes("!state.canActivate || !hasValidSimulationEvidence"), "activation rechecks sandbox evidence");

  check(actions.includes("markDentalSimulationPassed"), "server action executes deterministic sandbox certification path");
  check(ui.includes("Run deterministic sandbox"), "onboarding UI exposes deterministic sandbox action");
  check(ui.includes("Live dispatches") && ui.includes("Evidence"), "onboarding UI displays sandbox evidence");

  check(convergenceMigration.includes("uq_tenant_onboarding_runs_org_key"), "onboarding run is idempotent per organization and key");
  check(sandboxMigration.includes("check (live_dispatch_count = 0)"), "database enforces zero live dispatches in sandbox evidence");
  check(sandboxMigration.includes("enable row level security"), "sandbox evidence table has RLS enabled");
  check(sandboxMigration.includes("service_role_all_dental_onboarding_simulation_runs"), "sandbox evidence writes are service-role governed");

  check(!ui.includes("Record simulation review as passed"), "manual simulation-pass shortcut is removed");

  const packageJson = JSON.parse(read("package.json"));
  check(packageJson.scripts?.["test:onboarding"] === "node scripts/certify-dental-onboarding.js", "package exposes onboarding certification command");
  check(Boolean(packageJson.scripts?.["certify:onboarding"]), "package exposes aggregate onboarding certification gate");
  check(fs.existsSync(file(".github/workflows/dental-onboarding-certification.yml")), "pull-request certification workflow exists");
  if (fs.existsSync(file(".github/workflows/dental-onboarding-certification.yml"))) {
    const workflow = read(".github/workflows/dental-onboarding-certification.yml");
    check(workflow.includes("npm run migration:validate"), "CI validates migration governance");
    check(workflow.includes("npm run test:e2e"), "CI preserves existing E2E invariants");
    check(workflow.includes("npm run test:onboarding"), "CI executes dental onboarding certification");
    check(workflow.includes("npm run typecheck") && workflow.includes("npm run build"), "CI gates on typecheck and production build");
  }
}

console.log(`Dental onboarding certification invariants: ${passes.length} passed, ${failures.length} failed.`);
for (const label of passes) console.log(`PASS ${label}`);

if (failures.length) {
  for (const label of failures) console.error(`FAIL ${label}`);
  process.exit(1);
}

console.log("DENTAL_ONBOARDING_CERTIFICATION=PASS");
console.log("ZERO_LIVE_DISPATCH_INVARIANT=PASS");
console.log("DECISION=READY_FOR_RUNTIME_E2E");
