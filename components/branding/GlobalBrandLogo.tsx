import Link from "next/link";
import { brandConfig } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { GlobalBrandIcon } from "@/components/branding/GlobalBrandIcon";
import { GlobalBrandWordmark } from "@/components/branding/GlobalBrandWordmark";

export function GlobalBrandLogo({
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
      <GlobalBrandIcon className={markClassName} />
      {iconOnly ? null : (
        <GlobalBrandWordmark
          subtitle={subtitle}
          textClassName={textClassName}
          mutedClassName={mutedClassName}
        />
      )}
    </>
  );

  return (
    <Link href={href} className={cn("inline-flex items-center gap-3", className)} aria-label={`${brandConfig.name} home`}>
      {content}
    </Link>
  );
}
