"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { Locale } from "@/i18n/config";
import type { PagesCopy } from "@/i18n/pages";
import { useCart } from "@/lib/shop/cart";
import { formatMoney } from "@/lib/shop/money";
import { orderTotalCents } from "@/lib/shop/shipping";
import type { PaymentMethod } from "@/lib/validation";
import { Shot } from "@/components/ui/Shot";
import { lineImage } from "@/lib/shop/catalog";

const METHOD_ORDER: PaymentMethod[] = ["card", "apple_pay", "google_pay", "paypal", "crypto", "usdt_trc20"];

/**
 * Which wallets this browser can actually present.
 *
 * Offering Apple Pay in Chrome on Windows is a dead end: the button appears,
 * the sheet never does. `ApplePaySession` exists only in Safari on Apple
 * hardware; the Payment Request API is the equivalent signal for Google Pay.
 *
 * Read through `useSyncExternalStore` rather than an effect, because it is a
 * browser fact that has to differ between the server render and the client one
 * without tearing. The capability cannot change while the page is open, so
 * there is nothing to subscribe to.
 */
const noSubscribe = () => () => {};

function useAppleWallet(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () =>
      "ApplePaySession" in window
      && (window as unknown as { ApplePaySession: { canMakePayments(): boolean } }).ApplePaySession.canMakePayments(),
    () => false,
  );
}

function useGoogleWallet(): boolean {
  return useSyncExternalStore(noSubscribe, () => "PaymentRequest" in window, () => false);
}

