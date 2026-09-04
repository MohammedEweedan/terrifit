import { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Text } from "@/components/AppText";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ApiError, appCheckout, getAddresses, getPaymentMethods, reportCheckout, saveAddress,
  type AppCheckoutResult, type SavedAddress,
} from "@/api";
import { useAppState } from "@/app-state";
import { useCart } from "@/cart";
import { PayIcon } from "@/components/PayIcon";
import {
  findCountry, loadCountries, lookupPostcode, searchStreets, toE164, validPhone, validPostal,
  type Country, type Precision, type Suggestion,
} from "@/countries";
import { ModalHeader } from "@/components/ModalHeader";
import { OrderConfirmed } from "@/components/OrderConfirmed";
import { StepDots } from "@/components/StepDots";
import { useSession } from "@/session";
import { useStripeSheet } from "@/stripe-safe";
import { fonts, display, theme } from "@/theme";
import { TerrifitSpinner } from "@/components/TerrifitSpinner";
import { CurrencyPicker } from "@/components/MarketPicker";
import { usePreferences } from "@/preferences";

const METHOD_LABELS: Record<string, string> = {
  card: "Card",
  apple_pay: "Apple Pay",
  google_pay: "Google Pay",
  paypal: "PayPal",
  crypto: "Crypto",
};

const METHOD_NOTES: Record<string, string> = {
  card: "Visa, Mastercard, Amex",
  apple_pay: "Face ID, one tap",
  google_pay: "Card in your Google account",
  paypal: "Balance or linked card",
  crypto: "USDT, USDC, BTC, ETH",
};

const METHOD_ORDER = ["card", "apple_pay", "google_pay", "paypal", "crypto"];

/**
 * Which wallets this device can plausibly present.
 *
 * Apple Pay only exists on iOS and Google Pay only on Android, so the platform
 * is the gate. Whether a card is actually provisioned in that wallet needs
 * `@stripe/stripe-react-native`'s `isPlatformPaySupported`, which is a native
 * module and a rebuild — until that lands, choosing a wallet opens the Stripe
 * Checkout session in the browser, where the sheet appears if the wallet is set
 * up and the card form appears if it is not. Nobody hits a dead end.
 */
function walletAvailable(method: string): boolean {
  if (method === "apple_pay") return Platform.OS === "ios";
  if (method === "google_pay") return Platform.OS === "android";
  return true;
}

/**
 * Card, Apple Pay and Google Pay all go through Stripe's native sheet. On a
 * build without the module linked they cannot be presented at all, so they are
 * not offered — better than a Pay button that opens nothing.
 */
