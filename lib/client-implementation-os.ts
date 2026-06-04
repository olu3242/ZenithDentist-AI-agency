import "server-only";

import { getTenantData } from "@/lib/data/tenants";
import { createServiceClient } from "@/lib/supabase/server";
import { getImplementationIntelligenceState, type ImplementationIntelligenceState } from "@/lib/implementation-intelligence";

export type ImplementationPhase = "signed" | "discovery" | "configuration" | "integration" | "testing" | "training" | "go_live" | "optimization" | "completed";
export type ImplementationSection = "implementations" | "onboarding" | "integrations-readiness" | "training" | "adoption" | "go-live" | "client-playbooks";
export type ClientOperatingLifecycleStage = "onboarded" | "activated" | "optimized" | "scaled" | "renewed" | "expanded";

export interface OperatingPlaybookItemTemplate {
  playbookKey: string;
  section: string;
  key: string;
  label: string;
  ownerRole: string;
  dueOffsetDays: number;
  evidenceType: string | null;
}

export interface OperatingPlaybookTemplate {
  key: string;
  name: string;
  lifecycleStage: ClientOperatingLifecycleStage;
  cadence: string;
  objective: string;
  successMetrics: string[];
  items: OperatingPlaybookItemTemplate[];
}

export const implementationPhases: ImplementationPhase[] = ["signed", "discovery", "configuration", "integration", "testing", "training", "go_live", "optimization", "completed"];

export const implementationBlueprints = [
  {
    key: "revenue_recovery",
    name: "Revenue Recovery",
    packageKey: "revenue_recovery",
    integrations: ["Open Dental", "Stripe", "Email", "SMS"],
    data: ["Patient recall list", "No-show history", "Treatment plan backlog", "Revenue baseline"],
    training: ["Practice Owner", "Office Manager", "Front Desk"],
    workflows: ["Recall Recovery", "No Show Recovery", "Treatment Recovery", "Reactivation"],
    successCriteria: ["Recall workflow active", "No-show workflow active", "Revenue baseline captured", "First recovery report generated"]
  },
  {
    key: "ai_growth",
    name: "AI Growth",
    packageKey: "ai_growth",
    integrations: ["Google Business Profile", "Meta", "Email", "SMS"],
    data: ["Review baseline", "Referral sources", "Lead funnel", "Campaign assets"],
    training: ["Practice Owner", "Marketing Coordinator", "Front Desk"],
    workflows: ["Review Generation", "Referral Growth", "Lead Nurture", "Reputation Recovery"],
    successCriteria: ["Review campaign active", "Referral workflow configured", "Lead nurture live", "Growth dashboard reporting"]
  },
  {
    key: "managed_ai_operations",
    name: "Managed AI Operations",
    packageKey: "managed_ai_operations",
    integrations: ["Open Dental", "Stripe", "Google", "Calendly", "Email", "SMS", "WhatsApp"],
    data: ["Full PMS baseline", "Provider roster", "Locations", "Financial baseline", "Workflow inventory"],
    training: ["Practice Owner", "Office Manager", "Front Desk", "Provider"],
    workflows: ["Recall Recovery", "Treatment Recovery", "Review Generation", "Schedule Optimization", "AI Revenue Intelligence recommendations"],
    successCriteria: ["All required integrations connected", "Training certified", "Go-live checklist passed", "30-day success review scheduled"]
  }
] as const;

