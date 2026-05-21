"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-6">
      <section className="max-w-xl rounded border border-line bg-white p-8 shadow-soft">
        <p className="text-sm font-bold uppercase tracking-wider text-rust">Operational fallback</p>
        <h1 className="mt-3 text-3xl font-black">Something failed to load cleanly.</h1>
        <p className="mt-3 text-muted">
          The platform caught the error and kept the route recoverable. Try again, and check logs if this persists.
        </p>
        <Button className="mt-6" onClick={reset}>Retry</Button>
      </section>
    </main>
  );
}
