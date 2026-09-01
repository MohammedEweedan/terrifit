import { useState } from "react";
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from "react-native";
import { bandColour, display, theme } from "@/theme";
import type { Score } from "@/api";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const BAND_WORD: Record<Score["band"], string> = {
  good: "Good",
  fair: "Fair",
  poor: "Low",
  unknown: "No data",
};

type Props = {
  title: string;
  score: Score;
  suffix?: string;
  blurb: string;
  /** Strain runs 0–21, everything else 0–100. The bar needs to know. */
  max?: number;
};

/**
 * A score, and — the whole point — the arithmetic behind it.
 *
 * Every other wearable hands you a number and asks you to trust it. Tapping a
 * card here opens the exact inputs: each reading, the baseline it was measured
 * against, the sub-score it earned and the share of the total it carried —
 * plus whatever the day was missing.
 */
export function ScoreCard({ title, score, suffix = "", blurb, max = 100 }: Props) {
  const [open, setOpen] = useState(false);
  const colour = bandColour(score.band);
  const fill = score.value == null ? 0 : Math.max(0, Math.min(100, (score.value / max) * 100));

  return (
    <Pressable
      style={s.card}
      onPress={() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setOpen((was) => !was);
      }}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${score.value == null ? "no data" : Math.round(score.value)}. Tap for the breakdown.`}
    >
      <View style={s.head}>
        <View style={s.flex}>
          <Text style={s.title}>{title}</Text>
          <Text style={s.blurb}>{blurb}</Text>
        </View>
        <View style={s.readout}>
          <Text style={[s.value, { color: score.value == null ? theme.muted : theme.ink }]}>
            {score.value == null ? "—" : score.value}
            {score.value == null ? "" : <Text style={s.suffix}>{suffix}</Text>}
          </Text>
          <View style={[s.pill, { borderColor: colour }]}>
            <View style={[s.dot, { backgroundColor: colour }]} />
            <Text style={[s.pillText, { color: colour }]}>{BAND_WORD[score.band]}</Text>
          </View>
        </View>
      </View>

      <View style={s.track}>
        <View
          style={[
            s.trackFill,
            { width: `${fill}%`, backgroundColor: colour },
          ]}
        />
      </View>

      {open ? (
        <View style={s.detail}>
          <Text style={s.detailHead}>Why this number</Text>
          {score.inputs.length === 0 ? (
            <Text style={s.empty}>Nothing came in for this day.</Text>
          ) : (
            score.inputs.map((input) => (
              <View key={input.label} style={s.row}>
                <View style={s.flex}>
                  <Text style={s.rowLabel}>{input.label}</Text>
                  <Text style={s.rowMeta}>
                    {input.value}
                    {input.baseline ? `   vs ${input.baseline}` : ""}
                  </Text>
                  <View style={s.sub}>
                    <View
                      style={[
                        s.subFill,
                        { width: `${Math.max(0, Math.min(100, input.contribution))}%`, backgroundColor: colour },
                      ]}
                    />
                  </View>
                </View>
                <View style={s.rowRight}>
                  <Text style={s.rowScore}>{Math.round(input.contribution)}</Text>
                  <Text style={s.rowWeight}>
                    {input.weight > 0 ? `${Math.round(input.weight * 100)}% of the score` : "not counted"}
                  </Text>
                </View>
              </View>
            ))
          )}

          {score.missing.length > 0 ? (
            <Text style={s.missing}>
              Not counted: {score.missing.join(", ")}. The remaining inputs were re-weighted to fill the gap.
            </Text>
          ) : null}
        </View>
      ) : (
        <Text style={s.hint}>
          {score.value == null ? "Not enough data to score this one" : "Tap to see the maths"}
        </Text>
      )}

      {/* The caveat stays visible whether or not the breakdown is open — it is
          the honest limit of the number, not a footnote to the arithmetic. */}
      {score.caveat ? <Text style={s.caveat}>{score.caveat}</Text> : null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line,
    borderRadius: 4, padding: 18, marginBottom: 12,
  },
  flex: { flex: 1 },
  head: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  title: { color: theme.ink, fontSize: 13, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase" },
  blurb: { color: theme.ink2, fontSize: 13, lineHeight: 19, marginTop: 6 },
  readout: { alignItems: "flex-end" },
  value: { fontFamily: display, fontSize: 38, includeFontPadding: false },
  suffix: { fontSize: 15, color: theme.ink2 },
  pill: {
    flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6,
    borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3,
  },
  dot: { width: 5, height: 5, borderRadius: 999 },
  pillText: { fontSize:10, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" },
  track: { height: 3, backgroundColor: theme.line, borderRadius: 999, marginTop: 16, overflow: "hidden" },
  trackFill: { height: 3, borderRadius: 999 },
  hint: { color: theme.muted, fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", marginTop: 14, fontWeight: "700" },
  detail: { marginTop: 16, borderTopWidth: 1, borderTopColor: theme.line, paddingTop: 14 },
  detailHead: { color: theme.accent, fontSize: 10, fontWeight: "800", letterSpacing: 1.6, textTransform: "uppercase", marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.line },
  rowLabel: { color: theme.ink, fontSize: 13, fontWeight: "600" },
  rowMeta: { color: theme.ink2, fontSize: 12, marginTop: 3 },
  rowRight: { alignItems: "flex-end", width: 104 },
  rowScore: { color: theme.ink, fontSize: 17, fontWeight: "800", fontVariant: ["tabular-nums"] },
  rowWeight: { color: theme.muted, fontSize: 10, marginTop: 3, textAlign: "right" },
  sub: { height: 3, backgroundColor: theme.line, borderRadius: 999, marginTop: 8, overflow: "hidden" },
  subFill: { height: 3, borderRadius: 999 },
  missing: { color: theme.ink2, fontSize: 12, lineHeight: 18, marginTop: 12 },
  caveat: { color: theme.muted, fontSize: 11, lineHeight: 17, marginTop: 10, fontStyle: "italic" },
  empty: { color: theme.ink2, fontSize: 13 },
});
