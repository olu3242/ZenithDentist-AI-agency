import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { z } from "zod";
import { provisionOrganization } from "@/lib/tenant/organization-provisioning";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  practiceName: z.string().min(1).max(200),
});

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}

/**
 * POST /api/auth/register
 * Registers a new practice owner and provisions their organization.
 */
export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json(
      { success: false, error: "Authentication service not configured." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.errors[0]?.message ?? "Invalid request body." },
      { status: 400 }
    );
  }

  const { email, password, practiceName } = parsed.data;

  const response = NextResponse.json({ success: true });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() { return req.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error || !data.user) {
    return NextResponse.json(
      { success: false, error: error?.message ?? "Registration failed." },
      { status: 400 }
    );
  }

  const user = data.user;
  const organizationId = crypto.randomUUID();
  const slug = generateSlug(practiceName);

  const provision = await provisionOrganization({
    organizationId,
    organizationSlug: slug,
    organizationName: practiceName,
    ownerUserId: user.id,
    ownerEmail: email,
    planKey: "starter",
  });

  if (!provision.success) {
    // Non-fatal: user was created, provisioning can be retried
    return NextResponse.json(
      { success: true, organizationId, warning: "Organization provisioning partially failed.", steps: provision.steps },
      { status: 201 }
    );
  }

  return NextResponse.json({ success: true, organizationId }, { status: 201 });
}
