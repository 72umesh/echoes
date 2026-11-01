"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FloatingGhost } from "@/app/components/Ghost";
import { SiteFooter, SiteHeader } from "@/app/components/SiteChrome";

const EXAMPLES = [
  { label: "RD17/ambar", url: "https://github.com/RD17/ambar" },
  { label: "octocat/Hello-World", url: "https://github.com/octocat/Hello-World" },
];

const STEPS = [
  {
    title: "Collect evidence",
    body: "Reads the README, file tree, recent commits and open issues from the GitHub API. Every item gets an ID.",
  },
  {
    title: "Ask Gemma",
    body: "A Gemma model writes the report and can only cite those IDs. Any ID it invents is dropped and counted.",
  },
  {
    title: "Read the findings",
    body: "Each finding is marked observed, inferred or unknown, with a link back to its source.",
  },
];

export default function Home() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) return;
    const timer = setInterval(() => setElapsed((seconds) => seconds + 1), 1000);
    return () => clearInterval(timer);
  }, [loading]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setElapsed(0);
    setLoading(true);
    try {
      const response = await fetch("/api/investigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error?.message ?? "Investigation failed.");
        setLoading(false);
        return;
      }
      if (data.report) {
        try {
          window.localStorage.setItem(
            `echoes:report:${data.id}`,
            JSON.stringify(data.report),
          );
        } catch {
          // Storage can be full or blocked. The server copy may still work.
        }
      }
      router.push(`/report/${data.id}`);
    } catch {
      setError("Could not reach the server. Check that npm run dev is still running.");
      setLoading(false);
    }
  }

  return (
    <>
      <FloatingGhost />
      <SiteHeader />

      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-6 pb-24 pt-16">
        <section className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-[64px] leading-16 text-cream sm:text-[96px] sm:leading-24">
            Echoes
          </h1>
          <p className="mt-6 text-xl leading-8 text-cream font-lora">
            Every repository has a story. Some are waiting to be continued.
          </p>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-cream/70 font-manrope">
            Paste a public GitHub repository. Echoes reads its history and
            tells you what it was, where it stopped, and how you could pick it
            up.
          </p>
        </section>

        <section className="mx-auto mt-12 max-w-2xl rounded-lg border border-line bg-surface/80 p-6 shadow-[0_0_64px_rgb(95_15_64/0.35)] backdrop-blur-sm">
          <form onSubmit={onSubmit} className="flex flex-col gap-4 sm:flex-row">
            <label htmlFor="repo-url" className="sr-only">
              GitHub repository URL
            </label>
            <input
              id="repo-url"
              type="url"
              required
              value={repoUrl}
              onChange={(event) => setRepoUrl(event.target.value)}
              placeholder="https://github.com/owner/repo"
              disabled={loading}
              className="h-12 w-full font-manrope rounded border border-line-strong bg-raised px-4 text-base text-cream outline-none transition placeholder:text-cream/40 focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading}
              className="h-12 shrink-0 rounded font-lora border border-accent bg-accent px-8 text-base font-semibold text-night transition hover:bg-accent-hover disabled:opacity-60"
            >
              {loading ? "Investigating" : "Investigate"}
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-cream/60 font-manrope">Try an example:</span>
            {EXAMPLES.map((example) => (
              <button
                key={example.url}
                type="button"
                disabled={loading}
                onClick={() => setRepoUrl(example.url)}
                className="rounded-full font-lora border border-line bg-raised px-6 py-1 text-sm text-cream/80 transition hover:border-line-strong hover:text-cream disabled:opacity-60"
              >
                {example.label}
              </button>
            ))}
          </div>

          {loading && (
            <p
              role="status"
              className="mt-6 flex items-center gap-4 rounded-lg border border-line bg-raised px-4 py-2 text-sm leading-6 text-cream/80"
            >
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-accent"
              />
              Investigating. {elapsed}s so far. A run usually takes about a
              minute.
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="mt-6 rounded-lg border border-danger-line bg-danger-bg px-4 py-2 text-sm leading-6 text-danger-text"
            >
              {error}
            </p>
          )}

          <p className="mt-4 text-xs leading-4 text-cream/60 font-manrope">
            Public repositories only. The analysis uses the hosted Gemini API
            with a Gemma model, so README and issue text leave your machine.
          </p>
        </section>

        <section className="mt-24">
          <h2 className="font-display text-[32px] leading-10 text-cream">
            How an investigation works
          </h2>
          <ol className="mt-6 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="rounded-lg border border-line bg-surface/80 p-6 backdrop-blur-sm"
              >
                <span className="font-display text-3xl leading-8 text-accent">
                  {index + 1}
                </span>
                <h3 className="mt-2 font-lora text-lg font-semibold leading-8 text-cream">
                  {step.title}
                </h3>
                <p className="mt-2 font-manrope text-sm leading-6 text-cream/70">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}