import { useEffect, useRef, useState } from "react";
import {
  Animated, Easing, Image, Pressable, ScrollView, StyleSheet, Text, View,
  useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent,
} from "react-native";
import { useRouter } from "expo-router";
import Svg, { Circle as SvgCircle, Defs, RadialGradient, Stop } from "react-native-svg";
import { AppHeader } from "@/components/AppHeader";
import { Screen } from "@/components/Screen";
import { API_BASE } from "@/api";
import { useAppState, type WearArm } from "@/app-state";
import { useDashboard, useNotifications } from "@/data";
import { duration } from "@/format";
import { display, theme } from "@/theme";

export default function BandScreen() {
  const router = useRouter();
  const { band, wearArm, refresh } = useAppState();
  const notices = useNotifications();
  const dashboard = useDashboard();
  const device = band?.band;
  const colourways = band?.colourways ?? [];

  if (!device) return <Unpaired unread={notices.data?.unread ?? 0} arm={wearArm} onPair={() => router.push("/pair-band" as never)} />;

  const pending = device.id.startsWith("pending-");
  const mine = colourways.find((colour) => colour.id === device.colourway) ?? null;
  const latest = dashboard.data?.latest;
  const lastRow = dashboard.data?.history[0];

  return (
    <Screen
      eyebrow={pending ? "Sync pending" : "Connected"}
      title="V1"
      refreshing={dashboard.refreshing}
      onRefresh={() => {
        refresh();
        dashboard.reload();
      }}
      header={<AppHeader unread={notices.data?.unread ?? 0} />}
    >
      <Hero
        image={mine?.image ?? null}
        label={mine?.label ?? device.colourway}
        accent={mine?.accent ?? theme.accent}
        serial={device.serial}
        battery={pending ? null : device.batteryPercent}
      />

      <View style={s.facts}>
        <Fact label="Firmware" value={device.firmware} />
        <Fact label="Worn on" value={`${wearArm} arm`} />
        <Fact
          label="Last sync"
          value={device.lastSyncAt ? new Date(device.lastSyncAt).toLocaleDateString() : "Waiting"}
        />
      </View>

      <Text style={s.section}>Today from V1</Text>
      {latest ? (
        <View style={s.readings}>
          <Reading value={latest.recovery.value} suffix="%" label="Recovery" colour={theme.good} />
          <Reading value={latest.strain.value} label="Strain" colour={theme.accent} decimals={1} />
          <Reading
            value={lastRow?.sleepMinutes ?? null}
            label="Sleep"
            colour={theme.sleep}
            format={(v) => duration(v)}
          />
        </View>
      ) : (
        <View style={s.waiting}>
          <Text style={s.waitingTitle}>Nothing measured yet</Text>
          <Text style={s.waitingBody}>
            Wear the V1 through a full night and the first recovery score lands with your alarm.
          </Text>
        </View>
      )}

      <Text style={s.section}>Straps</Text>
      <Text style={s.sectionNote}>Swipe through the weaves. Yours is marked — the rest swap in seconds.</Text>
      <StrapCarousel
        colourways={colourways}
        owned={device.colourway}
        onOrder={() => router.push("/product/v1-strap" as never)}
      />

      <Pressable onPress={() => router.push("/product/v1-bicep-strap" as never)} style={s.bicep}>
        <View style={s.flex}>
          <Text style={s.bicepTitle}>Bicep strap</Text>
          <Text style={s.bicepBody}>
            Moves the sensor above the elbow for barbell work, where the arm is still and the trace stays clean.
          </Text>
        </View>
        <Text style={s.bicepArrow}>›</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/pair-band" as never)} style={s.secondary}>
        <Text style={s.secondaryText}>Change V1 or wearing arm</Text>
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
  const size = 250;
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = battery == null ? 0 : Math.max(0, Math.min(100, battery)) / 100;
  const tone = battery == null ? theme.lineStrong : battery <= 15 ? theme.poor : battery <= 35 ? theme.fair : theme.good;

  const breathe = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    Animated.timing(ring, { toValue: 1, duration: 1100, delay: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    return () => loop.stop();
  }, [breathe, ring]);

  const glowScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.06] });
  const glowOpacity = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.85] });
  const haloScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1.04, 0.94] });

  return (
    <View style={s.hero}>
      <View style={s.stage}>
        {/* The lit plate. Two layers so the falloff reads as light rather than a disc. */}
        <Animated.View
          style={[s.halo, { transform: [{ scale: haloScale }], opacity: glowOpacity }]}
        >
          <Svg width={300} height={300}>
            <Defs>
              <RadialGradient id="bandHalo" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={accent} stopOpacity={0.34} />
                <Stop offset="55%" stopColor={accent} stopOpacity={0.10} />
                <Stop offset="100%" stopColor={accent} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <SvgCircle cx={150} cy={150} r={150} fill="url(#bandHalo)" />
          </Svg>
        </Animated.View>

        <Animated.View style={[s.glow, { transform: [{ scale: glowScale }], opacity: glowOpacity }]}>
          <Svg width={210} height={210}>
            <Defs>
              <RadialGradient id="bandGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#ffffff" stopOpacity={0.16} />
                <Stop offset="60%" stopColor={accent} stopOpacity={0.20} />
                <Stop offset="100%" stopColor={accent} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <SvgCircle cx={105} cy={105} r={105} fill="url(#bandGlow)" />
          </Svg>
        </Animated.View>

        <Animated.View style={{ opacity: ring }}>
          <Svg width={size} height={size}>
            <SvgCircle cx={size / 2} cy={size / 2} r={radius} stroke={theme.line} strokeWidth={4} fill="none" />
            <SvgCircle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={tone}
              strokeWidth={4}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={circumference * (1 - filled)}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>
        </Animated.View>

        {image ? (
          <Image source={{ uri: asset(image) }} style={s.heroImage} />
        ) : (
          <View style={s.heroFallback} />
        )}
      </View>

      <Text style={[s.colourway, { color: accent }]}>{label}</Text>
      <Text style={s.serial}>{serial}</Text>
      <View style={s.batteryRow}>
        <View style={[s.batteryDot, { backgroundColor: tone }]} />
        <Text style={s.batteryText}>
          {battery == null
            ? "Battery unknown until it syncs"
            : `${battery}% · about ${Math.max(1, Math.round((battery / 100) * 14))} days left`}
        </Text>
      </View>
    </View>
  );
}

