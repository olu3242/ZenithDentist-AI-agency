import type React from "react";
import { brandConfig } from "@/lib/brand";
import { themeConfig } from "@/lib/theme";

export function BrandProvider({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-brand={brandConfig.name}
      data-product={brandConfig.productAcronym}
      style={themeConfig.cssVariables as React.CSSProperties}
    >
      {children}
    </div>
  );
}
