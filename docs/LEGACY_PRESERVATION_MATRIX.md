# Legacy Preservation Matrix

Date: 2026-06-01

| Legacy Asset | Category | Current Status | Evidence |
| --- | --- | --- | --- |
| Original PRD | Preserved | Still valid as origin document | `zenith-ai-prd.html` |
| Original Dashboard | Expanded | Current portal dashboard and Mission Control exceed legacy scope | `app/portal/dashboard/page.tsx`, `app/mission-control/page.tsx` |
| Original Landing Page | Partial | Revenue promise preserved; PROS/ALICE/Mission Control under-communicated | `app/page.tsx` |
| Original Revenue Engine | Expanded | Current PRE plus PROS and playbooks | `lib/patient-revenue-engine.ts`, `lib/revenue-playbooks/index.ts` |
| Original ROI Calculator | Preserved | ROI logic remains in platform | `lib/roi.ts`, `lib/pilot-operations.ts` |
| Original ICP | Preserved | Dental practice owner/office manager/DSO preserved | `zenith-ai-prd.html` |
| Original Offer Framework | Expanded | Commercial tiers, lifecycle, managed services added | `lib/commercial-operations.ts` |
| Original PMS Integration Vision | Partial | PMS adapter framework exists; true portal missing | `lib/pms.ts`, `/portal/integrations` |
| Legacy practice tenant model | Replaced | `organizations`, `organization_members`, `locations` supersede `practices` | migrations and tenant code |
| Legacy simple automation engine | Expanded | Workflow OS, Runtime OS, Event Fabric, Mission Control added | `lib/workflow-os`, `lib/runtime` |

## Summary

The legacy system has mostly been preserved or expanded. The main missing preservation item is full PMS portal execution and patient-domain operational schema parity.
