import { InternalSidebar } from "@/components/internal/internal-sidebar";

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[280px_1fr]">
      <InternalSidebar />
      <main className="p-5 lg:p-8">{children}</main>
    </div>
  );
}
