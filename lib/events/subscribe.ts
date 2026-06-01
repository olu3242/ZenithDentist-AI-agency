export function buildTenantEventChannel(organizationId: string) {
  return `tenant:${organizationId}:events`;
}

export function buildDashboardEventFilter(organizationId: string) {
  return { event: "*", schema: "public", table: "platform_events", filter: `organization_id=eq.${organizationId}` };
}
