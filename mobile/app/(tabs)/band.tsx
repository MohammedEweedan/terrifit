import { useEffect, useRef, useState } from "react";
import { Alert, Animated, Easing, Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/components/AppText";
import { useRouter } from "expo-router";
import { AppHeader } from "@/components/AppHeader";
import { Screen } from "@/components/Screen";
import { API_BASE, setBandColourway, unpairBand } from "@/api";
import { useSession } from "@/session";
import { useAppState, type WearArm } from "@/app-state";
import { useDashboard, useNotifications } from "@/data";
import { duration } from "@/format";
import { fonts, display, theme } from "@/theme";
import { usePreferences } from "@/preferences";
import { screenCopy } from "@/i18n/screens";
import { BandCarousel } from "@/components/BandCarousel";
import { AuroraLine } from "@/components/AuroraLine";
import { CardTitle } from "@/components/CardTitle";
import { Colourway } from "@/components/Colourway";

export default function BandScreen() {
  const copy = screenCopy[usePreferences().locale];
  const router = useRouter();
  const { band, wearArm, refresh } = useAppState();
  const { token } = useSession();
  const notices = useNotifications();
  const dashboard = useDashboard();
  const device = band?.band;
  const colourways = band?.colourways ?? [];

  function forget() {
    if (!device) return;
    Alert.alert(
      "Remove this V1?",
      `${device.serial} stops syncing to this account. Everything it has already recorded stays.`,
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            void unpairBand(token ?? "")
              .then(refresh)
              .catch(() => Alert.alert("Couldn't remove it", "Try again in a moment."));
          },
        },
      ],
    );
  }

  if (!device) return <Unpaired unread={notices.data?.unread ?? 0} arm={wearArm} onPair={() => router.push("/pair-band" as never)} />;

  const pending = device.id.startsWith("pending-");
  const mine = colourways.find((colour) => colour.id === device.colourway) ?? null;
  const latest = dashboard.data?.latest;
  const lastRow = dashboard.data?.history[0];

  return (
    <Screen
      eyebrow={pending ? "Sync pending" : ""}
      title=""
      refreshing={dashboard.refreshing}
      onRefresh={() => {
        refresh();
        dashboard.reload();
      }}
      header={<AppHeader unread={notices.data?.unread ?? 0}/>}
    >
      <Hero
        image={mine?.image ?? null}
        label={mine?.label ?? device.colourway}
        accent={mine?.accent ?? theme.accent}
        serial={device.serial}
        battery={pending ? null : device.batteryPercent}
      />

      <View style={s.facts}>
        <Fact label={copy.firmware} value={device.firmware} />
        <Fact label={copy.wornOn} value={wearArm === "left" ? copy.leftArm : copy.rightArm} divided />
        <Fact
          label={copy.lastSync}
          value={
            device.lastSyncAt
              ? new Date(device.lastSyncAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })
              : copy.awaitingSync
          }
          divided
        />
      </View>

      <Text style={s.section}>{copy.todayFromV1}</Text>
      {latest ? (
        <View style={s.readings}>
          <Reading value={latest.recovery.value} suffix="%" label={copy.recoveryLabel} colour={theme.good} />
          <Reading value={latest.strain.value} label={copy.strainLabel} colour={theme.accent} decimals={1} />
          <Reading
            value={lastRow?.sleepMinutes ?? null}
            label={copy.sleepLabel}
            colour={theme.sleep}
            format={(v) => duration(v)}
          />
        </View>
      ) : (
        <View style={s.waiting}>
          <Text style={s.waitingTitle}>{copy.nothingMeasured}</Text>
          <Text style={s.waitingBody}>{copy.wearFullNight}</Text>
        </View>
      )}

      <CardTitle icon="metrics" title={copy.yourStrap} />
      <Text style={s.sectionNote}>{copy.strapNote}</Text>
      <StrapPicker
        colourways={colourways}
        worn={device.colourway}
        onWear={(id) => {
          void setBandColourway(token, id).then(refresh).catch(() => {});
        }}
        onOrder={() => router.push("/product/v1-strap" as never)}
      />

      <Pressable onPress={() => router.push("/product/v1-bicep-strap" as never)} style={s.bicep}>
        <View style={s.flex}>
          <Text style={s.bicepTitle}>{copy.bicepStrap}</Text>
          <Text style={s.bicepBody}>
            Moves the sensor above the elbow for barbell work, where the arm is still and the trace stays clean.
          </Text>
        </View>
        <Text style={s.bicepArrow}>›</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/pair-band" as never)} style={s.secondary}>
        <Text style={s.secondaryText}>Change V1 or wearing arm</Text>
      </Pressable>

      {/* There was no way to remove a band at all — only to pair another over
          the top of it, which leaves the old one on the account. */}
      <Pressable onPress={forget} style={s.forget}>
        <Text style={s.forgetText}>{copy.removeThisV1}</Text>
      </Pressable>
    </Screen>
  );
}