export const implementationChecklistTemplates = [
  checklist("client_info", "contacts", "practice_name", "Practice Name", "implementation_owner", 1, "CLIENT_PROFILE"),
  checklist("client_info", "contacts", "primary_contact", "Primary Contact", "implementation_owner", 1, "CLIENT_PROFILE"),
  checklist("client_info", "contacts", "practice_owner", "Practice Owner", "customer_success", 1, "CLIENT_PROFILE"),
  checklist("client_info", "contacts", "office_manager", "Office Manager", "customer_success", 1, "CLIENT_PROFILE"),
  checklist("client_info", "contacts", "billing_contact", "Billing Contact", "billing", 1, "BILLING_PROFILE"),
  checklist("client_info", "contacts", "support_contact", "Support Contact", "support", 1, "SUPPORT_PROFILE"),
  checklist("client_info", "commercial", "contract_signed", "Contract Signed", "sales", 1, "CONTRACT_EVENT", true),
  checklist("client_info", "commercial", "initial_invoice_paid", "Initial Invoice Paid", "billing", 2, "PAYMENT_EVENT", true),
  checklist("commercial_onboarding", "contract_billing", "contract_executed", "Contract Executed", "sales", 1, "CONTRACT_EVENT", true),
  checklist("commercial_onboarding", "contract_billing", "nda_signed", "NDA Signed", "sales", 2, "CONTRACT_EVENT"),
  checklist("commercial_onboarding", "contract_billing", "stripe_customer_created", "Stripe Customer Created", "billing", 2, "PAYMENT_EVENT", true),
  checklist("commercial_onboarding", "contract_billing", "subscription_created", "Subscription Created", "billing", 2, "PAYMENT_EVENT", true),
  checklist("commercial_onboarding", "contract_billing", "setup_fee_paid", "Setup Fee Paid", "billing", 3, "PAYMENT_EVENT", true),
  checklist("commercial_onboarding", "contract_billing", "monthly_billing_activated", "Monthly Billing Activated", "billing", 3, "PAYMENT_EVENT", true),
  checklist("commercial_onboarding", "package", "package_assigned", "Package Assigned", "implementation_owner", 2, "PACKAGE_ASSIGNMENT", true),
  checklist("practice_discovery", "practice_profile", "practice_name_verified", "Practice Name Verified", "implementation_owner", 3, "DISCOVERY_EVENT"),
  checklist("practice_discovery", "practice_profile", "practice_address", "Practice Address", "implementation_owner", 3, "DISCOVERY_EVENT"),
  checklist("practice_discovery", "practice_profile", "phone_number", "Phone Number", "implementation_owner", 3, "DISCOVERY_EVENT"),
  checklist("practice_discovery", "practice_profile", "website", "Website", "implementation_owner", 3, "DISCOVERY_EVENT"),
  checklist("practice_discovery", "practice_profile", "number_of_locations", "Number of Locations", "implementation_owner", 4, "DISCOVERY_EVENT"),
  checklist("practice_discovery", "practice_profile", "number_of_providers", "Number of Providers", "implementation_owner", 4, "DISCOVERY_EVENT"),
  checklist("practice_discovery", "practice_profile", "number_of_operatories", "Number of Operatories", "implementation_owner", 4, "DISCOVERY_EVENT"),
  checklist("practice_discovery", "practice_profile", "pms_identified", "PMS Identified", "implementation_owner", 4, "INTEGRATION_EVENT", true),
  checklist("practice_discovery", "current_challenges", "recall_problems", "Recall Problems", "implementation_owner", 5, "DISCOVERY_EVENT"),
  checklist("practice_discovery", "current_challenges", "treatment_acceptance_problems", "Treatment Acceptance Problems", "implementation_owner", 5, "DISCOVERY_EVENT"),
  checklist("practice_discovery", "current_challenges", "review_problems", "Review Problems", "implementation_owner", 5, "DISCOVERY_EVENT"),
  checklist("practice_discovery", "current_challenges", "collection_problems", "Collection Problems", "implementation_owner", 5, "DISCOVERY_EVENT"),
  checklist("practice_discovery", "current_challenges", "no_show_problems", "No-Show Problems", "implementation_owner", 5, "DISCOVERY_EVENT"),
  checklist("practice_discovery", "current_challenges", "reactivation_problems", "Reactivation Problems", "implementation_owner", 5, "DISCOVERY_EVENT"),
  checklist("technical_onboarding", "open_dental", "access_credentials_received", "Open Dental Access Credentials Received", "implementation_owner", 6, "INTEGRATION_EVENT", true),
  checklist("technical_onboarding", "open_dental", "database_connection_verified", "Open Dental Database Connection Verified", "implementation_owner", 7, "INTEGRATION_EVENT", true),
  checklist("technical_onboarding", "open_dental", "patient_sync_tested", "Patient Sync Tested", "implementation_owner", 8, "PMS_SYNC_EVENT", true),
  checklist("technical_onboarding", "open_dental", "appointment_sync_tested", "Appointment Sync Tested", "implementation_owner", 8, "PMS_SYNC_EVENT", true),
  checklist("technical_onboarding", "open_dental", "provider_sync_tested", "Provider Sync Tested", "implementation_owner", 8, "PMS_SYNC_EVENT"),
  checklist("technical_onboarding", "open_dental", "treatment_sync_tested", "Treatment Sync Tested", "implementation_owner", 8, "PMS_SYNC_EVENT"),
  checklist("technical_onboarding", "other_pms", "integration_method_approved", "Integration Method Approved", "implementation_owner", 6, "INTEGRATION_EVENT"),
  checklist("technical_onboarding", "other_pms", "data_mapping_completed", "Data Mapping Completed", "implementation_owner", 7, "INTEGRATION_EVENT"),
  checklist("technical_onboarding", "other_pms", "test_sync_passed", "Test Sync Passed", "implementation_owner", 8, "PMS_SYNC_EVENT", true),
  checklist("technical_onboarding", "email", "domain_verified", "Email Domain Verified", "implementation_owner", 6, "COMMUNICATION_EVENT", true),
  checklist("technical_onboarding", "email", "smtp_connected", "SMTP Connected", "implementation_owner", 7, "COMMUNICATION_EVENT", true),
  checklist("technical_onboarding", "email", "email_sending_verified", "Email Sending Verified", "implementation_owner", 8, "COMMUNICATION_EVENT", true),
  checklist("technical_onboarding", "email", "email_templates_installed", "Email Templates Installed", "implementation_owner", 9, "TEMPLATE_EVENT", true),
  checklist("technical_onboarding", "sms", "sms_provider_connected", "SMS Provider Connected", "implementation_owner", 7, "COMMUNICATION_EVENT", true),
  checklist("technical_onboarding", "sms", "sms_sending_verified", "SMS Sending Verified", "implementation_owner", 8, "COMMUNICATION_EVENT", true),
  checklist("technical_onboarding", "sms", "sms_compliance_verified", "SMS Compliance Verified", "compliance", 8, "COMPLIANCE_EVENT", true),
  checklist("technical_onboarding", "whatsapp", "whatsapp_business_account_connected", "WhatsApp Business Account Connected", "implementation_owner", 9, "COMMUNICATION_EVENT"),
  checklist("technical_onboarding", "whatsapp", "whatsapp_webhook_connected", "WhatsApp Webhook Connected", "implementation_owner", 10, "COMMUNICATION_EVENT"),
  checklist("technical_onboarding", "whatsapp", "whatsapp_test_message_sent", "WhatsApp Test Message Sent", "implementation_owner", 10, "COMMUNICATION_EVENT"),
  checklist("technical_onboarding", "calendars", "calendly_connected", "Calendly Connected", "implementation_owner", 8, "INTEGRATION_EVENT"),
  checklist("technical_onboarding", "calendars", "appointment_types_configured", "Appointment Types Configured", "implementation_owner", 9, "CONFIGURATION_EVENT"),
  checklist("technical_onboarding", "calendars", "scheduling_tested", "Scheduling Tested", "implementation_owner", 10, "VALIDATION_EVENT"),
  checklist("technical_onboarding", "stripe", "stripe_connected", "Stripe Connected", "billing", 7, "PAYMENT_EVENT", true),
  checklist("technical_onboarding", "stripe", "payment_links_tested", "Payment Links Tested", "billing", 8, "PAYMENT_EVENT", true),
  checklist("technical_onboarding", "stripe", "invoice_tested", "Invoice Tested", "billing", 8, "PAYMENT_EVENT"),
  checklist("technical_onboarding", "stripe", "receipt_tested", "Receipt Tested", "billing", 8, "PAYMENT_EVENT"),
  checklist("system_configuration", "templates", "appointment_templates_configured", "Appointment Templates Configured", "implementation_owner", 11, "TEMPLATE_EVENT", true),
  checklist("system_configuration", "templates", "recall_templates_configured", "Recall Templates Configured", "implementation_owner", 11, "TEMPLATE_EVENT", true),
  checklist("system_configuration", "templates", "treatment_templates_configured", "Treatment Templates Configured", "implementation_owner", 11, "TEMPLATE_EVENT", true),
  checklist("system_configuration", "templates", "review_templates_configured", "Review Templates Configured", "implementation_owner", 11, "TEMPLATE_EVENT"),
  checklist("system_configuration", "templates", "collection_templates_configured", "Collection Templates Configured", "implementation_owner", 11, "TEMPLATE_EVENT"),
  checklist("system_configuration", "workflow_os", "recall_workflow_enabled", "Recall Workflow Enabled", "implementation_owner", 12, "WORKFLOW_EXECUTED", true),
  checklist("system_configuration", "workflow_os", "review_workflow_enabled", "Review Workflow Enabled", "implementation_owner", 12, "WORKFLOW_EXECUTED"),
  checklist("system_configuration", "workflow_os", "reactivation_workflow_enabled", "Reactivation Workflow Enabled", "implementation_owner", 12, "WORKFLOW_EXECUTED"),
  checklist("system_configuration", "workflow_os", "treatment_acceptance_workflow_enabled", "Treatment Acceptance Workflow Enabled", "implementation_owner", 12, "WORKFLOW_EXECUTED", true),
  checklist("system_configuration", "workflow_os", "collections_workflow_enabled", "Collections Workflow Enabled", "implementation_owner", 12, "WORKFLOW_EXECUTED"),
  checklist("system_configuration", "alice", "practice_profile_loaded", "Practice Profile Loaded", "implementation_owner", 13, "ALICE_EVENT", true),
  checklist("system_configuration", "alice", "goals_configured", "Goals Configured", "customer_success", 13, "ALICE_EVENT"),
  checklist("system_configuration", "alice", "recommendations_enabled", "Recommendations Enabled", "implementation_owner", 13, "ALICE_EVENT", true),
  checklist("system_configuration", "alice", "revenue_forecasting_enabled", "Revenue Forecasting Enabled", "implementation_owner", 13, "ALICE_EVENT"),
  checklist("system_configuration", "video", "treatment_videos_uploaded", "Treatment Videos Uploaded", "implementation_owner", 14, "VIDEO_EVENT"),
  checklist("system_configuration", "video", "video_journeys_configured", "Video Journeys Configured", "implementation_owner", 14, "VIDEO_EVENT"),
  checklist("system_configuration", "video", "video_tracking_verified", "Video Tracking Verified", "implementation_owner", 14, "VIDEO_EVENT"),
  checklist("validation_testing", "functional_testing", "new_patient_journey_tested", "New Patient Journey Tested", "implementation_owner", 15, "VALIDATION_EVENT"),
  checklist("validation_testing", "functional_testing", "appointment_reminder_tested", "Appointment Reminder Tested", "implementation_owner", 15, "VALIDATION_EVENT", true),
  checklist("validation_testing", "functional_testing", "recall_journey_tested", "Recall Journey Tested", "implementation_owner", 15, "VALIDATION_EVENT", true),
  checklist("validation_testing", "functional_testing", "treatment_journey_tested", "Treatment Journey Tested", "implementation_owner", 15, "VALIDATION_EVENT", true),
  checklist("validation_testing", "functional_testing", "review_journey_tested", "Review Journey Tested", "implementation_owner", 15, "VALIDATION_EVENT"),
  checklist("validation_testing", "functional_testing", "collections_journey_tested", "Collections Journey Tested", "implementation_owner", 15, "VALIDATION_EVENT"),
  checklist("validation_testing", "evidence_os", "evidence_records_generated", "Evidence Records Generated", "implementation_owner", 16, "EVIDENCE_EVENT", true),
  checklist("validation_testing", "evidence_os", "revenue_attribution_generated", "Revenue Attribution Generated", "implementation_owner", 16, "REVENUE_EVENT", true),
  checklist("validation_testing", "evidence_os", "alice_traces_generated", "ALICE Traces Generated", "implementation_owner", 16, "ALICE_EVENT", true),
  checklist("validation_testing", "evidence_os", "incident_logs_generated", "Incident Logs Generated", "implementation_owner", 16, "INCIDENT_EVENT"),
  checklist("validation_testing", "evidence_os", "sla_records_generated", "SLA Records Generated", "implementation_owner", 16, "SLA_EVENT"),
  checklist("validation_testing", "mission_control", "events_visible", "Events Visible", "implementation_owner", 17, "CERTIFICATION_EVENT", true),
  checklist("validation_testing", "mission_control", "dashboards_visible", "Dashboards Visible", "implementation_owner", 17, "CERTIFICATION_EVENT", true),
  checklist("validation_testing", "mission_control", "executive_metrics_visible", "Executive Metrics Visible", "implementation_owner", 17, "CERTIFICATION_EVENT", true),
  checklist("training", "practice_owner", "executive_dashboard_training", "Executive Dashboard Training", "customer_success", 18, "TRAINING_EVENT", true),
  checklist("training", "practice_owner", "revenue_dashboard_training", "Revenue Dashboard Training", "customer_success", 18, "TRAINING_EVENT", true),
  checklist("training", "practice_owner", "alice_training", "ALICE Training", "customer_success", 18, "TRAINING_EVENT", true),
  checklist("training", "office_manager", "workflow_os_training", "Automation Platform Training", "customer_success", 18, "TRAINING_EVENT", true),
  checklist("training", "office_manager", "recall_training", "Recall Training", "customer_success", 18, "TRAINING_EVENT"),
  checklist("training", "office_manager", "reviews_training", "Reviews Training", "customer_success", 18, "TRAINING_EVENT"),
  checklist("training", "office_manager", "reporting_training", "Reporting Training", "customer_success", 18, "TRAINING_EVENT"),
  checklist("training", "front_desk", "patient_communication_training", "Patient Communication Training", "customer_success", 18, "TRAINING_EVENT"),
  checklist("training", "front_desk", "appointment_training", "Appointment Training", "customer_success", 18, "TRAINING_EVENT"),
  checklist("training", "front_desk", "treatment_follow_up_training", "Treatment Follow-Up Training", "customer_success", 18, "TRAINING_EVENT"),
  checklist("go_live_certification", "requirements", "pms_connected", "PMS Connected", "implementation_owner", 19, "INTEGRATION_EVENT", true),
  checklist("go_live_certification", "requirements", "email_connected", "Email Connected", "implementation_owner", 19, "COMMUNICATION_EVENT", true),
  checklist("go_live_certification", "requirements", "sms_connected", "SMS Connected", "implementation_owner", 19, "COMMUNICATION_EVENT", true),
  checklist("go_live_certification", "requirements", "stripe_connected_gate", "Stripe Connected", "billing", 19, "PAYMENT_EVENT", true),
  checklist("go_live_certification", "requirements", "templates_configured", "Templates Configured", "implementation_owner", 19, "TEMPLATE_EVENT", true),
  checklist("go_live_certification", "requirements", "workflows_active", "Workflows Active", "implementation_owner", 19, "WORKFLOW_EXECUTED", true),
  checklist("go_live_certification", "requirements", "training_completed_gate", "Training Completed", "customer_success", 19, "TRAINING_EVENT", true),
  checklist("go_live_certification", "requirements", "testing_passed", "Testing Passed", "implementation_owner", 19, "VALIDATION_EVENT", true),
  checklist("go_live_approval", "approvals", "technical_review_approved", "Technical Review Approved", "implementation_owner", 20, "CERTIFICATION_EVENT", true),
  checklist("go_live_approval", "approvals", "operations_review_approved", "Operations Review Approved", "operations", 20, "CERTIFICATION_EVENT", true),
  checklist("go_live_approval", "approvals", "customer_success_review_approved", "Customer Success Review Approved", "customer_success", 20, "CERTIFICATION_EVENT", true),
  checklist("go_live_approval", "approvals", "executive_review_approved", "Executive Review Approved", "executive", 20, "CERTIFICATION_EVENT", true),
  checklist("post_go_live", "30_day_review", "revenue_impact_review", "Revenue Impact Review", "customer_success", 50, "REVENUE_EVENT"),
  checklist("post_go_live", "30_day_review", "workflow_performance_review", "Workflow Performance Review", "customer_success", 50, "WORKFLOW_EXECUTED"),
  checklist("post_go_live", "30_day_review", "adoption_review", "Adoption Review", "customer_success", 50, "ADOPTION_EVENT"),
  checklist("post_go_live", "60_day_review", "optimization_review", "Optimization Review", "customer_success", 80, "ADOPTION_EVENT"),
  checklist("post_go_live", "60_day_review", "additional_opportunities_review", "Additional Opportunities Review", "customer_success", 80, "REVENUE_EVENT"),
  checklist("post_go_live", "90_day_review", "executive_business_review", "Executive Business Review", "customer_success", 110, "CERTIFICATION_EVENT"),
  checklist("post_go_live", "90_day_review", "expansion_opportunity_review", "Expansion Opportunity Review", "customer_success", 110, "REVENUE_EVENT")
] as const;

