import Link from "next/link";
import { Ghost } from "./Ghost";

export function SiteHeader() {
  return (
    <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
      <Link href="/" className="flex items-center gap-2">
        <Ghost className="h-10 w-10" />
        <span className="font-display text-3xl leading-8 text-cream">
          Echoes
        </span>
      </Link>
      <span className="hidden font-lora rounded-lg border border-line bg-surface/80 px-4 py-1 text-sm text-cream/70 sm:inline-flex">
        Hacktoberfest 2026: Ghost in the Machine
      </span>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative z-10 mx-auto mt-auto w-full max-w-5xl px-6 pb-8">
      <p className="border-t border-line pt-6 text-sm leading-6 text-cream/60 font-manrope">
        Echoes is open source. Reports come from a Gemma model reached through
        the hosted Gemini API, so analysis is not offline or private. Low
        activity is a signal, not proof that a project is abandoned.
      </p>
    </footer>
  );
}