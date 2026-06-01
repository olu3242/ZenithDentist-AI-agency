# Environment Audit

## Variables Checked

| Variable | Status | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Present | Points to Supabase host `yjbxhlfiwqhhuvgpcrey.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Present | JWT-shaped value detected |
| `SUPABASE_SECRET_KEY` | Present | Used as server/service key fallback |
| `SUPABASE_SERVICE_ROLE_KEY` | Missing | App falls back to `SUPABASE_SECRET_KEY` |
| `RESEND_API_KEY` | Present | Email is now non-blocking |
| `OPENAI_API_KEY` | Present | AI provider optional for lead capture |
| `ANTHROPIC_API_KEY` | Present | AI provider optional for lead capture |
| Runtime OS URLs | Not configured | Runtime OS is in-process/Supabase-backed |
| Workflow OS URLs | Not configured | Workflow OS is in-process/Supabase-backed |
| Event Fabric URLs | Not configured | Event Fabric is in-process/Supabase-backed |

## Connectivity Result

Supabase REST probe:

- URL: `https://yjbxhlfiwqhhuvgpcrey.supabase.co/rest/v1/`
- Result: connection refused from the current environment.
- Impact: any direct database insert through Supabase REST can fail with `TypeError: fetch failed`.

## RCA

The runtime errors are not caused by route rendering, AppShell, or Next build artifacts. The failing external dependency is Supabase REST connectivity from the server runtime.
