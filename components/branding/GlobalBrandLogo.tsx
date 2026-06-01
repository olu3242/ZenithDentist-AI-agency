import { brandConfig } from "@/lib/brand";
import { ZenithLogo } from "@/components/branding/ZenithLogo";

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
  return (
    <ZenithLogo
      href={href}
      subtitle={subtitle}
      className={className}
      markClassName={markClassName}
      textClassName={textClassName}
      mutedClassName={mutedClassName}
      iconOnly={iconOnly}
    />
  );
}
