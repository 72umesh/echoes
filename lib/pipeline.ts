import { buildEvidenceMap, evidenceList } from "./evidence";
import { fetchGitHubSnapshot } from "./github/client";
import { parseGitHubUrl } from "./github/parse";
import { analyzeWithGemma } from "./gemma";
import { makeReportId, writeReport, type InvestigationReport } from "./reports";
import { resolveAnalysisEvidence } from "./resolveEvidence";

export async function investigateRepository(repoUrl: string): Promise<{
  report: InvestigationReport;
  path: string;
}> {
  const ref = parseGitHubUrl(repoUrl);
  const snapshot = await fetchGitHubSnapshot(ref);
  const evidence = buildEvidenceMap(snapshot);
  const { analysis: rawAnalysis, model } = await analyzeWithGemma(snapshot, evidence);
  const { analysis, droppedEvidenceCount } = resolveAnalysisEvidence(rawAnalysis, evidence);

  const report: InvestigationReport = {
    id: makeReportId(snapshot.meta.owner, snapshot.meta.name),
    generatedAt: new Date().toISOString(),
    hostedModel: {
      provider: "google-gemini",
      model,
      note: "Analysis used Google's hosted Gemini API with a Gemma model. It is not offline or private.",
    },
    repo: snapshot.meta,
    warnings: snapshot.warnings,
    evidence: evidenceList(evidence),
    analysis,
    droppedEvidenceCount,
  };

  const filePath = await writeReport(report);
  return { report, path: filePath };
}
