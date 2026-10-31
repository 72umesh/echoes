import * as Sentry from "@sentry/node";

let started = false;

export function initSentry(service: string): void {
  if (started) return;
  started = true;
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return; // Sentry is optional: without a DSN everything still runs.
  Sentry.init({
    dsn,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV ?? "development",
    initialScope: { tags: { service } },
  });
}

export { Sentry };