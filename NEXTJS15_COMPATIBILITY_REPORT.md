# Next.js 15 Compatibility Report

Date: 2026-06-01

## Route Handler Audit

Audited all `app/api/**/route.ts` files.

## Dynamic Route Status

| Route | Params shape | Status |
| --- | --- | --- |
| `app/api/reports/[id]/route.ts` | `params: Promise<{ id: string }>` with `await params` | Compatible |

No remaining API route handlers were found using `{ params }: { params: { id: string } }`.

## Related Build Fix

Next.js build previously failed because `app/admin/page.tsx` exported a helper component. App Router pages may only export allowed page fields. The shared admin header was moved to:

- `components/admin/admin-header.tsx`

Admin pages now import `AdminHeader` from that component instead of importing from another page.
