# Zenith Platform Admin Roadmap

## Objective

Deliver a Salesforce-grade Platform Administration Console for Zenith without creating duplicate dashboards, runtimes, workflow engines, AI assistants, or telemetry systems.

## Architecture Rule

The Platform Administration Console configures and governs existing systems:

- ALICE = Intelligence Layer.
- Workflow OS = Orchestration Layer.
- Mission Control = Command Center.
- Runtime OS = Execution Layer.
- Patient Revenue Engine = Revenue Layer.

## Phase 1: Administration Foundation

Deliver:

- Platform admin shell.
- Setup navigation.
- Global setup search.
- Module registry.
- Admin route protection.
- Setup Audit Trail foundation.
- Permission model foundation.

Success:

- Platform admins have a centralized setup entry point.
- Every setup mutation is auditable.
- No client dashboard is duplicated.

## Phase 2: Organization, User, And Permission Administration

Deliver:

- Organization Manager.
- User Manager.
- Roles & Permission Sets.
- Route permission visibility.
- Object permission visibility.
- Field permission visibility.

Success:

- Platform admins can manage access centrally.
- Role drift and permission drift become visible.
- Client Access Lockdown remains active.

## Phase 3: Object Manager

Deliver:

- Object catalog.
- Field metadata.
- Relationship metadata.
- Validation rule registry.
- Object permission registry.
- Trigger registry.
- Workflow binding registry.

Success:

- Zenith object model becomes admin-visible.
- Workflow bindings are governable.
- Operational records stay in domain systems.

## Phase 4: Workflow And Automation Administration

Deliver:

- Workflow Administration.
- Workflow version view.
- Workflow deployment view.
- Workflow health view.
- Workflow ROI view.
- Workflow audit view.
- Automation Registry admin surface.

Actions:

- Pause.
- Resume.
- Rollback.
- Clone.
- Version.
- Deploy.

Success:

- Workflow OS remains the orchestration layer.
- Admins gain lifecycle control and audit visibility.

## Phase 5: ALICE Administration

Deliver:

- Prompt Registry.
- Knowledge Registry.
- Memory Registry.
- Model Registry.
- Decision Logs.
- Recommendations.
- AI Audit Trail.

Success:

- ALICE remains one intelligence layer.
- AI configuration is governed and auditable.

## Phase 6: Integration Center

Deliver:

- Integration catalog.
- Open Dental setup and health.
- Dentrix setup and health.
- Eaglesoft setup and health.
- Twilio setup and health.
- Stripe setup and health.
- Calendly setup and health.
- Resend setup and health.
- OpenAI setup and health.
- Anthropic setup and health.

Success:

- Integrations are centrally visible and governable.
- Runtime OS remains responsible for execution.

## Phase 7: Deployment Center

Deliver:

- Migration governance.
- Feature flag management.
- Workflow deployment management.
- Environment promotions.
- Schema change review.
- Rollback center.
- Deployment approval queue.

Success:

- Production changes become controlled and auditable.
- Deployment risk is visible before execution.

## Phase 8: Governance Command Center

Deliver:

- Security posture.
- RLS posture.
- Permission drift.
- Workflow governance.
- ALICE governance.
- Deployment risk.
- Audit completeness.
- Integration governance.

Success:

- Platform governance becomes executive-visible without duplicating Mission Control.

## Implementation Sequence

Recommended order:

1. Setup shell and route protection.
2. Setup Audit Trail.
3. Permission model.
4. Organization and User Managers.
5. Object Manager.
6. Workflow Administration.
7. Automation Registry.
8. ALICE Administration.
9. Integration Center.
10. Deployment Center.
11. Governance Command Center.

## Data Model Sequence

Recommended migrations:

1. `setup_audit_trail`
2. `permission_sets` and assignments.
3. Object metadata tables.
4. Workflow administration metadata.
5. ALICE administration metadata.
6. Integration administration metadata.
7. Deployment center metadata.
8. Governance posture snapshots.

## Validation Plan

Run:

- `npm run lint`
- `npm run build`
- `npm run test:e2e`
- migration validation
- role access tests
- audit write tests
- tenant isolation tests

## Success Criteria

- Zenith has a centralized administration layer.
- No duplicate systems are created.
- All setup changes are auditable.
- All admin actions are permissioned.
- Workflow OS, ALICE, Mission Control, Runtime OS, and Patient Revenue Engine remain distinct.
