import { cn } from "@/lib/utils";

export function DashboardContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mx-auto flex w-full max-w-7xl flex-col gap-6", className)}>{children}</div>;
}

export function DashboardGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("grid min-w-0 gap-6 xl:grid-cols-2", className)}>{children}</section>;
}

export function KpiGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4", className)}>{children}</section>;
}
