# Video Delivery Audit

Delivery ownership:

- Automation Platform owns state, orchestration, evidence, attribution, retries, and self-healing.
- n8n owns SMS, email, WhatsApp, provider integrations, outbound delivery, and callbacks.

Implemented delivery records:

- `video_deliveries`
- `video_engagement_events`
- `patient_video_events`

Event Fabric:

- `video.generated`
- `video.sent`
- `video.opened`
- `video.viewed`
- `video.completed`
- `video.cta_clicked`
- `video.confirmed`
- `video.review_generated`
- `video.referral_generated`
- `video.no_show_recovered`

Certification status: PARTIAL until live n8n callbacks write delivery and engagement records.
