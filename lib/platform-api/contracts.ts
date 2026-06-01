export interface PlatformApiEnvelope<T> {
  apiVersion: "2026-05-22";
  organizationId: string;
  correlationId: string;
  data: T;
}

export function createPlatformEnvelope<T>(organizationId: string, correlationId: string, data: T): PlatformApiEnvelope<T> {
  return { apiVersion: "2026-05-22", organizationId, correlationId, data };
}
