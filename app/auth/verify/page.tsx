import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";

export default function AuthVerifyPage() {
  return (
    <AuthCard title="Check your email" subtitle="Verification links return to /auth/callback, then route through the portal selector.">
      <Link href="/login" className="inline-flex min-h-10 items-center rounded bg-teal px-4 text-sm font-black text-white">Back to Login</Link>
    </AuthCard>
  );
}
