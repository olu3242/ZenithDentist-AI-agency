# Digital Dentist Twin — Governance

**Version:** 1.0  
**Status:** Active  
**Last Updated:** 2026-06-02  

---

## 1. Purpose

This document establishes the governance framework for the Digital Dentist Twin (DDT) — defining quality standards, consent requirements, liability boundaries, approval processes, and ongoing oversight for AI-generated dentist representations.

---

## 2. Governance Principles

1. **Identity Integrity** — The DDT must authentically represent the dentist and practice; no misleading representations permitted.
2. **Clinical Accuracy** — All clinical content in DDT communications must be factually accurate and approved by the practice.
3. **Informed Consent** — Patients must consent to receiving AI-generated personalized video messages.
4. **PHI Boundary** — No patient health information appears in DDT scripts or videos.
5. **Provider Approval** — Dentists approve their avatar, voice, and all script templates before activation.

---

## 3. Approval Process

### 3.1 DDT Activation Checklist

Before a Digital Dentist Twin is activated for any practice, ALL of the following must be completed and recorded:

| Requirement | Approver | Evidence Required |
|-------------|---------|------------------|
| Avatar likeness approved | Dentist (provider) | Signed approval in platform |
| Voice sample approved | Dentist (provider) | Voice profile flagged `approved = true` |
| Minimum 3 script templates approved | Dentist or practice admin | Templates flagged `approved = true` |
| Test video reviewed and approved | Dentist (provider) | Video approval record |
| Patient consent mechanism active | Agency admin | Portal consent flow verified |
| PHI scan passed | Platform automated check | Scan result logged |
| Communication channels tested | Practice manager | Test send verified |

### 3.2 Template Approval Workflow

Every new or modified script template must go through:

1. **Drafting** — Script Engine generates template (AI or staff-authored).
2. **Clinical Review** — Dentist or designated clinical reviewer checks for accuracy.
3. **Brand Review** — Practice admin checks for voice and style alignment.
4. **Approval** — Dentist signs off; template status → `approved`.
5. **Activation** — Template becomes available for use in workflows.
6. **Periodic Review** — All templates reviewed every 6 months.

---

## 4. Content Standards

### 4.1 Permissible DDT Content

| Content Type | Permitted | Conditions |
|-------------|-----------|-----------|
| Recall reminders | Yes | No specific clinical details |
| Appointment reminders | Yes | Appointment date/time only |
| Treatment education (general) | Yes | General information only; no personalized clinical advice |
| Membership offers | Yes | Pricing from approved templates |
| Review requests | Yes | Post-appointment only |
| Referral asks | Yes | Champion tier only |
| Welcome messages | Yes | Generic welcome |

### 4.2 Prohibited DDT Content

| Content Type | Reason |
|-------------|--------|
| Specific diagnosis mention | Clinical liability |
| PHI of any kind | HIPAA compliance |
| Price comparisons with competitors | Brand and legal risk |
| Guarantees of outcomes | Clinical liability |
| Impersonation of other providers | Identity integrity |
| Content not approved by dentist | Quality and trust |

---

## 5. Voice Governance

### 5.1 Voice Sample Standards

| Requirement | Standard |
|-------------|---------|
| Minimum recording length | 30 seconds of clean speech |
| Recording quality | No background noise; 44.1kHz minimum |
| Sample content | Neutral professional phrases (not patient-specific) |
| Consent | Dentist signs voice consent agreement |
| Storage | Encrypted; accessible only to voice_studio module |

### 5.2 Voice Clone Restrictions

- Voice model may only be used for approved DDT communications.
- Voice model may not be used for real-time conversation or phone calls.
- Voice model is tied to `organization_id` and may not be used across practices.
- Dentist may request voice profile deletion at any time.

---

## 6. Avatar Governance

### 6.1 Avatar Standards

| Requirement | Standard |
|-------------|---------|
| Avatar style | Photorealistic, illustrated, or minimal (dentist choice) |
| Likeness approval | Dentist must approve final avatar before activation |
| Update frequency | Major updates require re-approval |
| Accuracy | Avatar must bear reasonable resemblance to actual dentist |

### 6.2 Avatar Restrictions

- Avatar may not be depicted in clinical situations (e.g., performing procedures).
- Avatar expressions and gestures must be professionally appropriate.
- Avatar may not be used in third-party marketing without written consent.

---

## 7. Patient Consent

### 7.1 Consent Requirements

Patients must provide explicit, affirmative consent before receiving DDT video messages. Consent must:

- Be captured at patient portal onboarding.
- Clearly explain that messages are AI-generated using a voice and likeness representation of their dentist.
- Be revocable at any time.
- Be logged with timestamp in the patient consent record.

### 7.2 Consent Withdrawal

When a patient withdraws DDT consent:
1. DDT video delivery disabled immediately for that patient.
2. Active journeys updated to use text/email alternatives.
3. Withdrawal logged as an immutable event.
4. Patient notified of the change.

---

## 8. Quality Monitoring

### 8.1 Ongoing Quality Metrics

| Metric | Threshold | Action |
|--------|-----------|--------|
| Personalization fill rate | > 95% | Alert if below |
| Patient opt-out rate | < 5% | Review content if above |
| Video delivery failure rate | < 2% | Investigate delivery chain |
| Script approval lag | < 5 business days | Remind approver |
| Template staleness (no review > 6 months) | 0 templates | Auto-flag for review |

### 8.2 Complaint Handling

Patient complaints about DDT content are handled as:

1. Complaint received (Executive Dashboard or external channel).
2. Immediate suspension of the specific message type pending review.
3. Content review within 1 business day.
4. If content standard violation found: template suspended, dentist notified.
5. Resolution logged in platform audit trail.

---

## 9. Liability Boundaries

| Responsibility | Party |
|---------------|-------|
| Clinical accuracy of content | Dental practice (provider) |
| AI generation quality | ZenithDentist platform |
| Patient consent compliance | Dental practice |
| Voice/avatar accuracy | Dental practice (approval) |
| PHI exclusion | ZenithDentist platform (automated) + practice (review) |
| Delivery and channel compliance | ZenithDentist platform |

---

## 10. Governance Review Cadence

| Review | Frequency | Owner |
|--------|-----------|-------|
| Template audit | Every 6 months per practice | ALICE Product Owner |
| Voice model quality review | Annually | Voice Studio team |
| Consent flow audit | Annually | Security Officer |
| Content standards review | Annually | Platform Architect + Legal |
