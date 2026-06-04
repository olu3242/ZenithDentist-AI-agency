import Link from "next/link";
import { updatePasswordAction } from "@/app/auth-actions";
import { AuthCard } from "@/components/auth/auth-card";
import { SubmitButton } from "@/components/auth/submit-button";

export default async function AuthResetPasswordPage({
  searchParams
}: {
  searchParams?: Promise<{ code?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthCard title="Choose a new password" subtitle="Complete your Supabase password recovery and return to login.">
      {params?.error ? <div className="mb-4 rounded border border-rust/30 bg-rust/10 p-3 text-sm font-bold text-rust">{params.error}</div> : null}
      {params?.code ? (
        <form action={updatePasswordAction} className="grid gap-4">
          <input type="hidden" name="code" value={params.code} />
          <label className="grid gap-1 text-sm font-bold text-ink">New password<input name="password" type="password" minLength={8} required autoComplete="new-password" className="rounded border border-line px-3 py-2" /></label>
          <label className="grid gap-1 text-sm font-bold text-ink">Confirm password<input name="confirmPassword" type="password" minLength={8} required autoComplete="new-password" className="rounded border border-line px-3 py-2" /></label>
          <SubmitButton pendingText="Updating password...">Update Password</SubmitButton>
        </form>
      ) : (
        <div className="grid gap-4">
          <p className="rounded border border-line bg-surface p-3 text-sm font-semibold text-muted">Reset links must include a valid Supabase recovery code.</p>
          <Link href="/forgot-password" className="inline-flex min-h-10 items-center justify-center rounded bg-teal px-4 text-sm font-black text-white">Request New Link</Link>
        </div>
      )}
    </AuthCard>
  );
}
