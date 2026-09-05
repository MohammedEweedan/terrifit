"use client";

import { useState } from "react";

type TrackEvent = { at: string; description: string; location: string | null };

type Tracked = {
  number: string;
  placedAt: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  packedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  events: TrackEvent[];
  estimatedDelivery: string | null;
};

/** The four states an order moves through, in order. */
const STEPS = [
  { key: "placed", label: "Order placed" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
] as const;

/**
 * Order tracking for somebody with a number and no account.
 *
 * The timeline is built from our own fulfilment dates rather than the carrier's
 * feed, so it works whether or not a tracking number exists yet and whether or
 * not the 17TRACK key is configured. Carrier events, when there are any, are
 * added underneath as detail rather than used as the source of truth — a
 * carrier that has not scanned a parcel yet would otherwise make a packed order
 * look like nothing had happened.
 */
export function TrackOrder() {
  const [number, setNumber] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<Tracked | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const ready = number.trim().length >= 4 && /.+@.+\..+/.test(email);

  async function lookup(event: React.FormEvent) {
    event.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setError("");
    setOrder(null);

    const response = await fetch("/api/shop/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number: number.trim(), email: email.trim() }),
    }).catch(() => null);

    if (response?.status === 429) {
      setError("Too many attempts. Give it a minute and try again.");
    } else if (!response?.ok) {
      // Deliberately one message for every failure — see the API route.
      setError("We couldn't find an order with that number and email together. Check both and try again.");
    } else {
      setOrder((await response.json()) as Tracked);
    }
    setBusy(false);
  }

  const reached = (step: (typeof STEPS)[number]["key"]): boolean => {
    if (!order) return false;
    if (order.fulfillmentStatus === "cancelled") return step === "placed";
    if (step === "placed") return true;
    if (step === "packed") return Boolean(order.packedAt || order.shippedAt || order.deliveredAt);
    if (step === "shipped") return Boolean(order.shippedAt || order.deliveredAt);
    return Boolean(order.deliveredAt);
  };

  const when = (step: (typeof STEPS)[number]["key"]): string | null => {
    if (!order) return null;
    const iso =
      step === "placed" ? order.placedAt
      : step === "packed" ? order.packedAt
      : step === "shipped" ? order.shippedAt
      : order.deliveredAt;
    if (!iso) return null;
    return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="tk">
      <section className="tk-hero">
        <span className="tk-eyebrow">Order tracking</span>
        <h1>Where&apos;s my order?</h1>
        <p className="tk-lede">
          Your order number is on the confirmation email, and it starts with TF. You do not need an account.
        </p>

        <form className="tk-form" onSubmit={lookup}>
          <label>
            <span>Order number</span>
            <input
              value={number}
              onChange={(event) => setNumber(event.target.value.toUpperCase().slice(0, 40))}
              placeholder="TF-4K2P9X"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <label>
            <span>Email on the order</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value.slice(0, 200))}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>
          <button type="submit" disabled={!ready || busy}>
            {busy ? "Looking…" : "Track it"}
          </button>
        </form>

        {error ? <p className="tk-error" role="alert">{error}</p> : null}
      </section>

      {order ? (
        <section className="tk-result" aria-live="polite">
          <header className="tk-result-head">
            <div>
              <p className="tk-result-eyebrow">Order</p>
              <strong>{order.number}</strong>
            </div>
            {order.estimatedDelivery ? (
              <div className="tk-eta">
                <p className="tk-result-eyebrow">Estimated</p>
                <strong>
                  {new Date(order.estimatedDelivery).toLocaleDateString(undefined, { day: "numeric", month: "long" })}
                </strong>
              </div>
            ) : null}
          </header>

          {order.fulfillmentStatus === "cancelled" ? (
            <p className="tk-cancelled">This order was cancelled. If that is a surprise, email orders@terrifit.com.</p>
          ) : (
            <ol className="tk-steps">
              {STEPS.map((step) => (
                <li key={step.key} data-done={reached(step.key) ? "true" : undefined}>
                  <span className="tk-dot" aria-hidden />
                  <span className="tk-step-label">{step.label}</span>
                  <span className="tk-step-when">{when(step.key) ?? "—"}</span>
                </li>
              ))}
            </ol>
          )}

          {order.trackingUrl ? (
            <div className="tk-carrier">
              <div>
                <p className="tk-result-eyebrow">{order.carrier ?? "Carrier"}</p>
                <strong className="tk-tracking-number">{order.trackingNumber}</strong>
              </div>
              <a className="tk-button" href={order.trackingUrl} target="_blank" rel="noopener noreferrer">
                Track with the carrier <span aria-hidden>↗</span>
              </a>
            </div>
          ) : (
            <p className="tk-pending">
              No tracking number yet. It appears here, and in your email, the day the parcel leaves the warehouse.
            </p>
          )}

          {order.events.length ? (
            <div className="tk-events">
              <h2>Carrier updates</h2>
              <ol>
                {order.events.map((event) => (
                  <li key={`${event.at}-${event.description}`}>
                    <time dateTime={event.at}>
                      {new Date(event.at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                    </time>
                    <span>{event.description}</span>
                    {event.location ? <em>{event.location}</em> : null}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
