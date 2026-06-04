# Billing Framework Report

Date: 2026-06-01

## Required Commercial Capabilities

Implemented in `buildBillingFramework`.

- Subscriptions
- Invoices
- Usage Tracking
- Plan Management
- Renewals
- Expansion Tracking

## Framework

- Subscriptions map to Starter, Growth, Professional, and Enterprise tiers.
- Invoices combine plan fees, implementation fees, managed services, and usage add-ons.
- Usage tracking uses metered product catalog units.
- Plan management uses the existing product catalog and subscription governance.
- Renewals begin 90 days before contract end.
- Expansion tracking separates additional playbooks, locations, providers, AI services, and managed services from base MRR.

## Status

Billing and subscription framework is commercially defined and compatible with existing platform-core subscription governance.
