import { EchoesError } from "@/lib/errors";
import { readReport, type InvestigationReport } from "@/lib/reports";
import { ReportView } from "@/app/components/ReportView";
import { StoredReport } from "@/app/components/StoredReport";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let report: InvestigationReport | null = null;
  try {
    report = await readReport(id);
  } catch (error) {
    if (!(error instanceof EchoesError)) throw error;
  }

  if (report) return <ReportView report={report} />;

  // Hosted server instances do not share files, so fall back to this browser's copy.
  return <StoredReport id={id} />;
}