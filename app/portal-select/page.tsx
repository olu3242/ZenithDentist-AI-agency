import { redirect } from "next/navigation";
import Link from "next/link";
import { getDefaultPortalForRole, roleLabel, type ZenithRole } from "@/lib/auth-routing";
import { getOptionalCurrentZenithRole } from "@/lib/server-auth";

const portalOptions: Array<{ role: ZenithRole; href: string; description: string }> = [
  { role: "practice_owner", href: "/portal", description: "Client revenue intelligence portal" },
  { role: "staff", href: "/dashboard", description: "Staff operating dashboard" },
  { role: "agency_admin", href: "/admin", description: "Agency CRM and delivery workspace" },
  { role: "super_admin", href: "/mission-control", description: "Platform mission control" }
];

export default async function PortalSelectPage() {
  const role = await getOptionalCurrentZenithRole();
  if (role) redirect(getDefaultPortalForRole(role));

  return (
    <main className="min-h-screen bg-paper px-5 py-16">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-black uppercase tracking-wider text-teal">Zenith AI Automation Agency</p>
        <h1 className="mt-3 text-4xl font-black text-ink">Select your portal</h1>
        <p className="mt-3 max-w-2xl text-base font-semibold text-muted">
          Your session needs a valid access token before protected portals open. Choose the correct destination after signing in or setting the matching access token.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {portalOptions.map(option => (
            <Link key={option.role} href={option.href} className="rounded border border-line bg-white p-5 shadow-sm hover:bg-paper">
              <strong className="text-lg text-ink">{roleLabel(option.role)}</strong>
              <span className="mt-2 block text-sm font-semibold text-muted">{option.description}</span>
              <span className="mt-4 block text-sm font-black text-teal">{option.href}</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
