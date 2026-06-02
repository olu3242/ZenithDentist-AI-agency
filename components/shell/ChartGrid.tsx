import { cn } from "@/lib/utils";

const colsMap: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 lg:grid-cols-2",
};

export function ChartGrid({
  children,
  cols = 2,
}: {
  children: React.ReactNode;
  cols?: 1 | 2;
}) {
  return (
    <div className={cn("grid gap-5", colsMap[cols])}>
      {children}
    </div>
  );
}
