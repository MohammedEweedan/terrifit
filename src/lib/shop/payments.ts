import type { PaymentMethod } from "@/lib/validation";

/**
 * Payment gateways.
 *
 * Each rail is behind the same tiny interface so the checkout route never
 * branches on a provider. Credentials come from the environment and a rail is
 * simply absent when its keys are missing, which is what `availableMethods`
 * reports to the storefront.
 *
 * When a rail is unconfigured the checkout still completes — but as an
 * explicitly flagged sandbox order that is recorded `pending`, marked
 * `sandbox`, and told to the customer on screen. A demo that silently claims a
 * card was charged is the one behaviour that would be genuinely dishonest.
 */

export type PaymentOutcome = {
  /** `paid` only ever comes from a gateway confirming it. */
  status: "paid" | "pending" | "failed";
  reference: string | null;
  /** Where to send the customer to authorise, when the rail needs that. */
  redirectUrl?: string;
  sandbox: boolean;
  error?: string;
};

export type PaymentRequest = {
  method: PaymentMethod;
  orderNumber: string;
  amountCents: number;
  currency: string;
  email: string;
  description: string;
  /** Absolute URLs the gateway sends the customer back to. */
  successUrl: string;
  cancelUrl: string;
};

const env = (key: string) => process.env[key]?.trim() || "";

/**
 * Pinned because ephemeral keys are version-specific: a key minted for a newer
 * API than the SDK expects is rejected on the device with a confusing error.
 * Bump this together with `@stripe/stripe-react-native`.
 */
const STRIPE_API_VERSION = "2024-06-20";

/**
 * Which rails have credentials.
 *
 * Apple Pay and Google Pay ride on Stripe — they are wallet presentations of a
 * card payment, not separate processors — so they are configured exactly when
 * Stripe is. Whether the *device* can offer them is a client-side question the
 * app answers separately.
 */
export function methodConfigured(method: PaymentMethod): boolean {
  switch (method) {
    case "card":
    case "apple_pay":
    case "google_pay":
      return Boolean(env("STRIPE_SECRET_KEY"));
    case "paypal":
      return Boolean(env("PAYPAL_CLIENT_ID") && env("PAYPAL_SECRET"));
    case "crypto":
      return Boolean(env("NOWPAYMENTS_API_KEY"));
  }
}

/**
 * Whether an unconfigured payment rail may record a fake, unpaid order.
 *
 * Off in production unless somebody deliberately turns it on, and on
 * everywhere else. It used to be the other way round — allowed unless the
 * environment said `false` — which meant the one deployment that most needed
 * the protection, a live site whose Stripe keys had not been set yet, was
 * exactly the one that accepted orders nobody had paid for. The safe default
 * belongs on the side of the mistake that is easy to make.
 */
export function sandboxAllowed(): boolean {
  const flag = env("ALLOW_SANDBOX_CHECKOUT").toLowerCase();
  if (flag === "true") return true;
  if (flag === "false") return false;
  return process.env.NODE_ENV !== "production";
}

export function availableMethods(): PaymentMethod[] {
  const all: PaymentMethod[] = ["card", "apple_pay", "google_pay", "paypal", "crypto"];
  return all.filter((method) => methodConfigured(method) || sandboxAllowed());
}

export async function createPayment(request: PaymentRequest): Promise<PaymentOutcome> {
  if (!methodConfigured(request.method)) {
    if (!sandboxAllowed()) {
      return { status: "failed", reference: null, sandbox: false, error: "method_unavailable" };
    }
    // Recorded, unpaid, and labelled as such everywhere it is shown.
    return { status: "pending", reference: null, sandbox: true };
  }

  try {
    switch (request.method) {
      case "card":
      case "apple_pay":
      case "google_pay":
        // One rail. The wallet is a presentation choice — Stripe Checkout shows
        // the sheet the device supports — so all three land on the same session.
        return await stripeCheckout(request);
      case "paypal":
        return await paypalOrder(request);
      case "crypto":
        return await nowPaymentsInvoice(request);
    }
  } catch {
    return { status: "failed", reference: null, sandbox: false, error: "gateway_error" };
  }
}

/* -------------------------------------------------------------------------- */

/**
 * Stripe Checkout. A hosted session rather than a raw PaymentIntent, because it
 * brings Apple Pay, Google Pay, 3-D Secure and SCA with it and keeps card data
 * entirely off our origin.
 */
async function stripeCheckout(request: PaymentRequest): Promise<PaymentOutcome> {
  const body = new URLSearchParams({
    mode: "payment",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": request.currency.toLowerCase(),
    "line_items[0][price_data][unit_amount]": String(request.amountCents),
    "line_items[0][price_data][product_data][name]": request.description,
    customer_email: request.email,
    client_reference_id: request.orderNumber,
    success_url: request.successUrl,
    cancel_url: request.cancelUrl,
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env("STRIPE_SECRET_KEY")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      // Stripe deduplicates on this, so a double-submitted checkout cannot
      // create two sessions for one order.
      "Idempotency-Key": `order_${request.orderNumber}`,
    },
    body,
  });

  const payload = (await response.json()) as { id?: string; url?: string };
  if (!response.ok || !payload.url) {
    return { status: "failed", reference: null, sandbox: false, error: "stripe_error" };
  }

  // Payment is confirmed by webhook, never by the browser coming back.
  return {
    status: "pending",
    reference: payload.id ?? null,
    redirectUrl: payload.url,
    sandbox: env("STRIPE_SECRET_KEY").startsWith("sk_test_"),
  };
}

