# Script Intelligence Architecture

## Overview

The Script Intelligence Engine provides template management, variable substitution, and performance analytics for all patient-facing communications across channels. Scripts are the spoken and written content delivered by Digital Dentist Twins, SMS automations, email campaigns, and portal messages.

## Library File

`lib/script-engine/index.ts`

### Exports

| Function | Signature | Description |
|----------|-----------|-------------|
| `renderScript` | `(orgId, templateId, variables) → RenderedScript` | Substitutes `{{variable}}` tokens in a template |
| `getScriptTemplates` | `(orgId, opts?) → Template[]` | Lists active templates for org + global |
| `createScriptTemplate` | `(opts) → { id }` | Creates an org-specific template |
| `recordScriptPerformance` | `(orgId, templateId, event) → void` | Increments monthly analytics counters |

## Variable Substitution

`renderScript()` iterates `script_templates.variables[]` and replaces each `{{varName}}` occurrence in `content_template` using `String.replaceAll()`. Variables not supplied by the caller are added to `missingVariables[]` in the response — content is still returned with unresolved tokens so callers can decide whether to proceed.

### ScriptVariables Interface

```typescript
interface ScriptVariables {
  patient_first_name?: string;
  patient_last_name?: string;
  provider_name?: string;
  practice_name?: string;
  appointment_date?: string;
  appointment_time?: string;
  treatment_name?: string;
  treatment_cost?: string;
  recall_months?: string;
  portal_url?: string;
  review_link?: string;
  [key: string]: string | undefined; // extensible for org-specific vars
}
```

## 11 Seeded Standard Variables

Seeded in the `script_variables` table at migration time:

| Variable | Category |
|----------|----------|
| `patient_first_name` | patient |
| `patient_last_name` | patient |
| `provider_name` | provider |
| `practice_name` | practice |
| `appointment_date` | appointment |
| `appointment_time` | appointment |
| `treatment_name` | treatment |
| `treatment_cost` | treatment |
| `recall_months` | workflow |
| `portal_url` | communication |
| `review_link` | communication |

## 8 Variable Categories

`patient` · `provider` · `practice` · `treatment` · `appointment` · `workflow` · `communication` · `revenue`

Categories are used to filter variables in the template editor UI and to validate completeness before sending.

## Database Tables

### script_templates

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `organization_id` | uuid FK | NULL for global templates |
| `template_name` | text | Display name |
| `journey_type` | text | Links to `journey_definitions.journey_type` |
| `category` | text | One of 8 categories |
| `channel` | text | video/sms/email/whatsapp/voice/portal |
| `content_template` | text | Raw template with `{{variable}}` tokens |
| `variables` | text[] | List of variable names used in content |
| `is_global_template` | boolean | True = visible to all orgs |
| `is_active` | boolean | Soft-delete flag |
| `performance_score` | numeric | Computed from analytics; used for ranking |

`getScriptTemplates()` queries `organization_id = $orgId OR is_global_template = true` so global templates are always available. Results are ordered by `performance_score DESC`.

### script_variables

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `variable_name` | text UNIQUE | e.g. `patient_first_name` |
| `category` | text | One of 8 categories |
| `description` | text | Human-readable explanation |
| `is_required` | boolean | |

### script_analytics

Monthly performance counters per template per org.

| Column | Type | Notes |
|--------|------|-------|
| `organization_id` | uuid FK | |
| `script_template_id` | uuid FK | |
| `period_start` | date | First day of month |
| `period_end` | date | Last day of month |
| `total_sent` | int | Incremented by `recordScriptPerformance('sent')` |
| `total_opened` | int | |
| `total_clicked` | int | |
| `conversion_count` | int | |

`recordScriptPerformance()` upserts by `(organization_id, script_template_id, period_start)` to avoid duplicate rows.

## Global vs Org Templates

- `is_global_template = true` + `organization_id = NULL`: Zenith default templates, visible to all orgs
- `is_global_template = false` + `organization_id = <uuid>`: Practice-specific customizations

Org-specific templates override global templates when both exist for the same `journey_type` + `channel` combination. `getScriptTemplates()` returns both and orders by `performance_score`.

## Integration with Journey Steps

`journey_step_definitions.script_template_id` references `script_templates.id`. When the journey engine executes a step, it calls `renderScript(orgId, step.scriptTemplateId, patientVariables)` to produce the final message content before dispatching to the delivery channel.

## Performance Feedback Loop

1. Message sent → `recordScriptPerformance(orgId, templateId, 'sent')`
2. Patient opens → `recordScriptPerformance(orgId, templateId, 'opened')`
3. Patient clicks CTA → `recordScriptPerformance(orgId, templateId, 'clicked')`
4. Treatment accepted / appointment booked → `recordScriptPerformance(orgId, templateId, 'converted')`
5. `script_templates.performance_score` is updated periodically from `script_analytics` open/conversion rates
6. Higher-scoring templates surface first in `getScriptTemplates()` results