export const clientOperatingLifecycle: ClientOperatingLifecycleStage[] = ["onboarded", "activated", "optimized", "scaled", "renewed", "expanded"];

export const clientOperatingPlaybookTemplates: OperatingPlaybookTemplate[] = [
  playbook("day_1_activation", "Day 1 Activation", "activated", "first_24_hours", "Confirm all live systems, workflows, and dashboards are active.", ["PMS Sync Active", "Appointment Reminders Active", "Executive Dashboard Active"], [
    operatingItem("day_1_activation", "verify_systems", "pms_sync_active", "PMS Sync Active", "implementation_owner", 1, "PMS_SYNC_EVENT"),
    operatingItem("day_1_activation", "verify_systems", "email_sending_active", "Email Sending Active", "implementation_owner", 1, "COMMUNICATION_EVENT"),
    operatingItem("day_1_activation", "verify_systems", "sms_sending_active", "SMS Sending Active", "implementation_owner", 1, "COMMUNICATION_EVENT"),
    operatingItem("day_1_activation", "verify_systems", "stripe_active", "Stripe Active", "billing", 1, "PAYMENT_EVENT"),
    operatingItem("day_1_activation", "verify_systems", "alice_active", "ALICE Active", "implementation_owner", 1, "ALICE_EVENT"),
    operatingItem("day_1_activation", "verify_systems", "mission_control_active", "Mission Control Active", "operations", 1, "CERTIFICATION_EVENT"),
    operatingItem("day_1_activation", "verify_workflows", "appointment_reminders_active", "Appointment Reminders Active", "implementation_owner", 1, "WORKFLOW_EXECUTED"),
    operatingItem("day_1_activation", "verify_workflows", "recall_workflow_active", "Recall Workflow Active", "implementation_owner", 1, "WORKFLOW_EXECUTED"),
    operatingItem("day_1_activation", "verify_workflows", "review_workflow_active", "Review Workflow Active", "implementation_owner", 1, "WORKFLOW_EXECUTED"),
    operatingItem("day_1_activation", "verify_workflows", "treatment_workflow_active", "Treatment Workflow Active", "implementation_owner", 1, "WORKFLOW_EXECUTED"),
    operatingItem("day_1_activation", "verify_dashboards", "executive_dashboard", "Executive Dashboard", "customer_success", 1, "CERTIFICATION_EVENT"),
    operatingItem("day_1_activation", "verify_dashboards", "revenue_dashboard", "Revenue Dashboard", "customer_success", 1, "CERTIFICATION_EVENT"),
    operatingItem("day_1_activation", "verify_dashboards", "workflow_dashboard", "Workflow Dashboard", "customer_success", 1, "CERTIFICATION_EVENT")
  ]),
  playbook("week_1_validation", "Week 1 Validation", "activated", "week_1", "Validate communication, workflow execution, and evidence production after first live week.", ["Messages Delivered", "Revenue Attribution Generated", "ALICE Traces Generated"], [
    operatingItem("week_1_validation", "communication_review", "messages_delivered", "Messages Delivered", "customer_success", 7, "COMMUNICATION_EVENT"),
    operatingItem("week_1_validation", "communication_review", "open_rates_verified", "Open Rates Verified", "customer_success", 7, "ADOPTION_EVENT"),
    operatingItem("week_1_validation", "communication_review", "response_rates_verified", "Response Rates Verified", "customer_success", 7, "ADOPTION_EVENT"),
    operatingItem("week_1_validation", "workflow_review", "recall_running", "Recall Running", "implementation_owner", 7, "WORKFLOW_EXECUTED"),
    operatingItem("week_1_validation", "workflow_review", "reviews_running", "Reviews Running", "implementation_owner", 7, "WORKFLOW_EXECUTED"),
    operatingItem("week_1_validation", "workflow_review", "treatment_follow_up_running", "Treatment Follow-Up Running", "implementation_owner", 7, "WORKFLOW_EXECUTED"),
    operatingItem("week_1_validation", "evidence_review", "evidence_records_generated", "Evidence Records Generated", "operations", 7, "EVIDENCE_EVENT"),
    operatingItem("week_1_validation", "evidence_review", "revenue_attribution_generated", "Revenue Attribution Generated", "operations", 7, "REVENUE_EVENT"),
    operatingItem("week_1_validation", "evidence_review", "alice_traces_generated", "ALICE Traces Generated", "operations", 7, "ALICE_EVENT")
  ]),
  playbook("thirty_day_success_review", "30 Day Success Review", "optimized", "30_day", "Review first-month revenue, adoption, workflow, and risk posture.", ["Appointments Influenced", "Workflow Usage", "Low Adoption Risk Reviewed"], [
    operatingItem("thirty_day_success_review", "revenue_metrics", "appointments_influenced", "Appointments Influenced", "customer_success", 30, "REVENUE_EVENT"),
    operatingItem("thirty_day_success_review", "revenue_metrics", "treatment_revenue_influenced", "Treatment Revenue Influenced", "customer_success", 30, "REVENUE_EVENT"),
    operatingItem("thirty_day_success_review", "revenue_metrics", "reviews_generated", "Reviews Generated", "customer_success", 30, "REVENUE_EVENT"),
    operatingItem("thirty_day_success_review", "revenue_metrics", "outstanding_balances_recovered", "Outstanding Balances Recovered", "customer_success", 30, "PAYMENT_EVENT"),
    operatingItem("thirty_day_success_review", "adoption_metrics", "owner_login_activity", "Owner Login Activity", "customer_success", 30, "ADOPTION_EVENT"),
    operatingItem("thirty_day_success_review", "adoption_metrics", "office_manager_usage", "Office Manager Usage", "customer_success", 30, "ADOPTION_EVENT"),
    operatingItem("thirty_day_success_review", "adoption_metrics", "workflow_usage", "Workflow Usage", "customer_success", 30, "ADOPTION_EVENT"),
    operatingItem("thirty_day_success_review", "risks", "low_adoption", "Low Adoption", "customer_success", 30, "ADOPTION_EVENT"),
    operatingItem("thirty_day_success_review", "risks", "missing_data", "Missing Data", "operations", 30, "EVIDENCE_EVENT"),
    operatingItem("thirty_day_success_review", "risks", "integration_issues", "Integration Issues", "operations", 30, "INCIDENT_EVENT")
  ]),
  playbook("sixty_day_optimization", "60 Day Optimization", "optimized", "60_day", "Tune workflows, ALICE recommendations, forecasting, and ROI.", ["KPI Progress Reviewed", "ROI Reviewed", "Forecast Accuracy Reviewed"], [
    operatingItem("sixty_day_optimization", "workflow_optimization", "recall_optimization", "Recall Optimization", "customer_success", 60, "WORKFLOW_EXECUTED"),
    operatingItem("sixty_day_optimization", "workflow_optimization", "review_optimization", "Review Optimization", "customer_success", 60, "WORKFLOW_EXECUTED"),
    operatingItem("sixty_day_optimization", "workflow_optimization", "treatment_acceptance_optimization", "Treatment Acceptance Optimization", "customer_success", 60, "WORKFLOW_EXECUTED"),
    operatingItem("sixty_day_optimization", "alice_optimization", "recommendations_reviewed", "Recommendations Reviewed", "customer_success", 60, "ALICE_EVENT"),
    operatingItem("sixty_day_optimization", "alice_optimization", "forecast_accuracy_reviewed", "Forecast Accuracy Reviewed", "customer_success", 60, "ALICE_EVENT"),
    operatingItem("sixty_day_optimization", "executive_review", "kpi_progress_reviewed", "KPI Progress Reviewed", "customer_success", 60, "CERTIFICATION_EVENT"),
    operatingItem("sixty_day_optimization", "executive_review", "roi_reviewed", "ROI Reviewed", "customer_success", 60, "REVENUE_EVENT")
  ]),
  playbook("ninety_day_business_review", "90 Day Business Review", "renewed", "90_day", "Assess business impact, expansion paths, and renewal health.", ["Revenue Impact", "Expansion Opportunity", "Renewal Health"], [
    operatingItem("ninety_day_business_review", "executive_business_review", "revenue_impact", "Revenue Impact", "customer_success", 90, "REVENUE_EVENT"),
    operatingItem("ninety_day_business_review", "executive_business_review", "operational_impact", "Operational Impact", "customer_success", 90, "CERTIFICATION_EVENT"),
    operatingItem("ninety_day_business_review", "executive_business_review", "adoption_impact", "Adoption Impact", "customer_success", 90, "ADOPTION_EVENT"),
    operatingItem("ninety_day_business_review", "expansion_assessment", "additional_locations", "Additional Locations", "sales", 90, "REVENUE_EVENT"),
    operatingItem("ninety_day_business_review", "expansion_assessment", "additional_providers", "Additional Providers", "sales", 90, "REVENUE_EVENT"),
    operatingItem("ninety_day_business_review", "expansion_assessment", "additional_workflows", "Additional Workflows", "sales", 90, "WORKFLOW_EXECUTED"),
    operatingItem("ninety_day_business_review", "renewal_health", "client_satisfaction", "Client Satisfaction", "customer_success", 90, "ADOPTION_EVENT"),
    operatingItem("ninety_day_business_review", "renewal_health", "risk_assessment", "Risk Assessment", "customer_success", 90, "INCIDENT_EVENT"),
    operatingItem("ninety_day_business_review", "renewal_health", "expansion_opportunity", "Expansion Opportunity", "sales", 90, "REVENUE_EVENT")
  ]),
  playbook("incident_response", "Incident Response", "activated", "as_needed", "Standardize P1/P2 incident response, recovery, and SLA evidence.", ["Incident Evidence", "Recovery Evidence", "SLA Evidence"], [
    operatingItem("incident_response", "p1_critical", "incident_created", "Incident Created", "operations", 0, "INCIDENT_EVENT"),
    operatingItem("incident_response", "p1_critical", "client_notified", "Client Notified", "customer_success", 0, "INCIDENT_EVENT"),
    operatingItem("incident_response", "p1_critical", "recovery_started", "Recovery Started", "operations", 0, "RECOVERY_EVENT"),
    operatingItem("incident_response", "p1_critical", "resolution_verified", "Resolution Verified", "operations", 1, "RECOVERY_EVENT"),
    operatingItem("incident_response", "p2_high", "escalated", "Escalated", "operations", 1, "INCIDENT_EVENT"),
    operatingItem("incident_response", "p2_high", "tracked", "Tracked", "operations", 1, "INCIDENT_EVENT"),
    operatingItem("incident_response", "p2_high", "resolved", "Resolved", "operations", 2, "RECOVERY_EVENT"),
    operatingItem("incident_response", "evidence_required", "incident_evidence", "Incident Evidence", "operations", 1, "INCIDENT_EVENT"),
    operatingItem("incident_response", "evidence_required", "recovery_evidence", "Recovery Evidence", "operations", 1, "RECOVERY_EVENT"),
    operatingItem("incident_response", "evidence_required", "sla_evidence", "SLA Evidence", "operations", 1, "SLA_EVENT")
  ]),
  playbook("customer_success", "Customer Success", "renewed", "monthly_quarterly_annual", "Run monthly, quarterly, and annual success motions.", ["Health Score Review", "Business Review", "Renewal Review"], [
    operatingItem("customer_success", "monthly", "health_score_review", "Health Score Review", "customer_success", 30, "ADOPTION_EVENT"),
    operatingItem("customer_success", "monthly", "adoption_review", "Adoption Review", "customer_success", 30, "ADOPTION_EVENT"),
    operatingItem("customer_success", "monthly", "revenue_review", "Revenue Review", "customer_success", 30, "REVENUE_EVENT"),
    operatingItem("customer_success", "quarterly", "business_review", "Business Review", "customer_success", 90, "CERTIFICATION_EVENT"),
    operatingItem("customer_success", "quarterly", "roadmap_discussion", "Roadmap Discussion", "customer_success", 90, "CERTIFICATION_EVENT"),
    operatingItem("customer_success", "quarterly", "expansion_review", "Expansion Review", "sales", 90, "REVENUE_EVENT"),
    operatingItem("customer_success", "annual", "contract_review", "Contract Review", "sales", 365, "CONTRACT_EVENT"),
    operatingItem("customer_success", "annual", "renewal_review", "Renewal Review", "sales", 365, "CONTRACT_EVENT"),
    operatingItem("customer_success", "annual", "strategic_planning", "Strategic Planning", "executive", 365, "CERTIFICATION_EVENT")
  ]),
  playbook("expansion_workflow", "Expansion Workflow", "expanded", "triggered", "Convert healthy clients into location, provider, workflow, and managed operations expansion.", ["Revenue Growth", "High Adoption", "Expansion Opportunity"], [
    operatingItem("expansion_workflow", "trigger_conditions", "revenue_growth", "Revenue Growth", "sales", 90, "REVENUE_EVENT"),
    operatingItem("expansion_workflow", "trigger_conditions", "high_adoption", "High Adoption", "customer_success", 90, "ADOPTION_EVENT"),
    operatingItem("expansion_workflow", "trigger_conditions", "multiple_providers", "Multiple Providers", "sales", 90, "CLIENT_PROFILE"),
    operatingItem("expansion_workflow", "trigger_conditions", "additional_locations_trigger", "Additional Locations", "sales", 90, "CLIENT_PROFILE"),
    operatingItem("expansion_workflow", "expansion_opportunities", "additional_locations", "Additional Locations", "sales", 90, "REVENUE_EVENT"),
    operatingItem("expansion_workflow", "expansion_opportunities", "additional_providers", "Additional Providers", "sales", 90, "REVENUE_EVENT"),
    operatingItem("expansion_workflow", "expansion_opportunities", "managed_ai_operations_upgrade", "Managed AI Operations Upgrade", "sales", 90, "REVENUE_EVENT"),
    operatingItem("expansion_workflow", "expansion_opportunities", "custom_workflow_package", "Custom Workflow Package", "sales", 90, "WORKFLOW_EXECUTED")
  ])
];

