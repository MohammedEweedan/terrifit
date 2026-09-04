import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/components/AppText";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cancelPro, startTrial, subscribePro } from "@/api";
import { useAppState } from "@/app-state";
import { ProBadge } from "@/components/ProBadge";
import { ProCelebration } from "@/components/ProCelebration";
import { TerrifitMark } from "@/components/TerrifitMark";
import { usePlan } from "@/data";
import { useSession } from "@/session";
import { useStripeSheet } from "@/stripe-safe";
import { fonts, display, theme } from "@/theme";
import { ModalHeader } from "@/components/ModalHeader";
import { usePreferences } from "@/preferences";
import { proCopy, type ProCopy } from "@/i18n/pro";
import { TerrifitSpinner } from "@/components/TerrifitSpinner";

const featuresFor = (copy: ProCopy) => [
  [copy.sleepQuality, copy.sleepQualityBody],
  [copy.load, copy.loadBody],
  [copy.bodyBattery, copy.bodyBatteryBody],
  [copy.insights, copy.insightsBody],
  [copy.fullHistory, copy.fullHistoryBody],
] as const;

export default function ProScreen() {
  const copy = proCopy[usePreferences().locale];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useSession();
  const { refresh } = useAppState();
  const plan = usePlan();
  const { available: stripeReady, initPaymentSheet, presentPaymentSheet } = useStripeSheet();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [celebrating, setCelebrating] = useState<null | { yearly: boolean }>(null);

  const info = plan.data;

  async function begin() {
    if (!token || busy) return;
    setBusy(true);
    const next = await startTrial(token).catch(() => null);
    setBusy(false);
    if (next) {
      plan.set(next);
      refresh();
      setCelebrating({ yearly: false });
    }
  }

  async function pay(interval: "monthly" | "yearly") {
    if (!token || busy) return;
    setBusy(true);
    setError("");

    try {
      const next = await subscribePro(token, interval);

      // Either no Stripe keys on this environment, or no native sheet in this
      // build. Both mean nothing can be charged here, and the screen says so.
      if (!next.sheet?.clientSecret || !stripeReady) {
        plan.set(next);
        refresh();
        setCelebrating({ yearly: interval === "yearly" });
        return;
      }

      const init = await initPaymentSheet({
        merchantDisplayName: "Terrifit",
        customerId: next.sheet.customerId,
        customerEphemeralKeySecret: next.sheet.ephemeralKey,
        paymentIntentClientSecret: next.sheet.clientSecret,
        allowsDelayedPaymentMethods: false,
      });
      if (init.error) {
        setError(copy.sheetFailed);
        return;
      }

      const presented = await presentPaymentSheet();
      if (presented.error) {
        if (presented.error.code !== "Canceled") {
          setError(presented.error.message || copy.paymentFailed);
        }
        return;
      }

      // Stripe's webhook is what actually grants Pro, and it usually lands
      // within a second or two. Refreshing picks it up; the celebration is the
      // few seconds of cover that takes.
      refresh();
      plan.reload();
      setCelebrating({ yearly: interval === "yearly" });
    } catch {
      setError(copy.subscribeFailed);
    } finally {
      setBusy(false);
    }
  }

  async function stop() {
    if (!token || busy) return;
    setBusy(true);
    const next = await cancelPro(token).catch(() => null);
    setBusy(false);
    if (next) {
      plan.set(next);
      refresh();
    }
  }

  return (
    <View style={s.page}>
      <ModalHeader title={copy.title} />

      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}>
        {plan.loading && !info ? <TerrifitSpinner style={{ marginTop: 50 }} /> : null}

        {info ? (
          <>
            <View style={s.lockup}>
              <TerrifitMark size={38} />
              <Text style={s.wordmark}>TERRIFIT</Text>
              <ProBadge size="wordmark" />
            </View>

            {info.trialExpired ? (
              <View style={s.notice}>
                <Text style={s.noticeTitle}>Your trial has finished</Text>
                <Text style={s.noticeBody}>
                  You kept everything you logged. Pick a plan to carry on with the derived metrics, or stay free — the
                  daily scores are yours either way.
                </Text>
              </View>
            ) : null}

            {info.plan === "trial" && !info.trialExpired ? (
              <View style={[s.notice, s.noticeGood]}>
                <Text style={s.noticeTitle}>
                  {info.trialDaysLeft} {info.trialDaysLeft === 1 ? "day" : "days"} left on your trial
                </Text>
                <Text style={s.noticeBody}>
                  Everything is unlocked. We&apos;ll ask before taking a penny — nothing renews on its own.
                </Text>
              </View>
            ) : null}

            <Text style={s.section}>What Pro adds</Text>
            {featuresFor(copy).map(([title, body]) => (
              <View key={title} style={s.feature}>
                <Text style={s.tick}>✓</Text>
                <View style={s.flex}>
                  <Text style={s.featureTitle}>{title}</Text>
                  <Text style={s.featureBody}>{body}</Text>
                </View>
              </View>
            ))}

            <Text style={s.freeNote}>
              Recovery, sleep, strain, movement and your fitness age stay free, always. Pro is the analysis on top.
            </Text>

            {info.plan === "pro" ? (
              <>
                <View style={s.active}>
                  <Text style={s.activeTitle}>You&apos;re Pro</Text>
                  <Text style={s.activeBody}>
                    {info.interval === "yearly" ? copy.yearlyPlan : copy.monthlyPlan}
                    {info.trialEndsAt ? "" : ""}
                  </Text>
                </View>
                <Pressable onPress={() => void stop()} disabled={busy} style={s.secondary}>
                  <Text style={s.secondaryText}>{busy ? "…" : copy.cancelPro}</Text>
                </Pressable>
              </>
            ) : info.trialAvailable ? (
              <>
                <Pressable onPress={() => void begin()} disabled={busy} style={[s.primary, busy && s.dim]}>
                  <Text style={s.primaryText}>{busy ? copy.starting : copy.startTrial.replace("{days}", String(info.trialDays))}</Text>
                </Pressable>
                <Text style={s.trialNote}>
                  No card needed to start. We ask at the end of the {info.trialDays} days, and take nothing before you
                  say yes.
                </Text>
              </>
            ) : (
              <>
                <Pressable onPress={() => void pay("yearly")} disabled={busy} style={[s.plan, s.planFeatured]}>
                  <View style={s.flex}>
                    <Text style={s.planName}>Yearly</Text>
                    <Text style={s.planPrice}>{info.pricing.yearly.label}</Text>
                    <Text style={s.planGift}>
                      {copy.twoMonthsFree}. {copy.samplesNote}</Text>
                  </View>
                </Pressable>

                <Pressable onPress={() => void pay("monthly")} disabled={busy} style={s.plan}>
                  <View style={s.flex}>
                    <Text style={s.planName}>Monthly</Text>
                    <Text style={s.planPrice}>{info.pricing.monthly.label}</Text>
                    <Text style={s.planGift}>Cancel any time, from this screen.</Text>
                  </View>
                </Pressable>
              </>
            )}
          </>
        ) : null}
        {error ? <Text style={s.payError}>{error}</Text> : null}
      </ScrollView>

      <ProCelebration
        visible={celebrating !== null}
        yearly={celebrating?.yearly ?? false}
        onDone={() => {
          setCelebrating(null);
          router.back();
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bg },
  flex: { flex: 1 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.line },
  close: { color: theme.accent, fontSize: 14, fontFamily: fonts.bold, fontWeight: "700", width: 46 },
  topTitle: { color: theme.ink, fontSize: 11, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase" },
  content: { paddingHorizontal: 20, paddingTop: 26 },
  lockup: { alignItems: "center", marginBottom: 28 },
  wordmark: { color: theme.ink, fontSize: 22, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 4, marginTop: 12 },
  notice: { padding: 16, borderRadius: 18, borderWidth: 1, borderColor: theme.fair, backgroundColor: "rgba(232,178,60,0.08)", marginBottom: 22 },
  noticeGood: { borderColor: theme.good, backgroundColor: "rgba(69,201,138,0.08)" },
  noticeTitle: { color: theme.ink, fontSize: 15, fontFamily: fonts.black, fontWeight: "900" },
  noticeBody: { color: theme.ink2, fontSize: 13, lineHeight: 19, marginTop: 7 },
  section: { color: theme.accent, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16 },
  feature: { flexDirection: "row", gap: 13, marginBottom: 16 },
  tick: { color: theme.good, fontSize: 14, fontFamily: fonts.black, fontWeight: "900", width: 18 },
  featureTitle: { color: theme.ink, fontSize: 15, fontFamily: fonts.black, fontWeight: "900" },
  featureBody: { color: theme.ink2, fontSize: 12, lineHeight: 18, marginTop: 4 },
  freeNote: { color: theme.muted, fontSize: 12, lineHeight: 18, marginTop: 6, marginBottom: 26 },
  plan: { flexDirection: "row", padding: 18, borderRadius: 20, borderWidth: 1, borderColor: theme.lineStrong, backgroundColor: theme.surface, marginBottom: 12 },
  planFeatured: { borderColor: theme.accent, backgroundColor: theme.accentSoft },
  planName: { color: theme.ink, fontSize: 17, fontFamily: fonts.black, fontWeight: "900" },
  payError: { color: theme.poor, fontSize: 13, lineHeight: 19, marginTop: 18, textAlign: "center" },
  planPrice: { color: theme.accent, fontFamily: display, fontSize: 26, marginTop: 4 },
  planGift: { color: theme.ink2, fontSize: 12, lineHeight: 18, marginTop: 8 },
  primary: { height: 56, borderRadius: 28, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" },
  dim: { opacity: 0.5 },
  primaryText: { color: "#fff", fontSize: 12, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  trialNote: { color: theme.muted, fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 14 },
  secondary: { height: 50, borderRadius: 25, borderWidth: 1, borderColor: theme.lineStrong, alignItems: "center", justifyContent: "center", marginTop: 14 },
  secondaryText: { color: theme.ink2, fontSize: 11, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  active: { padding: 18, borderRadius: 20, borderWidth: 1, borderColor: theme.accent, backgroundColor: theme.accentSoft },
  activeTitle: { color: theme.accent, fontFamily: display, fontSize: 24, textTransform: "uppercase" },
  activeBody: { color: theme.ink2, fontSize: 13, marginTop: 6 },
});
