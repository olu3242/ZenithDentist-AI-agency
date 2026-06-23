# LIZ Delegation Layer

LIZ remains the only persona the patient ever sees. Internally, she delegates to named peer agents.

## Flow

```
Patient message
  → LizIntentEngine.detectIntent(message)
  → LizDelegationEngine.delegate(message, context)
      → intent → agent slug mapping
      → AgentRouter.route()
      → ExecutionEngine.run()
  → LizResponseComposer.compose(result)
  → Patient-facing response (agent-agnostic)
```

## Files (`packages/agent-os/delegation/`)

- `LizIntentEngine.ts` — keyword-based `detectIntent(message)`: schedule_appointment, cancel_appointment, treatment_questions, payment_questions, insurance_questions, review_request, practice_report, revenue_performance, unknown.
- `LizDelegationEngine.ts` — intent→agent mapping: schedule/cancel_appointment→max, treatment_questions→ivy, payment/insurance_questions→finn, review_request→nova, practice_report→tess, revenue_performance→alice.
- `LizResponseComposer.ts` — turns an `ExecutionResult` into a short, agent-agnostic patient-facing message.

## IP Protection

The patient never sees MAX, IVY, FINN, NOVA, ALICE, QUINN, REX, or TESS by name — `LizResponseComposer` is the only thing that talks to the patient, consistent with the existing IP protection rule that internal agent/workflow architecture must never be exposed publicly.