/* -------------------------------------------------------------------------- */

async function paypalOrder(request: PaymentRequest): Promise<PaymentOutcome> {
  const base = env("PAYPAL_ENV") === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  const credentials = Buffer.from(`${env("PAYPAL_CLIENT_ID")}:${env("PAYPAL_SECRET")}`).toString("base64");

  const tokenResponse = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const token = (await tokenResponse.json()) as { access_token?: string };
  if (!tokenResponse.ok || !token.access_token) {
    return { status: "failed", reference: null, sandbox: false, error: "paypal_auth" };
  }

  const orderResponse = await fetch(`${base}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `order_${request.orderNumber}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: request.orderNumber,
          description: request.description.slice(0, 127),
          amount: {
            currency_code: request.currency,
            value: (request.amountCents / 100).toFixed(2),
          },
        },
      ],
      application_context: { return_url: request.successUrl, cancel_url: request.cancelUrl },
    }),
  });

  const order = (await orderResponse.json()) as {
    id?: string;
    links?: Array<{ rel: string; href: string }>;
  };
  const approve = order.links?.find((link) => link.rel === "approve")?.href;
  if (!orderResponse.ok || !approve) {
    return { status: "failed", reference: null, sandbox: false, error: "paypal_error" };
  }

  return {
    status: "pending",
    reference: order.id ?? null,
    redirectUrl: approve,
    sandbox: env("PAYPAL_ENV") !== "live",
  };
}

/* -------------------------------------------------------------------------- */

async function nowPaymentsInvoice(request: PaymentRequest): Promise<PaymentOutcome> {
  const response = await fetch("https://api.nowpayments.io/v1/invoice", {
    method: "POST",
    headers: {
      "x-api-key": env("NOWPAYMENTS_API_KEY"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      price_amount: request.amountCents / 100,
      price_currency: request.currency.toLowerCase(),
      order_id: request.orderNumber,
      order_description: request.description,
      success_url: request.successUrl,
      cancel_url: request.cancelUrl,
      ipn_callback_url: env("NOWPAYMENTS_IPN_URL") || undefined,
    }),
  });

  const invoice = (await response.json()) as { id?: string; invoice_url?: string };
  if (!response.ok || !invoice.invoice_url) {
    return { status: "failed", reference: null, sandbox: false, error: "crypto_error" };
  }

  return {
    status: "pending",
    reference: invoice.id ? String(invoice.id) : null,
    redirectUrl: invoice.invoice_url,
    sandbox: false,
  };
}

/* -------------------------------------------------------------------------- */
/* Native payment sheet                                                        */

export type PaymentSheetSetup = {
  clientSecret: string;
  ephemeralKey: string;
  customerId: string;
  publishableKey: string;
};

/**
 * Everything Stripe's native PaymentSheet needs, in one round trip.
 *
 * The hosted Checkout session above is the browser's rail. On a phone the sheet
 * is presented in-process, which needs three things the browser never sees: a
 * PaymentIntent to confirm, a Customer so cards can be saved and reused, and an
 * ephemeral key that lets the device read that Customer for the next hour and
 * nothing else. The secret key never leaves this process.
 *
 * Apple Pay and Google Pay are presented by the same sheet — they are wallet
 * front-ends for a card, not separate intents — so there is one function here,
 * not three.
 */
export async function createPaymentSheet(request: {
  orderNumber: string;
  amountCents: number;
  currency: string;
  email: string;
  name: string;
  description: string;
}): Promise<PaymentSheetSetup | { error: string }> {
  const secret = env("STRIPE_SECRET_KEY");
  const publishableKey = env("STRIPE_PUBLISHABLE_KEY");
  if (!secret || !publishableKey) return { error: "stripe_unconfigured" };

  const post = async (path: string, body: URLSearchParams, idempotency?: string) => {
    const response = await fetch(`https://api.stripe.com/v1/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
        ...(idempotency ? { "Idempotency-Key": idempotency } : {}),
        // Ephemeral keys are the one call that requires pinning: Stripe returns
        // a key shaped for whichever SDK version asked for it.
        ...(path === "ephemeral_keys" ? { "Stripe-Version": STRIPE_API_VERSION } : {}),
      },
      body,
    });
    return { ok: response.ok, json: (await response.json()) as Record<string, unknown> };
  };

  try {
    // Reusing a Customer per email means a returning buyer sees their saved
    // cards instead of typing the number again.
    const search = await fetch(
      `https://api.stripe.com/v1/customers?email=${encodeURIComponent(request.email)}&limit=1`,
      { headers: { Authorization: `Bearer ${secret}` } },
    );
    const existing = (await search.json()) as { data?: Array<{ id: string }> };
    let customerId = existing.data?.[0]?.id ?? "";

    if (!customerId) {
      const created = await post(
        "customers",
        new URLSearchParams({ email: request.email, name: request.name }),
      );
      if (!created.ok) return { error: "stripe_customer" };
      customerId = String(created.json.id ?? "");
    }

    const key = await post("ephemeral_keys", new URLSearchParams({ customer: customerId }));
    if (!key.ok) return { error: "stripe_ephemeral_key" };

    const intent = await post(
      "payment_intents",
      new URLSearchParams({
        amount: String(request.amountCents),
        currency: request.currency.toLowerCase(),
        customer: customerId,
        description: request.description,
        receipt_email: request.email,
        "metadata[order_number]": request.orderNumber,
        // Lets Stripe decide which methods to show from the dashboard config,
        // which is how Apple Pay, Google Pay and Link arrive without a deploy.
        "automatic_payment_methods[enabled]": "true",
      }),
      // Stripe deduplicates on this, so a double tap cannot charge twice.
      `intent_${request.orderNumber}`,
    );
    if (!intent.ok) return { error: "stripe_intent" };

    return {
      clientSecret: String(intent.json.client_secret ?? ""),
      ephemeralKey: String(key.json.secret ?? ""),
      customerId,
      publishableKey,
    };
  } catch {
    return { error: "gateway_error" };
  }
}

