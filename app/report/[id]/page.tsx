import { notFound } from "next/navigation";
import { EchoesError } from "@/lib/errors";
import type { EvidenceRecord } from "@/lib/evidence";
import { readReport, type InvestigationReport } from "@/lib/reports";
import type { Claim, ClaimKind } from "@/lib/schema";

const BADGE: Record<ClaimKind, string> = {
  observed: "border-emerald-700 bg-emerald-900/40 text-emerald-300",
  inferred: "border-amber-700 bg-amber-900/40 text-amber-300",
  unknown: "border-zinc-600 bg-zinc-800 text-zinc-300",
};

type EvidenceById = Record<string, EvidenceRecord>;

function Badge({ kind }: { kind: ClaimKind }) {
  return (
    <span className={`shrink-0 rounded border px-2 py-0.5 text-xs uppercase tracking-wide ${BADGE[kind]}`}>
      {kind}
    </span>
  );
}

function EvidenceLinks({ ids, evidence }: { ids: string[]; evidence: EvidenceById }) {
  const items = ids
    .map((id) => evidence[id])
    .filter((item) => item && item.url.startsWith("https://github.com/"));
  if (items.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-2">
      {items.map((item) => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="max-w-xs truncate rounded bg-zinc-800 px-2 py-0.5 text-xs text-violet-300 hover:text-violet-200"
        >
          {item.id}: {item.label}
        </a>
      ))}
    </div>
  );
}

function ClaimList({ claims, evidence }: { claims: Claim[]; evidence: EvidenceById }) {
  if (claims.length === 0) return <p className="text-sm text-zinc-500">No claims recorded.</p>;
  return (
    <ul className="space-y-3">
      {claims.map((claim, index) => (
        <li key={index} className="flex gap-3">
          <Badge kind={claim.kind} />
          <div>
            <p className="text-zinc-200">{claim.text}</p>
            <EvidenceLinks ids={claim.evidenceIds} evidence={evidence} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-t border-zinc-800 pt-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let report: InvestigationReport;
  try {
    report = await readReport(id);
  } catch (error) {
    if (error instanceof EchoesError) notFound();
    throw error;
  }

  const evidence: EvidenceById = Object.fromEntries(report.evidence.map((item) => [item.id, item]));
  const { analysis, repo } = report;

  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-zinc-100">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-2">
          <a href="/" className="text-sm text-violet-300 hover:text-violet-200">
            Echoes / new investigation
          </a>
          <h1 className="text-3xl font-semibold">
            <a href={repo.htmlUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {repo.fullName}
            </a>
          </h1>
          {repo.description && <p className="text-zinc-400">{repo.description}</p>}
          <p className="text-sm text-zinc-500">
            {repo.stars.toLocaleString("en-US")} stars · {repo.openIssues.toLocaleString("en-US")} open issues ·
            last push {repo.pushedAt ? repo.pushedAt.slice(0, 10) : "unknown"} · report generated{" "}
            {report.generatedAt.slice(0, 10)}
          </p>
          <p className="rounded border border-amber-800 bg-amber-950/40 p-3 text-xs text-amber-200">
            {report.hostedModel.note} Model: {report.hostedModel.model}. Low activity is a signal, not proof
            that a project is abandoned.
          </p>
        </header>

        {report.warnings.length > 0 && (
          <ul className="list-disc space-y-1 pl-5 text-sm text-amber-300">
            {report.warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        )}

        <Section title="Overview">
          <p className="text-zinc-300">{analysis.overview.summary}</p>
          <ClaimList claims={analysis.overview.claims} evidence={evidence} />
        </Section>

        <Section title="Architecture">
          <p className="rounded border border-zinc-700 bg-zinc-900 p-3 text-xs text-zinc-400">
            Inferred from the file tree and README only. Source files were not read.
          </p>
          <p className="text-zinc-300">{analysis.architecture.explanation}</p>
          <ClaimList claims={analysis.architecture.claims} evidence={evidence} />
        </Section>

        <Section title="History">
          <p className="text-zinc-300">{analysis.history.timeline}</p>
          <ClaimList claims={analysis.history.claims} evidence={evidence} />
        </Section>

        <Section title="Current state">
          <p className="text-zinc-300">{analysis.currentState.healthSignals}</p>
          <ClaimList claims={analysis.currentState.claims} evidence={evidence} />
        </Section>

        <Section title="Revival opportunities">
          {analysis.revivalOpportunities.length === 0 && (
            <p className="text-sm text-zinc-500">None identified from the available evidence.</p>
          )}
          <div className="space-y-3">
            {analysis.revivalOpportunities.map((item, index) => (
              <div key={index} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <div className="flex items-center gap-3">
                  <Badge kind={item.kind} />
                  <h3 className="font-medium">{item.title}</h3>
                </div>
                <p className="mt-2 text-zinc-300">{item.description}</p>
                <EvidenceLinks ids={item.evidenceIds} evidence={evidence} />
              </div>
            ))}
          </div>
        </Section>

        {analysis.unknowns.length > 0 && (
          <Section title="Unknowns">
            <ul className="list-disc space-y-1 pl-5 text-zinc-300">
              {analysis.unknowns.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </Section>
        )}

        <footer className="border-t border-zinc-800 pt-4 text-xs text-zinc-500">
          Invented evidence IDs dropped by the backend: {report.droppedEvidenceCount}. Links come only from the
          saved evidence map.
        </footer>
      </div>
    </main>
  );
}