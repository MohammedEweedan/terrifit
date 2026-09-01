"use client";

/**
 * Event-based analytics from day one, per the technical direction — but with
 * no third-party script, no cookie and no cross-site identifier. The session
 * id lives in sessionStorage and dies with the tab.
 */
const SESSION_KEY = "ryvn.sid";

function sessionId(): string {
  if (typeof window === "undefined") return "server";
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // Private browsing or blocked storage — the event still counts, anonymously.
    return "anonymous";
  }
}

export function track(name: string, props: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;

  const payload = JSON.stringify({
    name,
    sessionId: sessionId(),
    locale: document.documentElement.lang,
    path: window.location.pathname,
    props,
  });

  // sendBeacon survives navigation; fetch keepalive is the fallback.
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/events", new Blob([payload], { type: "application/json" }));
      return;
    }
  } catch {
    // fall through
  }

  void fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // Analytics must never break the page.
  });
}
