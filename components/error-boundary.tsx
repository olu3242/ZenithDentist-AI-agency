"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

export class ErrorBoundary extends Component<
  { children: ReactNode; fallbackTitle?: string },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(JSON.stringify({ level: "error", message: error.message, componentStack: info.componentStack }));
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <section className="rounded border border-line bg-white p-6">
        <h2 className="text-xl font-black">{this.props.fallbackTitle ?? "This panel failed to load."}</h2>
        <p className="mt-2 text-muted">Refresh the panel or retry after checking the operational logs.</p>
        <Button className="mt-4" onClick={() => this.setState({ hasError: false })}>Retry</Button>
      </section>
    );
  }
}
