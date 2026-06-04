import { brandConfig } from "@/lib/brand";
import { ZenithLogo } from "@/components/branding/ZenithLogo";

export function GlobalBrandLoader() {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <div className="w-full max-w-lg rounded border border-border bg-card p-6 shadow-soft">
        <ZenithLogo />
        <div className="mt-8 grid place-items-center gap-5">
          <div className="relative grid h-20 w-20 place-items-center rounded-full bg-surface">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/15" />
            <ZenithLogo iconOnly className="relative animate-pulse" markClassName="h-14 w-14 border-0 bg-transparent" />
          </div>
          <p className="text-center text-sm font-bold text-muted">{brandConfig.trademark} is loading operational context.</p>
          <div className="w-full space-y-3">
            <div className="h-4 w-2/3 animate-pulse rounded bg-border" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-border" />
            <div className="grid gap-3 md:grid-cols-3">
              {[0, 1, 2].map(item => <div key={item} className="h-20 animate-pulse rounded bg-surface" />)}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
