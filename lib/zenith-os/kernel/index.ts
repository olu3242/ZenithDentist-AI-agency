export type ZenithTaskStatus = "queued" | "running" | "blocked" | "completed" | "failed" | "cancelled";

export interface ZenithTask {
  id: string;
  organizationId: string;
  type: string;
  status: ZenithTaskStatus;
  dependencies: string[];
  checkpoint?: Record<string, unknown>;
}

export function transitionTask(task: ZenithTask, status: ZenithTaskStatus): ZenithTask {
  if (task.status === "cancelled" || task.status === "completed") return task;
  return { ...task, status };
}
