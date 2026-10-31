import { Client, Connection } from "@temporalio/client";
import { EchoesError } from "../lib/errors";
import { TASK_QUEUE, temporalAddress } from "./constants";

function rootMessage(error: unknown): string {
  let current = error as { message?: string; cause?: unknown } | undefined;
  let message = current?.message ?? "Investigation failed.";
  while (current?.cause) {
    current = current.cause as { message?: string; cause?: unknown };
    if (current?.message) message = current.message;
  }
  return message;
}

export async function runInvestigationViaTemporal(
  repoUrl: string,
): Promise<{ id: string; workflowId: string }> {
  const address = temporalAddress();
  let connection: Connection;
  try {
    connection = await Connection.connect({ address });
  } catch {
    throw new EchoesError(
      "temporal_unreachable",
      `Could not reach Temporal at ${address}. Start it with: temporal server start-dev`,
    );
  }

  try {
    const client = new Client({ connection });
    const workflowId = `echoes-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const handle = await client.workflow.start("investigateWorkflow", {
      args: [repoUrl],
      taskQueue: TASK_QUEUE,
      workflowId,
      workflowExecutionTimeout: "15 minutes",
    });
    console.log(`Started workflow ${workflowId}`);
    const result = (await handle.result()) as { id: string };
    return { id: result.id, workflowId };
  } catch (error) {
    throw new EchoesError("workflow_failed", rootMessage(error));
  } finally {
    await connection.close();
  }
}