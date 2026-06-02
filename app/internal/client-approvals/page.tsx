import { CheckCircle2, KeyRound, MailPlus, PauseCircle, Power, ShieldOff, XCircle } from "lucide-react";
import { clientAccessAction, createClientAccountAction } from "@/app/internal/client-approvals/actions";
import { getClientApprovalState } from "@/lib/access-control";
import { LEGAL_ENTITY } from "@/lib/legal-entity";

interface ClientApprovalRow {
  id: string;
  organization_id: string | null;
  email: string;
  full_name: string | null;
  practice_name: string | null;
  status: string;
  package_type: string;
  contract_signed: boolean;
  setup_fee_paid: boolean;
  approved_for_access: boolean;
  subscription_active: boolean;
}

export default async function InternalClientApprovalsPage({
  searchParams
}: {
  searchParams?: Promise<{ status?: string; error?: string }>;
}) {
  const params = await searchParams;
  const state = await getClientApprovalState();
  const accounts = state.accounts as ClientApprovalRow[];

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-black uppercase tracking-wider text-teal">Client Access Lockdown</p>
        <h1 className="mt-2 text-4xl font-black text-ink">Client Approvals</h1>
        <p className="mt-2 max-w-4xl text-muted">
          No self-service registration. No automatic organization creation. No automatic Google OAuth activation. Access is granted only after contract execution,
          initial invoice payment, organization approval, and user authorization by {LEGAL_ENTITY.legalName}.
        </p>
      </header>

      {params?.status ? <Notice tone="success" message={params.status} /> : null}
      {params?.error ? <Notice tone="error" message={params.error} /> : null}
      {!state.configured ? <Notice tone="error" message="Supabase service persistence is not configured. Client approval records cannot be loaded." /> : null}

      <section className="rounded border border-line bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <MailPlus className="h-5 w-5 text-teal" />
          <h2 className="text-xl font-black text-ink">Create Pending Client</h2>
        </div>
        <form action={createClientAccountAction} className="grid gap-3 md:grid-cols-4">
          <label className="grid gap-1 text-sm font-bold text-ink">Email<input name="email" type="email" required className="rounded border border-line px-3 py-2" /></label>
          <label className="grid gap-1 text-sm font-bold text-ink">Name<input name="fullName" className="rounded border border-line px-3 py-2" /></label>
          <label className="grid gap-1 text-sm font-bold text-ink">Practice<input name="practiceName" className="rounded border border-line px-3 py-2" /></label>
          <label className="grid gap-1 text-sm font-bold text-ink">
            Package
            <select name="packageType" defaultValue="revenue_recovery_system" className="rounded border border-line px-3 py-2">
              <option value="revenue_recovery_system">Revenue Recovery</option>
              <option value="ai_practice_growth_system">AI Practice Growth</option>
              <option value="managed_ai_operations">Managed AI Operations</option>
            </select>
          </label>
          <button className="min-h-11 rounded bg-teal px-4 text-sm font-black text-white md:col-span-4">Create Access Record</button>
        </form>
      </section>

      <section className="rounded border border-line bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-teal" />
          <h2 className="text-xl font-black text-ink">Approval Queue</h2>
        </div>
        <div className="grid gap-3">
          {accounts.length ? accounts.map(account => <ClientAccountRow key={account.id} account={account} />) : (
            <div className="rounded border border-dashed border-line bg-paper p-4 text-sm font-bold text-muted">No client accounts are waiting for approval.</div>
          )}
        </div>
      </section>
    </div>
  );
}

function ClientAccountRow({ account }: { account: ClientApprovalRow }) {
  return (
    <article className="rounded border border-line bg-white p-4">
      <div className="grid gap-3 xl:grid-cols-[1.2fr_0.9fr_0.9fr_0.9fr_1fr]">
        <div>
          <p className="font-black text-ink">{account.practice_name || account.full_name || account.email}</p>
          <p className="text-sm font-semibold text-muted">{account.email}</p>
        </div>
        <Badge label={account.status} tone={account.approved_for_access ? "success" : "warning"} />
        <Badge label={account.package_type} tone="neutral" />
        <div className="text-sm font-bold text-muted">
          <p>Contract: {account.contract_signed ? "signed" : "pending"}</p>
          <p>Setup fee: {account.setup_fee_paid ? "paid" : "pending"}</p>
          <p>Subscription: {account.subscription_active ? "active" : "inactive"}</p>
        </div>
        <form action={clientAccessAction} className="grid gap-2">
          <input type="hidden" name="clientAccountId" value={account.id} />
          <input type="hidden" name="organizationName" value={account.practice_name || account.full_name || account.email} />
          <div className="grid grid-cols-2 gap-2">
            <ActionButton action="approve" label="Approve" icon={CheckCircle2} />
            <ActionButton action="activate" label="Activate" icon={Power} />
            <ActionButton action="suspend" label="Suspend" icon={PauseCircle} />
            <ActionButton action="deactivate" label="Deactivate" icon={ShieldOff} />
            <ActionButton action="resend_invitation" label="Invite" icon={MailPlus} />
            <ActionButton action="revoke" label="Revoke" icon={XCircle} />
          </div>
        </form>
      </div>
    </article>
  );
}

function ActionButton({ action, label, icon: Icon }: { action: string; label: string; icon: typeof CheckCircle2 }) {
  return (
    <button name="action" value={action} className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-line bg-paper px-3 text-xs font-black text-ink hover:bg-white">
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function Badge({ label, tone }: { label: string; tone: "success" | "warning" | "neutral" }) {
  const classes = tone === "success"
    ? "border-green/30 bg-green/10 text-green"
    : tone === "warning"
      ? "border-gold/30 bg-gold/10 text-gold"
      : "border-line bg-paper text-muted";
  return <span className={`inline-flex h-9 items-center justify-center rounded border px-3 text-xs font-black uppercase tracking-wider ${classes}`}>{label}</span>;
}

function Notice({ tone, message }: { tone: "success" | "error"; message: string }) {
  const classes = tone === "success" ? "border-green/30 bg-green/10 text-green" : "border-rust/30 bg-rust/10 text-rust";
  return <div className={`rounded border p-3 text-sm font-bold ${classes}`}>{message}</div>;
}
