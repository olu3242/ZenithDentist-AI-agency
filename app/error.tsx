"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  error: Error & { digest?: string; code?: string; category?: string; recoverySuggestion?: string };
  reset: () => void;
}

function getCategoryLabel(category?: string): string {
  const labels: Record<string, string> = {
    AUTH_ERROR: "Authentication Error",
    DATABASE_ERROR: "Database Error",
    API_ERROR: "API Error",
    NETWORK_ERROR: "Network Error",
    RUNTIME_ERROR: "Runtime Error",
    WORKFLOW_ERROR: "Workflow Error",
    AI_ERROR: "AI Service Error",
    CONFIGURATION_ERROR: "Configuration Error",
    VALIDATION_ERROR: "Validation Error",
  };
  return labels[category ?? ""] ?? "Application Error";
}

export default function Error({ error, reset }: Props) {
  useEffect(() => {
    console.error("[ZenithError]", {
      message: error.message,
      code: error.code,
      category: error.category,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  const categoryLabel = getCategoryLabel(error.category);
  const errorCode = error.code ?? (error.digest ? `DIGEST-${error.digest}` : "UNK_001");
  const suggestion = error.recoverySuggestion ?? "Try refreshing the page. If this persists, contact support.";

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-6">
      <section className="max-w-xl rounded border border-line bg-white p-8 shadow-soft">
        <p className="text-sm font-bold uppercase tracking-wider text-rust">{categoryLabel}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="rounded bg-rust/10 px-2 py-0.5 font-mono text-xs text-rust">{errorCode}</span>
        </div>
        <h1 className="mt-3 text-2xl font-black">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted">{error.message || "An unexpected error occurred."}</p>
        <div className="mt-4 rounded border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-semibold text-amber-800">Recovery suggestion</p>
          <p className="mt-1 text-sm text-amber-700">{suggestion}</p>
        </div>
        <div className="mt-6 flex gap-3">
          <Button onClick={reset}>Retry</Button>
          <Button variant="secondary" onClick={() => window.location.href = "/portal"}>Go to Portal</Button>
        </div>
      </section>
    </main>
  );
}
