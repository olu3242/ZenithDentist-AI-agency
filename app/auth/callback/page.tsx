import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";

export default function AuthCallbackPage() {
  return (
    <AuthCard title="Email verified" subtitle="Your auth callback is reachable. Continue to portal selection to finish routing.">
      <Link href="/portal-select" className="inline-flex min-h-10 items-center rounded bg-teal px-4 text-sm font-black text-white">Continue</Link>
    </AuthCard>
  );
}
