# Onboarding Flow Report

Date: 2026-06-01

## Flow Traced

Signup -> Profile Creation -> Organization Creation -> Membership Creation -> Onboarding State -> Dashboard Redirect

## Code Paths

| Step | File | Status |
| --- | --- | --- |
| Email signup | `app/auth-actions.ts` -> `bootstrapUser()` | Wired |
| Google OAuth | `app/auth-actions.ts` -> `/auth/callback` | Wired |
| Password login | `loginBootstrapUser()` | Wired |
| Password reset | `forgotPasswordAction()` and `updatePasswordAction()` | Wired |
| Auth callback | `app/auth/callback/page.tsx` | Wired for Next.js 15 `searchParams` promise |
| Organization creation | `ensureOrganization()` | Fixed with migration and recovery hint |
| Profile creation | `profiles.upsert()` | Requires repair migration if table missing |
| Membership creation | `organization_members.insert/update()` | Requires repair migration if table missing |
| Onboarding run | `tenant_onboarding_runs.insert()` | Requires repair migration if table missing |
| Dashboard redirect | `completeOnboarding()` -> role portal | Wired |

## Failure Points Found

| Failure | Root cause | Fix |
| --- | --- | --- |
| `public.organizations` missing from schema cache | Remote schema drift or skipped core tenancy migration | Added repair migration |
| Generic organization-create error | Error did not tell operator how to recover schema cache | Added schema-cache recovery hint in `ensureOrganization()` |
| Dashboard data global | `/dashboard` used global admin lead data | Added tenant-scoped loader use |
| Runtime dead-letter leakage risk | Global dead-letter query then local filtering | Query now scopes by tenant trace IDs |
| Remote migration state unknown | Supabase project is not linked in this workspace | Deployment must run link/migration commands |

## Validation

After deployment:

```sql
select id, name, slug from public.organizations order by created_at desc limit 5;
select organization_id, user_id, role from public.organization_members order by invited_at desc limit 5;
select id, email, default_organization_id from public.profiles order by created_at desc limit 5;
select organization_id, onboarding_key, status, current_step from public.tenant_onboarding_runs order by updated_at desc limit 5;
```
