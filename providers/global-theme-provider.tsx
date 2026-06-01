import type React from "react";
import { themeConfig } from "@/lib/theme";

export function GlobalThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={themeConfig.cssVariables as React.CSSProperties}
    >
      {children}
    </div>
  );
}
