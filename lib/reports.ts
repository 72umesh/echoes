import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { EchoesError } from "./errors";
import type { EvidenceRecord } from "./evidence";
import type { GitHubRepoMeta } from "./github/client";
import type { Analysis } from "./schema";
import { tmpdir } from "node:os";

const REPORT_ID_PATTERN = /^[A-Za-z0-9._-]+$/;

export type InvestigationReport = {
  id: string;
  generatedAt: string;
  hostedModel: {
    provider: "google-gemini";
    model: string;
    note: "Analysis used Google's hosted Gemini API with a Gemma model. It is not offline or private.";
  };
  repo: GitHubRepoMeta;
  warnings: string[];
  evidence: EvidenceRecord[];
  analysis: Analysis;
  droppedEvidenceCount: number;
};

export function reportsDir(): string {
  const base = process.env.VERCEL ? tmpdir() : process.cwd();
  return path.resolve(base, "reports");
}
export function sanitizeReportId(id: string): string {
  if (!id || !REPORT_ID_PATTERN.test(id) || id.includes("..")) {
    throw new EchoesError(
      "invalid_report_id",
      "Report ID may contain only letters, numbers, dots, hyphens, and underscores.",
    );
  }
  return id;
}

export function resolveReportPath(id: string): string {
  const safeId = sanitizeReportId(id);
  const root = reportsDir();
  const resolved = path.resolve(root, `${safeId}.json`);
  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new EchoesError("invalid_report_id", "Report path is outside the reports/ directory.");
  }
  if (relative.includes("..") || relative.includes("/") || relative.includes("\\")) {
    throw new EchoesError("invalid_report_id", "Report path is outside the reports/ directory.");
  }
  return resolved;
}

export function makeReportId(owner: string, repo: string, at = new Date()): string {
  const stamp = at.toISOString().replace(/[:.]/g, "-");
  const raw = `${owner}-${repo}-${stamp}`.replace(/[^A-Za-z0-9._-]/g, "-");
  return sanitizeReportId(raw);
}

export async function writeReport(report: InvestigationReport): Promise<string> {
  await mkdir(reportsDir(), { recursive: true });
  const filePath = resolveReportPath(report.id);
  await writeFile(filePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return filePath;
}

export async function readReport(id: string): Promise<InvestigationReport> {
  const filePath = resolveReportPath(id);
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as InvestigationReport;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new EchoesError("report_not_found", `No report found for id ${id}.`);
    }
    throw error;
  }
}