const integrationProviders = ["Open Dental", "Stripe", "Google", "Meta", "Calendly", "Email", "SMS", "WhatsApp"] as const;
const trainingTracks = ["Practice Owner", "Office Manager", "Front Desk", "Provider"] as const;

export interface ClientImplementationState {
  configured: boolean;
  generatedAt: string;
  executiveMetrics: {
    implementationsInProgress: number;
    averageDaysToGoLive: number;
    blockedClients: number;
    goLiveSuccessRate: number;
    implementationCapacity: string;
    implementationForecast: number;
  };
  projects: Array<{ id: string; clientName: string; packageKey: string; owner: string; phase: string; goLiveDate: string; riskLevel: string; completion: number; status: string }>;
  tasks: Array<{ id: string; projectId: string; itemKey: string; title: string; type: string; owner: string; ownerRole: string; status: string; dueDate: string; evidenceType: string; evidenceStatus: string; goLiveRequirement: boolean }>;
  onboarding: Array<{ id: string; projectId: string; itemKey: string; label: string; stage: string; section: string; category: string; owner: string; ownerRole: string; dueDate: string; evidenceType: string; evidenceStatus: string; goLiveRequirement: boolean; certificationGate: string; status: string; required: boolean }>;
  integrations: Array<{ id: string; projectId: string; provider: string; status: string; failureReason: string }>;
  training: Array<{ id: string; projectId: string; track: string; participant: string; status: string }>;
  adoption: Array<{ id: string; projectId: string; score: number; classification: string; workflowUsage: number; aliceUsage: number }>;
  goLive: Array<{ id: string; projectId: string; certified: boolean; readiness: number; certifiedAt: string }>;
  health: Array<{ id: string; projectId: string; healthScore: number; riskScore: number; expansionScore: number }>;
  reviews: Array<{ id: string; projectId: string; type: string; status: string; scheduledAt: string }>;
  operatingPlaybooks: Array<{ id: string; projectId: string; playbookKey: string; label: string; stage: string; section: string; owner: string; ownerRole: string; dueDate: string; status: string; evidenceType: string; evidenceStatus: string; completedAt: string }>;
  implementationIntelligence: ImplementationIntelligenceState;
  blueprints: typeof implementationBlueprints;
  checklistTemplates: typeof implementationChecklistTemplates;
  operatingPlaybookTemplates: OperatingPlaybookTemplate[];
}

