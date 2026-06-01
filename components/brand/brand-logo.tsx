import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  href?: string;
  submark?: keyof typeof BRAND.logo.submarks;
  subtitle?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { mark: "h-7 w-7 text-xs",  title: "text-sm",  sub: "text-[10px]" },
  md: { mark: "h-9 w-9 text-sm",  title: "text-base", sub: "text-xs" },
  lg: { mark: "h-11 w-11 text-base", title: "text-lg", sub: "text-xs" },
};

export function BrandLogo({ href = "/", submark, subtitle, size = "md", className }: BrandLogoProps) {
  const s = sizeMap[size];
  const title = submark ? BRAND.logo.submarks[submark] : BRAND.logo.wordmark;
  const sub = subtitle ?? (submark ? undefined : BRAND.tagline);

  const inner = (
    <span className={cn("flex items-center gap-3 select-none", className)}>
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-md font-black text-white",
          "bg-primary",
          s.mark
        )}
        aria-hidden="true"
      >
        {BRAND.logo.mark}
      </span>
      <span>
        <strong className={cn("block font-black tracking-tight text-[#F8FAFC]", s.title)}>
          {title}
        </strong>
        {sub && (
          <small className={cn("block text-[#94A3B8]", s.sub)}>{sub}</small>
        )}
      </span>
    </span>
  );

  if (!href) return inner;

  return (
    <Link href={href} className="outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded-md">
      {inner}
    </Link>
  );
}
