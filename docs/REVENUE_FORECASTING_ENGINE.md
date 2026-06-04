# Revenue Forecasting Engine

## Overview

The Revenue Forecasting Engine generates multi-horizon revenue projections for dental practices. Forecasts are computed nightly, stored in `revenue_forecasts`, and surfaced in the Revenue Command Center. Each forecast includes confidence bands and is tracked for accuracy once the horizon passes.

---

## 5 Forecast Horizons

| Horizon | Days | Use Case | Confidence |
|---------|------|----------|-----------|
| Short-term | 30 days | Cash flow planning, staffing | 90% |
| Medium-term | 60 days | Marketing budget allocation | 80% |
| Quarterly | 90 days | QBR projections, goal setting | 70% |
| Semi-annual | 180 days | Annual planning, investment | 60% |
| Annual | 365 days | Strategic planning, lender reports | 50% |

**Confidence decay** reflects the natural increase in uncertainty over longer horizons. Confidence is expressed as the expected accuracy of the point estimate.

---

## 5 Forecast Types

| Type | Description | Primary Input |
|------|-------------|--------------|
| `total` | All revenue combined | Sum of all other types |
| `treatment` | Planned and predicted treatment revenue | `treatment_acceptance_predictions` |
| `membership` | Recurring membership MRR | `membership_tracking` |
| `recall` | Scheduled hygiene/recall value | `recall_tracking` |
| `referral` | Projected referral-sourced revenue | `patient_influence_scores` |

---

## Forecast Inputs

### Treatment Revenue Input
```sql
SELECT SUM(estimated_value * acceptance_probability) AS expected_treatment_revenue
FROM treatment_acceptance_predictions
WHERE organization_id = $1
  AND status = 'active'
  AND expected_treatment_date BETWEEN NOW() AND NOW() + INTERVAL '$horizon days';
```

### Membership Revenue Input
```sql
SELECT SUM(monthly_value) * ($horizon_days / 30.0) AS expected_membership_revenue
FROM membership_tracking
WHERE organization_id = $1
  AND status = 'active';
```

### Recall Revenue Input
```sql
SELECT COUNT(*) * 300 AS expected_recall_revenue
FROM recall_tracking
WHERE organization_id = $1
  AND status = 'scheduled'
  AND scheduled_date BETWEEN NOW() AND NOW() + INTERVAL '$horizon days';
```
*Average recall value: $300 (configurable per practice)*

### Referral Revenue Input
```sql
SELECT SUM(referral_probability_score / 100.0 * 1200) AS expected_referral_revenue
FROM patient_influence_scores
WHERE organization_id = $1
  AND referral_probability_score >= 65;
```
*Average referred patient first-year value: $1,200*

### Historical Trend Modifier

If prior-period data is available, apply a growth/decline trend multiplier:
```typescript
const trend = calculateTrend(historicalRevenue, periods = 3);
// trend > 1.0 → growing practice → boost forecast
// trend < 1.0 → declining practice → reduce forecast
forecastAmount *= trend;
```

---

## Confidence Decay Formula

```typescript
const confidenceByHorizon: Record<number, number> = {
  30: 0.90,
  60: 0.80,
  90: 0.70,
  180: 0.60,
  365: 0.50,
};

function applyConfidenceDecay(forecastAmount: number, horizonDays: number): ForecastResult {
  const confidence = confidenceByHorizon[horizonDays] ?? 0.50;
  return {
    forecast_amount: forecastAmount,
    confidence_score: confidence,
    low_estimate: forecastAmount * 0.7,
    high_estimate: forecastAmount * 1.3,
  };
}
```

---

## revenue_forecasts Table Schema

```sql
CREATE TABLE revenue_forecasts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES organizations(id),
  forecast_date     date NOT NULL DEFAULT CURRENT_DATE,
  horizon_days      integer NOT NULL,
  forecast_type     text NOT NULL,
  forecast_amount   numeric NOT NULL DEFAULT 0,
  confidence_score  numeric NOT NULL DEFAULT 0,
  low_estimate      numeric NOT NULL DEFAULT 0,
  high_estimate     numeric NOT NULL DEFAULT 0,
  actual_amount     numeric,
  accuracy_score    numeric,
  created_at        timestamptz NOT NULL DEFAULT NOW(),

  CONSTRAINT revenue_forecasts_horizon_check
    CHECK (horizon_days IN (30, 60, 90, 180, 365)),
  CONSTRAINT revenue_forecasts_type_check
    CHECK (forecast_type IN ('total', 'treatment', 'membership', 'recall', 'referral')),
  UNIQUE (organization_id, forecast_date, horizon_days, forecast_type)
);
```

