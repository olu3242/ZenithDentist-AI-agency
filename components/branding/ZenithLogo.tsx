import Link from "next/link";
import { brandConfig } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function ZenithLogo({
  href = "/",
  subtitle = brandConfig.descriptor,
  className,
  markClassName,
  textClassName,
  mutedClassName = "text-muted",
  iconOnly = false
}: {
  href?: string;
  subtitle?: string;
  className?: string;
  markClassName?: string;
  textClassName?: string;
  mutedClassName?: string;
  iconOnly?: boolean;
}) {
  const content = (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center",
          markClassName
        )}
      >
        <svg viewBox="0 0 32 32" className="h-full w-full" role="presentation">
          <defs>
            <linearGradient id="zenith-pros-logo-gradient" x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
              <stop stopColor={brandConfig.colors.primary} />
              <stop offset="1" stopColor={brandConfig.colors.secondary} />
            </linearGradient>
          </defs>
          <path d="M6 6H26L14 18H26V26H6L18 14H6V6Z" fill="url(#zenith-pros-logo-gradient)" />
          <path d="M13 11H19V13H13V11Z" fill={brandConfig.colors.navy} />
          <path d="M15 9H17V15H15V9Z" fill={brandConfig.colors.navy} />
        </svg>
      </span>
      {iconOnly ? null : (
        <span className="min-w-0 leading-none">
          <strong className={cn("block truncate text-lg font-black uppercase leading-none tracking-normal", textClassName)}>
            {brandConfig.shortName} <span className="text-[color:var(--brand-primary)]">{brandConfig.productAcronym}</span>
          </strong>
          {subtitle ? (
            <small className={cn("mt-1 block truncate font-mono text-[9px] font-semibold uppercase leading-tight tracking-[0.22em]", mutedClassName)}>
              {subtitle}
            </small>
          ) : null}
        </span>
      )}
    </>
  );

  return (
    <Link href={href} className={cn("inline-flex min-w-0 items-center gap-3", className)} aria-label={`${brandConfig.name} home`}>
      {content}
    </Link>
  );
}
