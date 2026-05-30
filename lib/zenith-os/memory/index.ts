export interface ExecutionMemory {
  taskId: string;
  checkpoint: Record<string, unknown>;
  updatedAt: string;
}

export function checkpointTask(taskId: string, checkpoint: Record<string, unknown>): ExecutionMemory {
  return { taskId, checkpoint, updatedAt: new Date().toISOString() };
}
