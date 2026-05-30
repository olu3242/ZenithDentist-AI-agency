import "server-only";

/**
 * Extension Registry — canonical catalog of all available marketplace extensions.
 * Extensions add integrations and workflow packs without modifying the core runtime.
 */

export type ExtensionCategory =
  | "pms_integration"
  | "marketing_integration"
  | "telephony_integration"
  | "ai_extension"
  | "analytics_extension"
  | "workflow_pack"
  | "industry_pack"
  | "automation_pack";

export type ExtensionStatus = "available" | "beta" | "deprecated" | "coming_soon";

export interface Extension {
  id: string;
  name: string;
  description: string;
  version: string;
  category: ExtensionCategory;
  status: ExtensionStatus;
  vendor: string;
  requiredCapabilities: string[];
  workflowIds: string[];
  configSchema: Record<string, { type: string; required: boolean; description: string }>;
}

export const EXTENSION_REGISTRY: Extension[] = [
  {
    id: "open_dental",
    name: "OpenDental Integration",
    description: "Bi-directional sync with OpenDental PMS: patients, appointments, billing.",
    version: "1.0.0",
    category: "pms_integration",
    status: "available",
    vendor: "Zenith",
    requiredCapabilities: ["recall_automation", "treatment_reactivation"],
    workflowIds: ["recall_due", "appointment_no_show", "reactivation_candidate_detected"],
    configSchema: {
      api_url:   { type: "string",  required: true,  description: "OpenDental API base URL" },
      api_key:   { type: "string",  required: true,  description: "OpenDental API key" },
      sync_interval_minutes: { type: "number", required: false, description: "Sync interval" },
    },
  },
  {
    id: "google_business",
    name: "Google Business Profile",
    description: "Review request delivery and reputation tracking via Google Business.",
    version: "1.0.0",
    category: "marketing_integration",
    status: "available",
    vendor: "Zenith",
    requiredCapabilities: ["review_automation"],
    workflowIds: ["review_request_due"],
    configSchema: {
      location_id: { type: "string", required: true, description: "Google Business location ID" },
    },
  },
  {
    id: "twilio_telephony",
    name: "Twilio Telephony",
    description: "Missed call detection and callback orchestration via Twilio.",
    version: "1.0.0",
    category: "telephony_integration",
    status: "available",
    vendor: "Zenith",
    requiredCapabilities: ["missed_call_recovery"],
    workflowIds: ["missed_call_detected"],
    configSchema: {
      account_sid:  { type: "string", required: true,  description: "Twilio Account SID" },
      auth_token:   { type: "string", required: true,  description: "Twilio Auth Token" },
      phone_number: { type: "string", required: true,  description: "Twilio phone number" },
    },
  },
  {
    id: "resend_email",
    name: "Resend Email",
    description: "Transactional email delivery for patient communications.",
    version: "1.0.0",
    category: "marketing_integration",
    status: "available",
    vendor: "Zenith",
    requiredCapabilities: [],
    workflowIds: [],
    configSchema: {
      api_key:      { type: "string", required: true,  description: "Resend API key" },
      from_address: { type: "string", required: true,  description: "From email address" },
    },
  },
  {
    id: "stripe_billing",
    name: "Stripe Billing",
    description: "Payment processing and revenue recovery via Stripe.",
    version: "1.0.0",
    category: "pms_integration",
    status: "available",
    vendor: "Zenith",
    requiredCapabilities: ["revenue_recovery"],
    workflowIds: ["unpaid_invoice_detected", "failed_payment_detected"],
    configSchema: {
      secret_key:      { type: "string", required: true, description: "Stripe secret key" },
      webhook_secret:  { type: "string", required: true, description: "Stripe webhook secret" },
    },
  },
  {
    id: "dental_growth_pack",
    name: "Dental Growth Pack",
    description: "Bundled workflow pack: recall + review + reactivation + revenue recovery.",
    version: "1.0.0",
    category: "workflow_pack",
    status: "available",
    vendor: "Zenith",
    requiredCapabilities: ["recall_automation", "review_automation", "treatment_reactivation", "revenue_recovery"],
    workflowIds: ["recall_due", "review_request_due", "reactivation_candidate_detected", "unpaid_invoice_detected"],
    configSchema: {},
  },
  {
    id: "calendly_scheduling",
    name: "Calendly Scheduling",
    description: "Inbound booking and appointment scheduling via Calendly.",
    version: "1.0.0",
    category: "marketing_integration",
    status: "available",
    vendor: "Zenith",
    requiredCapabilities: ["lead_nurture"],
    workflowIds: ["lead_created"],
    configSchema: {
      api_token: { type: "string", required: true, description: "Calendly API token" },
    },
  },
  // ── Dental Blueprint Automation Packs ──────────────────────────────────────
  {
    id: "recall_recovery_pack",
    name: "Recall Recovery Pack",
    description: "Automated recall outreach sequences that re-engage overdue patients and fill hygiene chairs.",
    version: "1.0.0",
    category: "automation_pack",
    status: "available",
    vendor: "Zenith",
    requiredCapabilities: ["recall_automation"],
    workflowIds: ["recall_due"],
    configSchema: {
      recall_window_days: { type: "number", required: false, description: "Days past due to trigger recall sequence" },
      message_channel:    { type: "string", required: false, description: "Preferred outreach channel: sms | email | both" },
    },
  },
  {
    id: "patient_reactivation_pack",
    name: "Patient Reactivation Pack",
    description: "Re-engages lapsed patients with personalised AI messaging to recover lost production.",
    version: "1.0.0",
    category: "automation_pack",
    status: "available",
    vendor: "Zenith",
    requiredCapabilities: ["treatment_reactivation"],
    workflowIds: ["reactivation_candidate_detected"],
    configSchema: {
      lapse_threshold_days: { type: "number", required: false, description: "Days inactive before patient is a reactivation candidate" },
      offer_incentive:      { type: "boolean", required: false, description: "Include a reactivation offer in outreach" },
    },
  },
  {
    id: "review_growth_pack",
    name: "Review Growth Pack",
    description: "Automated post-visit review requests that grow Google star-rating and new patient flow.",
    version: "1.0.0",
    category: "automation_pack",
    status: "available",
    vendor: "Zenith",
    requiredCapabilities: ["review_automation"],
    workflowIds: ["review_request_due"],
    configSchema: {
      request_delay_hours: { type: "number", required: false, description: "Hours after appointment to send review request" },
      google_location_id:  { type: "string", required: false, description: "Google Business location ID for review link" },
    },
  },
  {
    id: "insurance_verification_pack",
    name: "Insurance Verification Pack",
    description: "Automated pre-appointment insurance eligibility verification to reduce claim denials.",
    version: "1.0.0",
    category: "automation_pack",
    status: "available",
    vendor: "Zenith",
    requiredCapabilities: ["insurance_verification"],
    workflowIds: ["insurance_verification"],
    configSchema: {
      verification_lead_days: { type: "number", required: false, description: "Days before appointment to verify insurance" },
      payer_portal_url:       { type: "string", required: false, description: "Insurance payer portal URL" },
    },
  },
  {
    id: "treatment_followup_pack",
    name: "Treatment Follow-Up Pack",
    description: "Post-treatment follow-up sequences to improve acceptance, compliance, and patient satisfaction.",
    version: "1.0.0",
    category: "automation_pack",
    status: "available",
    vendor: "Zenith",
    requiredCapabilities: ["treatment_followup"],
    workflowIds: ["treatment_followup"],
    configSchema: {
      followup_delay_hours: { type: "number", required: false, description: "Hours after treatment to send follow-up" },
      include_care_tips:    { type: "boolean", required: false, description: "Include post-treatment care tips in message" },
    },
  },
  {
    id: "missed_appointment_recovery_pack",
    name: "Missed Appointment Recovery Pack",
    description: "Instant no-show detection and same-day rebooking sequences to protect chair revenue.",
    version: "1.0.0",
    category: "automation_pack",
    status: "available",
    vendor: "Zenith",
    requiredCapabilities: ["missed_call_recovery"],
    workflowIds: ["appointment_no_show"],
    configSchema: {
      rebook_window_hours: { type: "number", required: false, description: "Hours after no-show to attempt rebooking" },
      escalate_to_staff:   { type: "boolean", required: false, description: "Notify front-desk if automated rebook fails" },
    },
  },
];

export function getExtension(id: string): Extension | undefined {
  return EXTENSION_REGISTRY.find(e => e.id === id);
}

export function getExtensionsByCategory(category: ExtensionCategory): Extension[] {
  return EXTENSION_REGISTRY.filter(e => e.category === category);
}

export function getAvailableExtensions(): Extension[] {
  return EXTENSION_REGISTRY.filter(e => e.status === "available" || e.status === "beta");
}
