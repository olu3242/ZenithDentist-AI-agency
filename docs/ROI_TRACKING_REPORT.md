# ROI Tracking Report

Date: 2026-06-01

## Required Formulas

Implemented in `calculatePilotRoi` in `lib/pilot-operations.ts`.

- Recovered Revenue = `patientsRecovered * averageAppointmentValue`
- Generated Revenue = `newPatientsGenerated * averageNewPatientValue`
- Protected Revenue = `appointmentsSaved * averageAppointmentValue`
- Operational Hours Saved = direct tracked value
- Attributable ROI = `((recovered + generated + protected + hoursValue - monthlyInvestment) / monthlyInvestment) * 100`

## Dashboard Surface

Existing ROI surfaces remain authoritative:

- Admin ROI dashboard: `/admin/roi`
- Portal revenue dashboard: `/portal/revenue`
- Mission Control analytics projection: `analyticsProjector`

## Status

ROI tracking formulas are implemented and ready to populate pilot reporting.
