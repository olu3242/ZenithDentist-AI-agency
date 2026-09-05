import type { FlowDefinition } from "@/lib/flow-orchestration/types";

const definitions = new Map<string, FlowDefinition>();

function registryKey(key: string, version: number) {
  return `${key}@${version}`;
}

export function registerFlowDefinition(definition: FlowDefinition) {
  if (!definition.steps.some(step => step.key === definition.entryStep)) {
    throw new Error(`Flow ${definition.key}@${definition.version} has an invalid entry step.`);
  }

  const keys = new Set<string>();
  for (const step of definition.steps) {
    if (keys.has(step.key)) throw new Error(`Flow ${definition.key} contains duplicate step ${step.key}.`);
    keys.add(step.key);
  }

  for (const step of definition.steps) {
    for (const transition of step.transitions ?? []) {
      if (!keys.has(transition.to)) {
        throw new Error(`Flow ${definition.key} step ${step.key} points to missing step ${transition.to}.`);
      }
    }
  }

  definitions.set(registryKey(definition.key, definition.version), definition);
  return definition;
}

export function getFlowDefinition(key: string, version: number) {
  return definitions.get(registryKey(key, version)) ?? null;
}

export function listFlowDefinitions() {
  return [...definitions.values()];
}
