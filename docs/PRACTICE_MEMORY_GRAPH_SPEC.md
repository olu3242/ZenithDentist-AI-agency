# Practice Memory Graph — Specification

**Version:** 1.0  
**Status:** Canonical  
**Last Updated:** 2026-06-02  

---

## 1. Purpose

The Practice Memory Graph is the long-term institutional memory of a dental practice within the ZenithDentist platform. It captures the practice's personality, goals, constraints, clinical preferences, communication style, and learned patterns — providing ALICE and all Growth Engines with the contextual foundation needed to act as a true extension of the practice.

---

## 2. Core Concept

Unlike patient-level data which changes frequently, practice memory is relatively stable and cumulative. The graph grows richer over time as the platform learns what works for each unique practice.

The Practice Memory Graph answers the question: *"What does ALICE need to know about this practice to make decisions that feel authentically theirs?"*

---

## 3. Memory Categories

| Category | Description |
|----------|-------------|
| `identity` | Practice name, provider names, brand voice, personality |
| `goals` | Active growth goals, target metrics, priorities |
| `constraints` | No-contact periods, patient segments to exclude, compliance notes |
| `communication_style` | Tone preferences, approved language, forbidden phrases |
| `clinical_preferences` | Treatment focus areas, case types, acceptance strategies |
| `operational_patterns` | Scheduling patterns, staff availability, seasonal variations |
| `learned_patterns` | What has worked (A/B results, conversion winners) |
| `integration_config` | PMS type, field mappings, sync preferences |

---

## 4. Database Schema

```sql
CREATE TABLE practice_memory_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id),
  memory_category   TEXT NOT NULL,
  memory_key        TEXT NOT NULL,
  memory_value      JSONB NOT NULL,
  confidence        NUMERIC(3,2) DEFAULT 1.00,
  source            TEXT NOT NULL,  -- 'manual' | 'learned' | 'imported' | 'system'
  is_active         BOOLEAN DEFAULT true,
  valid_from        TIMESTAMPTZ DEFAULT NOW(),
  valid_until       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, memory_category, memory_key)
);

CREATE INDEX idx_practice_memory_org_category 
  ON practice_memory_records(organization_id, memory_category);
```

---

## 5. Memory Record Examples

### Identity Memory

```json
{
  "memory_category": "identity",
  "memory_key": "practice_voice",
  "memory_value": {
    "tone": "warm, reassuring, professional",
    "personality_traits": ["caring", "educational", "community-focused"],
    "brand_statement": "Where families trust their smiles",
    "provider_name": "Dr. Sarah Martinez",
    "provider_pronouns": "she/her"
  },
  "source": "manual"
}
```

### Communication Style Memory

```json
{
  "memory_category": "communication_style",
  "memory_key": "approved_language",
  "memory_value": {
    "preferred_greeting": "Hi {{first_name}}",
    "sign_off": "Warm regards, Dr. Martinez and the Sunridge Dental team",
    "forbidden_phrases": ["cheap", "discount", "deal"],
    "preferred_phrases": ["investment in your health", "your smile is our priority"],
    "max_message_length_sms": 160
  },
  "source": "manual"
}
```

### Learned Pattern Memory

```json
{
  "memory_category": "learned_patterns",
  "memory_key": "sms_recall_best_time",
  "memory_value": {
    "best_send_time": "09:00",
    "best_send_day": "tuesday",
    "open_rate_at_best_time": 0.74,
    "sample_size": 312,
    "last_validated": "2026-01-15"
  },
  "confidence": 0.91,
  "source": "learned"
}
```

### Constraint Memory

```json
{
  "memory_category": "constraints",
  "memory_key": "holiday_blackouts",
  "memory_value": {
    "no_contact_periods": [
      { "start": "12-24", "end": "01-02", "label": "Holiday season" }
    ],
    "exclude_segments": ["active_treatment_in_progress"],
    "max_outreach_per_patient_per_month": 3
  },
  "source": "manual"
}
```

---

## 6. Memory Formation

### 6.1 Manual Entry

Practice admins and agency staff enter identity, goals, constraints, and communication preferences during onboarding and configuration.

### 6.2 Learned Patterns

The platform automatically updates learned pattern memory based on observed outcomes:

| Trigger | Memory Updated |
|---------|--------------|
| A/B test concludes | Winning variant recorded |
| Outreach time analysis | Best send time updated |
| Channel performance analysis | Preferred channel per segment updated |
| Script performance analysis | Top-performing script templates noted |
| Growth Score milestone | Goal achievement logged |

### 6.3 Confidence Decay

Learned patterns lose confidence over time if not reinforced:

| Pattern Age | Confidence |
|-------------|-----------|
| < 30 days | As computed |
| 31-90 days | -10% |
| 91-180 days | -25% |
| 180+ days | -50%, minimum 0.30 |

---

## 7. ALICE Memory Consumption

ALICE reads relevant practice memory before every decision:

```
ALICE Decision Request
  → Load organization_id from context
  → Query practice_memory_records WHERE organization_id = ? AND is_active = true
  → Group by memory_category
  → Inject into ALICE system prompt as structured context
  → Generate decision informed by practice memory
```

### Memory Context in ALICE Prompt

```
PRACTICE MEMORY CONTEXT:
[identity] Voice: warm, reassuring, professional. Provider: Dr. Sarah Martinez.
[communication_style] Greeting: "Hi {{first_name}}". No: "cheap", "discount". Max SMS: 160 chars.
[constraints] No contact: Dec 24 - Jan 2. Max 3 outreach/patient/month.
[learned_patterns] Best recall time: Tuesday 9 AM (74% open rate, n=312, confidence: 0.91).
[goals] Current Q2 goal: Recall conversion rate > 40%. Growth Score target: 75.
```

---

## 8. Memory Versioning

When a memory record is updated, the previous version is preserved with `valid_until` set:

```sql
-- Mark old record as expired
UPDATE practice_memory_records
SET valid_until = NOW(), is_active = false
WHERE organization_id = ? AND memory_category = ? AND memory_key = ? AND is_active = true;

-- Insert new version
INSERT INTO practice_memory_records (...) VALUES (...);
```

Full memory history is retained for audit purposes.

---

## 9. Library Module

| Module | File | Responsibility |
|--------|------|---------------|
| `lib/practice-memory/` | Memory CRUD operations | Read/write practice memory records |
| `lib/practice-memory/` | Memory context builder | Assemble ALICE prompt context |
| `lib/practice-memory/` | Pattern learner | Auto-update learned patterns |
| `lib/practice-memory/` | Confidence manager | Apply decay and refresh |

---

## 10. Onboarding Memory Seed

During practice onboarding, the platform seeds a baseline memory record set:

| Memory Key | Source | Collected Via |
|-----------|--------|--------------|
| practice_voice | Practice admin | Onboarding questionnaire |
| provider_name | Organization record | Auto-populated |
| communication_style | Practice admin | Style guide wizard |
| goals | Practice admin | Goal-setting wizard |
| constraints | Practice admin | Configuration panel |
| integration_config | PMS setup | Technical onboarding |

---

## 11. Privacy and Compliance

- Practice memory contains no patient PHI.
- Memory records are owned by the practice (organization_id).
- Practices may export their full memory graph on request.
- Memory is deleted 30 days after contract termination.
- RLS policies enforce strict organization isolation.
