import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DailySignal } from "@/components/DailySignal";
import { useDashboard } from "@/data";
import { dayLabel, plural, sourceName } from "@/format";
import { theme } from "@/theme";

/**
 * The daily signal, on demand.
 *
 * Home shows this card inline when you open the app and folds it away after
 * ten seconds. Tapping the mark afterwards brings it back here as a sheet
 * rather than throwing you to the top of the feed — you asked to see your
 * numbers, not to lose your place.
 */
export default function SignalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dashboard = useDashboard();
  const data = dashboard.data;

  return (
    <View style={s.page}>
      <View style={[s.top, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={s.close}>Done</Text>
        </Pressable>
        <Text style={s.topTitle}>{data?.latest ? dayLabel(data.latest.date) : "Signal"}</Text>
        <View style={{ width: 46 }} />
      </View>

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <DailySignal data={data} open />

        {data ? (
          <Text style={s.sources}>
            Built from {plural(data.dayCount, "day")} of data
            {data.sources.length ? ` · ${data.sources.map(sourceName).join(", ")}` : ""}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bg },
  top: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.line,
  },
  close: { color: theme.accent, fontSize: 14, fontWeight: "700", width: 46 },
  topTitle: { color: theme.ink, fontSize: 11, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase" },
  content: { paddingHorizontal: 18, paddingTop: 14 },
  sources: { color: theme.muted, fontSize: 11, textAlign: "center", marginTop: 4 },
});
