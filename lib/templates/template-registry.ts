export type MessageChannel = "sms" | "email" | "whatsapp" | "video";

export const templateCategories = [
  "WELCOME_NEW_PATIENT",
  "APPOINTMENT_CONFIRMATION",
  "APPOINTMENT_REMINDER",
  "MISSED_APPOINTMENT",
  "RECALL_30",
  "RECALL_60",
  "RECALL_90",
  "RECALL_OVERDUE",
  "TREATMENT_PLAN_SENT",
  "TREATMENT_ACCEPTANCE",
  "TREATMENT_FINANCING",
  "REVIEW_REQUEST",
  "REVIEW_FOLLOWUP",
  "REFERRAL_REQUEST",
  "BALANCE_REMINDER",
  "PAYMENT_DUE",
  "PAYMENT_OVERDUE"
] as const;

export const templateVariables = [
  "patient_name",
  "provider_name",
  "practice_name",
  "appointment_date",
  "appointment_time",
  "treatment_name",
  "treatment_cost",
  "payment_link",
  "review_link",
  "video_link",
  "financing_link"
] as const;

export const defaultTemplates = templateCategories.map(category => ({
  templateKey: category.toLowerCase(),
  category,
  channel: "sms" as MessageChannel,
  body: `${category.replace(/_/g, " ")} for {{patient_name}} from {{practice_name}}.`,
  requiredVariables: ["patient_name", "practice_name"]
}));
