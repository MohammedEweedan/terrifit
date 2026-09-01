/**
 * Stripe, resolved defensively.
 *
 * `@stripe/stripe-react-native` calls `TurboModuleRegistry.getEnforcing` at
 * import time, which throws if the native module is not in the binary. Because
 * the provider is mounted from the root layout, that throw took down the whole
 * app — every screen, not just checkout — whenever the JS bundle was newer than
 * the installed build. That happens routinely during development, and it would
 * happen in production to anyone on a build that predates the Stripe rollout.
 *
 * A payment library that is not linked should cost you the ability to pay, not
 * the ability to open the app. So the import is guarded and everything else
 * asks `stripeAvailable` first.
 */
type StripeModule = typeof import("@stripe/stripe-react-native");

let resolved: StripeModule | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  resolved = require("@stripe/stripe-react-native") as StripeModule;
} catch {
  // Not in this binary. Checkout says so plainly rather than crashing.
  resolved = null;
}

export const stripe = resolved;
export const stripeAvailable = resolved !== null;

/** What the sheet functions return when Stripe is not linked. */
const unavailable = {
  error: {
    code: "Unavailable",
    message: "Card payments need an app update. Everything else still works.",
  },
} as const;

/**
 * The two sheet calls, or stubs that fail cleanly.
 *
 * Availability is fixed at module load, so this never changes the number of
 * hooks called between renders.
 */
type InitParams = Parameters<ReturnType<StripeModule["useStripe"]>["initPaymentSheet"]>[0];
type SheetError = { error?: { code: string; message: string } };

export function useStripeSheet(): {
  available: boolean;
  initPaymentSheet: (params: InitParams) => Promise<SheetError>;
  presentPaymentSheet: () => Promise<SheetError>;
} {
  if (!stripe) {
    return {
      available: false,
      initPaymentSheet: async () => unavailable,
      presentPaymentSheet: async () => unavailable,
    };
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const sheet = stripe.useStripe();
  return {
    available: true,
    initPaymentSheet: sheet.initPaymentSheet,
    presentPaymentSheet: sheet.presentPaymentSheet,
  };
}