export async function getClientImplementationState(): Promise<ClientImplementationState> {
  const tenant = await getTenantData();
  const organizationId = tenant.tenant.organizationId ?? tenant.organization.id;
  const supabase = createServiceClient();
  const implementationIntelligence = await getImplementationIntelligenceState();

  if (!supabase) return buildState(false, {}, implementationIntelligence);
  const client = supabase as any;
  const [
    projectsResult,
    tasksResult,
    onboardingResult,
    integrationsResult,
    trainingResult,
    adoptionResult,
    goLiveResult,
    healthResult,
    reviewsResult,
    operatingPlaybooksResult
  ] = await Promise.all([
    client.from("implementation_projects").select("*").eq("organization_id", organizationId).order("updated_at", { ascending: false }).limit(100),
    client.from("implementation_tasks").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(200),
    client.from("client_onboarding_items").select("*").eq("organization_id", organizationId).order("created_at", { ascending: true }).limit(200),
    client.from("integration_readiness_checks").select("*").eq("organization_id", organizationId).order("created_at", { ascending: true }).limit(200),
    client.from("training_assignments").select("*, training_tracks(name)").eq("organization_id", organizationId).order("assigned_at", { ascending: false }).limit(200),
    client.from("implementation_adoption_metrics").select("*").eq("organization_id", organizationId).order("measured_at", { ascending: false }).limit(100),
    client.from("go_live_checklists").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(100),
    client.from("client_health_rollups").select("*").eq("organization_id", organizationId).order("measured_at", { ascending: false }).limit(100),
    client.from("customer_success_reviews").select("*").eq("organization_id", organizationId).order("scheduled_at", { ascending: true }).limit(100),
    client.from("client_operating_playbook_items").select("*").eq("organization_id", organizationId).order("due_date", { ascending: true }).limit(300)
  ]);

  return buildState(true, {
    projects: projectsResult.data ?? [],
    tasks: tasksResult.data ?? [],
    onboarding: onboardingResult.data ?? [],
    integrations: integrationsResult.data ?? [],
    training: trainingResult.data ?? [],
    adoption: adoptionResult.data ?? [],
    goLive: goLiveResult.data ?? [],
    health: healthResult.data ?? [],
    reviews: reviewsResult.data ?? [],
    operatingPlaybooks: operatingPlaybooksResult.data ?? []
  }, implementationIntelligence);
}

