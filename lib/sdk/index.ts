import { createPlatformEnvelope } from "@/lib/platform-api/contracts";

export function createZenithInternalSdk(input: { organizationId: string; correlationId: string }) {
  return {
    envelope<T>(data: T) {
      return createPlatformEnvelope(input.organizationId, input.correlationId, data);
    },
    meterUsage(counterKey: string, quantity: number) {
      return { organizationId: input.organizationId, counterKey, quantity, correlationId: input.correlationId };
    }
  };
}
