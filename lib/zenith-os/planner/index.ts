export function buildExecutionGraph(steps: Array<{ id: string; dependsOn?: string[] }>) {
  return {
    nodes: steps.map(step => ({ id: step.id })),
    edges: steps.flatMap(step => (step.dependsOn ?? []).map(source => ({ source, target: step.id })))
  };
}