export async function createImplementationProjectFromContract(input: {
  organizationId: string;
  clientName: string;
  packageKey: string;
  owner?: string;
  goLiveDate?: string;
}) {
  const supabase = createServiceClient();
  if (!supabase) return { ok: false, message: "Supabase service persistence is not configured." };
  const client = supabase as any;
  const blueprint = implementationBlueprints.find(item => item.packageKey === input.packageKey) ?? implementationBlueprints[0];
  const { data: project, error } = await client.from("implementation_projects").insert({
    organization_id: input.organizationId,
    client_name: input.clientName,
    package_key: input.packageKey,
    implementation_owner: input.owner ?? "Implementation Owner",
    go_live_date: input.goLiveDate ?? null,
    current_phase: "signed",
    completion_percent: 5,
    signed_at: new Date().toISOString()
  }).select().single();
  if (error) return { ok: false, message: error.message };

  const projectId = project.id;
  await Promise.all([
    client.from("implementation_checklist_templates").upsert(buildChecklistTemplateRows(input.organizationId), { onConflict: "organization_id,item_key" }),
    client.from("client_operating_playbook_templates").upsert(buildOperatingPlaybookTemplateRows(input.organizationId), { onConflict: "organization_id,playbook_key" }),
    client.from("implementation_tasks").insert(buildTasks(input.organizationId, projectId, blueprint)),
    client.from("client_onboarding_items").insert(buildChecklistRows(input.organizationId, projectId, input.owner ?? "Implementation Owner")),
    client.from("client_operating_playbook_items").insert(buildOperatingPlaybookRows(input.organizationId, projectId, input.owner ?? "Implementation Owner")),
    client.from("integration_readiness_checks").insert(integrationProviders.map(provider => ({ organization_id: input.organizationId, implementation_project_id: projectId, provider }))),
    client.from("go_live_checklists").insert({ organization_id: input.organizationId, implementation_project_id: projectId }),
    client.from("customer_success_reviews").insert(buildSuccessReviews(input.organizationId, projectId))
  ]);
  return { ok: true, projectId };
}

