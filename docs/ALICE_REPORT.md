# ALICE Agents — Architecture Report

## Overview

ALICE (Automated Learning & Intelligence for Clinical Enterprises) is the AI intelligence layer of the Zenith Patient Revenue Operating System. It consists of a core intelligence module and four specialized agent modules, all backed by real Anthropic LLM inference.

## Provider Layer — `lib/ai/provider.ts`

**Status: LIVE**

`AnthropicProvider.complete()` now calls the Anthropic Messages API (`claude-haiku-4-5-20251001`) via native `fetch`. On API error or missing `ANTHROPIC_API_KEY`, it falls back to `LocalProvider` (echoes input), ensuring safe degradation.

- Endpoint: `https://api.anthropic.com/v1/messages`
- Model: `claude-haiku-4-5-20251001` (fastest/cheapest for operational queries)
- Fallback: LocalProvider (echo mode) when key is absent or on error

## Core ALICE Module — `lib/alice.ts`

**Status: LIVE — real LLM results used**

### `answerOperationalQuery(question, organizationId?)`
Builds a rich system prompt from practice health score, benchmark percentile, no-show rate, recovered revenue, and automation health state. Calls `provider.complete()` and attempts to parse structured JSON from the AI response. Falls back to prose wrapping if JSON parsing fails.

### `generateAliceInsights(organizationId?)`
Aggregates `summarizeAutomationHealth()` + `detectCriticalFailures()` + health scores. Prompts AI for 3-5 actionable insights as a JSON array. Falls back to predictive insights from `buildPredictiveInsights()` if parsing fails.

### `generateAliceReport(period, organizationId?)`
Builds a period-specific (daily/weekly/monthly) executive briefing via AI. Parses structured JSON with title, summary, risks, opportunities. Falls back to health data defaults.

## Specialized Agents

### Revenue Analyst — `lib/alice/agents/revenue-analyst.ts`

**Status: LIVE**

Analyzes revenue patterns across 5 engines: Recall Recovery, No-Show Recovery, Review Growth, Treatment Follow-Up, Reactivation. Returns `RevenueAnalystReport` with:
- `topOpportunities`: up to 3 engines with estimated value, confidence, and action
- `riskAreas`: up to 2 risk areas with recommendations
- `rawInsight`: full AI response text

### Operations Analyst — `lib/alice/agents/operations-analyst.ts`

**Status: LIVE**

Uses `summarizeAutomationHealth()` and `detectCriticalFailures()` as context. Returns `OperationsReport` with workflow health score (0-100), automation coverage %, critical issues list, and recommendations.

### Patient Journey Analyst — `lib/alice/agents/patient-journey-analyst.ts`

**Status: LIVE**

Reads `recall_recovery_events` and `revenue_recovery_events` from Supabase. Evaluates 6 patient journey stages. Returns `PatientJourneyReport` with funnel health score, drop-off points with per-stage recommendations, recall health, and retention rate.

### Executive Advisor — `lib/alice/agents/executive-advisor.ts`

**Status: LIVE**

Generates daily or weekly executive summaries for practice owners. Returns `ExecutiveSummary` with headline (one-liner), revenue highlights, operational highlights, and top priority action.

## Wiring Summary

All agents use `getIntelligenceProvider().complete()` from `lib/ai/provider.ts`. When `AI_PROVIDER=anthropic` and `ANTHROPIC_API_KEY` is set, real Claude inference is used. Otherwise, the LocalProvider echo fallback activates transparently.
