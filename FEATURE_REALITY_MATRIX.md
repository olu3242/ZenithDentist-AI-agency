# Feature Reality Matrix

| Feature | UI | API | DB | Runtime | Analytics | ALICE | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Lead Funnel | Yes | Server action | Yes | Trace side effects | Yes | Indirect | VERIFIED |
| ROI Audit | Yes | Server action | Yes | Non-blocking trace | Yes | Indirect | VERIFIED |
| Onboarding | Yes | Server action | Yes | N/A | Logs | Indirect | VERIFIED |
| Marketplace | Yes | Server action | `automation_registry` | Execute path | Registry metrics | Yes | VERIFIED |
| Mission Control | Yes | API routes | Yes | Yes | Yes | Yes | PARTIAL |
| Workflow OS | Yes | Engine APIs | Yes via events | Yes | Yes | Yes | VERIFIED |
| Runtime OS | Yes | Runtime APIs | Yes | Yes | Yes | Yes | VERIFIED |
| Billing | Partial | Stripe ops | Billing tables | N/A | Partial | Indirect | PARTIAL |
| Support | Partial | None canonical | No canonical support table | N/A | No | No | STUB |
| Sales OS | Partial | Lead/admin actions | Leads/bookings/audits | Non-blocking trace | Yes | Indirect | PARTIAL |
| Dental Command Center | Yes | Mixed routes | Tenant/runtime tables | Yes | Yes | Yes | PARTIAL |

## Summary

Verified: 5  
Partial: 5  
Stub: 1  
Missing: 0
