import { GlobalBrandLogo } from "@/components/branding/GlobalBrandLogo";

export function AuthCard({
  title,
  subtitle,
  children,
  footer
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-paper px-5 py-16">
      <div className="mx-auto max-w-lg rounded border border-line bg-white p-6 shadow-sm">
        <GlobalBrandLogo />
        <div className="mt-8">
          <p className="text-xs font-black uppercase tracking-wider text-teal">Secure access</p>
          <h1 className="mt-2 text-3xl font-black text-ink">{title}</h1>
          <p className="mt-2 text-sm font-semibold text-muted">{subtitle}</p>
        </div>
        <div className="mt-6">{children}</div>
        {footer ? <div className="mt-6 border-t border-line pt-4 text-sm font-semibold text-muted">{footer}</div> : null}
      </div>
    </main>
  );
}

export function AuthError({ message }: { message?: string }) {
  if (!message) return null;
  return <div className="mb-4 rounded border border-rust/30 bg-rust/10 p-3 text-sm font-bold text-rust">{message}</div>;
}
