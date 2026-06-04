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
assertContains("components/app/app-shell.tsx", "PortalShell", "AppShell must delegate to the governed PortalShell");
assertContains("components/app/portal-shell.tsx", "logoutAction", "PortalShell profile menu must use logout action");
assertContains("package.json", "next-intl", "next-intl integration must be installed");
assertContains("next.config.mjs", "createNextIntlPlugin", "Next config must register next-intl");
assertContains("app/layout.tsx", "NextIntlClientProvider", "Root layout must provide next-intl context");
assertContains("components/app/portal-shell.tsx", "LocaleSwitcher", "Portal shell must expose locale switching");
assertContains("app/login/page.tsx", "LocaleSwitcher", "Login must expose locale switching");
assertContains("lib/currency.ts", "formatMoney", "Currency abstraction must expose money formatting");
assertContains("lib/i18n/config.ts", "CAD", "Currency config must support CAD");
assertContains("lib/i18n/config.ts", "USD", "Currency config must support USD");
assertContains("lib/email.ts", "getLocalizedText", "Email templates must use localized text");
assertContains("lib/communication-hub/index.ts", "buildLocalizedSms", "SMS templates must use localization helper");
assertContains("lib/alice/operational-intelligence.ts", "generateLocalizedAliceBriefing", "ALICE localization entrypoint must exist");
assertContains("supabase/migrations/20260629000000_i18n_multi_currency_foundation.sql", "default_locale", "Organizations must have default locale");
assertContains("supabase/migrations/20260629000000_i18n_multi_currency_foundation.sql", "default_currency", "Organizations must have default currency");
assertContains("supabase/migrations/20260629000000_i18n_multi_currency_foundation.sql", "preferred_language", "Patients must have preferred language");

for (const locale of ["en-US", "es-US", "en-CA", "fr-CA"]) {
  const messagePath = path.join(root, "messages", `${locale}.json`);
  assert(fs.existsSync(messagePath), `Missing message catalog: ${locale}`);
  const messages = JSON.parse(fs.readFileSync(messagePath, "utf8"));
  for (const namespace of ["landing", "auth", "dashboard", "missionControl", "workflowOS", "patientRevenueEngine", "clientSuccessOS", "alice", "email", "sms"]) {
    assert(messages[namespace], `Message catalog ${locale} missing namespace ${namespace}`);
  }
}

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
for (const localePrefix of ["/en-US/:path*", "/es-US/:path*", "/en-CA/:path*", "/fr-CA/:path*"]) {
  assert(middleware.includes(localePrefix), `Middleware matcher missing locale prefix ${localePrefix}`);
}

assertContains("lib/supabase/server.ts", "sb_secret_", "Supabase server client must accept modern secret keys");
assertContains("lib/supabase/server.ts", "supabase_service_client_unavailable", "Supabase service client must log structured failures");
assertContains("lib/patient-revenue-engine.ts", "Patient Revenue Engine", "Patient Revenue Engine product definition must exist");
assertContains("lib/marketplace-core/extension-registry.ts", "PATIENT_REVENUE_ENGINE_PRODUCT.id", "Patient Revenue Engine marketplace product must exist");
assertContains("app/automation-marketplace/actions.ts", "installPatientRevenueEngineAction", "Patient Revenue Engine install action must exist");
assertContains("app/automation-marketplace/actions.ts", "deployPatientRevenueEngineAction", "Patient Revenue Engine deploy action must exist");

console.log("E2E production invariant check passed.");
