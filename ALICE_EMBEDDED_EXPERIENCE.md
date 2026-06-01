# ALICE Embedded Experience

## Status

Implemented in the persona command center.

## Embedded Locations

| Location | Behavior |
| --- | --- |
| Command center priority card | Shows the top persona-specific recommendation |
| Embedded recommendation list | Shows all persona-specific ALICE prompts |
| Workflow queue | Ties recommendations to actionable workflow areas |
| Report links | Pushes decisions into reporting surfaces |

## Experience Rule

ALICE should not feel like a separate assistant page only. It should appear inside the operating context where decisions are made.

## Persona Examples

- Practice Owner: approve highest ROI workflow before lower-value automation expansion.
- Office Manager: clear PMS sync exceptions before recall campaigns.
- Agency Growth Operator: follow up with completed assessments before consultation-first CTAs.
- Zenith Platform Operator: resolve unresolved dead letters before workflow expansion.

## Next Iteration

Persist ALICE recommendation acknowledgements and decisions to an `alice_recommendation_actions` table so completion, owner, and impact can be tracked.
