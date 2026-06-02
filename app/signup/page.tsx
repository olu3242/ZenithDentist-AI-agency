import Link from "next/link";
import { signupAction } from "@/app/auth-actions";
import { AuthCard, AuthError } from "@/components/auth/auth-card";
import { SubmitButton } from "@/components/auth/submit-button";
import { getBootstrapState } from "@/lib/onboarding/bootstrap";

export default async function SignupPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const state = await getBootstrapState();
  const isFirstUser = state.configured && !state.hasPlatformAdmin;

  return (
    <AuthCard
      title={isFirstUser ? "Create the first platform admin" : "Request client access"}
      subtitle={isFirstUser ? "The first registered user becomes Super Admin and creates the default organization." : "Zenith does not allow open self-registration. Submit an access request and your tenant will be provisioned after approval."}
      footer={<span>Already onboarded? <Link className="font-black text-teal" href="/login">Log in</Link>.</span>}
    >
      <AuthError message={params?.error} />
      <form action={signupAction} className="grid gap-4" aria-describedby="signup-feedback">
        <p id="signup-feedback" className="rounded border border-line bg-surface p-3 text-sm font-semibold text-muted">
          {isFirstUser
            ? "This creates the first internal Super Admin, default organization, membership, and onboarding run."
            : "This does not create dashboard access. Client portals open only after contract execution, setup fee payment, organization approval, and user authorization."}
        </p>
        <label className="grid gap-1 text-sm font-bold text-ink">Full name<input name="fullName" required autoComplete="name" className="rounded border border-line px-3 py-2" /></label>
        <label className="grid gap-1 text-sm font-bold text-ink">Email<input name="email" type="email" required autoComplete="email" className="rounded border border-line px-3 py-2" /></label>
        <label className="grid gap-1 text-sm font-bold text-ink">Password<input name="password" type="password" minLength={8} required autoComplete="new-password" className="rounded border border-line px-3 py-2" /></label>
        <label className="grid gap-1 text-sm font-bold text-ink">Organization<input name="organizationName" required defaultValue={isFirstUser ? "Zenith Default Organization" : ""} className="rounded border border-line px-3 py-2" /></label>
        <label className="grid gap-1 text-sm font-bold text-ink">
          Role
          <select name="role" defaultValue="practice_owner" disabled={isFirstUser} className="rounded border border-line px-3 py-2">
            <option value="practice_owner">Practice Owner</option>
            <option value="staff">Staff</option>
            <option value="agency_admin">Agency Admin</option>
          </select>
        </label>
        {isFirstUser ? <input type="hidden" name="role" value="super_admin" /> : null}
        <SubmitButton pendingText={isFirstUser ? "Creating Super Admin..." : "Creating account..."}>
          {isFirstUser ? "Bootstrap Super Admin" : "Request Access"}
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
