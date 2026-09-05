const fs = require("fs");
const path = require("path");

const root = process.cwd();
const failures = [];
const passes = [];

function read(p) { return fs.readFileSync(path.join(root, p), "utf8"); }
function exists(p) { return fs.existsSync(path.join(root, p)); }
function check(condition, label) { (condition ? passes : failures).push(label); }

const required = [
  "app/api/runtime-certification/route.ts",
  "lib/onboarding/dental-practice.ts",
  "lib/onboarding/dental-sandbox.ts",
  "lib/flow-orchestration/engine.ts",
  "lib/flow-orchestration/intelligence.ts",
  "lib/workflow-os/workflow-engine.ts",
  "supabase/migrations/20260904000200_dental_onboarding_sandbox.sql",
  "supabase/migrations/20260904000300_flow_orchestration_os.sql",
  "supabase/migrations/20260904000400_flow_operator_actions.sql",
  "scripts/certify-runtime-e2e.js",
  ".github/workflows/runtime-e2e-certification.yml",
];

for (const p of required) check(exists(p), `required runtime-certification artifact exists: ${p}`);

if (!failures.length) {
  const endpoint = read("app/api/runtime-certification/route.ts");
  const sandbox = read("lib/onboarding/dental-sandbox.ts");
  const intelligence = read("lib/flow-orchestration/intelligence.ts");
  const live = read("scripts/certify-runtime-e2e.js");
  const workflow = read(".github/workflows/runtime-e2e-certification.yml");

  check(endpoint.includes("VERCEL_GIT_COMMIT_SHA") && endpoint.includes("runtime-e2e-v1"), "runtime metadata exposes exact deployed SHA contract");
  check(!endpoint.includes("SERVICE_ROLE") && !endpoint.includes("SUPABASE_SERVICE") && !endpoint.includes("patient"), "runtime metadata does not expose secrets or patient data");
  check(sandbox.includes("liveDispatchCount: 0") && sandbox.includes('deliveryMode: "suppressed"'), "sandbox contract enforces suppressed synthetic delivery");
  check(!sandbox.includes("sendSms(") && !sandbox.includes("sendEmail("), "sandbox has no live communication send path");
  check(intelligence.includes("requiresHumanApproval") && !intelligence.includes("executeWorkflow("), "Flow Intelligence remains recommendation-only");

  for (const envName of [
    "ZENITH_PREVIEW_URL",
    "ZENITH_EXPECTED_HEAD_SHA",
    "ZENITH_SUPABASE_URL",
    "ZENITH_SUPABASE_SERVICE_ROLE_KEY",
    "ZENITH_CERT_USER_A_JWT",
    "ZENITH_CERT_USER_B_JWT",
    "ZENITH_CERT_ORG_A_ID",
    "ZENITH_CERT_ORG_B_ID",
  ]) {
    check(live.includes(envName), `live certification requires explicit ${envName}`);
  }

  check(live.includes("live_dispatch_count") && live.includes("=== 0"), "live certification verifies zero live dispatch evidence");
  check(live.includes("tenant isolation") && live.includes("organization_id"), "live certification includes tenant-isolation checks");
  check(live.includes("gitSha") && live.includes("expectedHeadSha"), "live certification rejects stale preview heads");
  check(workflow.includes("environment: preview-certification"), "live workflow uses protected preview-certification environment");
  check(workflow.includes("npm run certify:runtime:live"), "live workflow executes runtime certification command");
  check(workflow.includes("ZENITH_SUPABASE_SERVICE_ROLE_KEY"), "live workflow obtains service credential only from GitHub secret");
}

console.log(`Runtime certification contract: ${passes.length} passed, ${failures.length} failed.`);
for (const p of passes) console.log(`PASS ${p}`);
if (failures.length) {
  for (const f of failures) console.error(`FAIL ${f}`);
  process.exit(1);
}
console.log("RUNTIME_CERTIFICATION_CONTRACT=PASS");
console.log("DECISION=READY_FOR_LIVE_RUNTIME_E2E");
