# Smart Video Journey Engine

Zenith now models patient video journeys as Automation Platform-owned state machines: PMS event -> ALICE classification -> video selection -> delivery callback -> behavioral signal -> next best action -> outcome -> evidence -> attribution.

Implemented foundation:

- Tenant-scoped migration: `20260619000000_smart_video_journey_engine.sql`
- Portal surface: `/portal/video`
- Workflow blueprints for new patient, cleaning, treatment acceptance, membership, review, referral, check-in, and financing journeys
- Live-state reader: `lib/video-intelligence.ts`
- Executive Dashboard KPIs for sent, viewed, completion, attention, readiness, reviews, referrals, and revenue influence

n8n remains the delivery execution layer for SMS, email, WhatsApp, video delivery, external integrations, and webhook callbacks.
