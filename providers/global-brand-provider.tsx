import type React from "react";
import { BrandProvider } from "@/providers/brand-provider";

export function GlobalBrandProvider({ children }: { children: React.ReactNode }) {
  return <BrandProvider>{children}</BrandProvider>;
}
