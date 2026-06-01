# Portal Connectivity Report

## Summary

All requested Zenith modules now have UI paths and role-aware navigation entries.

| Portal | Status | Navigation owner |
| --- | --- | --- |
| `/dashboard` | Connected | Staff, Agency Admin, Super Admin |
| `/portal` | Connected | Practice Owner, Super Admin |
| `/admin` | Connected | Agency Admin, Super Admin |
| `/mission-control` | Connected | Super Admin |
| `/workflow-os` | Connected | Super Admin |
| `/runtime-os` | Connected | Super Admin |
| `/internal` | Connected, redirects to `/internal/mission-control` | Super Admin |
| `/settings` | Connected | All authenticated roles |

## Implementation Notes

- `AppShell` is used by `/portal`, `/admin`, `/internal`, `/dashboard`, `/mission-control`, `/workflow-os`, `/runtime-os`, and `/settings`.
- `lib/navigation.ts` centralizes menu visibility.
- `lib/auth-routing.ts` centralizes role normalization, default portal selection, protected route prefixes, and role/path authorization.
- `middleware.ts` now covers `/workflow-os`, `/runtime-os`, `/settings`, and `/portal-select`.

## Connectivity Checks

- Public landing CTAs route users toward `/portal-select` or in-page audit sections.
- Admin subroutes are reachable from the Admin group.
- Portal subroutes are reachable from the Portal group.
- Internal routes are reachable from the Operations group for Super Admin.
- Standalone operations routes are reachable from the Operations group for Agency Admin and Super Admin.
