import { defineQuery, proxyActivities, setHandler } from "@temporalio/workflow";
import type * as activities from "./activities";

const retry = {
  maximumAttempts: 3,
  initialInterval: "5 seconds",
  backoffCoefficient: 2,
  nonRetryableErrorTypes: ["EchoesError"],
} satisfies import("@temporalio/common").RetryPolicy;

const { fetchGithub } = proxyActivities<typeof activities>({
  startToCloseTimeout: "2 minutes",
  retry,
});

const { analyze } = proxyActivities<typeof activities>({
  startToCloseTimeout: "10 minutes",
  heartbeatTimeout: "30 seconds",
  retry,
});

const { saveReport } = proxyActivities<typeof activities>({
  startToCloseTimeout: "1 minute",
  retry,
});

export const currentStepQuery = defineQuery<string>("currentStep");

export async function investigateWorkflow(repoUrl: string): Promise<{ id: string }> {
  let step = "fetching_github";
  setHandler(currentStepQuery, () => step);

  const snapshot = await fetchGithub(repoUrl);
  step = "analysing_with_gemma";
  const analyzed = await analyze(snapshot);
  step = "saving_report";
  const { id } = await saveReport(snapshot, analyzed);
  step = "done";
  return { id };
}