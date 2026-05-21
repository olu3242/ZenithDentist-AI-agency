export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type LeadStatus = "new" | "roi_completed" | "audit_requested" | "booked" | "qualified" | "won" | "lost";
export type BookingStatus = "clicked" | "scheduled" | "cancelled" | "completed";
export type OutreachEventType =
  | "lead_created"
  | "roi_completed"
  | "audit_requested"
  | "booking_clicked"
  | "booking_confirmed"
  | "email_sent"
  | "cta_clicked"
  | "faq_interaction"
  | "funnel_abandoned";

export interface Database {
  public: {
    Tables: {
      leads: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          dentist_name: string | null;
          practice_name: string;
          email: string;
          phone: string | null;
          locations: number;
          staff_size: number | null;
          pms_software: string | null;
          no_show_rate: number | null;
          operational_pain: string | null;
          status: LeadStatus;
          source: string;
          notes: string | null;
          attribution: Json;
        };
        Insert: Partial<Database["public"]["Tables"]["leads"]["Row"]> & {
          practice_name: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Row"]>;
        Relationships: [];
      };
      roi_calculations: {
        Row: {
          id: string;
          lead_id: string;
          chairs: number;
          monthly_appointments: number;
          avg_appointment_value: number;
          no_show_rate: number;
          recall_patients_lost: number;
          admin_hours_per_day: number;
          monthly_revenue_loss: number;
          yearly_revenue_loss: number;
          recoverable_revenue: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["roi_calculations"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["roi_calculations"]["Row"]>;
        Relationships: [];
      };
      audits: {
        Row: {
          id: string;
          lead_id: string;
          audit_summary: string;
          recommendations: Json;
          projected_recovery: number;
          generated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["audits"]["Row"], "id" | "generated_at">;
        Update: Partial<Database["public"]["Tables"]["audits"]["Row"]>;
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          lead_id: string | null;
          calendly_event_id: string | null;
          scheduled_at: string | null;
          booking_status: BookingStatus;
          notes: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["bookings"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["bookings"]["Row"]>;
        Relationships: [];
      };
      outreach_events: {
        Row: {
          id: string;
          lead_id: string | null;
          event_type: OutreachEventType;
          event_metadata: Json;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["outreach_events"]["Row"]> & {
          event_type: OutreachEventType;
        };
        Update: Partial<Database["public"]["Tables"]["outreach_events"]["Row"]>;
        Relationships: [];
      };
      faq_interactions: {
        Row: {
          id: string;
          question: string;
          category: string;
          interaction_type: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["faq_interactions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["faq_interactions"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      lead_status: LeadStatus;
      booking_status: BookingStatus;
      outreach_event_type: OutreachEventType;
    };
    CompositeTypes: Record<string, never>;
  };
}
