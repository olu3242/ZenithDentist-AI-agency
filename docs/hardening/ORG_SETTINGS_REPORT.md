# Org Settings Report

**Sprint:** Enterprise Tenant
**Score:** 76 / 100 — GO

---

## Summary

Organization settings are initialized at provisioning time and can be read and updated through the tenant integrations API. Settings cover branding, notifications, AI configuration, and automation preferences. Application-layer validation guards all configuration fields.

---

## Settings Domains

| Domain | Fields Covered |
|---|---|
| Branding | Practice name, logo URL, primary color, secondary color |
| Notifications | Email enabled, SMS enabled, notification frequency |
| AI | Default model, AI feature flags, response tone |
| Automation | Default workflow triggers, automation cadence |

---

## Provisioning Behavior

organization_settings are upserted during step 1 of provisionOrganization(). If settings already exist for the organization (e.g. reprovisioning after a failed setup), the upsert safely overwrites only default-value fields without touching user-customized settings.

---

## API Endpoints

- GET /api/tenant/integrations — reads all organization settings and integration records for the authenticated org
- POST /api/tenant/integrations — creates or updates an integration configuration

---

## Integration Types Managed

12 integration types across 7 categories are managed through the same settings layer as organization configuration. See INTEGRATION_REPORT.md for the full registry.

---

## Validation

All configuration fields are validated at the application layer before writing to organization_settings. Invalid values produce VALIDATION_ERROR (VAL_002) with the field name and expected format in the error message.

---

## Findings

- Score of 76 reflects that some advanced settings (AI fine-tuning, custom automation templates) are readable but not yet writable through the API
- Upsert-on-provision behavior prevents duplicate settings records for orgs that restart onboarding
- Branding settings are currently stored as plain strings; URL validation for logo_url is enforced at write time

---

## Recommendations

- Add a PATCH /api/tenant/settings endpoint for partial settings updates without touching integration records
- Expose branding settings to the UI settings page so practice managers can customize their portal appearance
- Add settings change events to the audit timeline for compliance tracking
