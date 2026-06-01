export function calculateStabilityScore(input: { failures: number; retries: number; completed: number; providerHealthy: boolean }) {
  const total = Math.max(1, input.failures + input.completed);
  const failurePenalty = input.failures / total * 45;
  const retryPenalty = Math.min(25, input.retries * 2);
  const providerPenalty = input.providerHealthy ? 0 : 20;
  return Math.max(0, Math.round(100 - failurePenalty - retryPenalty - providerPenalty));
}
