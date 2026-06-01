# Route Reality Report

## Route Status

| Route | Page | Layout | Navigation | Auth Guard | Role Routing | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | Yes | Root | Public header | Public | N/A | VERIFIED |
| `/login` | Yes | Root | Public/auth links | Public | N/A | VERIFIED |
| `/signup` | Yes | Root | Public/auth links | Public | N/A | VERIFIED |
| `/portal` | Yes | Portal/AppShell | AppShell + portal nav | Middleware | Practice owner/super admin | VERIFIED |
| `/dashboard` | Yes | AppShell | AppShell | Middleware | Staff/admin/super admin | VERIFIED |
| `/admin` | Yes | Admin/AppShell | AppShell + admin nav | Middleware | Agency admin/super admin | VERIFIED |
| `/internal` | Yes | Internal/AppShell | AppShell + internal nav | Middleware | Super admin | VERIFIED |
| `/mission-control` | Yes | AppShell | AppShell | Middleware | Super admin | VERIFIED |
| `/workflow-os` | Yes | AppShell | AppShell | Middleware | Super admin | VERIFIED |
| `/runtime-os` | Yes | AppShell | AppShell | Middleware | Super admin | VERIFIED |
| `/settings` | Yes | AppShell | AppShell | Middleware | All roles | VERIFIED |
| `/automation-marketplace` | Yes | AppShell | AppShell | Middleware | Practice owner/admin/super admin | VERIFIED |
| `/automation-center` | Yes | AppShell | AppShell | Middleware | All roles except unauthenticated | VERIFIED |
| `/portal-select` | Yes | Root | Manual cards | Public/role-aware redirect | Role default portal | VERIFIED |
| `/onboarding` | Yes | Root | Auth flow | Middleware | All authenticated roles | VERIFIED |

## Orphan Risk

No major platform route is missing a page. Some deep internal routes are reachable through internal nav only, which is expected.

## Score

Route Reality Score: 91/100
