import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/components/AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HealthSync } from "@/components/HealthSync";
import { ModalHeader } from "@/components/ModalHeader";
import { useAppState, } from "@/app-state";
import { useDashboard } from "@/data";
import { healthAvailable } from "@/health";
import { sourceName } from "@/format";
import { fonts, theme } from "@/theme";
import { appScreens } from "@/i18n/app-screens";
import { usePreferences } from "@/preferences";

/**
 * Where your numbers come from.
 *
 * This row used to be on the You page with a chevron and no handler — it
 * looked tappable and did nothing. It now lands here: what is connected, what
 * it has given us, and the one button that connects more.
 */
export default function HealthConnectionsScreen() {
  const copy = appScreens[usePreferences().locale].health;
  const insets = useSafeAreaInsets();
  const { band, refresh } = useAppState();
  const dashboard = useDashboard();

  const sources = dashboard.data?.sources ?? [];
  const days = dashboard.data?.dayCount ?? 0;

  return (
    <View style={s.page}>
      <ModalHeader title={copy.title} />

      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}>
        <Text style={s.lede}>
          Every score in Terrifit is worked out from what these have recorded. Nothing is typed in, and nothing is
          shared with anybody until you say so.
        </Text>

        <Text style={s.section}>{copy.connected}</Text>
        {sources.length === 0 && !band?.band ? (
          <View style={s.card}>
            <Text style={s.cardTitle}>{copy.nothingYet}</Text>
            <Text style={s.cardBody}>
              Connect Apple Health below and the app fills in from what your watch or phone already has.
            </Text>
          </View>
        ) : (
          <>
            {sources.map((source) => (
              <View key={source} style={s.card}>
                <View style={s.dot} />
                <View style={s.flex}>
                  <Text style={s.cardTitle}>{sourceName(source)}</Text>
                  <Text style={s.cardBody}>
                    {days} {days === 1 ? "day" : "days"} of daily metrics on file
                  </Text>
                </View>
              </View>
            ))}

            {band?.band ? (
              <View style={s.card}>
                <View style={s.dot} />
                <View style={s.flex}>
                  <Text style={s.cardTitle}>Terrifit V1</Text>
                  <Text style={s.cardBody}>{band.band.serial}</Text>
                </View>
              </View>
            ) : null}
          </>
        )}

        <Text style={s.section}>{copy.addAnother}</Text>
        {healthAvailable() ? (
          <>
            <Text style={s.cardBody}>
              Terrifit reads heart rate, HRV, resting heart rate, sleep, steps, energy and weight. It never writes
              anything back, and you can revoke access in iOS Settings at any time.
            </Text>
            <View style={s.syncSlot}>
              <HealthSync onDone={refresh} />
            </View>
          </>
        ) : (
          <View style={s.card}>
            <Text style={s.cardTitle}>
              {Platform.OS === "ios" ? copy.unavailable : copy.connectNotWired}
            </Text>
            <Text style={s.cardBody}>
              {Platform.OS === "ios"
                ? copy.unavailableBody
                : copy.connectNotWiredBody}
            </Text>
          </View>
        )}

        <Text style={s.footnote}>
          You can also upload an export from Garmin, Oura, Whoop, Strava, Fitbit or an InBody scan on the website, and
          it lands in the same place.
        </Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bg },
  flex: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 16 },
  lede: { color: theme.ink2, fontSize: 14, lineHeight: 21 },
  section: {
    color: theme.accent, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.5,
    textTransform: "uppercase", marginTop: 28, marginBottom: 12,
  },
  card: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 18, borderWidth: 1, borderColor: theme.line,
    backgroundColor: theme.surface, padding: 16, marginBottom: 10,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.good },
  cardTitle: { color: theme.ink, fontSize: 15, fontFamily: fonts.black, fontWeight: "900" },
  cardBody: { color: theme.ink2, fontSize: 13, lineHeight: 19, marginTop: 5 },
  syncSlot: { marginTop: 16 },
  footnote: { color: theme.muted, fontSize: 12, lineHeight: 18, marginTop: 28 },
});
