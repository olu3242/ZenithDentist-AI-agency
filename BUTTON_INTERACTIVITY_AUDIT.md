# Button Interactivity Audit

## Search Scope

Searched `onClick`, `Button`, `router.push`, `router.replace`, `Link`, `formAction`, server actions, and submit handlers across `app`, `components`, `lib`, and `middleware.ts`.

## Fixes

- Signup, login, and forgot-password submit buttons now use `SubmitButton` with pending spinner, disabled state, and clear pending text.
- Added `/onboarding` completion button with pending spinner and disabled state.
- Fixed dead `Queue for Review` button in `components/autonomous/operational-simulator.tsx`; it now queues locally, shows success feedback, and disables after completion.

## Verified Interactive Surfaces

- Landing CTAs route to ROI or signup.
- ROI funnel submits through `submitFunnelAction`.
- Booking CTA logs click and opens Calendly.
- FAQ buttons open panels and log analytics.
- Portal selection cards link to protected portals.
- AppShell/sidebar navigation uses real routes.

## Remaining Risks

- Some advanced operations screens still use local/in-memory UI actions until backend workflow mutation APIs are expanded.
