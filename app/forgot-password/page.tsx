import Link from "next/link";
import { forgotPasswordAction } from "@/app/auth-actions";
import { AuthCard, AuthError } from "@/components/auth/auth-card";
import { SubmitButton } from "@/components/auth/submit-button";

export default async function ForgotPasswordPage({ searchParams }: { searchParams?: Promise<{ sent?: string; error?: string }> }) {
  const params = await searchParams;
  return (
    <AuthCard
      title="Reset access"
      subtitle="Request a password reset for your Zenith account."
      footer={<span>Remembered it? <Link className="font-black text-teal" href="/login">Return to login</Link>.</span>}
    >
      <AuthError message={params?.error} />
      {params?.sent ? (
        <div className="rounded border border-green/30 bg-green/10 p-3 text-sm font-bold text-green">Reset instructions prepared for {params.sent}.</div>
      ) : (
        <form action={forgotPasswordAction} className="grid gap-4">
          <label className="grid gap-1 text-sm font-bold text-ink">Email<input name="email" type="email" required autoComplete="email" className="rounded border border-line px-3 py-2" /></label>
          <SubmitButton pendingText="Preparing reset...">Send Reset Link</SubmitButton>
        </form>
      )}
    </AuthCard>
  );
}
