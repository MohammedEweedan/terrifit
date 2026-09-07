"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => string;
      remove: (id: string) => void;
      reset: (id: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/** Loaded once per document, however many widgets are on the page. */
let loader: Promise<void> | undefined;
function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  loader ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      // Let a later mount try again rather than caching the failure forever.
      loader = undefined;
      reject(new Error("turnstile script failed to load"));
    };
    document.head.appendChild(script);
  });
  return loader;
}

/**
 * Renders the Turnstile challenge and reports its token to the parent form.
 *
 * Renders nothing when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is unset, which keeps
 * every form working in development and on deployments without keys — the
 * server side is permissive in exactly the same condition, so the two halves
 * cannot end up disagreeing about whether a token is required.
 */
export function TurnstileWidget({
  onToken,
  action,
  resetKey = 0,
}: {
  onToken: (token: string | null) => void;
  action?: string;
  /**
   * Increment to issue a fresh challenge.
   *
   * Turnstile tokens are single-use. These forms stay on the page after a
   * failed submission, so without this the retry would replay a spent token and
   * be rejected for as long as the person kept trying. The parent clears its
   * own token in the same event handler that bumps this, which keeps the state
   * change out of an effect.
   */
  resetKey?: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const callback = useRef(onToken);
  const widget = useRef<string>(undefined);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    callback.current = onToken;
  }, [onToken]);

  useEffect(() => {
    const element = host.current;
    if (!SITE_KEY || !element) return;
    let widgetId: string | undefined;
    let cancelled = false;

    loadTurnstile()
      .then(() => {
        if (cancelled || !window.turnstile) return;
        widgetId = window.turnstile.render(element, {
          sitekey: SITE_KEY,
          action,
          callback: (token: string) => callback.current(token),
          // A token is single-use and expires; clearing it forces the form to
          // wait for the refreshed one instead of submitting a dead token.
          "expired-callback": () => callback.current(null),
          "error-callback": () => callback.current(null),
        });
        widget.current = widgetId;
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
      widget.current = undefined;
    };
  }, [action]);

  useEffect(() => {
    // Skips the initial render, where the widget is already fresh.
    if (!resetKey || !widget.current || !window.turnstile) return;
    window.turnstile.reset(widget.current);
  }, [resetKey]);

  if (!SITE_KEY) return null;
  // The server fails open when Cloudflare is unreachable, so a blocked script
  // must not present itself as a wall the person cannot get past.
  if (failed) return null;
  return <div ref={host} className="tf-turnstile" />;
}
