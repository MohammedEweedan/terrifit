import { useSyncExternalStore, type ReactElement } from "react";
import { stripe, stripeAvailable } from "@/stripe-safe";
import { getPaymentMethods } from "@/api";

/**
 * Stripe's publishable key, fetched once per launch.
 *
 * Publishable keys are public by design — Stripe's own quickstarts ship them in
 * client code — but fetching rather than baking it in means rotating a key, or
 * switching a build between test and live, is a deploy instead of an App Store
 * release. Until it arrives the provider renders with an empty key, which is
 * harmless: nothing calls into Stripe before checkout.
 *
 * Read through `useSyncExternalStore` because the value has to arrive after the
 * first render, and this codebase does not allow setState inside an effect.
 */
type Keys = { publishableKey: string; merchantIdentifier: string | undefined };

const EMPTY: Keys = { publishableKey: "", merchantIdentifier: undefined };

let keys: Keys = EMPTY;
let started = false;
const listeners = new Set<() => void>();

function load() {
  if (started) return;
  started = true;
  void getPaymentMethods()
    .then((result) => {
      keys = {
        publishableKey: result.publishableKey ?? "",
        merchantIdentifier: result.merchantIdentifier ?? undefined,
      };
      for (const listener of listeners) listener();
    })
    .catch(() => {
      // Checkout surfaces the failure itself; there is nothing useful to say
      // about it three screens earlier.
    });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  load();
  return () => listeners.delete(listener);
}

export function PaymentsProvider({ children }: { children: ReactElement }) {
  const current = useSyncExternalStore(subscribe, () => keys, () => EMPTY);

  // No native module in this binary — render the app without the provider
  // rather than taking every screen down over a library checkout needs.
  if (!stripe || !stripeAvailable) return children;

  const StripeProvider = stripe.StripeProvider;

  return (
    <StripeProvider
      publishableKey={current.publishableKey}
      merchantIdentifier={current.merchantIdentifier}
      // Needed for 3-D Secure and for wallets to hand control back to the app.
      urlScheme="terrifit"
    >
      {children}
    </StripeProvider>
  );
}
