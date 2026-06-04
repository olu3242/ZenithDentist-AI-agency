# ALICE Validation — PROS Sprint
**Generated:** 2026-06-01  
**Canonical Source:** `lib/alice/agents/` + `lib/ai/provider.ts`

---

## AI Inference Infrastructure

**File:** `lib/ai/provider.ts`

### Provider Chain

```
getIntelligenceProvider()
  → if AI_PROVIDER === "anthropic" → AnthropicProvider
  → if AI_PROVIDER === "openai"   → OpenAIProvider (stub)
  → default                       → LocalProvider
```

### AnthropicProvider (Real LLM)

```typescript
class AnthropicProvider {
  async complete(request) {
    if (!env.ANTHROPIC_API_KEY) return LocalProvider.complete(request);
    
    // Real inference via Anthropic API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: request.system,
        messages: [{ role: "user", content: request.prompt }]
      })
    });
    return { provider: "anthropic", model: "claude-haiku-4-5-20251001", content: data.content[0].text };
  }
}
```

**Model:** `claude-haiku-4-5-20251001` — fast, cost-effective for dental practice insights

### LocalProvider (Fallback)

Returns `system + prompt` as-is when no API key is configured. This ensures all ALICE agents return a valid `IntelligenceResponse` even without credentials. The fallback content is not meaningful for production use.

### OpenAIProvider

Implements the interface but contains only a stub (`return super.complete(request)`) — it does not actually call OpenAI. `AI_PROVIDER=openai` will use the LocalProvider fallback. **This is intentional** — Anthropic is the only active provider.

---

## ALICE Agent: Revenue Analyst

**File:** `lib/alice/agents/revenue-analyst.ts`

**Function:** `generateRevenueAnalysis(organizationId, period)`

**Data Sources:** Queries `recall_recovery_events`, `revenue_recovery_events`, `review_growth_events`, `chair_utilization_snapshots` for the specified period.

**System Prompt:** "You are a dental practice revenue analyst for a Patient Revenue Operating System. Analyze recall recovery, review growth, chair utilization, and no-show rates to surface revenue opportunities."

**Output: `RevenueAnalystReport`**
```typescript
{
  organizationId: string;
  generatedAt: string;
  period: { start, end };
  summary: string;              // 2-3 sentence executive summary
  topOpportunities: Array<{
    engine: string;             // "recall_recovery", "chair_fill", etc.
    estimatedValue: number;     // dollar value
    confidence: number;         // 0–1
    action: string;             // recommended action
  }>;
  riskAreas: Array<{ area, risk, recommendation }>;
  rawInsight: string;           // raw LLM response
}
```

**JSON parsing:** LLM response is parsed with `JSON.parse()`. Parse errors fall back to default structure.

---

## ALICE Agent: Operations Analyst

**File:** `lib/alice/agents/operations-analyst.ts`

**Function:** `generateOperationsAnalysis(organizationId)`

**Data Sources:**
- `summarizeAutomationHealth()` from `lib/alice/operational-intelligence.ts`
- `detectCriticalFailures()` from `lib/alice/operational-intelligence.ts`

**System Prompt:** "You are a dental practice operations analyst. Evaluate workflow health, automation coverage, and operational risk."

**Output: `OperationsReport`**
```typescript
{
  workflowHealthScore: number;    // 0–100
  automationCoverage: number;     // % of patient touchpoints automated
  criticalIssues: string[];       // up to 5
  recommendations: string[];      // up to 5
  rawInsight: string;
}
```

**Context passed to LLM:**
- Automation health summary (from `summarizeAutomationHealth()`)
- Operational score (0-100)
- Unhealthy workflow count
- Dead letter queue depth
- Critical failure list (workflowId + reason)

---

## ALICE Agent: Patient Journey Analyst

**File:** `lib/alice/agents/patient-journey-analyst.ts`

**Function:** `generatePatientJourneyAnalysis(organizationId)`

**Data Sources:**
- `recall_recovery_events` — last 90 days, fields: status, contacted_at, responded_at, scheduled_at
- `revenue_recovery_events` — last 90 days, fields: status, recovery_type, amount_recovered

**System Prompt:** "You are a dental patient journey analyst. Evaluate the patient lifecycle funnel, identify drop-off points, and recommend interventions."

**Output: `PatientJourneyReport`**
```typescript
{
  conversionFunnelHealth: number;   // 0–100
  dropOffPoints: Array<{
    stage: string;                  // e.g. "scheduled → confirmed"
    dropOffRate: number;            // 0–1
    recommendation: string;
  }>;
  recallHealth: number;             // 0–100
  retentionRate: number;            // 0–1
  rawInsight: string;
}
```

---

## ALICE Agent: Executive Advisor

**File:** `lib/alice/agents/executive-advisor.ts`

**Function:** `generateExecutiveSummary(organizationId, period: "daily" | "weekly")`

**Data Sources:** `summarizeAutomationHealth()` — same operational intelligence as Operations Analyst

**System Prompt:** "You are ALICE, the executive advisor for a dental practice owner using a Patient Revenue Operating System. Generate a concise daily/weekly executive summary."

**Output: `ExecutiveSummary`**
```typescript
{
  period: "daily" | "weekly";
  headline: string;                   // max 120 chars
  revenueHighlights: string[];        // 2–3 bullets
  operationalHighlights: string[];    // 2–3 bullets
  topPriority: string;                // single action for owner today
  rawInsight: string;
}
```

**Use Case:** Displayed in Executive Dashboard executive panels. Can be called on demand or scheduled daily/weekly.

---

## ALICE Supporting Layer

### lib/alice/operational-intelligence.ts

- `summarizeAutomationHealth()` — reads from `getRuntimeHealthState()`, returns summary text + scores
- `detectCriticalFailures()` — identifies workflows with repeated failures from `automation_traces`

### lib/alice/commercial-intelligence.ts

- Commercial opportunity analysis (revenue pipeline, expansion signals)
- Used by Revenue Analyst agent for opportunity scoring

---

## Activation Configuration

| Config | Value | Effect |
|--------|-------|--------|
| `AI_PROVIDER=anthropic` | Use claude-haiku-4-5-20251001 | Real LLM inference |
| `ANTHROPIC_API_KEY=sk-ant-...` | Required for Anthropic | Falls back to LocalProvider if missing |
| `AI_PROVIDER=openai` | Stub only — uses LocalProvider | No real OpenAI calls |
| No config | LocalProvider | Returns concatenated prompt, not useful for production |

---

## Readiness Score: 85/100

| Dimension | Score | Evidence |
|-----------|-------|---------|
| Anthropic inference | 90 | fetch() to messages API, claude-haiku-4-5-20251001 |
| LocalProvider fallback | 95 | Always returns valid IntelligenceResponse |
| Revenue Analyst | 85 | Real data sources, JSON parse, typed output |
| Operations Analyst | 85 | Automation health context, 5 recommendations |
| Patient Journey Analyst | 80 | 90-day window, funnel health + drop-off |
| Executive Advisor | 85 | Daily/weekly, headline + priority action |
| JSON robustness | 70 | Parse errors fall back to defaults, but raw LLM may not always produce valid JSON |
| Context richness | 75 | More domain data (production totals, provider count) would improve LLM accuracy |

**Gap:** The LLM prompts request JSON-only responses, but if the model returns markdown fences or partial JSON, the parse will fail silently and return a default empty structure. A JSON extraction wrapper (strip markdown, retry on parse failure) would improve reliability to >95%.
