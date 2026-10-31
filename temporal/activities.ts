import { Context } from "@temporalio/activity";
import { fetchGitHubSnapshot, type GitHubSnapshot } from "../lib/github/client";
import { parseGitHubUrl } from "../lib/github/parse";
import { analyzeSnapshot, buildReport } from "../lib/pipeline";
import { writeReport } from "../lib/reports";

export type Analyzed = Awaited<ReturnType<typeof analyzeSnapshot>>;

// Keeps data passed between activities small. The prompt clips more tightly anyway
// (README 8000, commits 400, issues 800), so the model input is unchanged.
function trimForTransport(snapshot: GitHubSnapshot): GitHubSnapshot {
  return {
    ...snapshot,
    readme: { ...snapshot.readme, markdown: snapshot.readme.markdown.slice(0, 20_000) },
    commits: snapshot.commits.map((c) => ({ ...c, message: c.message.slice(0, 1_000) })),
    issues: snapshot.issues.map((i) => ({ ...i, body: i.body.slice(0, 1_500) })),
  };
}

export async function fetchGithub(repoUrl: string): Promise<GitHubSnapshot> {
  const ref = parseGitHubUrl(repoUrl);
  return trimForTransport(await fetchGitHubSnapshot(ref));
}

export async function analyze(snapshot: GitHubSnapshot): Promise<Analyzed> {
  // Heartbeat so Temporal notices quickly if this worker dies mid-call.
  const timer = setInterval(() => Context.current().heartbeat(), 5_000);
  try {
    return await analyzeSnapshot(snapshot);
  } finally {
    clearInterval(timer);
  }
}

export async function saveReport(
  snapshot: GitHubSnapshot,
  analyzed: Analyzed,
): Promise<{ id: string; path: string }> {
  const report = buildReport({ snapshot, ...analyzed });
  const path = await writeReport(report);
  return { id: report.id, path };
}