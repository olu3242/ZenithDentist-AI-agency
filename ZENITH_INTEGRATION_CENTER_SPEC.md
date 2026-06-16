# Zenith Integration Center Spec

## Purpose

The Integration Center centralizes setup, connection health, sync posture, errors, and governance for external systems connected to Zenith.

It does not replace integration adapters, Workflow OS, Runtime OS, or Mission Control. It administers and monitors integration configuration.

## Managed Integrations

Initial integrations:

- Open Dental
- Dentrix
- Eaglesoft
- Twilio
- Stripe
- Calendly
- Resend
- OpenAI
- Anthropic

## Integration Record

Each integration should expose:

- Integration key.
- Provider name.
- Category.
- Organization id.
- Connection status.
- Health score.
- Sync status.
- Last sync.
- Last successful sync.
- Last error.
- Error count.
- Credential status.
- Required environment variables.
- Owning Zenith layer.
- Workflow dependencies.
- Runtime dependency status.

## Integration Categories

Categories:

- PMS.
- Communications.
- Payments.
- Scheduling.
- Email.
- AI model provider.
- Analytics.
- Internal platform.

## Status Values

Connection status:

- Not configured.
- Pending.
- Connected.
- Degraded.
- Failed.
- Disabled.

Sync status:

- Idle.
- Syncing.
- Successful.
- Delayed.
- Failed.
- Replay required.

Credential status:

- Missing.
- Valid.
- Expiring.
- Expired.
- Rotated.
- Revoked.

## Health Score

Health score should combine:

- Credential validity.
- Last sync recency.
- Error rate.
- Runtime trace success.
- Queue delay.
- Data freshness.
- Required workflow dependency readiness.

## Integration Detail Page

Each integration detail page includes:

- Overview.
- Credentials.
- Health.
- Sync history.
- Errors.
- Workflow dependencies.
- Field mappings.
- Data quality.
- Audit trail.

## PMS Integrations

PMS integration setup should support:

- Open Dental.
- Dentrix.
- Eaglesoft.

PMS-specific views:

- Appointment sync.
- Patient sync.
- Provider sync.
- Claims sync.
- Treatment plan sync.
- Recall sync.
- Data quality score.
- Mapping coverage.

## Communications Integrations

Twilio:

- Account status.
- Sender status.
- Delivery errors.
- Message throughput.
- Workflow dependencies.

Resend:

- Domain verification.
- Sender status.
- Delivery errors.
- Email throughput.

## Payment Integrations

Stripe:

- Account status.
- Webhook health.
- Product and price sync.
- Subscription status sync.
- Payment event health.

## AI Provider Integrations

OpenAI and Anthropic:

- Credential status.
- Model registry availability.
- Request health.
- Rate limit posture.
- Error posture.
- ALICE dependency status.

## Audit Requirements

Audit every integration action:

- Connect.
- Disconnect.
- Rotate secret.
- Update mapping.
- Enable sync.
- Disable sync.
- Retry sync.
- Replay failed event.
- Change provider configuration.

## Data Model

Recommended tables:

- `integration_connections`
- `integration_health_scores`
- `integration_sync_runs`
- `integration_errors`
- `integration_field_mappings`
- `integration_credentials_metadata`

Secrets should not be stored directly in normal application tables. Store metadata and use secure environment or secret manager patterns.

## UI Requirements

- Integration catalog.
- Status badges.
- Health score cards.
- Sync history table.
- Error detail drawer.
- Mapping coverage view.
- Dependency map to workflows.
- Credential rotation flow.

## Success Criteria

- Administrators can see all integration health in one place.
- Integration configuration is auditable.
- Workflow dependencies are clear.
- PMS readiness and data quality are visible.
- No integration center feature duplicates Runtime OS execution or Mission Control operations.
