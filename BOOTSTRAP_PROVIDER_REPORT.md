# Bootstrap Provider Report

Generated: 2026-06-01

## Result

The root application provider stack is not the first confirmed blocker in the current local runtime.

Current `app/layout.tsx` provider order:

1. `DatabaseProvider`
2. `GlobalBrandProvider`
3. `GlobalThemeProvider`
4. `AnalyticsProvider`

Local dev smoke with the full provider stack enabled:

- `/login`: `200`
- `/signup`: `200`
- `/dashboard`: `307` redirect to `/login` for unauthenticated traffic

This confirms that `DatabaseProvider`, `GlobalBrandProvider`, `GlobalThemeProvider`, and `AnalyticsProvider` can bootstrap far enough for public auth pages to render.

## Provider Import Chain

### DatabaseProvider

- File: `components/providers/database-provider.tsx`
- Imports: `createBrowserClient()` from `lib/supabase/client.ts`
- Behavior: Creates a browser Supabase client when public URL and anon key are present.
- Runtime diagnostics observed:
  - `SUPABASE BROWSER URL LOADED true`
  - `SUPABASE BROWSER ANON KEY LOADED true`
- Status: `PASS`

### GlobalBrandProvider

- File: `providers/global-brand-provider.tsx`
- Imports:
  - `brandConfig` from `lib/brand.ts`
  - `themeConfig` from `lib/theme.ts`
- Behavior: Applies brand data attribute and theme CSS variables.
- Status: `PASS`

### GlobalThemeProvider

- File: `providers/global-theme-provider.tsx`
- Imports: `themeConfig` from `lib/theme.ts`
- Behavior: Applies global theme CSS variables and base background/text classes.
- Status: `PASS`

### AnalyticsProvider

- File: `components/providers/analytics-provider.tsx`
- Imports: `trackClientEvent()` from `lib/analytics.ts`
- Behavior: Registers scroll-depth tracking in a client effect.
- Status: `PASS`

## Error / Stack Trace

No provider stack trace was reproduced in the current local smoke test. The earlier `ChunkLoadError` was not reproduced after running the app with the full provider stack.

## First Confirmed Bootstrap Blocker

The first confirmed blocker is not a React provider. It is Supabase service-role credential validation:

- File: `.env.local`
- Line: `SUPABASE_SERVICE_ROLE_KEY=...`
- Evidence: JWT role claim decodes to `anon`, not `service_role`.

