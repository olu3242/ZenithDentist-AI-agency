export type ApiPermission = "runtime:read" | "runtime:write" | "customer:read" | "recovery:write" | "billing:read" | "governance:admin";

export interface ApiKeyPrincipal {
  keyId: string;
  organizationId: string;
  permissions: ApiPermission[];
}

export function hasApiPermission(principal: ApiKeyPrincipal, permission: ApiPermission) {
  return principal.permissions.includes(permission) || principal.permissions.includes("governance:admin");
}
