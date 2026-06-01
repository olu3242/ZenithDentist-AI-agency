const fs = require("fs");
const path = require("path");

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertContains(file, expected, message) {
  const content = read(file);
  assert(content.includes(expected), `${message} (${file})`);
}

const requiredRoutes = [
  "app/login/page.tsx",
  "app/signup/page.tsx",
  "app/forgot-password/page.tsx",
  "app/auth/callback/page.tsx",
  "app/auth/reset-password/page.tsx",
  "app/auth/verify/page.tsx",
  "app/portal-select/page.tsx",
  "middleware.ts"
];

for (const route of requiredRoutes) {
  assert(fs.existsSync(path.join(root, route)), `Missing required route file: ${route}`);
}

assertContains("app/auth-actions.ts", "googleLoginAction", "Google OAuth action must exist");
assertContains("app/auth-actions.ts", "signInWithOAuth", "Google OAuth must use Supabase OAuth");
assertContains("app/auth-actions.ts", "logoutAction", "Logout action must exist");
assertContains("app/auth-actions.ts", "updatePasswordAction", "Password update action must exist");
assertContains("app/auth/callback/page.tsx", "exchangeCodeForSession", "Auth callback must exchange Supabase code");
assertContains("app/auth/callback/page.tsx", "resolveAuthenticatedBootstrapUser", "Auth callback must resolve Zenith profile");
assertContains("app/auth/reset-password/page.tsx", "updatePasswordAction", "Reset password page must submit update action");
assertContains("components/app/app-shell.tsx", "logoutAction", "AppShell profile menu must use logout action");

const middleware = read("middleware.ts");
for (const prefix of [
  "/api/alice/:path*",
  "/api/autonomous/:path*",
  "/api/enterprise/:path*",
  "/api/gtm-command-center/:path*",
  "/api/mission-control/:path*",
  "/api/opendental/:path*",
  "/api/reports/:path*"
]) {
  assert(middleware.includes(prefix), `Middleware matcher missing ${prefix}`);
}

assertContains("lib/supabase/server.ts", "sb_secret_", "Supabase server client must accept modern secret keys");
assertContains("lib/supabase/server.ts", "supabase_service_client_unavailable", "Supabase service client must log structured failures");
assertContains("lib/patient-revenue-engine.ts", "Patient Revenue Engine", "Patient Revenue Engine product definition must exist");
assertContains("lib/marketplace-core/extension-registry.ts", "PATIENT_REVENUE_ENGINE_PRODUCT.id", "Patient Revenue Engine marketplace product must exist");
assertContains("app/automation-marketplace/actions.ts", "installPatientRevenueEngineAction", "Patient Revenue Engine install action must exist");
assertContains("app/automation-marketplace/actions.ts", "deployPatientRevenueEngineAction", "Patient Revenue Engine deploy action must exist");

console.log("E2E production invariant check passed.");
