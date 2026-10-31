export const TASK_QUEUE = "echoes-investigations";

export function temporalAddress(): string {
  return process.env.TEMPORAL_ADDRESS ?? "localhost:7233";
}