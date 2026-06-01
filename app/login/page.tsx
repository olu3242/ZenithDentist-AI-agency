import Link from "next/link";
import { googleLoginAction, loginAction } from "@/app/auth-actions";
import { AuthCard, AuthError } from "@/components/auth/auth-card";
import { SubmitButton } from "@/components/auth/submit-button";

export default async function LoginPage({ searchParams }: { searchParams?: Promise<{ error?: string; reason?: string; email?: string }> }) {
  const params = await searchParams;
  const info = params?.reason === "signed-out"
    ? "You have been signed out."
    : params?.reason === "password-updated"
      ? "Password updated. Log in with your new credentials."
      : params?.reason === "auth-required"
        ? "Log in to access that portal."
        : params?.reason === "existing-email"
          ? "That email is already registered. Log in to continue, or reset your password if you do not remember it."
        : undefined;

  return (
    <AuthCard
      title="Log in"
      subtitle="Resolve your Zenith profile and continue to the correct portal."
      footer={<span>Need access? <Link className="font-black text-teal" href="/signup">Create an account</Link>. Forgot credentials? <Link className="font-black text-teal" href="/forgot-password">Reset access</Link>.</span>}
    >
      <AuthError message={params?.error} />
      {info ? <div className="mb-4 rounded border border-green/30 bg-green/10 p-3 text-sm font-bold text-green">{info}</div> : null}
      {params?.reason === "existing-email" ? (
        <Link href={`/forgot-password${params.email ? `?email=${encodeURIComponent(params.email)}` : ""}`} className="mb-4 inline-flex min-h-10 items-center justify-center rounded border border-line bg-surface px-4 text-sm font-black text-ink">
          Send password reset instead
        </Link>
      ) : null}
      <form action={loginAction} className="grid gap-4">
        <label className="grid gap-1 text-sm font-bold text-ink">Email<input name="email" type="email" required autoComplete="email" defaultValue={params?.email ?? ""} className="rounded border border-line px-3 py-2" /></label>
        <label className="grid gap-1 text-sm font-bold text-ink">Password<input name="password" type="password" required autoComplete="current-password" className="rounded border border-line px-3 py-2" /></label>
        <SubmitButton pendingText="Signing in...">Log In</SubmitButton>
      </form>
      <form action={googleLoginAction} className="mt-3">
        <SubmitButton pendingText="Opening Google..." className="w-full bg-white text-ink ring-1 ring-line hover:bg-paper">
          Continue with Google
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