The `UNIQUE` constraint prevents duplicate forecasts for the same org/date/horizon/type combination.

---

## forecastRevenue() Function Flow

```typescript
async function forecastRevenue(organizationId: string): Promise<void> {
  const horizons = [30, 60, 90, 180, 365];
  const types = ['treatment', 'membership', 'recall', 'referral'];

  for (const horizon of horizons) {
    const components: Record<string, number> = {};

    // Calculate each component forecast
    for (const type of types) {
      components[type] = await calculateComponentForecast(organizationId, horizon, type);
    }

    // Total is sum of components
    components.total = Object.values(components).reduce((a, b) => a + b, 0);

    // Apply historical trend modifier
    const trend = await getHistoricalTrend(organizationId);
    for (const type of Object.keys(components)) {
      components[type] *= trend;
    }

    // Upsert forecasts with confidence decay
    for (const [type, amount] of Object.entries(components)) {
      const { forecast_amount, confidence_score, low_estimate, high_estimate } =
        applyConfidenceDecay(amount, horizon);

      await db.upsert('revenue_forecasts', {
        organization_id: organizationId,
        forecast_date: new Date(),
        horizon_days: horizon,
        forecast_type: type,
        forecast_amount,
        confidence_score,
        low_estimate,
        high_estimate,
      }, ['organization_id', 'forecast_date', 'horizon_days', 'forecast_type']);
    }
  }
}
```

---

## Confidence Bands

Confidence bands provide the range of likely outcomes:

```
Low estimate  = forecast_amount × 0.70
High estimate = forecast_amount × 1.30
```

**Display example:**
```
30-Day Revenue Forecast
Point estimate: $44,200
Range: $30,940 – $57,460 (90% confidence)
```

---

## Accuracy Tracking

After each horizon passes, the nightly job fills in `actual_amount` and computes `accuracy_score`:

```typescript
async function updateForecastAccuracy(organizationId: string): Promise<void> {
  // Find forecasts whose horizon has passed but accuracy not yet computed
  const staleForeacasts = await db.query(`
    SELECT * FROM revenue_forecasts
    WHERE organization_id = $1
      AND actual_amount IS NULL
      AND forecast_date + (horizon_days || ' days')::interval < NOW()
  `, [organizationId]);

  for (const forecast of staleForecasts) {
    const actual = await getActualRevenue(
      organizationId,
      forecast.forecast_date,
      forecast.forecast_date + forecast.horizon_days,
      forecast.forecast_type
    );

    const accuracy = actual > 0
      ? 1 - Math.abs(forecast.forecast_amount - actual) / actual
      : 0;

    await db.update('revenue_forecasts', {
      actual_amount: actual,
      accuracy_score: Math.max(0, accuracy),
    }, { id: forecast.id });
  }
}
```

**Alert:** If `accuracy_score < 0.70` after a 30-day horizon, flag in the Command Center for review.

---

## Forecast Command Center Panel SQL

```sql
-- Latest forecasts for dashboard display
SELECT
  horizon_days,
  forecast_type,
  forecast_amount,
  confidence_score,
  low_estimate,
  high_estimate,
  actual_amount,
  accuracy_score
FROM revenue_forecasts
WHERE organization_id = $1
  AND forecast_date = CURRENT_DATE
ORDER BY horizon_days ASC, forecast_type;
```

```sql
-- Forecast accuracy trend (last 6 months of 30-day forecasts)
SELECT
  forecast_date,
  forecast_amount,
  actual_amount,
  accuracy_score
FROM revenue_forecasts
WHERE organization_id = $1
  AND horizon_days = 30
  AND forecast_type = 'total'
  AND actual_amount IS NOT NULL
ORDER BY forecast_date DESC
LIMIT 6;
```

---

## Related Documents

- [Revenue OS Architecture](REVENUE_OS_ARCHITECTURE.md)
- [Revenue Command Center](REVENUE_COMMAND_CENTER.md)
- [Revenue Opportunity Engine](REVENUE_OPPORTUNITY_ENGINE.md)
