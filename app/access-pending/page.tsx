import Link from "next/link";
import { Clock3, ShieldCheck } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { LEGAL_ENTITY } from "@/lib/legal-entity";

const reasonMessages: Record<string, string> = {
  approval_required: "Your account exists but has not yet been approved.",
  email_not_authorized: "This email is not authorized for Zenith platform access.",
  client_account_missing: "This email has not been linked to an approved client account.",
  organization_missing: "Your client account is approved, but the organization has not been activated yet.",
  subscription_inactive: "Your account is approved, but subscription access is not active.",
  client_suspended: "This client account is currently suspended.",
  client_cancelled: "This client account is no longer active.",
  lookup_failed: "Access could not be verified. Please contact support."
};

export default async function AccessPendingPage({
  searchParams
}: {
  searchParams?: Promise<{ reason?: string; email?: string }>;
}) {
  const params = await searchParams;
  const message = reasonMessages[params?.reason ?? ""] ?? reasonMessages.approval_required;

  return (
    <AuthCard
      title="Access pending"
      subtitle="Zenith portal access is granted only after contract execution, initial payment, organization approval, and user authorization."
      footer={<span>Need help? Contact {LEGAL_ENTITY.brandName} through your implementation or sales contact.</span>}
    >
      <div className="grid gap-4">
        <div className="rounded border border-line bg-surface p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded bg-gold/15 text-gold">
              <Clock3 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-black text-ink">{message}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-muted">
                Please contact Zenith AI Automation Agency if you believe this is an error.
              </p>
              {params?.email ? <p className="mt-2 text-xs font-bold uppercase tracking-wider text-muted">Email: {params.email}</p> : null}
            </div>
          </div>
        </div>

        <div className="rounded border border-teal/25 bg-teal/10 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-teal" />
            <p className="text-sm font-semibold leading-6 text-muted">
              No self-service registration, automatic organization creation, automatic tenant creation, or automatic Google OAuth activation is allowed.
              All client organizations, users, and access rights must be explicitly approved by {LEGAL_ENTITY.legalName}.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/" className="inline-flex min-h-10 items-center justify-center rounded bg-teal px-4 text-sm font-black text-white">
            Back to Website
          </Link>
          <Link href="/login" className="inline-flex min-h-10 items-center justify-center rounded border border-line bg-white px-4 text-sm font-black text-ink">
            Try Login Again
          </Link>
        </div>
      </div>
    </AuthCard>
  );
}
