"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
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
      router.push(`/report/${data.id}`);
    } catch {
      setError("Could not reach the server. Is npm run dev still running?");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-zinc-100">
      <div className="w-full max-w-xl space-y-6">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">Echoes</h1>
          <p className="mt-2 text-zinc-400">
            Every repository has a story. Some are waiting to be continued.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="url"
            required
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            disabled={loading}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 outline-none focus:border-violet-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-violet-600 px-4 py-3 font-medium text-white hover:bg-violet-500 disabled:opacity-60"
          >
            {loading ? "Investigating... this can take a minute" : "Investigate"}
          </button>
        </form>

        {error && (
          <p role="alert" className="rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <p className="text-xs text-zinc-500">
          Public repositories only. Analysis uses the hosted Gemini API with a Gemma model, so README
          and issue text leave your machine. It is not offline or private.
        </p>
      </div>
    </main>
  );
}