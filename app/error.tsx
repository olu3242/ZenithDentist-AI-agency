"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Operational Fallback:", error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-6">
      <section className="max-w-3xl rounded border border-line bg-white p-8 shadow-soft">
        <p className="text-sm font-bold uppercase tracking-wider text-rust">
          Operational Fallback
        </p>

        <h1 className="mt-3 text-3xl font-black">
          Something failed to load cleanly
        </h1>

        <p className="mt-3 text-muted">
          The platform caught the error and kept the route recoverable.
        </p>

        <div className="mt-6 overflow-auto rounded bg-surface p-4">
          <pre className="whitespace-pre-wrap text-xs text-rust">
            {error?.message || "Unknown error"}
          </pre>

          {error?.digest ? (
            <div className="mt-2 text-xs text-muted">
              Digest: {error.digest}
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => reset()}>
            Retry
          </Button>

          <Button
            variant="secondary"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
        </div>
      </section>
    </main>
  );
}