function buildState(configured: boolean, rows: Record<string, any[]> = {}, implementationIntelligence?: ImplementationIntelligenceState): ClientImplementationState {
  const projects = (rows.projects ?? []).map(project => ({
    id: project.id,
    clientName: project.client_name,
    packageKey: project.package_key,
    owner: project.implementation_owner ?? "Unassigned",
    phase: project.current_phase,
    goLiveDate: project.go_live_date ?? "Unscheduled",
    riskLevel: project.risk_level,
    completion: Number(project.completion_percent ?? 0),
    status: project.status
  }));
  const completedGoLives = (rows.goLive ?? []).filter(row => row.certified).length;
  const totalGoLives = rows.goLive?.length ?? 0;
  const blockedClients = projects.filter(project => project.riskLevel === "blocked" || project.status === "blocked").length;
  const avgDays = averageDaysToGoLive(rows.projects ?? []);

  return {
    configured,
    generatedAt: new Date().toISOString(),
    executiveMetrics: {
      implementationsInProgress: projects.filter(project => project.status !== "completed").length,
      averageDaysToGoLive: avgDays,
      blockedClients,
      goLiveSuccessRate: totalGoLives ? Math.round((completedGoLives / totalGoLives) * 100) : 0,
      implementationCapacity: projects.length > 12 ? "constrained" : projects.length > 6 ? "watch" : "available",
      implementationForecast: projects.filter(project => ["signed", "discovery", "configuration", "integration", "testing", "training"].includes(project.phase)).length
    },
    projects,
    tasks: (rows.tasks ?? []).map(task => ({ id: task.id, projectId: task.implementation_project_id, itemKey: task.checklist_item_key ?? "", title: task.title, type: task.task_type, owner: task.owner ?? "Unassigned", ownerRole: task.owner_role ?? "implementation_owner", status: task.status, dueDate: task.due_date ?? "Unscheduled", evidenceType: task.evidence_type ?? "Not required", evidenceStatus: task.evidence_status ?? "not_required", goLiveRequirement: Boolean(task.go_live_requirement) })),
    onboarding: (rows.onboarding ?? []).map(item => ({ id: item.id, projectId: item.implementation_project_id, itemKey: item.item_key, label: item.label, stage: item.stage ?? item.category, section: item.section ?? "general", category: item.category, owner: item.owner ?? "Unassigned", ownerRole: item.owner_role ?? "implementation_owner", dueDate: item.due_date ?? "Unscheduled", evidenceType: item.evidence_type ?? "Not required", evidenceStatus: item.evidence_status ?? "required", goLiveRequirement: Boolean(item.go_live_requirement), certificationGate: item.certification_gate ?? "", status: item.status, required: Boolean(item.required) })),
    integrations: (rows.integrations ?? []).map(item => ({ id: item.id, projectId: item.implementation_project_id, provider: item.provider, status: item.status, failureReason: item.failure_reason ?? "" })),
    training: (rows.training ?? []).map(item => ({ id: item.id, projectId: item.implementation_project_id, track: item.training_tracks?.name ?? "Training Track", participant: item.participant_name, status: item.status })),
    adoption: (rows.adoption ?? []).map(item => ({ id: item.id, projectId: item.implementation_project_id, score: Number(item.adoption_score ?? 0), classification: item.classification, workflowUsage: Number(item.workflow_usage ?? 0), aliceUsage: Number(item.alice_usage ?? 0) })),
    goLive: (rows.goLive ?? []).map(item => ({ id: item.id, projectId: item.implementation_project_id, certified: Boolean(item.certified), readiness: checklistReadiness(item), certifiedAt: item.certified_at ?? "Not certified" })),
    health: (rows.health ?? []).map(item => ({ id: item.id, projectId: item.implementation_project_id, healthScore: Number(item.health_score ?? 0), riskScore: Number(item.risk_score ?? 0), expansionScore: Number(item.expansion_score ?? 0) })),
    reviews: (rows.reviews ?? []).map(item => ({ id: item.id, projectId: item.implementation_project_id, type: item.review_type, status: item.status, scheduledAt: item.scheduled_at })),
    operatingPlaybooks: (rows.operatingPlaybooks ?? []).map(item => ({ id: item.id, projectId: item.implementation_project_id, playbookKey: item.playbook_key, label: item.label, stage: item.stage, section: item.section, owner: item.owner ?? "Unassigned", ownerRole: item.owner_role ?? "customer_success", dueDate: item.due_date ?? "Unscheduled", status: item.status, evidenceType: item.evidence_type ?? "Not required", evidenceStatus: item.evidence_status ?? "required", completedAt: item.completion_timestamp ?? "Open" })),
    implementationIntelligence: implementationIntelligence ?? emptyImplementationIntelligence(),
    blueprints: implementationBlueprints,
    checklistTemplates: implementationChecklistTemplates,
    operatingPlaybookTemplates: clientOperatingPlaybookTemplates
  };
}

