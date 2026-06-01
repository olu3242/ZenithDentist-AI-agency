import { InternalSidebar } from "@/components/internal/internal-sidebar";

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="zenith-layout">
      <InternalSidebar />
      <main className="p-5 lg:p-8">{children}</main>
    </div>
  );
}
