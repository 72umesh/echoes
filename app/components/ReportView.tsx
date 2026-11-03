import Link from "next/link";
import type { EvidenceKind, EvidenceRecord } from "@/lib/evidence";
import type { InvestigationReport } from "@/lib/reports";
import type { Claim, ClaimKind } from "@/lib/schema";
import { SiteFooter, SiteHeader } from "@/app/components/SiteChrome";

type EvidenceById = Record<string, EvidenceRecord>;

const KIND_STYLE: Record<ClaimKind, { badge: string; meaning: string }> = {
  observed: {
    badge: "border-observed-line bg-observed-bg text-observed-text",
    meaning: "Visible in the collected evidence.",
  },
  inferred: {
    badge: "border-inferred-line bg-inferred-bg text-inferred-text",
    meaning: "A reasoned guess from the evidence, not a fact.",
  },
  unknown: {
    badge: "border-unknown-line bg-unknown-bg text-unknown-text",
    meaning: "The evidence does not say.",
  },
};

const EVIDENCE_GROUPS: { kind: EvidenceKind; title: string }[] = [
  { kind: "readme", title: "README" },
  { kind: "file", title: "Files" },
  { kind: "commit", title: "Commits" },
  { kind: "issue", title: "Issues" },
];

function formatDate(iso: string | null): string {
  if (!iso) return "Unknown";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

// How long the repository had been quiet when this report was generated.
function quietFor(pushedAt: string | null, generatedAt: string): string | null {
  if (!pushedAt) return null;
  const ms = Date.parse(generatedAt) - Date.parse(pushedAt);
  if (!Number.isFinite(ms) || ms < 0) return null;
  const years = ms / (365.25 * 24 * 60 * 60 * 1000);
  if (years >= 1) return `${years.toFixed(1)} years before this report`;
  const months = Math.round(years * 12);
  return months <= 0 ? "Within the month before this report" : `${months} months before this report`;
}

function Badge({ kind }: { kind: ClaimKind }) {
  return (
    <span
      className={`inline-flex font-lora h-6 w-24 shrink-0 items-center justify-center rounded-full border text-xs font-medium ${KIND_STYLE[kind].badge}`}
    >
      {kind}
    </span>
  );
}

function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "danger" }) {
  const style =
    tone === "danger"
      ? "border-danger-line bg-danger-bg text-danger-text"
      : "border-line bg-surface text-cream/80";
  return (
    <span className={`inline-flex h-8 items-center rounded-md border px-4 text-sm ${style}`}>
      {children}
    </span>
  );
}

function Callout({
  tone,
  children,
}: {
  tone: "info" | "warn";
  children: React.ReactNode;
}) {
  const style =
    tone === "warn"
      ? "border-inferred-line bg-inferred-bg text-inferred-text"
      : "border-line-strong bg-raised text-cream/80";
  return (
    <div className={`rounded-md border px-4 py-2 text-sm sm:text-base leading-6 ${style}`}>{children}</div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string | null }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <dt className="text-xs sm:text-sm font-manrope text-cream/60">{label}</dt>
      <dd className="mt-2 font-display  text-2xl sm:text-[32px] leading-10 text-cream">{value}</dd>
      {note && <p className="mt-1 font-manrope text-xs leading-4 text-cream/60">{note}</p>}
    </div>
  );
}

function EvidenceChip({ item }: { item: EvidenceRecord }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      title={`${item.label} (opens on GitHub)`}
      className="flex max-w-full items-center gap-2 rounded-full border border-line bg-raised px-3 py-1 text-xs transition hover:border-link"
    >
      <span className="shrink-0 font-mono text-link">{item.id}</span>
      <span className="truncate text-cream/70">{item.label}</span>
    </a>
  );
}

// Links come only from the evidence map saved with the report, never from model output.
function resolve(ids: string[], evidence: EvidenceById): EvidenceRecord[] {
  return Array.from(new Set(ids))
    .map((id) => evidence[id])
    .filter((item) => item && item.url.startsWith("https://github.com/"));
}

function EvidenceLinks({ ids, evidence }: { ids: string[]; evidence: EvidenceById }) {
  const items = resolve(ids, evidence);
  if (items.length === 0) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item.id} className="min-w-0 max-w-full">
          <EvidenceChip item={item} />
        </li>
      ))}
    </ul>
  );
}

