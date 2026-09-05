const requiredEnv = [
  "ZENITH_PREVIEW_URL",
  "ZENITH_EXPECTED_HEAD_SHA",
  "ZENITH_SUPABASE_URL",
  "ZENITH_SUPABASE_PUBLISHABLE_KEY",
  "ZENITH_SUPABASE_SERVICE_ROLE_KEY",
  "ZENITH_CERT_USER_A_JWT",
  "ZENITH_CERT_USER_B_JWT",
  "ZENITH_CERT_ORG_A_ID",
  "ZENITH_CERT_ORG_B_ID",
];

const missing = requiredEnv.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`RUNTIME_CERTIFICATION_CONFIG=MISSING:${missing.join(",")}`);
  process.exit(2);
}

const previewUrl = process.env.ZENITH_PREVIEW_URL.replace(/\/$/, "");
const expectedHeadSha = process.env.ZENITH_EXPECTED_HEAD_SHA;
const supabaseUrl = process.env.ZENITH_SUPABASE_URL.replace(/\/$/, "");
const publishableKey = process.env.ZENITH_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.ZENITH_SUPABASE_SERVICE_ROLE_KEY;
const orgA = process.env.ZENITH_CERT_ORG_A_ID;
const orgB = process.env.ZENITH_CERT_ORG_B_ID;
const userAJwt = process.env.ZENITH_CERT_USER_A_JWT;
const userBJwt = process.env.ZENITH_CERT_USER_B_JWT;
const failures = [];
const passes = [];

function check(condition, label, detail) {
  if (condition) passes.push(label);
  else failures.push(detail ? `${label}: ${detail}` : label);
}

async function jsonFetch(url, options = {}) {
  const response = await fetch(url, { redirect: "follow", ...options });
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { response, body, text };
}