/** The strap library, one card at a time. */
function StrapCarousel({
  colourways,
  owned,
  onOrder,
}: {
  colourways: Array<{ id: string; label: string; note: string | null; accent: string | null; image: string | null }>;
  owned: string;
  onOrder: () => void;
}) {
  const { width } = useWindowDimensions();
  const cardWidth = width - 36;
  const [index, setIndex] = useState(() => Math.max(0, colourways.findIndex((c) => c.id === owned)));

  function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / cardWidth));
  }

  if (colourways.length === 0) return null;

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        contentOffset={{ x: index * cardWidth, y: 0 }}
      >
        {colourways.map((colour) => {
          const isMine = colour.id === owned;
          return (
            <View key={colour.id} style={[s.strap, { width: cardWidth }]}>
              <View style={s.strapImageWrap}>
                {colour.image ? <Image source={{ uri: asset(colour.image) }} style={s.strapImage} /> : null}
              </View>
              <View style={s.strapBody}>
                <View style={s.flex}>
                  <Text style={[s.strapName, colour.accent ? { color: colour.accent } : null]}>{colour.label}</Text>
                  <Text style={s.strapNote}>{isMine ? "The one on your wrist" : (colour.note ?? "Woven strap")}</Text>
                </View>
                {isMine ? (
                  <View style={s.yours}>
                    <Text style={s.yoursText}>Yours</Text>
                  </View>
                ) : (
                  <Pressable onPress={onOrder} style={s.order}>
                    <Text style={s.orderText}>Order</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={s.dots}>
        {colourways.map((colour, i) => (
          <View key={colour.id} style={[s.dot, i === index && s.dotOn]} />
        ))}
      </View>
    </View>
  );
}

function Unpaired({ unread, arm, onPair }: { unread: number; arm: WearArm; onPair: () => void }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);

  return (
    <Screen eyebrow="Terrifit V1" title="Connect" header={<AppHeader unread={unread} />}>
      <View style={s.unpaired}>
        <Animated.View
          style={[s.unpairedGlow, { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.4] }) }]}
        />
        <Image source={{ uri: asset("/media/terrifit-band-new.png") }} style={s.unpairedImage} />
        <Text style={s.unpairedTitle}>Your body, translated.</Text>
        <Text style={s.unpairedBody}>
          Continuous heart rate, sleep staging and strain, on a band with no screen to look at. Pair one and every
          score in the app becomes measured rather than imported.
        </Text>
        <Pressable onPress={onPair} style={s.primary}>
          <Text style={s.primaryText}>Pair your V1</Text>
        </Pressable>
        <Text style={s.unpairedArm}>Set up for your {arm} arm</Text>
      </View>

      <View style={s.features}>
        {[
          ["14+ days", "Battery, not a nightly charge"],
          ["Screenless", "Nothing to check mid-set"],
          ["Waterproof", "Showers, pools, sweat"],
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

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.fact}>
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
  hero: { alignItems: "center", paddingVertical: 26, borderRadius: 28, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, overflow: "hidden" },
  stage: { width: 300, height: 300, alignItems: "center", justifyContent: "center" },
  halo: { position: "absolute" },
  glow: { position: "absolute" },
  heroImage: { position: "absolute", width: 168, height: 168, borderRadius: 26, resizeMode: "contain" },
  heroFallback: { position: "absolute", width: 168, height: 168, borderRadius: 26, backgroundColor: theme.line },
  colourway: { fontFamily: display, fontSize: 30, marginTop: 18, textTransform: "uppercase" },
  serial: { color: theme.muted, fontSize: 11, letterSpacing: 1.4, marginTop: 4 },
  batteryRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 },
  batteryDot: { width: 7, height: 7, borderRadius: 4 },
  batteryText: { color: theme.ink2, fontSize: 12, fontWeight: "700" },
  facts: { flexDirection: "row", marginTop: 14, borderRadius: 20, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface },
  fact: { flex: 1, alignItems: "center", paddingVertical: 15 },
  factValue: { color: theme.ink, fontSize: 13, fontWeight: "800", textTransform: "capitalize" },
  factLabel: { color: theme.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", marginTop: 5 },
  section: { color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase", marginTop: 30, marginBottom: 10 },
  sectionNote: { color: theme.muted, fontSize: 12, lineHeight: 18, marginTop: -4, marginBottom: 14 },
  readings: { flexDirection: "row", gap: 10 },
  reading: { flex: 1, borderRadius: 20, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, padding: 15 },
  readingValue: { fontFamily: display, fontSize: 24 },
  readingBar: { height: 3, borderRadius: 2, width: 26, marginTop: 10 },
  readingLabel: { color: theme.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", marginTop: 9 },
  waiting: { borderRadius: 20, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, padding: 18 },
  waitingTitle: { color: theme.ink, fontSize: 15, fontWeight: "900" },
  waitingBody: { color: theme.ink2, fontSize: 13, lineHeight: 19, marginTop: 7 },
  strap: { paddingRight: 0 },
  strapImageWrap: { height: 190, borderRadius: 24, overflow: "hidden", backgroundColor: "#eceae5", alignItems: "center", justifyContent: "center" },
  strapImage: { width: "84%", height: "84%", resizeMode: "contain" },
  strapBody: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 14 },
  strapName: { color: theme.ink, fontSize: 19, fontWeight: "900" },
  strapNote: { color: theme.muted, fontSize: 12, marginTop: 4 },
  yours: { borderWidth: 1, borderColor: theme.good, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  yoursText: { color: theme.good, fontSize: 10, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  order: { backgroundColor: theme.accent, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10 },
  orderText: { color: "#fff", fontSize: 10, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  dots: { flexDirection: "row", gap: 5, justifyContent: "center", marginTop: 16 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: theme.lineStrong },
  dotOn: { backgroundColor: theme.accent, width: 18 },
  bicep: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 22, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface },
  bicepTitle: { color: theme.ink, fontSize: 15, fontWeight: "900" },
  bicepBody: { color: theme.muted, fontSize: 12, lineHeight: 17, marginTop: 5 },
  bicepArrow: { color: theme.accent, fontSize: 26 },
  secondary: { height: 50, borderRadius: 25, borderWidth: 1, borderColor: theme.lineStrong, alignItems: "center", justifyContent: "center", marginTop: 16 },
  secondaryText: { color: theme.ink2, fontSize: 11, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  unpaired: { alignItems: "center", paddingVertical: 26, borderRadius: 28, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, overflow: "hidden" },
  unpairedGlow: { position: "absolute", top: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: theme.accent },
  unpairedImage: { width: 176, height: 176, borderRadius: 26, resizeMode: "cover" },
  unpairedTitle: { color: theme.ink, fontFamily: display, fontSize: 30, textTransform: "uppercase", marginTop: 20, textAlign: "center" },
  unpairedBody: { color: theme.ink2, fontSize: 13, lineHeight: 20, textAlign: "center", marginTop: 10, paddingHorizontal: 22 },
  primary: { height: 52, borderRadius: 26, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, marginTop: 20 },
  primaryText: { color: "#fff", fontSize: 11, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  unpairedArm: { color: theme.muted, fontSize: 11, marginTop: 12, textTransform: "capitalize" },
  features: { marginTop: 16, borderRadius: 22, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, overflow: "hidden" },
  feature: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderBottomWidth: 1, borderBottomColor: theme.line },
  featureNumber: { color: theme.accent, fontFamily: display, fontSize: 18 },
  featureTitle: { color: theme.ink, fontSize: 14, fontWeight: "900" },
  featureBody: { color: theme.muted, fontSize: 12, marginTop: 3 },
});
