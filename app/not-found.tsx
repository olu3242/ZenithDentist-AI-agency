import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-paper px-6">
      <section className="max-w-xl rounded border border-line bg-white p-8 shadow-soft">
        <p className="text-sm font-bold uppercase tracking-wider text-muted">404</p>
        <h1 className="mt-3 text-3xl font-black">This page is not in the operating model.</h1>
        <p className="mt-3 text-muted">Return to the revenue engine and keep the funnel moving.</p>
        <Button asChild className="mt-6"><Link href="/">Go home</Link></Button>
      </section>
    </main>
  );
}