function emptyImplementationIntelligence(): ImplementationIntelligenceState {
  return {
    configured: false,
    generatedAt: new Date().toISOString(),
    commandCenter: { completed: 0, inProgress: 0, blocked: 0, readinessScore: 0, implementationScore: 0, potentialRevenue: 0, recoveredRevenue: 0 },
    scores: { practiceHealth: 0, revenueHealth: 0, growth: 0, risk: 0 },
    chevron: [],
    revenueRecovery: { totalLeaks: 0, topCategory: "None", potentialRevenue: 0, recoveredRevenue: 0, topOpportunities: [] },
    pmsReadiness: { supportedVendors: [], assessedVendors: [], averageReadiness: 0, openPlans: 0 },
    aliceAdvisor: { topActions: [], topRisks: [], topOpportunities: [] },
    workflowRegistrations: [],
    enterpriseMoat: {
      centers: [],
      autonomousGrowth: { weeklyPlans: 0, monthlyPlans: 0, quarterlyPlans: 0, expectedLift: 0, revenueGoal: 0 },
      aliceEvolution: []
    }
  };
}

function buildTasks(organizationId: string, projectId: string, blueprint: typeof implementationBlueprints[number]) {
  return [
    ...implementationChecklistTemplates.map(item => ({
      organization_id: organizationId,
      implementation_project_id: projectId,
      checklist_item_key: item.key,
      task_type: item.taskType,
      title: item.label,
      owner_role: item.ownerRole,
      due_date: dueDate(item.dueOffsetDays),
      evidence_type: item.evidenceType,
      evidence_status: item.evidenceType ? "required" : "not_required",
      go_live_requirement: item.goLiveRequirement
    })),
    ...blueprint.integrations.map(item => ({ organization_id: organizationId, implementation_project_id: projectId, task_type: "integration", title: `Connect ${item}`, owner_role: "implementation_owner", due_date: dueDate(7), evidence_type: "INTEGRATION_EVENT", evidence_status: "required", go_live_requirement: true })),
    ...blueprint.training.map(item => ({ organization_id: organizationId, implementation_project_id: projectId, task_type: "training", title: `Assign ${item} training`, owner_role: "customer_success", due_date: dueDate(18), evidence_type: "TRAINING_EVENT", evidence_status: "required", go_live_requirement: true })),
    ...blueprint.workflows.map(item => ({ organization_id: organizationId, implementation_project_id: projectId, task_type: "workflow", title: `Configure ${item}`, owner_role: "implementation_owner", due_date: dueDate(12), evidence_type: "WORKFLOW_EXECUTED", evidence_status: "required", go_live_requirement: true }))
  ];
}

function buildChecklistRows(organizationId: string, projectId: string, owner: string) {
  return implementationChecklistTemplates.map((item, index) => ({
    organization_id: organizationId,
    implementation_project_id: projectId,
    item_key: item.key,
    stage: item.stage,
    section: item.section,
    category: item.stage,
    label: item.label,
    owner: item.ownerRole === "implementation_owner" ? owner : null,
    owner_role: item.ownerRole,
    due_date: dueDate(item.dueOffsetDays),
    evidence_type: item.evidenceType,
    evidence_status: item.evidenceType ? "required" : "not_required",
    go_live_requirement: item.goLiveRequirement,
    certification_gate: item.goLiveRequirement ? item.stage : null,
    sort_order: index + 1,
    required: true
  }));
}

function buildChecklistTemplateRows(organizationId: string) {
  return implementationChecklistTemplates.map((item, index) => ({
    organization_id: organizationId,
    item_key: item.key,
    stage: item.stage,
    section: item.section,
    label: item.label,
    task_type: item.taskType,
    default_owner_role: item.ownerRole,
    default_due_offset_days: item.dueOffsetDays,
    evidence_type: item.evidenceType,
    go_live_requirement: item.goLiveRequirement,
    sort_order: index + 1
  }));
}

function buildOperatingPlaybookRows(organizationId: string, projectId: string, owner: string) {
  return clientOperatingPlaybookTemplates.flatMap(playbook =>
    playbook.items.map((item, index) => ({
      organization_id: organizationId,
      implementation_project_id: projectId,
      playbook_key: playbook.key,
      item_key: item.key,
      stage: playbook.lifecycleStage,
      section: item.section,
      label: item.label,
      owner: item.ownerRole === "implementation_owner" ? owner : null,
      owner_role: item.ownerRole,
      due_date: dueDate(item.dueOffsetDays),
      evidence_type: item.evidenceType,
      evidence_status: item.evidenceType ? "required" : "not_required",
      sort_order: index + 1
    }))
  );
}

function buildOperatingPlaybookTemplateRows(organizationId: string) {
  return clientOperatingPlaybookTemplates.map(playbook => ({
    organization_id: organizationId,
    playbook_key: playbook.key,
    playbook_name: playbook.name,
    lifecycle_stage: playbook.lifecycleStage,
    cadence: playbook.cadence,
    objective: playbook.objective,
    success_metrics: playbook.successMetrics,
    required_destinations: ["Executive Command Center", "Customer Success OS", "Agency CRM", "Evidence OS", "Mission Control"]
  }));
}

function checklist(stage: string, section: string, key: string, label: string, ownerRole: string, dueOffsetDays: number, evidenceType?: string, goLiveRequirement = false, taskType = "onboarding") {
  return { stage, section, key, label, ownerRole, dueOffsetDays, evidenceType: evidenceType ?? null, goLiveRequirement, taskType };
}

function playbook(key: string, name: string, lifecycleStage: ClientOperatingLifecycleStage, cadence: string, objective: string, successMetrics: string[], items: OperatingPlaybookItemTemplate[]): OperatingPlaybookTemplate {
  return { key, name, lifecycleStage, cadence, objective, successMetrics, items };
}

function operatingItem(playbookKey: string, section: string, key: string, label: string, ownerRole: string, dueOffsetDays: number, evidenceType?: string): OperatingPlaybookItemTemplate {
  return { playbookKey, section, key, label, ownerRole, dueOffsetDays, evidenceType: evidenceType ?? null };
}

function dueDate(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function buildSuccessReviews(organizationId: string, projectId: string) {
  const now = new Date();
  return [30, 60, 90].map(days => ({
    organization_id: organizationId,
    implementation_project_id: projectId,
    review_type: `${days}_day_review`,
    scheduled_at: new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString()
  }));
}

function checklistReadiness(item: any) {
  const checks = ["integrations_connected", "workflows_active", "templates_configured", "training_completed", "testing_passed"];
  return Math.round((checks.filter(check => Boolean(item[check])).length / checks.length) * 100);
}

function averageDaysToGoLive(projects: any[]) {
  const durations = projects
    .filter(project => project.signed_at && project.go_live_date)
    .map(project => Math.max(0, Math.round((new Date(project.go_live_date).getTime() - new Date(project.signed_at).getTime()) / 86400000)));
  return durations.length ? Math.round(durations.reduce((sum, days) => sum + days, 0) / durations.length) : 0;
}
