# Debug Center Certification

Status: PARTIAL

Implemented:

- `/internal/debug`
- Canonical debug/recovery tables: `system_failures`, `debug_events`, `recovery_actions`, `failure_patterns`, `recovery_results`
- Live runtime event feed and provider degradation visibility

Certification blockers:

- Mutating recovery orchestration actions
- Automatic write-through from failures to recovery records
- Verification events from recovery completion
