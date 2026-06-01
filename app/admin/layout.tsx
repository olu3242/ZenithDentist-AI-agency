import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="zenith-layout lg:grid-cols-[var(--sidebar-width)_1fr]">
      <AdminSidebar />
      <main className="p-5 lg:p-8">{children}</main>
    </div>
  );
}
