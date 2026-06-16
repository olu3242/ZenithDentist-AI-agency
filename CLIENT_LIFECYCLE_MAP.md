# Client Lifecycle Map

## Scope

Evidence map for taking one production dental practice from lead to renewal and expansion.

Primary evidence:

- `components/public/roi-funnel-form.tsx`
- `app/actions.ts`
- `lib/client-implementation-os.ts`
- `lib/implementation-intelligence.ts`
- `lib/access-control.ts`
- `lib/stripe/operations.ts`
- `docs/COMMERCIAL_AUTOMATION_AUDIT.md`

## Lifecycle Stages

| Stage | Owner | Inputs | Outputs | Automation | KPIs | Failure Points |
| --- | --- | --- | --- | --- | --- | --- |
| Lead | Sales | Website form, ROI funnel | Lead record, attribution event | ROI funnel, analytics events | Lead captured, source known | Static/demo copy can mislead if not separated from live data |
| Discovery Call | Sales | Practice pain, PMS, volume | Qualified opportunity | Discovery fields in ROI flow | Qualified/unqualified | Manual notes can be incomplete |
| ROI Assessment | Sales / Ops | Appointments, no-show, recall, treatment | Revenue opportunity | `submitFunnelAction`, ROI calculation | Opportunity value, practice health | Formula uses modeled estimates unless PMS data is connected |
| Audit Delivery | Sales | ROI result, audit record | Client-facing audit | Audit download route | Audit delivered | Delivery still depends on off-platform follow-up |
| Proposal | Sales | ROI, package, implementation need | Proposal/pricing | Offer builder | Proposal sent, value stated | Contract/e-signature not automated |
| Contract | Sales / Billing | Signed agreement | Access gates eligible | Commercial lockdown schema | Contract signed | Manual contract toggle remains |
| Implementation | Implementation Owner | Package, contacts, PMS, workflows | Project, tasks, onboarding items | `createImplementationProjectFromContract()` | Completion %, blockers | Requires admin/operator to create project |
| Integration Setup | Implementation Owner | PMS/API credentials, Stripe, comms | Connected integrations | Checklist templates and PMS pages | PMS sync tested, Stripe active | Dentrix/Eaglesoft/Denticon are not production-certified |
| Training | Customer Success | Role tracks | Training assignments | Training templates | Owner/manager/front desk trained | Staff training is a go-live blocker |
| Go Live | Ops / CS | Certified checklist | Live workflows | Go-live checklist, Mission Control | Readiness >= 75, no blockers | PMS, workflows, training gates can block |
| Optimization | CS / Ops | 30/60 day metrics | Optimization actions | Operating playbooks | ROI, adoption, workflow usage | Attribution must be reviewed for proof quality |
| Renewal | CS / Sales | Health, ROI, satisfaction | Renewal review | Customer success playbook | Health, renewal risk | Renewal workflow is defined but not fully automated |
| Expansion | Sales / CS | High health, revenue growth | Expansion quote/play | Expansion workflow | Expansion revenue | Expansion quote write paths are schema-level in some areas |

