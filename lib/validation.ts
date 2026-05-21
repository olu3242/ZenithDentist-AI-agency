import { z } from "zod";

export const roiInputSchema = z.object({
  chairs: z.coerce.number().int().min(1).max(200),
  monthlyAppointments: z.coerce.number().int().min(1).max(20000),
  avgAppointmentValue: z.coerce.number().min(50).max(20000),
  noShowRate: z.coerce.number().min(0).max(80),
  recallPatientsLost: z.coerce.number().min(0).max(1000),
  adminHoursPerDay: z.coerce.number().min(0).max(24)
});

export const leadCaptureSchema = z.object({
  dentistName: z.string().min(2).max(120),
  practiceName: z.string().min(2).max(160),
  email: z.string().email(),
  phone: z.string().min(7).max(40),
  locations: z.coerce.number().int().min(1).max(500),
  staffSize: z.coerce.number().int().min(1).max(10000),
  pmsSoftware: z.string().min(2).max(80),
  operationalPain: z.string().min(10).max(1000),
  source: z.string().min(1).max(120).default("website"),
  attribution: z.record(z.unknown()).default({})
});

export const funnelSubmissionSchema = leadCaptureSchema.merge(roiInputSchema);

export const bookingClickSchema = z.object({
  leadId: z.string().uuid().optional(),
  source: z.string().min(1).max(120).default("website"),
  metadata: z.record(z.unknown()).default({})
});

export const faqInteractionSchema = z.object({
  question: z.string().min(2).max(300),
  category: z.string().min(2).max(80),
  interactionType: z.string().min(2).max(80)
});

export type FunnelSubmissionInput = z.infer<typeof funnelSubmissionSchema>;
export type RoiInput = z.infer<typeof roiInputSchema>;
