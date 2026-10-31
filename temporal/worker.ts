import { config } from "dotenv";
import { NativeConnection, Worker } from "@temporalio/worker";
import * as activities from "./activities";
import { TASK_QUEUE, temporalAddress } from "./constants";

config({ path: ".env.local" });
config();

async function run() {
  const connection = await NativeConnection.connect({ address: temporalAddress() });
  try {
    const worker = await Worker.create({
      connection,
      namespace: "default",
      taskQueue: TASK_QUEUE,
      workflowsPath: require.resolve("./workflows"),
      activities,
    });
    console.log(`Echoes worker running on task queue "${TASK_QUEUE}"`);
    await worker.run();
  } finally {
    await connection.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});