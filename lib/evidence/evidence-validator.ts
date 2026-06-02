import { certificationSubsystems, evidenceRegistry, type EvidenceInput } from "@/lib/evidence/evidence-registry";

export function validateEvidence(input: EvidenceInput) {
  const registry = evidenceRegistry[input.type];
  const missing = registry.required.filter(key => !input[key]);
  return {
    valid: missing.length === 0,
    missing,
    table: registry.table
  };
}

export function statusForScore(score: number, threshold = 95): "PASS" | "WARN" | "FAIL" {
  if (score >= threshold) return "PASS";
  if (score >= Math.max(60, threshold - 20)) return "WARN";
  return "FAIL";
}

export function calculateExecutiveReadinessIndex(scores: Record<string, number>) {
  const values = certificationSubsystems.map(item => scores[item.key] ?? 0);
  const score = values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
  const level = score >= 95 ? "CERTIFIED" : score >= 80 ? "READY" : score >= 60 ? "PARTIAL" : "FAIL";
  return { score, level };
}

export function validateGoLiveGates(scores: Record<string, number>) {
  const gates = certificationSubsystems.map(item => ({
    subsystem: item.key,
    score: scores[item.key] ?? 0,
    threshold: item.threshold,
    status: statusForScore(scores[item.key] ?? 0, item.threshold)
  }));
  return {
    allowed: gates.every(gate => gate.status === "PASS"),
    gates
  };
}
