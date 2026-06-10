-- Patient Ops OS: event types for appointment lifecycle and scheduled detection
-- Extends outreach_event_type enum for cancellation handling and detector-emitted events.

ALTER TYPE outreach_event_type ADD VALUE IF NOT EXISTS 'calendly_booking_cancelled';
ALTER TYPE outreach_event_type ADD VALUE IF NOT EXISTS 'booking_cancelled';
ALTER TYPE outreach_event_type ADD VALUE IF NOT EXISTS 'recall_due_detected';
ALTER TYPE outreach_event_type ADD VALUE IF NOT EXISTS 'patient_inactive_detected';
ALTER TYPE outreach_event_type ADD VALUE IF NOT EXISTS 'revenue_leak_detected';
ALTER TYPE outreach_event_type ADD VALUE IF NOT EXISTS 'review_request_triggered';
ALTER TYPE outreach_event_type ADD VALUE IF NOT EXISTS 'no_show_detected';
