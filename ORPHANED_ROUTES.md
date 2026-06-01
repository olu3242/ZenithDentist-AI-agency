# Orphaned Routes Audit

## Result

No major UI route remains intentionally orphaned after the navigation pass.

## Previously Disconnected Or Weakly Connected

| Route | Issue found | Resolution |
| --- | --- | --- |
| `/mission-control` | Standalone page had no global shell/sidebar | Wrapped in `AppShell` and exposed to Super Admin |
| `/dashboard` | Standalone page had no global shell/sidebar | Wrapped in `AppShell` and exposed to Staff, Agency Admin, Super Admin |
| `/workflow-os` | Required portal did not exist | Added route and Super Admin navigation |
| `/runtime-os` | Required portal did not exist | Added route and Super Admin navigation |
| `/settings` | Required global settings route did not exist | Added route and all-role navigation |
| `/lead-operations` | Protected page existed but was not in primary navigation | Added Operations navigation for Agency Admin and Super Admin |
| `/client-operations` | Protected page existed but was not in primary navigation | Added Operations navigation for Agency Admin and Super Admin |
| `/gtm-command-center` | Protected page existed but was not in primary navigation | Added Operations navigation for Agency Admin and Super Admin |
| `/internal/*` | Only the old internal sidebar exposed these pages | Moved all internal routes into the unified Operations navigation for Super Admin |
| `/admin/*` | Old admin sidebar was route-specific | Added Admin navigation group inside `AppShell` |

## API Routes

API routes are not considered orphaned UI routes. They are consumed by dashboards, mission-control panels, webhooks, report links, and automation surfaces.

## Known Redirects

- `/internal` redirects to `/internal/mission-control`.
- `/portal-select` redirects authenticated users to the role's default portal.
