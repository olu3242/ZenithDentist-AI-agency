import { z } from "zod";

const optionalString = z.preprocess(value => value === "" ? undefined : value, z.string().min(1).optional());
const optionalUrl = z.preprocess(value => value === "" ? undefined : value, z.string().url().optional());

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalString,
  SUPABASE_SECRET_KEY: optionalString,
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  RESEND_API_KEY: optionalString,
  STRIPE_API_KEY: optionalString,
  NEXT_PUBLIC_GA_ID: optionalString,
  NEXT_PUBLIC_META_PIXEL_ID: optionalString,
  NEXT_PUBLIC_LINKEDIN_PARTNER_ID: optionalString,
  CALENDLY_URL: z.string().url().default("https://calendly.com/your-team/revenue-audit"),
  ADMIN_ACCESS_TOKEN: z.string().min(12).optional(),
  PORTAL_ACCESS_TOKEN: z.string().min(12).optional(),
  INTERNAL_ACCESS_TOKEN: z.string().min(12).optional(),
  NEXT_PUBLIC_DEFAULT_ORG_SLUG: z.string().min(2).default("demo-dental-group"),
  AI_PROVIDER: z.enum(["local", "openai", "anthropic"]).default("local"),
  OPENAI_API_KEY: optionalString,
  ANTHROPIC_API_KEY: optionalString,
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000")
});

export const env = envSchema.parse(process.env);

export const hasSupabaseServerEnv = Boolean(
  env.NEXT_PUBLIC_SUPABASE_URL && (env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY)
);

export const hasSupabaseBrowserEnv = Boolean(
  env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
