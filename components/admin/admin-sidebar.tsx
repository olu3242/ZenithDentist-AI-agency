"use client";
import { BarChart3, CalendarCheck, ClipboardList, Gauge, LayoutDashboard, Users } from "lucide-react";
import { BrandSidebar } from "@/components/brand";
import type { NavItem } from "@/components/brand";

const nav: NavItem[] = [
  { href: "/admin",           label: "Command",   icon: LayoutDashboard },
  { href: "/admin/leads",     label: "Leads",     icon: Users },
  { href: "/admin/audits",    label: "Audits",    icon: ClipboardList },
  { href: "/admin/bookings",  label: "Bookings",  icon: CalendarCheck },
  { href: "/admin/roi",       label: "ROI",       icon: Gauge },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export function AdminSidebar() {
  return (
    <BrandSidebar
      submark="admin"
      subtitle="Revenue command center"
      href="/admin"
      nav={nav}
    />
  );
}
