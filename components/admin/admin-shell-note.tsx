export function AdminShellNote() {
  return (
    <div className="rounded border border-gold/30 bg-warning/10 p-4 text-sm text-[#F8FAFC]">
      Admin protection is scaffolded with <code>ADMIN_ACCESS_TOKEN</code>. Replace this with Supabase Auth and role claims
      before exposing sensitive client data to a wider team.
    </div>
  );
}
