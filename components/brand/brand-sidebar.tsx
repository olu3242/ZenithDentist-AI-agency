"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "./brand-logo";
import { cn } from "@/lib/utils";
import type { BRAND } from "@/lib/brand";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface BrandSidebarProps {
  submark?: keyof typeof BRAND.logo.submarks;
  subtitle?: string;
  href?: string;
  nav: NavItem[];
  footer?: React.ReactNode;
}

export function BrandSidebar({ submark, subtitle, href = "/", nav, footer }: BrandSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="zenith-sidebar flex flex-col">
      <BrandLogo href={href} submark={submark} subtitle={subtitle} />

      <nav className="mt-6 flex-1 space-y-0.5" aria-label="Primary navigation">
        {nav.map(item => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-card text-[#F8FAFC]"
                  : "text-[#94A3B8] hover:bg-card hover:text-[#F8FAFC]"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="flex-1">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-black text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {footer && (
        <div className="mt-4 border-t border-card pt-4">
          {footer}
        </div>
      )}
    </aside>
  );
}
