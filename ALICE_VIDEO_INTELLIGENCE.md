# Video Revenue Intelligence

ALICE supports both Video Engagement OS optimization and the Smart Video Journey / Patient Influence model.

## Optimization Targets

- Best send time
- Best channel
- Best journey
- Best conversion path
- Best performing video
- Best patient segment
- Best CTA
- Best follow-up
- Best conversion strategy

## Inputs

- Appointment type
- Treatment type
- Patient history
- Engagement history
- Attention score
- Relationship health score
- Retention risk
- Membership eligibility
- Revenue attribution history

## Outputs

- Video recommendation
- Journey recommendation
- Next best action
- Expected outcome
- Expected revenue impact
- Confidence score
- Workflow launch recommendation

## Runtime Surfaces

- `lib/video-engagement-os.ts` exposes Video Engagement OS scoring and relationship-health recommendations.
- `lib/video-intelligence.ts` exposes Smart Video Journey, Patient Influence, treatment readiness, membership readiness, and revenue-protected intelligence.
- `/portal/video` surfaces ALICE video recommendations with problem, impact, action, workflow ID, confidence, and revenue context.
