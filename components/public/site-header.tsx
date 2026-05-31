import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/20 bg-surface/92 px-5 py-4 text-white backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded bg-accent font-black">Z</span>
          <span>
            <strong className="block leading-tight">ZENITH.AI</strong>
            <small className="text-white/60">Patient Revenue Engine</small>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-bold text-white/75 md:flex">
          <a href="#roi">ROI</a>
          <a href="#audit">Audit</a>
          <a href="#faq">FAQ</a>
          <Button asChild size="sm"><a href="#roi">Calculate Revenue</a></Button>
        </nav>
      </div>
    </header>
  );
}
