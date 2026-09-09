"use client";

/**
 * Console error boundary.
 *
 * Without this, anything that throws while rendering the console — server or
 * client — leaves a blank page with no indication of what happened, which is
 * indistinguishable from "the site is down" and impossible to report usefully.
 * The digest is the key: it is the id Vercel logs the real stack trace under.
 */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="cnsl-error" role="alert">
      <h1>The console could not be rendered</h1>
      <p>{error.message || "An unexpected error occurred."}</p>
      {error.digest ? (
        <p>
          Reference <code>{error.digest}</code> — quote this to find the full trace in the deployment logs.
        </p>
      ) : null}
      <button type="button" onClick={reset}>Try again</button>
    </main>
  );
}
