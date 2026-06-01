# Autonomy Maturity Framework

## Levels

| Level | Name | Behavior |
| --- | --- | --- |
| 0 | Observe | Agents only observe and report |
| 1 | Recommend | Agents recommend actions |
| 2 | Recommend + Approval | Human approval required before execution |
| 3 | Execute Approved Actions | Approved playbooks execute autonomously |
| 4 | Autonomous Operations | Routine events execute, recover, verify, and learn |

## Default Recommendation

Production tenants should begin at Level 1 or Level 2. Level 3 is suitable for bounded recovery and approved playbooks. Level 4 requires durable outcome tracking, governance evidence, and rollback proof.
