# CTA Audit Report

Date: 2026-06-01

## Rule Enforced

Landing Page -> Free Assessment -> ROI Results -> Report -> Strategy Session -> Onboarding

No assessment CTA should route directly to Calendly.

## CTA Inventory

| CTA text | File | Previous destination | Corrected destination | Conversion stage | Status |
| --- | --- | --- | --- | --- | --- |
| Get My Free Revenue Assessment | `components/public/pros-landing.tsx` header | `calendlyUrl` | `#roi` | Landing -> Free Assessment | Fixed |
| Get My Free Revenue Assessment | `components/public/pros-landing.tsx` hero | `calendlyUrl` | `#roi` | Landing -> Free Assessment | Fixed |
| Start Onboarding | `components/public/pros-landing.tsx` hero secondary | `/signup` | `#gallery` as Watch Demo | Landing -> Demo | Fixed |
| Get My Free Revenue Assessment | `components/public/pros-landing.tsx` footer | `calendlyUrl` | `#roi` | Landing -> Free Assessment | Fixed |
| Start Onboarding | `components/public/pros-landing.tsx` footer secondary | `/signup` | `#gallery` as Watch Demo | Landing -> Demo | Fixed |
| Get My Free Revenue Assessment | `components/public/roi-funnel-form.tsx` submit | Assessment submit | Get My Free Assessment submit | Assessment -> Report generation | Fixed |
| Book Recovery Audit | `components/public/booking-flow.tsx` | `calendlyUrl` | Schedule Strategy Session via `calendlyUrl` | Post-report strategy session | Fixed |
| Download Report | `components/public/audit-preview.tsx` | Missing | `/api/reports/{auditId}` | Assessment Results -> Report | Added |

## Calendly Placement

Allowed only after `leadId` and `reportId` exist in `components/public/audit-preview.tsx`.

Current permitted Calendly uses:

- `components/public/booking-flow.tsx`
- `app/api/calendly/events/route.ts`
- `app/admin/bookings/page.tsx`
- `lib/data/leads.ts`
- `lib/env.ts`

## Validation Search

Remaining public assessment CTAs point to `#roi`. The only public `href={calendlyUrl}` is the gated post-report `Schedule Strategy Session` link.
