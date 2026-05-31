import { BRAND } from "@/lib/brand";

interface BrandLoadingProps {
  message?: string;
  rows?: number;
}

export function BrandLoading({ message = "Loading…", rows = 4 }: BrandLoadingProps) {
  return (
    <div className="min-h-screen bg-background p-6" role="status" aria-label={message}>
      <div className="mx-auto max-w-7xl space-y-5">
        {/* Header skeleton */}
        <div className="flex items-center gap-3">
          <div className="zenith-skeleton h-9 w-9 rounded-md" />
          <div className="zenith-skeleton h-5 w-40 rounded" />
        </div>
        {/* Metric cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="zenith-card space-y-3">
              <div className="zenith-skeleton h-3 w-24 rounded" />
              <div className="zenith-skeleton h-8 w-16 rounded" />
              <div className="zenith-skeleton h-2 w-32 rounded" />
            </div>
          ))}
        </div>
        {/* Main content block */}
        <div className="zenith-card">
          <div className="zenith-skeleton h-96 w-full rounded" />
        </div>
        <p className="text-center text-sm text-[#94A3B8]">{message}</p>
      </div>
    </div>
  );
}

/** Inline spinner for within-page loading states */
export function BrandSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const s = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-8 w-8" : "h-5 w-5";
  return (
    <span
      className={`inline-block ${s} animate-spin rounded-full border-2 border-[#1E293B] border-t-primary`}
      aria-hidden="true"
    />
  );
}

/** Full-screen brand loading splash */
export function BrandSplash() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background">
      <span className="grid h-14 w-14 place-items-center rounded-xl bg-primary font-black text-xl text-white">
        {BRAND.logo.mark}
      </span>
      <BrandSpinner size="md" />
      <p className="text-sm text-[#94A3B8]">Loading {BRAND.name}…</p>
    </div>
  );
}
