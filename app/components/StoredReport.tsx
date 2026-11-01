"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { InvestigationReport } from "@/lib/reports";
import { ReportView } from "./ReportView";
import { SiteFooter, SiteHeader } from "./SiteChrome";

type State =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "found"; report: InvestigationReport };

export function StoredReport({ id }: { id: string }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(`echoes:report:${id}`);
      setState(
        raw
          ? { status: "found", report: JSON.parse(raw) as InvestigationReport }
          : { status: "missing" },
      );
    } catch {
      setState({ status: "missing" });
    }
  }, [id]);

  if (state.status === "found") return <ReportView report={state.report} />;

  return (
    <>
      <SiteHeader />
      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-6 py-16">
        <h1 className="font-display text-[32px] leading-10 text-cream">
          {state.status === "loading"
            ? "Looking for your report"
            : "This report is not on this device"}
        </h1>
        {state.status === "missing" && (
          <>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-cream/70">
              Reports made on the hosted site are kept in the browser that
              created them, so this link only works there. Run the
              investigation again to get a new one.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex h-14 items-center rounded-lg border border-accent bg-accent px-8 text-base font-semibold text-night transition hover:bg-accent-hover"
            >
              Investigate a repository
            </Link>
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}