import { cn } from "@/lib/utils";

export function GlobalBrandIcon({ className, title = "Zenith circuit Z" }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      className={cn("h-10 w-10 shrink-0", className)}
    >
      <defs>
        <linearGradient id="zenith-mark-gradient" x1="8" x2="56" y1="10" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <path
        d="M16 12h36L30 32h20L18 52h36"
        fill="none"
        stroke="url(#zenith-mark-gradient)"
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeWidth="7"
      />
      <path
        d="M16 18h11m20 0h5M18 46h14m12 0h10M24 12v8m26 13v-9M29 32H16m10 11V31"
        fill="none"
        stroke="url(#zenith-mark-gradient)"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
      <circle cx="16" cy="18" r="3" fill="#2563EB" />
      <circle cx="50" cy="24" r="3" fill="#06B6D4" />
      <circle cx="16" cy="32" r="3" fill="#2563EB" />
      <circle cx="26" cy="43" r="3" fill="#06B6D4" />
      <circle cx="54" cy="46" r="3" fill="#06B6D4" />
      <circle cx="22" cy="56" r="2" fill="#2563EB" />
      <circle cx="58" cy="56" r="2" fill="#06B6D4" />
      <circle cx="10" cy="26" r="2" fill="#2563EB" />
    </svg>
  );
}
