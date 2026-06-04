# Lead Pipeline Audit

## Status: WIRED ✅ — Two gaps closed this sprint

---

## Pipeline Tables

| Table | Purpose | Status |
|-------|---------|--------|
| leads | Primary lead record | ✅ |
| roi_calculations | Assessment inputs + outputs | ✅ |
| audits | Report, recommendations, LIZ JSON | ✅ |
| bookings | Strategy session scheduling | ✅ |
| outreach_events | Full event log | ✅ |

---

## Lead Status Flow

```
new → audit_requested → booked → qualified → won / lost
```

| Transition | Trigger | Status |
|-----------|---------|--------|
| new → audit_requested | submitFunnelAction() | ✅ |
| audit_requested → booked | Calendly webhook POST | ✅ Fixed this sprint |
| booked → qualified | Manual (admin) | Manual only |
| qualified → won/lost | Manual (admin) | Manual only |

---

## Fields Persisted

### Lead Record (leads table)
| Field | Source | Persisted |
|-------|--------|-----------|
| dentist_name | Form input | ✅ |
| practice_name | Form input | ✅ |
| email | Form input | ✅ |
| phone | Form input | ✅ |
| locations | Form input | ✅ |
| staff_size | Derived (providers × 3) | ✅ |
| pms_software | Form select | ✅ |
| no_show_rate | Slider | ✅ |
| operational_pain | Auto-generated string | ✅ |
| status | "audit_requested" | ✅ |
| source | "free_revenue_opportunity_assessment" | ✅ |
| attribution.practiceHealthScore | Calculated | ✅ |
| attribution.providers | Input | ✅ |
| attribution.treatment_acceptance_rate | Input | ✅ |
| attribution.recall_rate | Input | ✅ |

### ROI Calculation (roi_calculations table)
| Field | Status |
|-------|--------|
| revenue_recovery_opportunity | ✅ |
| practice_health_score | ✅ |
| recall_opportunity | ✅ |
| treatment_opportunity | ✅ |
| chair_fill_opportunity | ✅ |
| monthly_revenue_loss | ✅ |
| yearly_revenue_loss | ✅ |

### Audit Record (audits table)
| Field | Status |
|-------|--------|
| projected_recovery | ✅ |
| alice_report (LIZ report JSON) | ✅ |
| recommendations JSON | ✅ |
| ninety_day_snapshot JSON | ✅ |
| audit_summary | ✅ |

---

## Booking Record
| Field | Status |
|-------|--------|
| lead_id | ✅ (via utm_content in Calendly URL) |
| calendly_event_id | ✅ |
| scheduled_at | ✅ |
| booking_status = "scheduled" | ✅ |
| Lead status updated to "booked" | ✅ Fixed this sprint |

---

## Gaps Closed This Sprint

1. **Calendly URL empty** → Fixed: env.CALENDLY_URL now passed from server component
2. **Lead ID not in Calendly link** → Fixed: utm_content={leadId} appended to Calendly URL in BookingFlow
3. **Lead status not updated on booking** → Fixed: Calendly webhook now updates lead status to "booked"

---

## Remaining Manual Steps

- booked → qualified: Requires admin review (intentional — qualification is human judgment)
- qualified → won: Sales decision (intentional)
- Email follow-up sequences: Dependent on RESEND_API_KEY being configured
