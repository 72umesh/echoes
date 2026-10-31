import { buildEvidenceMap, evidenceList, type EvidenceRecord } from "./evidence";
import { fetchGitHubSnapshot, type GitHubSnapshot } from "./github/client";
import { parseGitHubUrl } from "./github/parse";
import { analyzeWithGemma } from "./gemma";
import { makeReportId, writeReport, type InvestigationReport } from "./reports";
import { resolveAnalysisEvidence } from "./resolveEvidence";
import type { Analysis } from "./schema";
import * as Sentry from "@sentry/node";

export async function analyzeSnapshot(snapshot: GitHubSnapshot): Promise<{
  analysis: Analysis;
  droppedEvidenceCount: number;
  model: string;
  evidence: EvidenceRecord[];
}> {
  const evidenceMap = buildEvidenceMap(snapshot);
  const { analysis: rawAnalysis, model } = await analyzeWithGemma(snapshot, evidenceMap);
  const { analysis, droppedEvidenceCount } = resolveAnalysisEvidence(rawAnalysis, evidenceMap);
    if (droppedEvidenceCount > 0) {
    Sentry.captureMessage(`Gemma cited ${droppedEvidenceCount} evidence IDs that do not exist`, {
      level: "warning",
      tags: { repo: `${snapshot.meta.owner}/${snapshot.meta.name}` },
    });
  }
  
  return { analysis, droppedEvidenceCount, model, evidence: evidenceList(evidenceMap) };
}

export function buildReport(args: {
  snapshot: GitHubSnapshot;
  model: string;
  evidence: EvidenceRecord[];
  analysis: Analysis;
  droppedEvidenceCount: number;
}): InvestigationReport {
  const { snapshot, model, evidence, analysis, droppedEvidenceCount } = args;
  return {
    id: makeReportId(snapshot.meta.owner, snapshot.meta.name),
    generatedAt: new Date().toISOString(),
    hostedModel: {
      provider: "google-gemini",
      model,
      note: "Analysis used Google's hosted Gemini API with a Gemma model. It is not offline or private.",
    },
    repo: snapshot.meta,
    warnings: snapshot.warnings,
    evidence,
    analysis,
    droppedEvidenceCount,
  };
}

export async function investigateRepository(repoUrl: string): Promise<{
  report: InvestigationReport;
  path: string;
}> {
  const ref = parseGitHubUrl(repoUrl);
  const snapshot = await fetchGitHubSnapshot(ref);
  const analyzed = await analyzeSnapshot(snapshot);
  const report = buildReport({ snapshot, ...analyzed });
  const filePath = await writeReport(report);
  return { report, path: filePath };
}