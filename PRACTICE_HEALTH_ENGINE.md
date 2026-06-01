# Practice Health Engine

## Status

Implemented in `calculatePracticeHealthScore` in `lib/action-engine.ts`.

## Composite Scores

| Score | Signal |
| --- | --- |
| Revenue Health | Recoverable revenue exposure |
| Operational Health | Runtime operational and observability score |
| Growth Health | Review and lead activity |
| Patient Health | Recall and recovery pressure |
| Automation Health | Reliability minus failed workflow pressure |

## Output

```txt
Practice Health Score
```

The score is rendered in persona, revenue, growth, and operations command centers and gives ALICE a prioritization signal.

## Next Step

Persist daily practice health snapshots so ALICE can trend recommendation impact over time.