function ClaimList({ claims, evidence }: { claims: Claim[]; evidence: EvidenceById }) {
  if (claims.length === 0) {
    return <p className="text-sm leading-6 text-cream/60">No claims recorded.</p>;
  }
  return (
    <ul className="divide-y divide-line">
      {claims.map((claim, index) => (
        <li
          key={index}
          className="grid gap-2 py-4 first:pt-0 last:pb-0 md:grid-cols-[96px_minmax(0,1fr)] md:gap-4"
        >
          <div>
            <Badge kind={claim.kind} />
          </div>
          <div className="min-w-0">
            <p className="leading-7 text-xs sm:text-sm font-manrope text-cream/90">{claim.text}</p>
            <EvidenceLinks ids={claim.evidenceIds} evidence={evidence} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-8">
      <h2 className="font-display text-[32px] leading-10 text-cream">{title}</h2>
      <div className="mt-4 rounded-lg border border-line bg-surface p-3 sm:p-6">{children}</div>
    </section>
  );
}

function Narrative({ children }: { children: React.ReactNode }) {
  return <p className="text-xs sm:text-sm font-manrope leading-8 text-cream">{children}</p>;
}

function Divider({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 border-t border-line pt-6">{children}</div>;
}

export function ReportView({ report }: { report: InvestigationReport }) {
  const evidence: EvidenceById = Object.fromEntries(
    report.evidence.map((item) => [item.id, item]),
  );
  const { analysis, repo } = report;
  const hasUnknowns = analysis.unknowns.length > 0;

  const nav = [
    { id: "overview", label: "Overview" },
    { id: "architecture", label: "Architecture" },
    { id: "history", label: "History" },
    { id: "state", label: "Current state" },
    { id: "revival", label: "Revival opportunities" },
    ...(hasUnknowns ? [{ id: "unknowns", label: "Unknowns" }] : []),
    { id: "evidence", label: "Evidence index" },
  ];

  return (
    <>
      <SiteHeader />

      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-4 sm:px-6 pb-16">
        <Link
          href="/"
          className="inline-flex text-sm text-cream/70 transition hover:text-cream font-manrope"
        >
          Investigate another repository 
        </Link>

        <header className="mt-8">
          <h1 className="font-display text-[48px] sm:text-[64px] leading-12 text-cream sm:leading-16">
            <a
              href={repo.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-accent"
            >
              {repo.fullName}
            </a>
          </h1>
          {repo.description && (
            <p className="mt-2 max-w-2xl text-base sm:text-lg leading-8 text-cream/70 font-lora">{repo.description}</p>
          )}

          <ul className="mt-6 flex flex-wrap gap-2">
            {repo.archived && (
              <li>
                <Pill tone="danger">Archived on GitHub</Pill>
              </li>
            )}
            {repo.language && (
              <li>
                <Pill>{repo.language}</Pill>
              </li>
            )}
            {repo.license && (
              <li>
                <Pill>{repo.license} license</Pill>
              </li>
            )}
            <li>
              <Pill>Created {formatDate(repo.createdAt)}</Pill>
            </li>
          </ul>

          <dl className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Stars" value={repo.stars.toLocaleString("en-US")} />
            <Stat label="Forks" value={repo.forks.toLocaleString("en-US")} />
            <Stat label="Open issues" value={repo.openIssues.toLocaleString("en-US")} />
            <Stat
              label="Last push"
              value={formatDate(repo.pushedAt)}
              note={quietFor(repo.pushedAt, report.generatedAt)}
            />
          </dl>

          <div className="mt-8">
            <Callout tone="warn">
              {report.hostedModel.note} Model: {report.hostedModel.model}. Report generated{" "}
              {formatDate(report.generatedAt)}.
            </Callout>
          </div>
        </header>

        <div className="mt-12 grid gap-12 lg:grid-cols-[208px_minmax(0,1fr)]">
          <aside className="hidden lg:sticky lg:top-8 lg:block lg:self-start">
            <nav aria-label="On this page">
              <p className="text-sm font-semibold text-cream font-manrope">On this page</p>
              <ul className="mt-4 border-l border-line">
                {nav.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="block py-1 pl-4 font-lora text-sm leading-6 text-cream/70 transition hover:text-accent"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <div className="min-w-0 space-y-12">
            <section aria-labelledby="legend-title" className="rounded-lg border border-line bg-surface p-4 sm:p-6">
              <h2 id="legend-title" className="text-lg font-semibold leading-8 text-cream font-manrope">
                How to read the labels
              </h2>
              <dl className="mt-4 grid gap-4 md:grid-cols-3">
                {(Object.keys(KIND_STYLE) as ClaimKind[]).map((kind) => (
                  <div key={kind} className="flex flex-col items-start gap-2">
                    <dt>
                      <Badge kind={kind} />
                    </dt>
                    <dd className="text-sm font-manrope leading-6 text-cream/70">{KIND_STYLE[kind].meaning}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {report.warnings.length > 0 && (
              <Callout tone="warn">
                <ul className="list-disc space-y-1 pl-6">
                  {report.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </Callout>
            )}

            <Section id="overview" title="Overview">
              <Narrative>{analysis.overview.summary}</Narrative>
              <Divider>
                <ClaimList claims={analysis.overview.claims} evidence={evidence} />
              </Divider>
            </Section>

            <Section id="architecture" title="Architecture">
              <Callout tone="info">
                Inferred from the file tree and README only. Source files were not read.
              </Callout>
              <div className="mt-6">
                <Narrative>{analysis.architecture.explanation}</Narrative>
              </div>
              <Divider>
                <ClaimList claims={analysis.architecture.claims} evidence={evidence} />
              </Divider>
            </Section>

            <Section id="history" title="History">
              <Narrative>{analysis.history.timeline}</Narrative>
              <Divider>
                <ClaimList claims={analysis.history.claims} evidence={evidence} />
              </Divider>
            </Section>

            <Section id="state" title="Current state">
              <Narrative>{analysis.currentState.healthSignals}</Narrative>
              <Divider>
                <ClaimList claims={analysis.currentState.claims} evidence={evidence} />
              </Divider>
            </Section>

            <Section id="revival" title="Revival opportunities">
              {analysis.revivalOpportunities.length === 0 ? (
                <p className="text-sm leading-6 text-cream/60">
                  None identified from the available evidence.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {analysis.revivalOpportunities.map((item, index) => (
                    <li key={index} className="py-6 first:pt-0 last:pb-0">
                      <div className="flex flex-col sm:flex-row flex-wrap sm:items-center gap-2 sm:gap-4">
                        <h3 className="text-base font-semibold leading-8 text-cream">{item.title}</h3>
                        <Badge kind={item.kind} />
                      </div>
                      <p className="mt-2 text-sm leading-7 text-cream/80">{item.description}</p>
                      <EvidenceLinks ids={item.evidenceIds} evidence={evidence} />
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {hasUnknowns && (
              <Section id="unknowns" title="Unknowns">
                <ul className="divide-y divide-line">
                  {analysis.unknowns.map((item, index) => (
                    <li
                      key={index}
                      className="grid gap-2 py-4 first:pt-0 last:pb-0 md:grid-cols-[96px_minmax(0,1fr)] md:gap-4"
                    >
                      <div>
                        <Badge kind="unknown" />
                      </div>
                      <p className="leading-7 text-cream/90">{item}</p>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <Section id="evidence" title="Evidence index">
              <Callout tone="info">
                Invented evidence IDs dropped by the backend: {report.droppedEvidenceCount}. Every
                link in this report comes from the saved evidence list below, not from model output.
              </Callout>
              <div className="mt-6 space-y-4">
                {EVIDENCE_GROUPS.map((group) => {
                  const items = report.evidence.filter((item) => item.kind === group.kind);
                  if (items.length === 0) return null;
                  return (
                    <details key={group.kind} className="rounded-md border border-line bg-raised px-4 py-2 sm:p-4">
                      <summary className="cursor-pointer font-manrope text-sm sm:text-base font-semibold leading-6 text-cream marker:text-accent">
                        {group.title} ({items.length})
                      </summary>
                      <ul className="mt-4 flex flex-wrap gap-2">
                        {items.map((item) => (
                          <li key={item.id} className="min-w-0 max-w-full">
                            <EvidenceChip item={item} />
                          </li>
                        ))}
                      </ul>
                    </details>
                  );
                })}
              </div>
            </Section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}