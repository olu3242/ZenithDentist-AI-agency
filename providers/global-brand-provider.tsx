import type React from "react";
import { brandConfig } from "@/lib/brand";
import { themeConfig } from "@/lib/theme";

export function GlobalBrandProvider({ children }: { children: React.ReactNode }) {
  const style = {
    ...themeConfig.cssVariables
  } as React.CSSProperties;

  return <div data-brand={brandConfig.shortName} style={style}>{children}</div>;
}