/* -------------------------------------------------------------------------- */
/* Subscriptions                                                               */

export type SubscriptionSetup = {
  subscriptionId: string;
  customerId: string;
  /** Null when the first invoice needed no confirmation (e.g. a saved card). */
  clientSecret: string | null;
  ephemeralKey: string;
  publishableKey: string;
};

/** Whether Pro can actually be sold, or only given away in development. */
export function subscriptionsConfigured(): boolean {
  return Boolean(env("STRIPE_SECRET_KEY") && env("STRIPE_PRICE_MONTHLY") && env("STRIPE_PRICE_YEARLY"));
}

/**
 * Starts a real Pro subscription.
 *
 * `default_incomplete` is the important part: Stripe creates the subscription
 * but leaves it inactive until the first invoice is actually paid, and hands
 * back a PaymentIntent for the app to confirm in the sheet. Nobody becomes Pro
 * because a request was made — they become Pro when the webhook says the money
 * arrived. See `src/app/api/webhooks/stripe/route.ts`.
 */
export async function createSubscription(request: {
  interval: "monthly" | "yearly";
  email: string;
  name: string;
  userId: string;
  existingCustomerId?: string | null;
}): Promise<SubscriptionSetup | { error: string }> {
  const secret = env("STRIPE_SECRET_KEY");
  const publishableKey = env("STRIPE_PUBLISHABLE_KEY");
  const price = request.interval === "yearly" ? env("STRIPE_PRICE_YEARLY") : env("STRIPE_PRICE_MONTHLY");
  if (!secret || !publishableKey || !price) return { error: "stripe_unconfigured" };

  const post = async (path: string, body: URLSearchParams, headers?: Record<string, string>) => {
    const response = await fetch(`https://api.stripe.com/v1/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
        ...headers,
      },
      body,
    });
    return { ok: response.ok, json: (await response.json()) as Record<string, unknown> };
  };

  try {
    let customerId = request.existingCustomerId ?? "";
    if (!customerId) {
      const created = await post(
        "customers",
        new URLSearchParams({
          email: request.email,
          name: request.name,
          "metadata[user_id]": request.userId,
        }),
      );
      if (!created.ok) return { error: "stripe_customer" };
      customerId = String(created.json.id ?? "");
    }

    const key = await post(
      "ephemeral_keys",
      new URLSearchParams({ customer: customerId }),
      { "Stripe-Version": STRIPE_API_VERSION },
    );
    if (!key.ok) return { error: "stripe_ephemeral_key" };

    const subscription = await post(
      "subscriptions",
      new URLSearchParams({
        customer: customerId,
        "items[0][price]": price,
        payment_behavior: "default_incomplete",
        "payment_settings[save_default_payment_method]": "on_subscription",
        "expand[0]": "latest_invoice.payment_intent",
        "metadata[user_id]": request.userId,
      }),
    );
    if (!subscription.ok) return { error: "stripe_subscription" };

    const invoice = subscription.json.latest_invoice as { payment_intent?: { client_secret?: string } } | undefined;

    return {
      subscriptionId: String(subscription.json.id ?? ""),
      customerId,
      clientSecret: invoice?.payment_intent?.client_secret ?? null,
      ephemeralKey: String(key.json.secret ?? ""),
      publishableKey,
    };
  } catch {
    return { error: "gateway_error" };
  }
}

/**
 * Cancels at the end of the paid period rather than immediately.
 *
 * Somebody who has paid for the month keeps the month. Cutting access the
 * instant they cancel is the kind of thing that turns a quiet churn into a
 * chargeback and a review.
 */
export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
  const secret = env("STRIPE_SECRET_KEY");
  if (!secret || !subscriptionId) return false;

  try {
    const response = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ cancel_at_period_end: "true" }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