const STRIPE_RAILS = ["card", "apple_pay", "google_pay"];

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useSession();
  const { profile } = useAppState();
  const cart = useCart();
  const preferences = usePreferences();
  const money = (cents: number, currency = preferences.currencyCode) => preferences.money(cents, currency);
  const { available: stripeReady, initPaymentSheet, presentPaymentSheet } = useStripeSheet();

  const [methods, setMethods] = useState<string[]>([]);
  const [sandbox, setSandbox] = useState<string[]>([]);
  const [method, setMethod] = useState("card");

  const [countries, setCountries] = useState<Country[]>([]);
  const [countryCode, setCountryCode] = useState(preferences.countryCode ?? "US");
  const [picking, setPicking] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);

  const [name, setName] = useState(profile?.user.name ?? "");
  const [email, setEmail] = useState(profile?.user.email ?? "");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");

  const [looking, setLooking] = useState(false);
  const [found, setFound] = useState<Suggestion[]>([]);
  const [precision, setPrecision] = useState<Precision>("none");
  const [pickingAddress, setPickingAddress] = useState(false);
  const [streetHits, setStreetHits] = useState<Suggestion[]>([]);
  const [streetPicked, setStreetPicked] = useState(false);
  const [busy, setBusy] = useState(false);
  // "working" while the order is in flight, "fail" for a beat after one is
  // refused. Success is handled by the confirmation screen, which owns its own
  // resolve so the tick is not drawn twice.
  const [attempt, setAttempt] = useState<"idle" | "working" | "fail">("idle");
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState<SavedAddress[]>([]);
  const [saveThis, setSaveThis] = useState(true);
  const [done, setDone] = useState<AppCheckoutResult | null>(null);

  const country = useMemo(() => findCountry(countries, countryCode), [countries, countryCode]);

  useEffect(() => {
    void getPaymentMethods()
      .then((result) => {
        const usable = result.methods
          .filter(walletAvailable)
          .filter((item) => stripeReady || !STRIPE_RAILS.includes(item));
        setMethods(usable);
        setSandbox(result.sandbox);
        if (usable.length > 0 && !usable.includes(method)) setMethod(usable[0]);
      })
      .catch(() => setMethods(["card"]));
    void loadCountries().then(setCountries).catch(() => {});

    // The address book, so a returning customer taps once instead of typing.
    void getAddresses(token)
      .then((result) => {
        setSaved(result.addresses);
        const preferred = result.addresses.find((item) => item.isDefault) ?? result.addresses[0];
        if (preferred) applySaved(preferred);
      })
      .catch(() => {});
    // Only on mount: the picker should not jump under someone mid-edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Memberships are delivered to an account, not a doormat; everything else
  // needs somewhere to go. The server applies the same rule.
  const needsAddress = cart.lines.some((line) => line.slug !== "terrifit-membership");

  // Debounced, so it fires when someone stops typing rather than per keystroke.
  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (lookupTimer.current) clearTimeout(lookupTimer.current);
    if (!needsAddress || !country || !validPostal(country, postcode)) {
      setFound([]);
      setPrecision("none");
      return;
    }
    lookupTimer.current = setTimeout(() => {
      setLooking(true);
      void lookupPostcode(country.code, postcode)
        .then((result) => {
          if ("error" in result) {
            setFound([]);
            setPrecision("none");
            return;
          }
          setFound(result.addresses);
          setPrecision(result.precision);
          // One result is not a choice, so it is applied rather than offered.
          if (result.addresses.length === 1) applyAddress(result.addresses[0], result.precision);
          else if (result.addresses.length > 1) setPickingAddress(true);
        })
        .catch(() => {
          setFound([]);
          setPrecision("none");
        })
        .finally(() => setLooking(false));
    }, 550);
    return () => {
      if (lookupTimer.current) clearTimeout(lookupTimer.current);
    };
    // `applyAddress` is stable in practice and listing it would re-run the
    // lookup every time a field it writes to changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postcode, country, needsAddress]);

  /**
   * Fills in what the lookup knew and leaves the rest alone.
   *
   * A street-level result deliberately does not touch line 1 if something is
   * already typed there — overwriting a door number somebody entered with a
   * bare street name would be worse than not looking it up at all.
   */
  // Suggestions while typing the street. Debounced harder than the postcode
  // lookup because it fires on every keystroke rather than on a finished code.
  const streetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (streetTimer.current) clearTimeout(streetTimer.current);
    // Nothing to suggest once a suggestion has been taken, and three letters is
    // the point below which everything matches everything.
    if (streetPicked || !needsAddress || !country || line1.trim().length < 3) {
      setStreetHits([]);
      return;
    }
    streetTimer.current = setTimeout(() => {
      void searchStreets(country.code, postcode.trim(), line1.trim())
        .then((result) => {
          if ("error" in result) return setStreetHits([]);
          // A suggestion identical to what is typed is not a suggestion.
          setStreetHits(
            result.addresses.filter((item) => item.line1.toLowerCase() !== line1.trim().toLowerCase()).slice(0, 5),
          );
        })
        .catch(() => setStreetHits([]));
    }, 450);
    return () => {
      if (streetTimer.current) clearTimeout(streetTimer.current);
    };
  }, [line1, postcode, country, needsAddress, streetPicked]);

  /** Fills the whole form from the address book in one tap. */
  function applySaved(address: SavedAddress) {
    setName(address.name);
    setLine1(address.line1);
    setLine2(address.line2 ?? "");
    setCity(address.city);
    setPostcode(address.postcode);
    setCountryCode(address.country);
    if (address.phone) {
      // Stored in E.164; the field holds the national part beside the dial code.
      const dial = findCountry(countries, address.country)?.dial ?? "";
      setPhone(address.phone.replace(`+${dial}`, "").trim());
    }
  }

  function applyAddress(address: Suggestion, level: Precision) {
    if (address.city) setCity(address.city);
    if (address.postal) setPostcode(address.postal);
    if (address.line2) setLine2(address.line2);
    if (address.line1 && (level === "exact" || line1.trim().length === 0)) setLine1(address.line1);
  }

  const postcodeOk = !needsAddress || validPostal(country, postcode);
  const phoneOk = phone.trim().length === 0 || validPhone(phone);
  const addressDone =
    !needsAddress || (line1.trim().length > 0 && city.trim().length > 0 && postcodeOk && Boolean(country));
  const ready =
    name.trim().length > 0 && /.+@.+\..+/.test(email) && addressDone && phoneOk && cart.lines.length > 0;

  const STEPS = ["Details", "Payment", "Review"];
  // Each step gates the next, so nobody reaches Pay with a half-filled form and
  // finds out from a 422.
  const stepReady = step === 0 ? name.trim().length > 0 && /.+@.+\..+/.test(email) && addressDone && phoneOk
    : step === 1 ? methods.includes(method)
      : ready;

  async function persistAddress() {
    if (!needsAddress || !saveThis) return;
    // Nothing to add if this exact address is already in the book.
    const already = saved.some(
      (item) => item.line1 === line1.trim() && item.postcode.toUpperCase() === postcode.trim().toUpperCase(),
    );
    if (already) return;

    await saveAddress(token, {
      label: null,
      name: name.trim(),
      phone: phone.trim() && country ? toE164(country.dial, phone) : null,
      line1: line1.trim(),
      line2: line2.trim() || null,
      city: city.trim(),
      postcode: postcode.trim(),
      country: countryCode,
    }).catch(() => {
      // Saving is a convenience; failing to save must never block a purchase.
    });
  }

  function next() {
    if (!stepReady) return;
    if (step === 0) void persistAddress();
    if (step < STEPS.length - 1) setStep(step + 1);
    else void pay();
  }

  async function pay() {
    if (busy) return;

    // Re-checked here, not just at the step gate: whatever route somebody took
    // to reach Review — a tapped step dot, a field cleared after passing —
    // this is the last point before money, and a 422 is a worse answer than a
    // sentence naming the field.
    const missing = needsAddress
      ? ([
          [line1.trim(), "a street address"],
          [city.trim(), "a city"],
          [postcode.trim(), "a postcode"],
        ] as const).filter(([value]) => !value).map(([, label]) => label)
      : [];

    if (missing.length > 0) {
      setStep(0);
      setError(`Still needs ${missing.join(", ")}.`);
      return;
    }
    if (!ready) {
      setStep(0);
      setError("Check the highlighted fields and try again.");
      return;
    }

    setBusy(true);
    setAttempt("working");
    setError("");

    try {
      const result = await appCheckout(token, {
        items: cart.lines.map((line) => ({
          slug: line.slug,
          variantId: line.variantId,
          quantity: line.quantity,
        })),
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() && country ? toE164(country.dial, phone) : undefined,
        line1: line1.trim(),
        line2: line2.trim() || undefined,
        city: city.trim(),
        postcode: postcode.trim(),
        country: countryCode,
        paymentMethod: method,
        currency: preferences.currencyCode,
        locale: preferences.locale,
      });

      // No Stripe keys yet. The order is real and recorded; nothing is charged,
      // and the confirmation screen says exactly that.
      if (!result.sheet) {
        setDone(result);
        cart.clear();
        return;
      }

      const init = await initPaymentSheet({
        merchantDisplayName: "Terrifit",
        customerId: result.sheet.customerId,
        customerEphemeralKeySecret: result.sheet.ephemeralKey,
        paymentIntentClientSecret: result.sheet.clientSecret,
        // Saves the card against the Customer so the next order is one tap.
        allowsDelayedPaymentMethods: false,
        defaultBillingDetails: {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() && country ? toE164(country.dial, phone) : undefined,
          address: {
            line1: line1.trim(),
            line2: line2.trim(),
            city: city.trim(),
            postalCode: postcode.trim(),
            country: countryCode,
          },
        },
        applePay: { merchantCountryCode: countryCode },
        googlePay: { merchantCountryCode: countryCode, testEnv: __DEV__ },
      });

      if (init.error) {
        setError("We couldn't open the payment sheet. Nothing has been charged.");
        return;
      }

      const presented = await presentPaymentSheet();

      if (presented.error) {
        // Canceled is somebody changing their mind, not a failure to report.
        await reportCheckout(token, result.number, "cancelled").catch(() => {});
        if (presented.error.code !== "Canceled") {
          setError(presented.error.message || "That payment didn't go through. Nothing has been charged.");
        }
        return;
      }

      await reportCheckout(token, result.number, "completed").catch(() => {});
      setDone(result);
      cart.clear();
    } catch (caught) {
      // The server names the fields it rejected; saying which is the whole
      // difference between a fixable error and a dead end. Sends them back to
      // the step that holds them, too.
      if (caught instanceof ApiError && caught.status === 422) {
        setStep(0);
        setError(
          caught.detail
            ? `Not accepted: ${caught.detail}. Fix that and try again.`
            : "Some details were not accepted. Check the address — anything posted needs a full one.",
        );
      } else if (caught instanceof ApiError && caught.status === 502) {
        setError("The payment provider did not respond. Your order was not placed and nothing was charged.");
      } else {
        setError("We couldn't place the order. Nothing has been charged.");
      }
    } finally {
      setBusy(false);
      // If an error was set on this pass, show the cross before clearing.
      setAttempt((current) => (current === "working" ? "fail" : current));
    }
  }

  // Flipped shortly after the confirmation screen appears, so the refresh mark
  // has a moment to turn before it resolves into the tick.
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => setSettled(true), 900);
    return () => clearTimeout(timer);
  }, [done]);

  /** Back to the app, not another copy of it on top. */
  function close() {
    if (router.canDismiss()) router.dismissAll();
    else router.back();
  }

  if (done) {
    return (
      <View style={[s.page, { paddingTop: insets.top + 40, paddingHorizontal: 20 }]}>
        {/* The mark turns, then becomes the tick. `settled` is held back a beat
            on purpose: the order is already written by the time this screen
            mounts, and resolving instantly reads as a static icon rather than
            an answer arriving. */}
        <View style={s.confirmMark}>
          <OrderConfirmed state={settled ? "ok" : "working"} />
        </View>
        <Text style={s.eyebrow}>Order placed</Text>
        <Text style={s.orderNumber}>{done.number}</Text>
        <Text style={s.body}>
          {done.sandbox
            ? "Recorded as pending. Stripe has no live keys on this build, so nothing was charged — the order is real and will be picked up once it goes live."
            : "Paid. Stripe is settling it now, and your receipt lands in your inbox the moment it clears — usually within a minute."}
        </Text>
        {done.totals ? (
          <View style={s.totals}>
            <Row label="Subtotal" value={money(done.totals.subtotalCents, done.currency)} />
            <Row label="Tax" value={money(done.totals.taxCents, done.currency)} />
            <Row label="Shipping" value={done.totals.shippingCents === 0 ? "Free" : money(done.totals.shippingCents, done.currency)} />
            <Row label="Total" value={money(done.totals.totalCents, done.currency)} strong />
          </View>
        ) : null}
        {/* `replace` with a tab route from inside a modal mounted the whole
            tab navigator *inside* the modal — a second app on top of the
            first. Dismissing the modal stack is what actually gets you back to
            where you were. */}
        <Pressable onPress={close} style={s.primary}>
          <Text style={s.primaryText}>Done</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            close();
            router.push("/orders" as never);
          }}
          style={s.secondary}
        >
          <Text style={s.secondaryText}>Track this order</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={s.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ModalHeader
        title="Checkout"
        left={
          step > 0 ? (
            <Pressable onPress={() => setStep(step - 1)} hitSlop={10}>
              <Text style={s.back}>‹ Back</Text>
            </Pressable>
          ) : undefined
        }
      />

      <StepDots steps={STEPS} current={step} onJump={setStep} />

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: 120 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 0 ? (
        <>
        <Step number={1} title="Where it goes" note={needsAddress ? "Required for anything posted" : "For your receipt"} />

        {saved.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.savedRow}>
            {saved.map((item) => {
              const on = item.line1 === line1 && item.postcode === postcode;
              return (
                <Pressable key={item.id} onPress={() => applySaved(item)} style={[s.savedCard, on && s.savedOn]}>
                  <Text style={[s.savedLabel, on && s.savedLabelOn]} numberOfLines={1}>
                    {item.label ?? (item.isDefault ? "Default" : "Saved")}
                  </Text>
                  <Text style={s.savedLine} numberOfLines={2}>
                    {item.line1}, {item.city}
                  </Text>
                  <Text style={s.savedPostcode}>{item.postcode}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}
        <Field label="Name" value={name} onChange={setName} autoComplete="name" autoCapitalize="words" />
        <Field label="Email" value={email} onChange={setEmail} keyboardType="email-address" autoComplete="email" />

        <View style={s.field}>
          <Text style={s.label}>Country</Text>
          <Pressable onPress={() => setPicking(true)} style={s.select}>
            <Text style={s.selectText}>{country ? country.name : countryCode}</Text>
            <Text style={s.selectChevron}>⌄</Text>
          </Pressable>
        </View>

        <View style={s.field}>
          <Text style={s.label}>Phone</Text>
          <View style={s.phoneRow}>
            <Pressable onPress={() => setPicking(true)} style={s.dial}>
              <Text style={s.dialText}>+{country?.dial ?? "—"}</Text>
            </Pressable>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              style={[s.input, s.flex, !phoneOk && s.inputBad]}
              placeholder="7700 900123"
              placeholderTextColor={theme.muted}
              keyboardType="phone-pad"
              autoComplete="tel"
            />
          </View>
          <Text style={phoneOk ? s.hint : s.hintBad}>
            {phoneOk
              ? "We send order codes over WhatsApp. If this number isn't on WhatsApp you'll get them as a normal text instead."
              : "That doesn't look like a full number for this country."}
          </Text>
        </View>

        {needsAddress ? (
          <>
            <View style={s.row}>
              <View style={s.flex}>
                <Field
                  label={country?.postalLabel ?? "Postcode"}
                  value={postcode}
                  onChange={setPostcode}
                  autoCapitalize="characters"
                  autoComplete="postal-code"
                  bad={postcode.length > 0 && !postcodeOk}
                />
              </View>
              <View style={s.lookupSlot}>{looking ? <TerrifitSpinner /> : null}</View>
            </View>
            {postcode.length > 0 && postcodeOk && !looking ? (
              precision === "exact" || precision === "street" ? (
                <Pressable onPress={() => setPickingAddress(true)} style={s.foundRow}>
                  <Text style={s.foundText}>
                    {found.length} {found.length === 1 ? "address" : "addresses"} at this{" "}
                    {(country?.postalLabel ?? "postcode").toLowerCase()}
                    {precision === "street" ? " · street only, add your number" : ""}
                  </Text>
                  <Text style={s.foundChevron}>›</Text>
                </Pressable>
              ) : precision === "area" ? (
                <Text style={s.hint}>
                  {found[0]?.city} filled in. Start typing your street below and we&apos;ll suggest the rest.
                </Text>
              ) : null
            ) : null}
            {postcode.length > 0 && !postcodeOk ? (
              <Text style={s.hintBad}>That is not a valid {(country?.postalLabel ?? "postcode").toLowerCase()} for {country?.name ?? "this country"}.</Text>
            ) : null}

            <Field
              label="Address"
              value={line1}
              onChange={(value) => {
                setLine1(value);
                setStreetPicked(false);
              }}
              autoComplete="street-address"
              autoCapitalize="words"
            />

            {streetHits.length > 0 ? (
              <View style={s.suggestions}>
                {streetHits.map((hit) => (
                  <Pressable
                    key={hit.label}
                    onPress={() => {
                      setLine1(hit.line1);
                      if (hit.city) setCity(hit.city);
                      if (hit.postal) setPostcode(hit.postal);
                      setStreetPicked(true);
                      setStreetHits([]);
                    }}
                    style={s.suggestion}
                  >
                    <Text style={s.suggestionLine}>{hit.line1}</Text>
                    <Text style={s.suggestionMeta}>
                      {[hit.city, hit.postal].filter(Boolean).join(" · ")}
                    </Text>
                  </Pressable>
                ))}
                <Text style={s.suggestionNote}>Add your house or flat number to the line above.</Text>
              </View>
            ) : null}
            <Field label="Flat, unit or company (optional)" value={line2} onChange={setLine2} autoCapitalize="words" />
            <Field label="City" value={city} onChange={setCity} autoCapitalize="words" />
          </>
        ) : null}

        {needsAddress ? (
          <Pressable onPress={() => setSaveThis(!saveThis)} style={s.saveToggle}>
            <View style={[s.checkbox, saveThis && s.checkboxOn]}>
              {saveThis ? <Text style={s.checkboxTick}>✓</Text> : null}
            </View>
            <Text style={s.saveToggleText}>Save this address for next time</Text>
          </Pressable>
        ) : null}
        </>
        ) : null}

        {step === 1 ? (
        <>
        <Step number={2} title="How you pay" note={`Charged once in ${preferences.currencyCode}`} />
        <Pressable onPress={()=>setCurrencyOpen(true)} style={s.currencyRow}><View><Text style={s.reviewLabel}>{preferences.t("paymentCurrency")}</Text><Text style={s.currencyValue}>{preferences.currencyCode} · {preferences.money(4999)}</Text></View><Text style={s.reviewEdit}>{preferences.t("currency")}</Text></Pressable>
        {methods.length === 0 ? <TerrifitSpinner /> : null}
        <View style={s.methods}>
          {METHOD_ORDER.filter((item) => methods.includes(item)).map((item) => {
            const on = method === item;
            return (
              <Pressable key={item} onPress={() => setMethod(item)} style={[s.method, on && s.methodOn]}>
                <PayIcon method={item} color={on ? theme.accent : theme.ink2} />
                <Text style={[s.methodText, on && s.methodTextOn]}>{METHOD_LABELS[item] ?? item}</Text>
                <Text style={s.methodNote} numberOfLines={2}>
                  {sandbox.includes(item) ? "Test mode" : METHOD_NOTES[item] ?? ""}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {!stripeReady ? (
          <Text style={s.sandboxNote}>
            Card, Apple Pay and Google Pay need an app update — this build does not have the payment sheet in it.
            PayPal and crypto still work.
          </Text>
        ) : null}
        {sandbox.includes(method) ? (
          <Text style={s.sandboxNote}>
            This rail has no live credentials yet. The order is recorded and nothing is charged.
          </Text>
        ) : null}

        </>
        ) : null}

        {step === 2 ? (
        <>
        {needsAddress ? (
          <Pressable onPress={() => setStep(0)} style={s.reviewAddress}>
            <View style={s.flex}>
              <Text style={s.reviewLabel}>Delivering to</Text>
              {line1.trim() ? (
                <Text style={s.reviewLine}>
                  {[name.trim(), line1.trim(), line2.trim(), city.trim(), postcode.trim(), countryCode]
                    .filter(Boolean)
                    .join("\n")}
                </Text>
              ) : (
                <Text style={s.reviewMissing}>No street address yet — tap to add it</Text>
              )}
            </View>
            <Text style={s.reviewEdit}>Edit</Text>
          </Pressable>
        ) : null}

        <Step number={3} title="What you are buying" note={`${cart.lines.length} ${cart.lines.length === 1 ? "line" : "lines"}`} />
        {cart.lines.map((line) => (
          <View key={`${line.slug}-${line.variantId ?? ""}`} style={s.summaryLine}>
            <Text style={s.summaryName} numberOfLines={1}>
              {line.quantity} × {line.name}
              {line.variantLabel ? ` · ${line.variantLabel}` : ""}
            </Text>
            <Text style={s.summaryPrice}>{money(line.priceCents * line.quantity)}</Text>
          </View>
        ))}
        <View style={s.subtotal}>
          <Text style={s.summaryName}>Subtotal</Text>
          <Text style={s.summaryPrice}>{money(cart.subtotalCents)}</Text>
        </View>
        <View style={s.estimateRow}>
          <Text style={s.summaryName}>Shipping and tax</Text>
          <Text style={s.summaryPrice}>Worked out on the next tap</Text>
        </View>
        <Text style={s.finalNote}>
          Every line is re-priced on the server before anything is charged, so the total you are shown at the end is
          the one that counts.
        </Text>

        </>
        ) : null}

        {attempt === "fail" ? (
          <View style={s.attemptMark}>
            <OrderConfirmed state="fail" size={64} />
          </View>
        ) : null}
        {error ? <Text style={s.error}>{error}</Text> : null}
      </ScrollView>

      {/* The action lives at the bottom of the screen, not the bottom of the
          scroller — on a long form it was below the fold and felt like the
          flow had no end. */}
      <View style={[s.actionBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <Pressable onPress={next} disabled={!stepReady || busy} style={[s.primary, (!stepReady || busy) && s.dim]}>
          <Text style={s.primaryText}>
            {busy
              ? "Placing order…"
              : step < STEPS.length - 1
                ? "Continue"
                : `Pay ${money(cart.subtotalCents)}`}
          </Text>
        </Pressable>
      </View>

      <AddressPicker
        open={pickingAddress}
        addresses={found}
        precision={precision}
        onPick={(address) => {
          applyAddress(address, "exact");
          setPickingAddress(false);
        }}
        onClose={() => setPickingAddress(false)}
      />

      <CountryPicker
        open={picking}
        countries={countries}
        selected={countryCode}
        onPick={(code) => {
          setCountryCode(code);
          setPicking(false);
        }}
        onClose={() => setPicking(false)}
      />
      <CurrencyPicker open={currencyOpen} onClose={()=>setCurrencyOpen(false)}/>
    </KeyboardAvoidingView>
  );
}

/**
 * The addresses at a postcode, to pick from.
 *
 * Shown only when the lookup found more than one, because a single result is
 * applied straight to the form — a sheet with one row in it is a tap somebody
 * has to make for no reason.
 */
function AddressPicker({
  open, addresses, precision, onPick, onClose,
}: {
  open: boolean;
  addresses: Suggestion[];
  precision: Precision;
  onPick: (address: Suggestion) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <View style={[s.page, { paddingTop: insets.top + 8 }]}>
        <View style={s.pickerTop}>
          <Text style={s.pickerTitle}>Pick your address</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={s.back}>Type it instead</Text>
          </Pressable>
        </View>

        {precision === "street" ? (
          <Text style={[s.hint, { paddingHorizontal: 18, marginBottom: 10 }]}>
            These are the streets on this postcode. Pick yours and add the house or flat number.
          </Text>
        ) : null}

        <FlatList
          data={addresses}
          keyExtractor={(item, index) => `${item.label}-${index}`}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable onPress={() => onPick(item)} style={s.countryRow}>
              <View style={s.flex}>
                <Text style={s.countryName}>{item.line1 || item.city}</Text>
                <Text style={s.addressMeta}>
                  {[item.city, item.region, item.postal].filter(Boolean).join(" · ")}
                </Text>
              </View>
              <Text style={s.foundChevron}>›</Text>
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}

/** Every country in the world is a list, not a dropdown. It needs a search. */
function CountryPicker({
  open, countries, selected, onPick, onClose,
}: {
  open: boolean;
  countries: Country[];
  selected: string;
  onPick: (code: string) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (country) => country.name.toLowerCase().includes(q) || country.code.toLowerCase() === q || country.dial.startsWith(q),
    );
  }, [countries, query]);

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <View style={[s.page, { paddingTop: insets.top + 8 }]}>
        <View style={s.pickerTop}>
          <Text style={s.pickerTitle}>Country</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={s.back}>Done</Text>
          </Pressable>
        </View>
        <View style={{ paddingHorizontal: 18, paddingBottom: 10 }}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search"
            placeholderTextColor={theme.muted}
            style={s.input}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <FlatList
          data={shown}
          keyExtractor={(item) => item.code}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable onPress={() => onPick(item.code)} style={s.countryRow}>
              <Text style={[s.countryName, item.code === selected && s.countryOn]}>{item.name}</Text>
              <Text style={s.countryDial}>+{item.dial}</Text>
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}

/** A numbered step. Checkout is a sequence and should read like one. */
function Step({ number, title, note }: { number: number; title: string; note: string }) {
  return (
    <View style={s.step}>
      <View style={s.stepNumber}>
        <Text style={s.stepNumberText}>{number}</Text>
      </View>
      <View style={s.flex}>
        <Text style={s.stepTitle}>{title}</Text>
        <Text style={s.stepNote}>{note}</Text>
      </View>
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  bad,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  bad?: boolean;
  // TextInput has its own `onChange` (an event handler); ours takes the text,
  // so the collision is removed rather than shadowed.
} & Omit<React.ComponentProps<typeof TextInput>, "onChange" | "value">) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        style={[s.input, bad && s.inputBad]}
        placeholderTextColor={theme.muted}
        autoCapitalize="none"
        {...rest}
      />
    </View>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={s.totalRow}>
      <Text style={[s.summaryName, strong && s.strong]}>{label}</Text>
      <Text style={[s.summaryPrice, strong && s.strong]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  confirmMark: { alignItems: "center", marginBottom: 26 },
  attemptMark: { alignItems: "center", marginTop: 18 },
  page: { flex: 1, backgroundColor: theme.bg },
  flex: { flex: 1 },
  top: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.line,
  },
  back: { color: theme.accent, fontSize: 14, fontFamily: fonts.bold, fontWeight: "700" },
  topTitle: { color: theme.ink, fontSize: 11, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase" },
  content: { paddingHorizontal: 18, paddingTop: 16 },
  step: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 30, marginBottom: 16 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: theme.accent, alignItems: "center", justifyContent: "center" },
  stepNumberText: { color: theme.accent, fontSize: 12, fontFamily: fonts.black, fontWeight: "900" },
  stepTitle: { color: theme.ink, fontSize: 16, fontFamily: fonts.black, fontWeight: "900" },
  stepNote: { color: theme.muted, fontSize: 11, marginTop: 3 },
  estimateRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  field: { marginBottom: 12 },
  label: { color: theme.muted, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.1, textTransform: "uppercase", marginBottom: 7 },
  input: {
    height: 50, borderRadius: 14, borderWidth: 1, borderColor: theme.lineStrong,
    paddingHorizontal: 14, color: theme.ink, fontSize: 15, backgroundColor: theme.surface,
  },
  inputBad: { borderColor: theme.poor },
  hint: { color: theme.muted, fontSize: 11, lineHeight: 16, marginTop: 7 },
  hintBad: { color: theme.poor, fontSize: 11, lineHeight: 16, marginTop: 7 },
  select: {
    height: 50, borderRadius: 14, borderWidth: 1, borderColor: theme.lineStrong,
    paddingHorizontal: 14, backgroundColor: theme.surface,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  selectText: { color: theme.ink, fontSize: 15 },
  selectChevron: { color: theme.muted, fontSize: 18, marginTop: -6 },
  phoneRow: { flexDirection: "row", gap: 9 },
  dial: {
    height: 50, minWidth: 78, borderRadius: 14, borderWidth: 1, borderColor: theme.lineStrong,
    paddingHorizontal: 12, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center",
  },
  dialText: { color: theme.ink, fontSize: 15, fontFamily: fonts.bold, fontWeight: "700" },
  row: { flexDirection: "row", gap: 10, alignItems: "flex-end" },
  lookupSlot: { width: 28, height: 50, alignItems: "center", justifyContent: "center" },
  pickerTop: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 18, paddingBottom: 14,
  },
  pickerTitle: { color: theme.ink, fontSize: 17, fontFamily: fonts.black, fontWeight: "900" },
  countryRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 18, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: theme.line,
  },
  countryName: { color: theme.ink, fontSize: 15, flex: 1 },
  addressMeta: { color: theme.muted, fontSize: 11, marginTop: 4 },
  foundRow: {
    flexDirection: "row", alignItems: "center", gap: 10, marginTop: 9,
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 14, borderWidth: 1, borderColor: theme.accent, backgroundColor: theme.accentSoft,
  },
  foundText: { color: theme.accent, fontSize: 12, fontFamily: fonts.black, fontWeight: "800", flex: 1, lineHeight: 17 },
  foundChevron: { color: theme.accent, fontSize: 18 },
  countryOn: { color: theme.accent, fontFamily: fonts.black, fontWeight: "800" },
  countryDial: { color: theme.muted, fontSize: 14 },

  // Two across, so the four common rails read as one block rather than a
  // ragged wrap that changes shape with the label lengths.
  methods: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  method: {
    width: "48.4%", borderRadius: 16, borderWidth: 1, borderColor: theme.lineStrong,
    paddingHorizontal: 14, paddingVertical: 14, backgroundColor: theme.surface, gap: 8,
  },
  methodOn: { borderColor: theme.accent, backgroundColor: theme.accentSoft },
  methodText: { color: theme.ink, fontSize: 14, fontFamily: fonts.black, fontWeight: "800" },
  methodTextOn: { color: theme.accent },
  methodNote: { color: theme.muted, fontSize: 10, lineHeight: 14 },
  sandboxNote: { color: theme.fair, fontSize: 12, lineHeight: 18, marginTop: 12 },
  summaryLine: { flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 9 },
  summaryName: { color: theme.ink2, fontSize: 13, flex: 1 },
  summaryPrice: { color: theme.ink, fontSize: 13, fontFamily: fonts.black, fontWeight: "800" },
  strong: { color: theme.ink, fontSize: 16, fontFamily: fonts.black, fontWeight: "900" },
  subtotal: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderTopWidth: 1, borderTopColor: theme.line, marginTop: 6 },
  finalNote: { color: theme.muted, fontSize: 11, lineHeight: 17, marginTop: 10 },
  error: { color: theme.poor, fontSize: 13, lineHeight: 19, marginTop: 16 },
  suggestions: {
    borderRadius: 14, borderWidth: 1, borderColor: theme.lineStrong,
    backgroundColor: theme.surface, overflow: "hidden", marginTop: -4, marginBottom: 12,
  },
  suggestion: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.line },
  suggestionLine: { color: theme.ink, fontSize: 14, fontFamily: fonts.bold, fontWeight: "700" },
  suggestionMeta: { color: theme.muted, fontSize: 11, marginTop: 3 },
  suggestionNote: { color: theme.muted, fontSize: 11, lineHeight: 16, paddingHorizontal: 14, paddingVertical: 10 },

  savedRow: { gap: 10, paddingBottom: 16 },
  savedCard: {
    width: 160, borderRadius: 16, borderWidth: 1, borderColor: theme.lineStrong,
    backgroundColor: theme.surface, paddingHorizontal: 13, paddingVertical: 12,
  },
  savedOn: { borderColor: theme.accent, backgroundColor: theme.accentSoft },
  savedLabel: { color: theme.muted, fontSize: 9, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.1, textTransform: "uppercase" },
  savedLabelOn: { color: theme.accent },
  savedLine: { color: theme.ink, fontSize: 12, lineHeight: 16, marginTop: 6 },
  savedPostcode: { color: theme.muted, fontSize: 11, marginTop: 4 },

  reviewAddress: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    borderRadius: 16, borderWidth: 1, borderColor: theme.line,
    backgroundColor: theme.surface, padding: 14, marginBottom: 6,
  },
  currencyRow: {
    minHeight: 66, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderRadius: 16, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface,
    paddingHorizontal: 14, marginBottom: 16,
  },
  currencyValue: { color: theme.ink, fontSize: 14, fontFamily: fonts.black, fontWeight: "800", marginTop: 6 },
  reviewLabel: { color: theme.muted, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.2, textTransform: "uppercase" },
  reviewLine: { color: theme.ink, fontSize: 13, lineHeight: 19, marginTop: 7 },
  reviewMissing: { color: theme.poor, fontSize: 13, lineHeight: 19, marginTop: 7 },
  reviewEdit: { color: theme.accent, fontSize: 12, fontFamily: fonts.black, fontWeight: "900" },

  saveToggle: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6, paddingVertical: 8 },
  checkbox: {
    width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: theme.lineStrong,
    alignItems: "center", justifyContent: "center",
  },
  checkboxOn: { backgroundColor: theme.accent, borderColor: theme.accent },
  checkboxTick: { color: "#fff", fontSize: 11, fontFamily: fonts.black, fontWeight: "900" },
  saveToggleText: { color: theme.ink2, fontSize: 13 },

  actionBar: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    paddingHorizontal: 18, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: theme.line, backgroundColor: theme.bg,
  },
  secondary: {
    height: 50, borderRadius: 25, borderWidth: 1, borderColor: theme.lineStrong,
    alignItems: "center", justifyContent: "center", marginTop: 12,
  },
  secondaryText: { color: theme.ink, fontSize: 11, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  primary: { height: 54, borderRadius: 27, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" },
  dim: { opacity: 0.5 },
  primaryText: { color: "#fff", fontSize: 12, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  eyebrow: { color: theme.accent, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 2, textTransform: "uppercase" },
  orderNumber: { color: theme.ink, fontFamily: display, fontSize: 44, marginTop: 8 },
  body: { color: theme.ink2, fontSize: 14, lineHeight: 21, marginTop: 12 },
  totals: { marginTop: 26, borderTopWidth: 1, borderTopColor: theme.line, paddingTop: 14 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
});