/**
 * The band itself, in the colourway they actually bought.
 *
 * The product sits on a lit stage rather than straight on the page: a radial
 * plate tinted with the colourway, breathing slowly. That is not decoration —
 * Midnight and Black are near-black products, and on a near-black ground they
 * simply disappear. The plate is what makes every colourway readable, and the
 * pulse is what makes the thing feel alive rather than a catalogue photo.
 *
 * The battery ring wraps the product because on a screenless device the two
 * things you open this page for are "is it charged" and "is it on".
 */
function Hero({
  image,
  label,
  accent,
  serial,
  battery,
}: {
  image: string | null;
  label: string;
  accent: string;
  serial: string;
  battery: number | null;
}) {
  const copy = screenCopy[usePreferences().locale];
  const filled = battery == null ? 0 : Math.max(0, Math.min(100, battery));
  const tone = battery == null ? theme.lineStrong : battery <= 15 ? theme.poor : battery <= 35 ? theme.fair : theme.good;
  // 15 days from full is the V8's rated life with continuous heart rate on; the
  // estimate scales linearly from whatever is left, which is all a percentage
  // can honestly support.
  const daysLeft = battery == null ? null : Math.max(1, Math.round((battery / 100) * 15));

  const meter = useRef(new Animated.Value(0)).current;
  const [meterWidth, setMeterWidth] = useState(0);


  useEffect(() => {
    if (meterWidth === 0) return;
    Animated.timing(meter, {
      toValue: (filled / 100) * meterWidth,
      duration: 900,
      delay: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [meter, filled, meterWidth]);


  return (
    <View style={s.hero}>
      {/* No light behind the product. The band is the subject and a glow behind
          it flattened the strap's own weave into a silhouette. */}
      <View style={s.stage}>
        {image ? (
          <Image source={{ uri: asset(image) }} style={s.heroImage} />
        ) : (
          <View style={s.heroFallback} />
        )}
      </View>

      {/* The light belongs to the colourway name and nothing else: it is the
          one word on this screen that is specific to the band you own, and the
          strap's own accent is what lights it. */}
      <View style={s.nameRow}>
        <View style={s.nameGlow} pointerEvents="none">
          <AuroraLine width={300} height={90} tint={accent} spread={0} count={2} />
        </View>
        <Text style={[s.colourway, { color: accent }]}>{label}</Text>
      </View>
      <Text style={s.serial}>{serial}</Text>

      <View style={s.batteryBlock}>
        <View style={s.batteryHead}>
          <Text style={s.batteryLabel}>{copy.battery}</Text>
          <Text style={[s.batteryValue, { color: tone }]}>
            {battery == null ? "—" : `${battery}%`}
          </Text>
        </View>

        <View style={s.batteryTrack} onLayout={(event) => setMeterWidth(event.nativeEvent.layout.width)}>
          <Animated.View style={[s.batteryFill, { width: meter, backgroundColor: tone }]} />
        </View>

        <Text style={s.batteryDays}>
          {daysLeft == null
            ? copy.unknownUntilSync
            : `${copy.aboutLabel} ${daysLeft} ${daysLeft === 1 ? copy.dayLeftLabel : copy.daysLeftLabel}`}
        </Text>
      </View>
    </View>
  );
}

/**
 * The straps, as swatches.
 *
 * Was a paged carousel of photographs, one at a time — three taps to see four
 * colours, and no way to say which one you had on. A row of woven swatches
 * shows all of them at once and doubles as the control: tapping one tells the
 * app what is on your wrist, and every picture of your V1 follows.
 */
function StrapPicker({
  colourways,
  worn,
  onWear,
  onOrder,
}: {
  colourways: Array<{ id: string; label: string; note: string | null; accent: string | null; swatchColours?: string[]; image: string | null }>;
  worn: string;
  onWear: (id: string) => void;
  onOrder: () => void;
}) {
  const copy = screenCopy[usePreferences().locale];
  const chosen = colourways.find((colour) => colour.id === worn) ?? null;
  if (colourways.length === 0) return null;

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.swatchRow}
      >
        {colourways.map((colour) => {
          const on = colour.id === worn;
          return (
            <Pressable
              key={colour.id}
              onPress={() => onWear(colour.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={colour.label}
              style={s.swatchTap}
            >
              <Colourway colours={colour.swatchColours ?? []} size={54} selected={on} />
              <Text style={[s.swatchLabel, on && colour.accent ? { color: colour.accent } : null]} numberOfLines={1}>
                {colour.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {chosen?.note ? <Text style={s.swatchNote}>{chosen.note}</Text> : null}

      <Pressable onPress={onOrder} style={s.buyStrap}>
        <Text style={s.buyStrapText}>{copy.buyAnotherStrap}</Text>
        <Text style={s.buyStrapArrow}>›</Text>
      </Pressable>
    </View>
  );
}

function Unpaired({ unread, arm, onPair }: { unread: number; arm: WearArm; onPair: () => void }) {
  const copy = screenCopy[usePreferences().locale];
  return (
    <Screen eyebrow="Terrifit V1" title="Connect" header={<AppHeader unread={unread} />}>
      <View style={s.unpaired}>
        <BandCarousel size={340} asset={asset} />
        <Text style={s.unpairedTitle}>{copy.bodyTranslated}</Text>
        <Text style={s.unpairedBody}>
          Continuous heart rate, sleep staging and strain, on a band with no screen to look at. Pair one and every
          score in the app becomes measured rather than imported.
        </Text>
        <Pressable onPress={onPair} style={s.primary}>
          <Text style={s.primaryText}>{copy.pairYourV1}</Text>
        </Pressable>
        <Text style={s.unpairedArm}>Set up for your {arm} arm</Text>
      </View>

      <View style={s.features}>
        {[
          ["15 days", "Battery, not a nightly charge"],
          ["Screenless", "Nothing to check mid-set"],
          ["ECG + PPG", "Heart rhythm recording, not a diagnosis"],
          ["Automatic", "No session to start"],
        ].map(([title, body], index) => (
          <View key={title} style={s.feature}>
            <Text style={s.featureNumber}>0{index + 1}</Text>
            <View style={s.flex}>
              <Text style={s.featureTitle}>{title}</Text>
              <Text style={s.featureBody}>{body}</Text>
            </View>
          </View>
        ))}
      </View>
    </Screen>
  );
}

function Fact({ label, value, divided }: { label: string; value: string; divided?: boolean }) {
  // A hairline between cells rather than three floating columns.
  return (
    <View style={[s.fact, divided && s.factDivider]}>
      <Text style={s.factValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={s.factLabel}>{label}</Text>
    </View>
  );
}

function Reading({
  value,
  label,
  colour,
  suffix = "",
  decimals = 0,
  format,
}: {
  value: number | null;
  label: string;
  colour: string;
  suffix?: string;
  decimals?: number;
  format?: (value: number) => string;
}) {
  return (
    <View style={s.reading}>
      <Text style={[s.readingValue, { color: value == null ? theme.muted : theme.ink }]}>
        {value == null ? "—" : format ? format(value) : `${value.toFixed(decimals)}${suffix}`}
      </Text>
      <View style={[s.readingBar, { backgroundColor: colour }]} />
      <Text style={s.readingLabel}>{label}</Text>
    </View>
  );
}

function asset(path: string): string {
  return /^https?:|^data:/.test(path) ? path : `${API_BASE}${path}`;
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  hero: { alignItems: "center", paddingBottom: 22, marginTop: -18 },
  stage: { width: 320, height: 268, alignItems: "center", justifyContent: "center" },
  batteryBlock: { alignSelf: "stretch", marginTop: 22 },
  batteryHead: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 9 },
  batteryLabel: { color: theme.muted, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.4, textTransform: "uppercase" },
  batteryValue: { fontSize: 22, fontFamily: fonts.black, fontWeight: "900", letterSpacing: -0.6 },
  batteryTrack: { height: 8, borderRadius: 4, backgroundColor: theme.line, overflow: "hidden" },
  batteryFill: { height: 8, borderRadius: 4 },
  batteryDays: { color: theme.ink2, fontSize: 12, marginTop: 9 },
  // Sits low: the light belongs behind the colourway name, not the band.
  nameRow: { alignItems: "center", justifyContent: "center", overflow: "visible" },
  nameGlow: { position: "absolute", alignItems: "center", justifyContent: "center" },
  heroImage: { position: "absolute", width: 232, height: 232, borderRadius: 26, resizeMode: "contain" },
  heroFallback: { position: "absolute", width: 232, height: 232, borderRadius: 26, backgroundColor: theme.line },
  colourway: { fontFamily: display, fontSize: 30, marginTop: 6, textTransform: "uppercase" },
  serial: { color: theme.muted, fontSize: 11, letterSpacing: 1.4, marginTop: 4 },
  swatchRow: { gap: 12, paddingHorizontal: 2, paddingVertical: 4, marginBottom: 4 },
  swatchTap: { alignItems: "center", width: 62 },
  swatchLabel: { color: theme.ink2, fontSize: 11, fontFamily: fonts.black, fontWeight: "800", marginTop: 9 },
  swatchNote: { color: theme.muted, fontSize: 12, lineHeight: 17, textAlign: "center", marginTop: 10 },
  buyStrap: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    height: 48, borderRadius: 24, borderWidth: 1, borderColor: theme.lineStrong, marginTop: 18,
  },
  buyStrapText: { color: theme.ink, fontSize: 11, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  buyStrapArrow: { color: theme.accent, fontSize: 17 },
  factDivider: { borderLeftWidth: 1, borderLeftColor: theme.line },
  facts: { flexDirection: "row", marginTop: 14, borderRadius: 20, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface },
  fact: { flex: 1, alignItems: "center", paddingVertical: 15 },
  factValue: { color: theme.ink, fontSize: 13, fontFamily: fonts.black, fontWeight: "800", textTransform: "capitalize" },
  factLabel: { color: theme.muted, fontSize: 10, fontFamily: fonts.black, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", marginTop: 5 },
  section: { color: theme.accent, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase", marginTop: 30, marginBottom: 10 },
  sectionNote: { color: theme.muted, fontSize: 12, lineHeight: 18, marginTop: -4, marginBottom: 14 },
  readings: { flexDirection: "row", gap: 10 },
  reading: { flex: 1, borderRadius: 20, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, padding: 15 },
  readingValue: { fontFamily: display, fontSize: 24 },
  readingBar: { height: 3, borderRadius: 2, width: 26, marginTop: 10 },
  readingLabel: { color: theme.muted, fontSize: 10, fontFamily: fonts.black, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", marginTop: 9 },
  waiting: { borderRadius: 20, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, padding: 18 },
  waitingTitle: { color: theme.ink, fontSize: 15, fontFamily: fonts.black, fontWeight: "900" },
  waitingBody: { color: theme.ink2, fontSize: 13, lineHeight: 19, marginTop: 7 },
  strap: { paddingRight: 0 },
  strapImageWrap: { height: 190, borderRadius: 24, overflow: "hidden", backgroundColor: "#eceae5", alignItems: "center", justifyContent: "center" },
  strapImage: { width: "84%", height: "84%", resizeMode: "contain" },
  strapBody: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 14 },
  strapName: { color: theme.ink, fontSize: 19, fontFamily: fonts.black, fontWeight: "900" },
  strapNote: { color: theme.muted, fontSize: 12, marginTop: 4 },
  yours: { borderWidth: 1, borderColor: theme.good, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  yoursText: { color: theme.good, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  order: { backgroundColor: theme.accent, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10 },
  orderText: { color: "#fff", fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  dots: { flexDirection: "row", gap: 5, justifyContent: "center", marginTop: 16 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: theme.lineStrong },
  dotOn: { backgroundColor: theme.accent, width: 18 },
  bicep: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 22, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface },
  bicepTitle: { color: theme.ink, fontSize: 15, fontFamily: fonts.black, fontWeight: "900" },
  bicepBody: { color: theme.muted, fontSize: 12, lineHeight: 17, marginTop: 5 },
  bicepArrow: { color: theme.accent, fontSize: 26 },
  secondary: { height: 50, borderRadius: 25, borderWidth: 1, borderColor: theme.lineStrong, alignItems: "center", justifyContent: "center", marginTop: 16 },
  forget: { alignItems: "center", paddingVertical: 18, marginTop: 4 },
  forgetText: { color: theme.poor, fontSize: 11, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  secondaryText: { color: theme.ink2, fontSize: 11, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  unpaired: { alignItems: "center", paddingTop: 8, paddingBottom: 26 },
  unpairedTitle: { color: theme.ink, fontFamily: display, fontSize: 30, textTransform: "uppercase", marginTop: 20, textAlign: "center" },
  unpairedBody: { color: theme.ink2, fontSize: 13, lineHeight: 20, textAlign: "center", marginTop: 10, paddingHorizontal: 22 },
  primary: { height: 52, borderRadius: 26, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, marginTop: 20 },
  primaryText: { color: "#fff", fontSize: 11, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  unpairedArm: { color: theme.muted, fontSize: 11, marginTop: 12, textTransform: "capitalize" },
  features: { marginTop: 16, borderRadius: 22, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, overflow: "hidden" },
  feature: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderBottomWidth: 1, borderBottomColor: theme.line },
  featureNumber: { color: theme.accent, fontFamily: display, fontSize: 18 },
  featureTitle: { color: theme.ink, fontSize: 14, fontFamily: fonts.black, fontWeight: "900" },
  featureBody: { color: theme.muted, fontSize: 12, marginTop: 3 },
});
