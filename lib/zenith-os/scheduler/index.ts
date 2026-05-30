import type { ZenithTask } from "@/lib/zenith-os/kernel";

export function scheduleReadyTasks(tasks: ZenithTask[]) {
  const completed = new Set(tasks.filter(task => task.status === "completed").map(task => task.id));
  return tasks.filter(task => task.status === "queued" && task.dependencies.every(dependency => completed.has(dependency)));
}
