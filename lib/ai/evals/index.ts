export function evaluateAIResponse(input: { content: string; requiredSignals?: string[] }) {
  const missingSignals = (input.requiredSignals ?? []).filter(signal => !input.content.toLowerCase().includes(signal.toLowerCase()));
  return {
    grounded: missingSignals.length === 0,
    missingSignals,
    length: input.content.length,
    evaluatedAt: new Date().toISOString()
  };
}
