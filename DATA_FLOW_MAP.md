# Data Flow Map

| Surface | Data Source | Backend |
| --- | --- | --- |
| Landing | ROI form state and lead action | `submitFunnelAction`, `lib/data/leads.ts`, Supabase lead/audit tables |
| Signup/Login | Supabase Auth and profiles | `app/auth-actions.ts`, `lib/onboarding/bootstrap.ts` |
| Onboarding | Cookies + Supabase profile/org/member state | `/onboarding`, `tenant_onboarding_runs` |
| Dashboard | Tenant/lead operations data | `lib/data/*`, AppShell role context |
| Portal | Tenant, reports, recommendations, runtime summaries | `lib/data/tenants.ts`, portal components |
| Admin | Leads, ROI, audits, bookings | `getAdminDashboardData` |
| Mission Control | Runtime/AI/tenant health | `lib/mission-control`, `lib/stability`, runtime APIs |
| Workflow OS | Workflow registry and analytics | `lib/workflow-os/*` |
| Runtime OS | Trace, event fabric, recovery state | `lib/runtime/*` |
| ALICE | Insights and orchestration APIs | `app/api/alice/*`, `lib/alice.ts` |
