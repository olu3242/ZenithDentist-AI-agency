import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_GA_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_META_PIXEL_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_LINKEDIN_PARTNER_ID: z.string().min(1).optional(),
  CALENDLY_URL: z.string().url().default("https://calendly.com/your-team/revenue-audit"),
  ADMIN_ACCESS_TOKEN: z.string().min(12).optional(),
  PORTAL_ACCESS_TOKEN: z.string().min(12).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000")
});

export const env = envSchema.parse(process.env);

export const hasSupabaseServerEnv = Boolean(
  env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
);

export const hasSupabaseBrowserEnv = Boolean(
  env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
