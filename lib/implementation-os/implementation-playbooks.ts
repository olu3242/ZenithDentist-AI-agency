import "server-only";

/**
 * Implementation Playbooks — canonical onboarding sequences for new dental practices.
 * Every practice follows a structured playbook from sign-up to go-live.
 */

export type PlaybookStage =
  | "contract_signed"
  | "kickoff_scheduled"
  | "practice_setup"
  | "integration_setup"
  | "workflow_activation"
  | "staff_training"
  | "roi_baseline"
  | "go_live"
  | "adoption_review";

export interface PlaybookStep {
  id: string;
  stage: PlaybookStage;
  title: string;
  description: string;
  owner: "zenith" | "practice" | "joint";
  estimatedDays: number;
  blockers: string[];
  successCriteria: string;
  automatable: boolean;
}

export interface ImplementationPlaybook {
  id: string;
  name: string;
  plan: string;
  estimatedDays: number;
  stages: PlaybookStage[];
  steps: PlaybookStep[];
}

export const STANDARD_PLAYBOOK: ImplementationPlaybook = {
  id: "standard_dental_onboarding",
  name: "Standard Dental Practice Onboarding",
  plan: "growth",
  estimatedDays: 14,
  stages: [
    "contract_signed", "kickoff_scheduled", "practice_setup",
    "integration_setup", "workflow_activation", "staff_training",
    "roi_baseline", "go_live", "adoption_review"
  ],
  steps: [
    {
      id: "s1", stage: "contract_signed",
      title: "Welcome email + credentials delivered",
      description: "Automated welcome email, portal login, and onboarding checklist sent.",
      owner: "zenith", estimatedDays: 0, blockers: [], automatable: true,
      successCriteria: "Practice admin logged into portal."
    },
    {
      id: "s2", stage: "kickoff_scheduled",
      title: "Kickoff call scheduled",
      description: "30-min kickoff with practice owner and implementation specialist.",
      owner: "joint", estimatedDays: 2, blockers: ["calendar access"], automatable: false,
      successCriteria: "Kickoff completed, goals documented."
    },
    {
      id: "s3", stage: "practice_setup",
      title: "Organization profile configured",
      description: "Practice name, locations, team members, and branding configured.",
      owner: "practice", estimatedDays: 1, blockers: [], automatable: false,
      successCriteria: "Organization profile complete in portal."
    },
    {
      id: "s4", stage: "integration_setup",
      title: "PMS integration connected",
      description: "OpenDental or compatible PMS connected and sync verified.",
      owner: "joint", estimatedDays: 3, blockers: ["PMS credentials", "IT access"], automatable: false,
      successCriteria: "First sync completed, patient records visible."
    },
    {
      id: "s5", stage: "integration_setup",
      title: "Communication channels connected",
      description: "Email (Resend) and telephony (Twilio) configured and tested.",
      owner: "zenith", estimatedDays: 1, blockers: ["phone number selection"], automatable: true,
      successCriteria: "Test message delivered successfully."
    },
    {
      id: "s6", stage: "workflow_activation",
      title: "Recall workflow activated",
      description: "Patient recall automation enabled and first run scheduled.",
      owner: "zenith", estimatedDays: 1, blockers: ["PMS sync confirmed"], automatable: true,
      successCriteria: "First recall batch queued."
    },
    {
      id: "s7", stage: "workflow_activation",
      title: "Review and revenue workflows activated",
      description: "Review request and revenue recovery automations enabled.",
      owner: "zenith", estimatedDays: 1, blockers: [], automatable: true,
      successCriteria: "All 3 core workflows in executing state."
    },
    {
      id: "s8", stage: "staff_training",
      title: "Portal training completed",
      description: "Practice staff trained on portal, reports, and ALICE copilot.",
      owner: "zenith", estimatedDays: 2, blockers: [], automatable: false,
      successCriteria: "≥ 2 staff logged in, dashboard reviewed."
    },
    {
      id: "s9", stage: "roi_baseline",
      title: "ROI baseline established",
      description: "Current recall rate, review count, and revenue recovery documented.",
      owner: "joint", estimatedDays: 1, blockers: ["30-day data available"], automatable: true,
      successCriteria: "Baseline KPIs locked in portal."
    },
    {
      id: "s10", stage: "go_live",
      title: "Go-live confirmed",
      description: "All workflows running, team trained, ROI baseline set. Customer operational.",
      owner: "zenith", estimatedDays: 0, blockers: [], automatable: true,
      successCriteria: "Health score ≥ 70, all workflows active."
    },
    {
      id: "s11", stage: "adoption_review",
      title: "30-day adoption review",
      description: "Review first-month results, address gaps, plan expansion.",
      owner: "joint", estimatedDays: 30, blockers: [], automatable: false,
      successCriteria: "QBR report generated, expansion opportunity identified."
    },
  ],
};

export function getPlaybookForPlan(plan: string): ImplementationPlaybook {
  return { ...STANDARD_PLAYBOOK, plan };
}