export function CheckoutForm({
  locale,
  copy,
  countries,
  methods,
  sandboxMethods,
}: {
  locale: Locale;
  copy: PagesCopy["shop"];
  countries: Array<{ code: string; label: string }>;
  /** Which rails the server will actually accept, resolved at request time. */
  methods: PaymentMethod[];
  /** Of those, the ones with no credentials, which record an order without charging. */
  sandboxMethods: PaymentMethod[];
}) {
  const cart = useCart();
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod>(methods[0] ?? "card");
  const [status, setStatus] = useState<"idle" | "placing" | "error">("idle");
  const [error, setError] = useState("");
  const [invalid, setInvalid] = useState<string[]>([]);
  const appleWallet = useAppleWallet();
  const googleWallet = useGoogleWallet();

  const hasPhysical = cart.lines.some((line) => line.product.fulfilment === "ship");
  const totals = orderTotalCents(cart.subtotalCents, hasPhysical);
  // A rail with no credentials records the order without charging anything. The
  // customer is told that here, before they commit, rather than afterwards.
  const sandbox = sandboxMethods.includes(method);

  // A bag emptied in another tab must not leave someone filling in an address
  // for nothing.
  useEffect(() => {
    if (cart.ready && cart.lines.length === 0) router.replace(`/${locale}/shop/cart`);
  }, [cart.ready, cart.lines.length, locale, router]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus("placing");
    setError("");
    setInvalid([]);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.items,
          email: form.get("email"),
          name: form.get("name"),
          phone: form.get("phone") || "",
          line1: form.get("line1") || "",
          line2: form.get("line2") || "",
          city: form.get("city") || "",
          postcode: form.get("postcode") || "",
          country: form.get("country") || "",
          paymentMethod: method,
          locale,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { number?: string; redirectUrl?: string | null; error?: string; fields?: string[] }
        | null;

      if (response.ok && payload?.number) {
        // The bag is only cleared once the order exists server-side.
        cart.clear();
        if (payload.redirectUrl) {
          window.location.href = payload.redirectUrl;
          return;
        }
        router.push(`/${locale}/shop/order/${payload.number}`);
        return;
      }

      setStatus("error");
      if (response.status === 429) setError(copy.checkout.errorRate);
      else if (response.status === 422 && payload?.error === "method_unavailable") setError(copy.checkout.unavailable);
      else if (response.status === 422) {
        setInvalid(payload?.fields ?? []);
        setError(copy.checkout.errorValidation);
      } else setError(copy.checkout.errorGeneric);
    } catch {
      setStatus("error");
      setError(copy.checkout.errorGeneric);
    }
  }

  if (cart.ready && cart.lines.length === 0) {
    return (
      <div className="sh-page">
        <div className="tf-shell sh-cart-empty">
          <h1>{copy.checkout.emptyTitle}</h1>
          <Link className="sh-button" href={`/${locale}/shop`}>
            {copy.checkout.emptyCta}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="sh-page">
      <div className="tf-shell">
        <h1>{copy.checkout.title}</h1>

        <form className="sh-checkout" onSubmit={submit}>
          <div className="sh-checkout-main">
            <fieldset className="sh-fieldset">
              <legend>
                <span className="numeric">01</span> {copy.checkout.step1}
              </legend>
              <label className={`sh-field ${invalid.includes("email") ? "is-invalid" : ""}`}>
                <span>{copy.checkout.emailLabel}</span>
                <input name="email" type="email" required autoComplete="email" />
                <small>{copy.checkout.emailHint}</small>
              </label>
              <label className={`sh-field ${invalid.includes("name") ? "is-invalid" : ""}`}>
                <span>{copy.checkout.nameLabel}</span>
                <input name="name" type="text" required autoComplete="name" />
              </label>
            </fieldset>

            {hasPhysical ? (
              <fieldset className="sh-fieldset">
                <legend>
                  <span className="numeric">02</span> {copy.checkout.step2}
                </legend>
                <label className={`sh-field ${invalid.includes("line1") ? "is-invalid" : ""}`}>
                  <span>{copy.checkout.addressLabel}</span>
                  <input name="line1" type="text" required autoComplete="address-line1" />
                </label>
                <label className="sh-field">
                  <span>{copy.checkout.address2Label}</span>
                  <input name="line2" type="text" autoComplete="address-line2" />
                </label>
                <div className="sh-field-row">
                  <label className={`sh-field ${invalid.includes("city") ? "is-invalid" : ""}`}>
                    <span>{copy.checkout.cityLabel}</span>
                    <input name="city" type="text" required autoComplete="address-level2" />
                  </label>
                  <label className={`sh-field ${invalid.includes("postcode") ? "is-invalid" : ""}`}>
                    <span>{copy.checkout.postcodeLabel}</span>
                    <input name="postcode" type="text" required autoComplete="postal-code" />
                  </label>
                </div>
                <div className="sh-field-row">
                  <label className={`sh-field ${invalid.includes("country") ? "is-invalid" : ""}`}>
                    <span>{copy.checkout.countryLabel}</span>
                    <select name="country" required defaultValue="" autoComplete="country">
                      <option value="" disabled>
                        —
                      </option>
                      {countries.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="sh-field">
                    <span>{copy.checkout.phoneLabel}</span>
                    <input name="phone" type="tel" autoComplete="tel" />
                  </label>
                </div>
              </fieldset>
            ) : null}

            <fieldset className="sh-fieldset">
              <legend>
                <span className="numeric">{hasPhysical ? "03" : "02"}</span> {copy.checkout.step3}
              </legend>
              <div className="sh-methods" role="radiogroup" aria-label={copy.checkout.methodLabel}>
                {METHOD_ORDER.filter((key) => methods.includes(key))
                  .filter((key) => (key === "apple_pay" ? appleWallet : key === "google_pay" ? googleWallet : true))
                  .map((key) => (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={method === key}
                    className={method === key ? "is-active" : undefined}
                    onClick={() => setMethod(key)}
                  >
                    <strong>{copy.checkout.methods[key].label}</strong>
                    <span>{copy.checkout.methods[key].note}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <aside className="sh-summary">
            <h2>{copy.checkout.summaryTitle}</h2>
            <ul className="sh-summary-lines">
              {cart.lines.map((line) => (
                <li key={line.key}>
                  <Shot
                    src={lineImage(line.product, line.variantId).src}
                    alt={lineImage(line.product, line.variantId).alt}
                    ratio={1}
                    sizes="56px"
                    fit="contain"
                    fallback={{ label: line.product.name }}
                  />
                  <div>
                    <strong>{line.product.name}</strong>
                    <span>
                      {line.variant ? `${line.variant.label} · ` : ""}
                      <b className="numeric">×{line.quantity}</b>
                    </span>
                  </div>
                  <b className="numeric">{formatMoney(line.lineCents, locale)}</b>
                </li>
              ))}
            </ul>
            <dl>
              <div>
                <dt>{copy.checkout.subtotal}</dt>
                <dd className="numeric">{formatMoney(totals.subtotalCents, locale)}</dd>
              </div>
              <div>
                <dt>{copy.checkout.shipping}</dt>
                <dd className="numeric">
                  {totals.shippingCents === 0 ? copy.cart.shippingFree : formatMoney(totals.shippingCents, locale)}
                </dd>
              </div>
              <div>
                <dt>{copy.checkout.tax}</dt>
                <dd className="numeric">{formatMoney(totals.taxCents, locale)}</dd>
              </div>
              <div className="is-total">
                <dt>{copy.checkout.total}</dt>
                <dd className="numeric">{formatMoney(totals.totalCents, locale)}</dd>
              </div>
            </dl>
            <p className="sh-tax-note">{copy.checkout.taxNote}</p>

            {error ? (
              <p className="sh-error" role="alert">
                {error}
              </p>
            ) : null}

            <button className="sh-button sh-button-block" type="submit" disabled={status === "placing"}>
              {status === "placing" ? copy.checkout.placing : copy.checkout.place}
            </button>
            {sandbox ? <p className="sh-sandbox">{copy.checkout.testMode}</p> : null}
            <p className="sh-terms">{copy.checkout.terms}</p>
            <Link className="sh-text-link" href={`/${locale}/shop/cart`}>
              {copy.checkout.backToBag}
            </Link>
          </aside>
        </form>
      </div>
    </div>
  );
}
