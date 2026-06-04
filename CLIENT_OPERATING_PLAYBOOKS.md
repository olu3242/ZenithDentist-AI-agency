# Client Operating Playbooks

Status: PARTIALLY CERTIFIED

## Lifecycle

Every client moves through:

`Onboarded -> Activated -> Optimized -> Scaled -> Renewed -> Expanded`

## First-Class Objects

- `client_operating_playbook_templates` stores the standard post-onboarding playbooks.
- `client_operating_playbook_items` instantiates every playbook checklist item per client.
- Every item supports owner, owner role, due date, status, evidence record, evidence status, and completion timestamp.

## Standard Playbooks

- Day 1 Activation
- Week 1 Validation
- 30 Day Success Review
- 60 Day Optimization
- 90 Day Business Review
- Incident Response
- Customer Success
- Expansion Workflow

## System Feeds

Each playbook item is designed to feed:

- Executive Command Center
- Customer Success OS
- Agency CRM
- Evidence OS
- Executive Dashboard

## Healthy Client Criteria

- Health Score > 80
- Adoption Score > 75
- Workflow Usage > 70%
- Revenue Attribution Active
- No Critical Incidents
- SLA Compliance > 95%

## Internal Surface

- `/internal/client-playbooks`

## Remaining Production Proof

- Apply the Client Implementation OS migration to staging and production.
- Populate operating playbook items for live clients.
- Connect evidence producers so completion can be certified automatically.