function restHeaders(apikey, bearer = apikey) {
  return {
    apikey,
    Authorization: `Bearer ${bearer}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

async function supabaseSelect(table, query, apikey, bearer) {
  return jsonFetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
    headers: restHeaders(apikey, bearer),
  });
}

async function certifyPreview() {
  const meta = await jsonFetch(`${previewUrl}/api/runtime-certification`, {
    headers: { Accept: "application/json" },
  });
  check(meta.response.ok, "preview certification endpoint reachable", `HTTP ${meta.response.status}`);
  if (!meta.response.ok) return;

  check(meta.body?.certificationContract === "runtime-e2e-v1", "preview exposes runtime-e2e-v1 contract");
  check(meta.body?.gitSha === expectedHeadSha, "preview is exact expected PR head", `expected ${expectedHeadSha}, got ${meta.body?.gitSha}`);
  check(meta.body?.capabilities?.zeroLiveDispatchRequired === true, "preview requires zero-live-dispatch safety");
  check(meta.body?.capabilities?.humanGovernanceRequired === true, "preview requires human governance");

  for (const route of ["/", "/onboarding", "/workflow-os", "/workflow-os/flows"]) {
    const result = await fetch(`${previewUrl}${route}`, { redirect: "manual" });
    check(result.status < 500, `preview route does not server-error: ${route}`, `HTTP ${result.status}`);
  }
}

async function certifyDatabaseShapeAndSafety() {
  for (const table of ["tenant_onboarding_runs", "dental_onboarding_simulation_runs", "flow_runs", "flow_step_runs", "flow_waits", "flow_events", "flow_operator_actions"]) {
    const result = await supabaseSelect(table, "select=id&limit=1", serviceKey);
    check(result.response.ok, `runtime table reachable with server credential: ${table}`, result.text.slice(0, 200));
  }

  const simulations = await supabaseSelect(
    "dental_onboarding_simulation_runs",
    "select=id,organization_id,live_dispatch_count,evidence_hash,created_at&order=created_at.desc&limit=100",
    serviceKey,
  );
  if (simulations.response.ok && Array.isArray(simulations.body)) {
    const unsafe = simulations.body.filter((row) => Number(row.live_dispatch_count) !== 0);
    check(unsafe.length === 0, "live sandbox evidence preserves live_dispatch_count === 0", `${unsafe.length} unsafe rows`);
  }
}

async function certifyTenantIsolation() {
  // These calls deliberately use the publishable gateway key + each real certification user's JWT.
  // RLS must be evaluated from Authorization; service-role credentials are never used for tenant-isolation assertions.
  const aOwn = await supabaseSelect("flow_runs", `select=id,organization_id&organization_id=eq.${encodeURIComponent(orgA)}&limit=5`, publishableKey, userAJwt);
  const aOther = await supabaseSelect("flow_runs", `select=id,organization_id&organization_id=eq.${encodeURIComponent(orgB)}&limit=5`, publishableKey, userAJwt);
  const bOwn = await supabaseSelect("flow_runs", `select=id,organization_id&organization_id=eq.${encodeURIComponent(orgB)}&limit=5`, publishableKey, userBJwt);
  const bOther = await supabaseSelect("flow_runs", `select=id,organization_id&organization_id=eq.${encodeURIComponent(orgA)}&limit=5`, publishableKey, userBJwt);

  for (const [name, result] of [["A own", aOwn], ["A cross-tenant", aOther], ["B own", bOwn], ["B cross-tenant", bOther]]) {
    check(result.response.ok, `tenant isolation query executes: ${name}`, result.text.slice(0, 200));
  }

  if ([aOther, bOther].every((result) => result.response.ok && Array.isArray(result.body))) {
    check(aOther.body.length === 0, "tenant isolation blocks user A from organization B", `returned ${aOther.body.length} rows`);
    check(bOther.body.length === 0, "tenant isolation blocks user B from organization A", `returned ${bOther.body.length} rows`);
  }

  if (aOwn.response.ok && Array.isArray(aOwn.body)) {
    check(aOwn.body.every((row) => row.organization_id === orgA), "tenant A read model contains only organization A rows");
  }
  if (bOwn.response.ok && Array.isArray(bOwn.body)) {
    check(bOwn.body.every((row) => row.organization_id === orgB), "tenant B read model contains only organization B rows");
  }
}

async function certifyRuntimeEvidence() {
  const flowRows = await supabaseSelect(
    "flow_runs",
    `select=id,organization_id,flow_key,status,current_step_key,correlation_id,created_at&organization_id=in.(${encodeURIComponent(orgA)},${encodeURIComponent(orgB)})&order=created_at.desc&limit=50`,
    serviceKey,
  );
  if (!flowRows.response.ok || !Array.isArray(flowRows.body)) {
    failures.push(`runtime flow evidence readable: ${flowRows.text.slice(0, 200)}`);
    return;
  }

  const certFlows = flowRows.body.filter((row) => row.flow_key === "dental_practice_activation_v1");
  check(certFlows.length > 0, "runtime contains dental_practice_activation_v1 certification flow evidence");
  check(certFlows.every((row) => row.correlation_id), "certification flows preserve correlation IDs");

  const events = await supabaseSelect(
    "flow_events",
    `select=id,organization_id,flow_run_id,event_type,idempotency_key,created_at&organization_id=in.(${encodeURIComponent(orgA)},${encodeURIComponent(orgB)})&order=created_at.desc&limit=100`,
    serviceKey,
  );
  check(events.response.ok, "Flow OS event evidence is queryable", events.text.slice(0, 200));
}

(async () => {
  try {
    await certifyPreview();
    await certifyDatabaseShapeAndSafety();
    await certifyTenantIsolation();
    await certifyRuntimeEvidence();
  } catch (error) {
    failures.push(`unhandled runtime certification error: ${error instanceof Error ? error.stack || error.message : String(error)}`);
  }

  console.log(`Live runtime certification: ${passes.length} passed, ${failures.length} failed.`);
  for (const p of passes) console.log(`PASS ${p}`);
  if (failures.length) {
    for (const f of failures) console.error(`FAIL ${f}`);
    console.error("RUNTIME_E2E_CERTIFICATION=FAIL");
    console.error("DECISION=MERGE_BLOCKED");
    process.exit(1);
  }

  console.log("RUNTIME_E2E_CERTIFICATION=PASS");
  console.log("ZERO_LIVE_DISPATCH_RUNTIME=PASS");
  console.log("TENANT_ISOLATION_RUNTIME=PASS");
  console.log("DECISION=READY_TO_MERGE");
})();
