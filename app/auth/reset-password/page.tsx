import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";

export default function AuthResetPasswordPage() {
  return (
    <AuthCard title="Choose a new password" subtitle="This route is public and ready for Supabase password recovery completion.">
      <Link href="/login" className="inline-flex min-h-10 items-center rounded bg-teal px-4 text-sm font-black text-white">Return to Login</Link>
    </AuthCard>
  );
}
