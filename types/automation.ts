export type AutomationDomain =
  | "front_office"
  | "patient_followup"
  | "recall"
  | "scheduling"
  | "billing"
  | "marketing"
  | "reputation"
  | "analytics"
  | "compliance"
  | "mission_control"
  | "lead_operations"
  | "treatment"
  | "insurance";

export type AutomationCoverageClassification =
  | "COMPLETE"
  | "PARTIAL"
  | "DECLARED_ONLY"
  | "MISSING_RUNTIME"
  | "UNOBSERVABLE"
  | "CRITICAL_GAP";

export type AutomationObservability = {
  tracing: boolean;
  metrics: boolean;
  logging: boolean;
  alerting: boolean;
};

export type AutomationBlueprint = {
  id: string;
  domain: AutomationDomain;
  name: string;
  description: string;
  triggers: string[];
  emittedEvents: string[];
  queueHandlers: string[];
  actions: string[];
  intelligenceOutputs: string[];
  aliceGroundingSurfaces: string[];
  replayRequired: boolean;
  retryEnabled: boolean;
  deadLetterRequired: boolean;
  slaMinutes?: number;
  dependencies?: string[];
  requiredEnv?: string[];
  observability: AutomationObservability;
};
