# Customer Success Report

Date: 2026-06-01

## Required Scores

Implemented in `calculateCustomerSuccessScores` in `lib/pilot-operations.ts`.

- Practice Health Score
- Playbook Health Score
- Automation Coverage Score
- Revenue Opportunity Score
- ALICE Recommendation Score

## Evidence Sources

- Practice health: baseline vs current no-show, recall, chair utilization, collections
- Playbook health: healthy installed playbooks / installed playbooks
- Automation coverage: installed playbooks / six required PROS playbooks
- Revenue opportunity: production lift against baseline
- ALICE recommendation score: accepted recommendations / total recommendations

## Status

Customer success scoring is operationalized without adding a new customer success platform layer.
