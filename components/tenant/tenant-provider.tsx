"use client";

import { createContext, useContext } from "react";
import type { TenantContext } from "@/lib/tenant";

const TenantContextValue = createContext<TenantContext>({ organizationSlug: "demo-dental-group" });

export function TenantProvider({ tenant, children }: { tenant: TenantContext; children: React.ReactNode }) {
  return <TenantContextValue.Provider value={tenant}>{children}</TenantContextValue.Provider>;
}

export function useTenant() {
  return useContext(TenantContextValue);
}
