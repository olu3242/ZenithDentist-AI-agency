export type PersonaKey =
  | 'practice_owner'
  | 'office_manager'
  | 'treatment_coordinator'
  | 'marketing_coordinator'
  | 'front_desk'
  | 'dso_executive'
  | 'zenith_admin';

export interface PersonaConfig {
  key: PersonaKey;
  displayName: string;
  description: string;
  defaultRoute: string;
  nav: Array<{ href: string; label: string; iconName: string }>;
  kpis: Array<{ key: string; label: string; tone: string }>;
  workflows: string[];
  reports: string[];
  alicePrompt: string;
}

export const PERSONAS: Record<PersonaKey, PersonaConfig> = {
  practice_owner: {
    key: 'practice_owner',
    displayName: 'Practice Owner',
    description: 'Revenue, growth, and operational overview',
    defaultRoute: '/portal',
    nav: [
      { href: '/portal', label: 'Dashboard', iconName: 'LayoutDashboard' },
      { href: '/portal/revenue', label: 'Revenue', iconName: 'TrendingUp' },
      { href: '/portal/recall', label: 'Recall', iconName: 'RefreshCw' },
      { href: '/portal/patients', label: 'Patients', iconName: 'Users' },
      { href: '/portal/reports', label: 'Reports', iconName: 'FileText' },
    ],
    kpis: [
      { key: 'monthly_production', label: 'Monthly Production', tone: 'primary' },
      { key: 'collection_rate', label: 'Collection Rate', tone: 'success' },
      { key: 'recall_recovery', label: 'Recall Recovery', tone: 'accent' },
      { key: 'no_show_rate', label: 'No-Show Rate', tone: 'warning' },
    ],
    workflows: ['recall_due', 'appointment_no_show', 'treatment_followup_due', 'review_request_due'],
    reports: ['executive_summary', 'revenue_report', 'practice_health'],
    alicePrompt: 'You are advising a dental practice owner focused on revenue growth and operational excellence.',
  },
  office_manager: {
    key: 'office_manager',
    displayName: 'Office Manager',
    description: 'Operations, scheduling, and front office management',
    defaultRoute: '/portal',
    nav: [
      { href: '/portal', label: 'Dashboard', iconName: 'LayoutDashboard' },
      { href: '/portal/recall', label: 'Recall', iconName: 'RefreshCw' },
      { href: '/portal/patients', label: 'Patients', iconName: 'Users' },
      { href: '/portal/locations', label: 'Locations', iconName: 'Building2' },
    ],
    kpis: [
      { key: 'recall_recovery', label: 'Recall Recovery', tone: 'accent' },
      { key: 'no_show_rate', label: 'No-Show Rate', tone: 'warning' },
      { key: 'chair_utilization', label: 'Chair Utilization', tone: 'primary' },
      { key: 'open_appointments', label: 'Open Slots', tone: 'success' },
    ],
    workflows: ['recall_due', 'appointment_no_show', 'chair_fill_opportunity'],
    reports: ['operations_report', 'recall_report', 'scheduling_report'],
    alicePrompt: 'You are advising a dental office manager focused on scheduling efficiency and patient flow.',
  },
  treatment_coordinator: {
    key: 'treatment_coordinator',
    displayName: 'Treatment Coordinator',
    description: 'Treatment plans, case acceptance, and patient follow-up',
    defaultRoute: '/portal',
    nav: [
      { href: '/portal', label: 'Dashboard', iconName: 'LayoutDashboard' },
      { href: '/portal/patients', label: 'Patients', iconName: 'Users' },
      { href: '/portal/revenue', label: 'Treatment Revenue', iconName: 'TrendingUp' },
    ],
    kpis: [
      { key: 'treatment_acceptance', label: 'Acceptance Rate', tone: 'success' },
      { key: 'treatment_pipeline', label: 'Pipeline Value', tone: 'primary' },
      { key: 'followup_pending', label: 'Follow-ups Due', tone: 'warning' },
    ],
    workflows: ['treatment_followup_due'],
    reports: ['treatment_acceptance_report'],
    alicePrompt: 'You are advising a dental treatment coordinator focused on case acceptance and patient education.',
  },
  marketing_coordinator: {
    key: 'marketing_coordinator',
    displayName: 'Marketing Coordinator',
    description: 'Reviews, referrals, and new patient growth',
    defaultRoute: '/portal',
    nav: [
      { href: '/portal', label: 'Dashboard', iconName: 'LayoutDashboard' },
      { href: '/portal/reviews', label: 'Reviews', iconName: 'Star' },
      { href: '/portal/patients', label: 'Patients', iconName: 'Users' },
    ],
    kpis: [
      { key: 'review_count', label: 'Reviews This Month', tone: 'success' },
      { key: 'avg_rating', label: 'Avg Rating', tone: 'accent' },
      { key: 'referrals', label: 'Referrals', tone: 'primary' },
      { key: 'new_patients', label: 'New Patients', tone: 'secondary' },
    ],
    workflows: ['review_request_due', 'referral_detected'],
    reports: ['marketing_report', 'review_report'],
    alicePrompt: 'You are advising a dental marketing coordinator focused on online reputation and new patient growth.',
  },
  front_desk: {
    key: 'front_desk',
    displayName: 'Front Desk',
    description: 'Daily appointments, reminders, and patient communication',
    defaultRoute: '/portal',
    nav: [
      { href: '/portal', label: 'Dashboard', iconName: 'LayoutDashboard' },
      { href: '/portal/patients', label: 'Patients', iconName: 'Users' },
      { href: '/portal/recall', label: 'Recall', iconName: 'RefreshCw' },
    ],
    kpis: [
      { key: 'todays_appointments', label: "Today's Appointments", tone: 'primary' },
      { key: 'unconfirmed', label: 'Unconfirmed', tone: 'warning' },
      { key: 'recalls_due', label: 'Recalls Due', tone: 'accent' },
    ],
    workflows: ['appointment_no_show', 'recall_due'],
    reports: ['daily_schedule'],
    alicePrompt: 'You are assisting a dental front desk team member focused on daily patient appointments and communication.',
  },
  dso_executive: {
    key: 'dso_executive',
    displayName: 'DSO Executive',
    description: 'Multi-location revenue, group performance, and enterprise analytics',
    defaultRoute: '/portal',
    nav: [
      { href: '/portal', label: 'Executive Dashboard', iconName: 'LayoutDashboard' },
      { href: '/portal/locations', label: 'Locations', iconName: 'Building2' },
      { href: '/portal/revenue', label: 'Revenue', iconName: 'TrendingUp' },
      { href: '/portal/reports', label: 'Reports', iconName: 'FileText' },
    ],
    kpis: [
      { key: 'group_production', label: 'Group Production', tone: 'primary' },
      { key: 'group_collection', label: 'Group Collection', tone: 'success' },
      { key: 'locations_count', label: 'Locations', tone: 'secondary' },
      { key: 'top_performer', label: 'Top Location', tone: 'accent' },
    ],
    workflows: [],
    reports: ['executive_summary', 'group_performance', 'location_comparison'],
    alicePrompt: 'You are advising a DSO executive focused on multi-location performance, group revenue, and enterprise growth.',
  },
  zenith_admin: {
    key: 'zenith_admin',
    displayName: 'Zenith Admin',
    description: 'Platform administration, tenant management, and system health',
    defaultRoute: '/internal',
    nav: [
      { href: '/internal', label: 'Admin Dashboard', iconName: 'Shield' },
      { href: '/internal/organizations', label: 'Organizations', iconName: 'Building2' },
      { href: '/internal/mission-control', label: 'Executive Dashboard', iconName: 'Radar' },
      { href: '/internal/health', label: 'Health', iconName: 'Activity' },
    ],
    kpis: [
      { key: 'active_orgs', label: 'Active Orgs', tone: 'primary' },
      { key: 'total_workflows', label: 'Workflows Run', tone: 'accent' },
      { key: 'error_rate', label: 'Error Rate', tone: 'danger' },
      { key: 'uptime', label: 'Uptime', tone: 'success' },
    ],
    workflows: [],
    reports: ['platform_health', 'tenant_report'],
    alicePrompt: 'You are advising the Zenith platform administrator focused on system health, tenant success, and platform reliability.',
  },
};

export function getPersonaConfig(key: PersonaKey): PersonaConfig {
  return PERSONAS[key];
}

export function getPersonaByRole(role: string): PersonaKey {
  const mapping: Record<string, PersonaKey> = {
    platform_admin: 'zenith_admin',
    super_admin: 'zenith_admin',
    organization_owner: 'practice_owner',
    practice_manager: 'office_manager',
    staff: 'front_desk',
    read_only: 'front_desk',
  };
  return mapping[role] ?? 'front_desk';
}
