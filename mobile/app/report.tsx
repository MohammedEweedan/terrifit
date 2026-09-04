import { useCallback, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, Share, StyleSheet, View } from "react-native";
import { Text } from "@/components/AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getReport, getReportLink, reportCsvUrl, type HealthReport } from "@/api";
import { ModalHeader } from "@/components/ModalHeader";
import { TerrifitSpinner } from "@/components/TerrifitSpinner";
import { useSession } from "@/session";
import { usePreferences } from "@/preferences";
import { fonts, display, theme } from "@/theme";

/** What can go in a report, in the order it reads. */
const SECTIONS = [
  { id: "summary", label: "Summary" },
  { id: "fitnessAge", label: "Fitness age" },
  { id: "recovery", label: "Recovery" },
  { id: "sleep", label: "Sleep" },
  { id: "activity", label: "Activity" },
  { id: "body", label: "Body" },
  { id: "insights", label: "Insights" },
] as const;

const RANGES = [
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 365, label: "A year" },
] as const;

/**
 * Your data, as something you can keep.
 *
 * Everything is built on the server from the same function the dashboard draws
 * from, so a report and the screen it came from can never quote different
 * numbers. Pick the whole thing or one section — somebody taking sleep to a GP
 * does not need their step count in it.
 */
export default function ReportScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useSession();
  const { t } = usePreferences();

  const [days, setDays] = useState<number>(90);
  const [chosen, setChosen] = useState<string[]>(SECTIONS.map((section) => section.id));
  const [report, setReport] = useState<HealthReport | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setBusy(true);
    void getReport(token, { days, sections: chosen })
      .then(setReport)
      .catch(() => setReport(null))
      .finally(() => setBusy(false));
  }, [token, days, chosen]);

  // Built on first render and whenever the shape changes, so the preview is
  // always the report the buttons below would produce.
  const [signature, setSignature] = useState("");
  const next = `${days}:${chosen.join(",")}`;
  if (signature !== next) {
    setSignature(next);
    load();
  }

  function toggle(id: string) {
    setChosen((current) =>
      current.includes(id)
        ? current.length > 1 ? current.filter((item) => item !== id) : current
        : [...current, id],
    );
  }

  async function print() {
    try {
      const link = await getReportLink(token, { days, sections: chosen });
      await Linking.openURL(link.url);
    } catch {
      Alert.alert("Couldn't open it", "Try again in a moment.");
    }
  }

  async function shareCsv() {
    try {
      await Share.share({
        message: reportCsvUrl(days),
        title: `Terrifit data, ${days} days`,
      });
    } catch {
      // Cancelling the share sheet is not an error worth a dialogue.
    }
  }

  return (
    <View style={s.page}>
      <ModalHeader title={t("report")} />

      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 140 }]}>
        <Text style={s.lede}>{t("reportLede")}</Text>

        <Text style={s.section}>{t("period")}</Text>
        <View style={s.row}>
          {RANGES.map((range) => (
            <Pressable
              key={range.days}
              onPress={() => setDays(range.days)}
              style={[s.chip, days === range.days && s.chipOn]}
            >
              <Text style={[s.chipText, days === range.days && s.chipTextOn]}>{range.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={s.section}>{t("include")}</Text>
        <View style={s.wrapRow}>
          {SECTIONS.map((item) => {
            const on = chosen.includes(item.id);
            return (
              <Pressable key={item.id} onPress={() => toggle(item.id)} style={[s.chip, on && s.chipOn]}>
                <Text style={[s.chipText, on && s.chipTextOn]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={s.section}>{t("preview")}</Text>
        {busy && !report ? (
          <TerrifitSpinner style={{ alignSelf: "center", marginVertical: 30 }} />
        ) : report ? (
          <View style={s.preview}>
            <Text style={s.previewPeriod}>{report.period}</Text>
            {report.blocks.map((block) => (
              <View key={block.id} style={s.block}>
                <Text style={s.blockTitle}>{block.title}</Text>
                {block.rows.map(([label, value]) => (
                  <View key={label} style={s.line}>
                    <Text style={s.lineLabel} numberOfLines={2}>{label}</Text>
                    <Text style={s.lineValue}>{value}</Text>
                  </View>
                ))}
                {block.note ? <Text style={s.blockNote}>{block.note}</Text> : null}
              </View>
            ))}
          </View>
        ) : (
          <Text style={s.empty}>{t("reportEmpty")}</Text>
        )}
      </ScrollView>

      <View style={[s.actions, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <Pressable onPress={() => void print()} style={s.primary}>
          <Text style={s.primaryText}>{t("printReport")}</Text>
        </Pressable>
        <Pressable onPress={() => void shareCsv()} style={s.secondary}>
          <Text style={s.secondaryText}>{t("exportCsv")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bg },
  content: { paddingHorizontal: 18, paddingTop: 16 },
  lede: { color: theme.ink2, fontSize: 14, lineHeight: 21 },
  section: {
    color: theme.accent, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.5,
    textTransform: "uppercase", marginTop: 26, marginBottom: 12,
  },
  row: { flexDirection: "row", gap: 9 },
  wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  chip: {
    borderRadius: 16, borderWidth: 1, borderColor: theme.lineStrong,
    backgroundColor: theme.surface, paddingHorizontal: 14, paddingVertical: 10,
  },
  chipOn: { borderColor: theme.accent, backgroundColor: theme.accentSoft },
  chipText: { color: theme.ink2, fontSize: 12, fontFamily: fonts.black, fontWeight: "800" },
  chipTextOn: { color: theme.accent },

  preview: {
    borderRadius: 20, borderWidth: 1, borderColor: theme.line,
    backgroundColor: theme.surface, padding: 18,
  },
  previewPeriod: { color: theme.muted, fontSize: 11, marginBottom: 14 },
  block: { marginBottom: 20 },
  blockTitle: {
    color: theme.ink, fontFamily: display, fontSize: 18,
    textTransform: "uppercase", marginBottom: 8,
  },
  line: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "baseline",
    gap: 14, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: theme.line,
  },
  lineLabel: { color: theme.ink2, fontSize: 12, flex: 1 },
  lineValue: { color: theme.ink, fontSize: 13, fontFamily: fonts.black, fontWeight: "800" },
  blockNote: { color: theme.muted, fontSize: 11, lineHeight: 16, marginTop: 9 },
  empty: { color: theme.muted, fontSize: 13, textAlign: "center", paddingVertical: 30 },

  actions: {
    position: "absolute", left: 0, right: 0, bottom: 0, gap: 10,
    paddingHorizontal: 18, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: theme.line, backgroundColor: theme.bg,
  },
  primary: { height: 52, borderRadius: 26, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" },
  primaryText: { color: "#fff", fontSize: 11, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  secondary: {
    height: 48, borderRadius: 24, borderWidth: 1, borderColor: theme.lineStrong,
    alignItems: "center", justifyContent: "center",
  },
  secondaryText: { color: theme.ink, fontSize: 11, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
});
