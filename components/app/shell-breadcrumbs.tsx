"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

function labelFor(segment: string) {
  return segment
    .split("-")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function ShellBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (!segments.length) {
    return null;
  }

  const crumbs = segments.map((segment, index) => ({
    href: `/${segments.slice(0, index + 1).join("/")}`,
    label: labelFor(segment)
  }));

  return (
    <nav className="flex min-w-0 items-center gap-1 overflow-hidden text-xs font-black uppercase tracking-wider text-muted" aria-label="Breadcrumb">
      <Link href="/" className="shrink-0 hover:text-teal">Home</Link>
      {crumbs.map((crumb, index) => {
        const isCurrent = index === crumbs.length - 1;
        return (
          <span key={crumb.href} className="flex min-w-0 items-center gap-1">
            <ChevronRight className="h-3 w-3 shrink-0 text-muted/60" />
            {isCurrent ? (
              <span className="truncate text-ink">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="truncate hover:text-teal">{crumb.label}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
