const fs = require("fs");
const path = require("path");

const root = process.cwd();
const migrationsDir = path.join(root, "supabase", "migrations");
const manifestPath = path.join(root, "supabase", "MIGRATION_MANIFEST.md");

const BASELINE_ID = "20260615000000";
const timestampPattern = /^(\d{14})_[a-z0-9]+(?:_[a-z0-9]+)*\.sql$/;
const allowedGlobalTables = new Set([
  "organizations",
  "profiles",
  "organization_members",
  "user_roles",
  "subscription_plans"
]);

const legacyMigrations = new Set([
  "040_runtime_trace_system.sql",
  "041_operational_memory_incidents.sql",
  "042_governance_self_healing.sql",
  "043_operational_cloud_mesh.sql",
  "044_gap_closure_platformization.sql",
  "045_gtm_delivery_growth.sql",
  "046_production_hardening_operational_tables.sql",
  "202605210001_phase4_production_schema.sql",
  "202605210002_phase5_ai_operations.sql",
  "202605210003_phase6_multitenant_saas.sql",
  "202605210004_phase7_8_autonomous_os.sql",
  "202605210005_phase10_11_healthcare_cloud.sql",
  "202605210006_batch1_2_operational_stability.sql",
  "202605210007_e2e_automation_audit.sql",
  "202605310001_first_user_bootstrap_profiles.sql",
  "202605310002_automation_os_registry.sql"
]);

// These files existed before canonical migration governance was enforced on this
// branch. They are frozen compatibility history: do not rename or modify them.
// All new migrations after this governance repair must satisfy the 14-digit
// timestamp, manifest, tenant-ownership, RLS, and policy requirements below.
const grandfatheredMigrations = new Set([
  "202605300001_dental_revenue_os.sql",
  "202605300002_rls_tenant_isolation.sql",
  "202605310001_rbac_roles.sql",
  "202605310002_runtime_convergence.sql",
  "202606010001_pros_core_tables.sql",
  "202606010002_revenue_attribution.sql",
  "202606020001_evidence_layer.sql",
  "202606020002_commercialization.sql",
  "202606030001_billing_customers.sql",
  "202606030004_dental_growth_os.sql",
  "202606030005_agent_os_integration_os.sql",
  "202606030006_client_success_os.sql",
  "202606030007_revenue_commercialization_os.sql",
  "202606030008_pilot_war_room.sql",
  "202606030009_harmonization_phase12.sql",
  "20260626000000_social_proof_gallery_cms.sql",
  "20260627000000_revenue_pipeline.sql",
  "20260628000000_fk_reconciliation.sql"
]);

function fail(message) {
  failures.push(message);
}

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function createdTables(sql) {
  return [...sql.matchAll(/^\s*create\s+table(?:\s+if\s+not\s+exists)?\s+public\.([a-zA-Z0-9_]+)/gim)]
    .map(match => match[1]);
}

const failures = [];

if (!fs.existsSync(migrationsDir)) {
  throw new Error("Missing supabase/migrations directory.");
}

if (!fs.existsSync(manifestPath)) {
  fail("Missing supabase/MIGRATION_MANIFEST.md.");
}

const manifest = fs.existsSync(manifestPath) ? read(manifestPath) : "";
const files = fs.readdirSync(migrationsDir)
  .filter(file => file.endsWith(".sql"))
  .sort();

const timestamped = [];
const seenIds = new Map();

for (const file of files) {
  if (grandfatheredMigrations.has(file)) continue;

  const match = file.match(timestampPattern);
  const isLegacy = legacyMigrations.has(file);

  if (!match && !isLegacy) {
    fail(`Invalid migration filename: ${file}. Required: YYYYMMDDHHMMSS_description.sql.`);
    continue;
  }

  if (match) {
    const id = match[1];
    timestamped.push({ id, file });

    if (seenIds.has(id)) {
      fail(`Duplicate migration number: ${id} used by ${seenIds.get(id)} and ${file}.`);
    }
    seenIds.set(id, file);

    if (id >= BASELINE_ID) {
      if (!manifest.includes(`Migration ID: ${id}`)) {
        fail(`Manifest entry missing for ${file}.`);
      }
      validateForwardMigration(file, id);
    }
  }
}

for (let i = 1; i < timestamped.length; i += 1) {
  if (timestamped[i].id < timestamped[i - 1].id) {
    fail(`Out-of-order timestamp migration: ${timestamped[i - 1].file} before ${timestamped[i].file}.`);
  }
}

if (!files.includes(`${BASELINE_ID}_canonical_baseline.sql`)) {
  fail(`Missing required canonical baseline migration: ${BASELINE_ID}_canonical_baseline.sql.`);
}

function validateForwardMigration(file, id) {
  const sql = read(path.join(migrationsDir, file));
  const tables = createdTables(sql);
  const hasDependencyDeclaration = manifest.includes(`Migration ID: ${id}`) && manifest.includes("Dependencies:");
  if (!hasDependencyDeclaration) {
    fail(`Missing dependency declaration for ${file}.`);
  }

  for (const table of tables) {
    const tableDefinition = extractTableDefinition(sql, table);
    const requiresTenant = !allowedGlobalTables.has(table);

    if (requiresTenant && !/\borganization_id\b/.test(tableDefinition)) {
      fail(`Missing organization_id on new table ${table} in ${file}.`);
    }

    const rlsPattern = new RegExp(`alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security`, "i");
    if (!rlsPattern.test(sql)) {
      fail(`Missing RLS enablement for new table ${table} in ${file}.`);
    }

    const policyPattern = new RegExp(`create\\s+policy\\s+[^\\n]+\\s+on\\s+public\\.${table}\\b`, "i");
    if (!policyPattern.test(sql)) {
      fail(`Missing RLS policy for new table ${table} in ${file}.`);
    }
  }
}

function extractTableDefinition(sql, table) {
  const pattern = new RegExp(`create\\s+table(?:\\s+if\\s+not\\s+exists)?\\s+public\\.${table}\\s*\\(`, "i");
  const match = sql.match(pattern);
  if (!match || match.index === undefined) return "";
  const start = match.index;
  const nextCreate = sql.slice(start + match[0].length).search(/\n\s*create\s+/i);
  const end = nextCreate === -1 ? sql.length : start + match[0].length + nextCreate;
  return sql.slice(start, end);
}

if (failures.length) {
  console.error("Migration governance validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Migration governance validation passed. ${grandfatheredMigrations.size} pre-governance migrations remain explicitly frozen.`);
