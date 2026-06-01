export function selectDegradedMode(input: { providerHealthy: boolean; queuePressure: number; aiConfigured: boolean }) {
  if (!input.providerHealthy) return "provider_fallback";
  if (input.queuePressure > 80) return "queue_throttle";
  if (!input.aiConfigured) return "local_reasoning";
  return "normal";
}
