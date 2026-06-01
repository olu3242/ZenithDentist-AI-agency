# Portal Handoff Report

## Role Routing

| Role | Destination | Status |
| --- | --- | --- |
| `platform_owner` | `/mission-control` | Alias implemented |
| `super_admin` | `/mission-control` | Implemented |
| `agency_admin` | `/admin` | Implemented |
| `practice_owner` | `/portal` | Implemented |
| `staff` | `/dashboard` | Implemented |

## Loop Prevention

- Unauthorized protected access redirects to `/login`.
- Authenticated role mismatch redirects to that role's default portal.
- `/onboarding` is accessible to all authenticated roles.
