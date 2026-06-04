# ALICE Persona Framework

## Status

Implemented as persona-specific recommendation arrays in `lib/personas.ts` and rendered throughout the command center.

## Recommendation Model

AI Revenue Intelligence recommendations are now attached to the persona, not the page. This makes recommendations role-aware even when users drill into the same underlying workflow or report.

## Persona Recommendation Themes

| Persona | ALICE focus |
| --- | --- |
| Front Desk Operator | Daily recall, no-show, review, and missed-call prioritization |
| Clinical Provider | Treatment plan follow-up, production recovery, patient outcome risk |
| Office Manager | PMS sync, staff focus, workflow failure resolution |
| Practice Owner | ROI prioritization, benchmark comparisons, strategy recommendations |
| DSO Executive | Location variance, portfolio rollout, PMS data quality |
| Agency Growth Operator | Assessment follow-up, strategy-session qualification, client readiness |
| Zenith Platform Operator | Dead-letter recovery, tenant scoping, ALICE grounding confidence |

## Embedded Experience

ALICE appears in:

- Command center priority panel
- Embedded recommendation list
- Persona workflow context
- Report and drilldown architecture

## Guardrail

AI Revenue Intelligence recommendations must be grounded in the persona mission and the current operating domain. Generic recommendations are considered incomplete.
