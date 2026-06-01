import { brandConfig } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function GlobalBrandWordmark({
  subtitle = brandConfig.descriptor,
  className,
  textClassName,
  mutedClassName = "text-muted"
}: {
  subtitle?: string;
  className?: string;
  textClassName?: string;
  mutedClassName?: string;
}) {
  return (
    <span className={cn("min-w-0 leading-none", className)}>
      <strong className={cn("block text-xl font-black leading-none tracking-normal", textClassName)}>
        {brandConfig.shortName}
      </strong>
      {subtitle ? <small className={cn("mt-1 block text-xs font-semibold leading-tight", mutedClassName)}>{subtitle}</small> : null}
    </span>
  );
}
