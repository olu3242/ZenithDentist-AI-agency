import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GlobalBrandLogo } from "@/components/branding/GlobalBrandLogo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/20 bg-ink/92 px-5 py-4 text-white backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <GlobalBrandLogo mutedClassName="text-white/60" />
        <nav className="hidden items-center gap-6 text-sm font-bold text-white/75 md:flex">
          <Link href="/login">Login</Link>
          <Link href="/signup">Signup</Link>
          <Link href="/dashboard">Dashboard</Link>
          <a href="#audit">Audit</a>
          <a href="#faq">FAQ</a>
          <Button asChild size="sm"><a href="/signup">Start Onboarding</a></Button>
        </nav>
      </div>
    </header>
  );
}
