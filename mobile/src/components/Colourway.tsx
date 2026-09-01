import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, Rect, Stop, LinearGradient as SvgGradient } from "react-native-svg";
import { theme } from "@/theme";

/**
 * A colourway chip, drawn the way the web shop draws it.
 *
 * The straps are an interwoven two-tone yarn, so the swatch is a hard-edged
 * diagonal split rather than a blend — a soft gradient would suggest a fade
 * that does not exist on the actual product. Single-colour options fall back to
 * a flat fill, and an option with no colour at all gets the surface tone rather
 * than a black hole.
 */
export function Colourway({ colours, size = 54, selected }: { colours: string[]; size?: number; selected: boolean }) {
  const id = `weave-${colours.join("-") || "none"}`;
  const [first, second] = [colours[0] ?? theme.lineStrong, colours[1] ?? colours[0] ?? theme.lineStrong];

  return (
    <View
      style={[
        s.chip,
        { width: size, height: size, borderRadius: size / 2 },
        selected && { borderColor: theme.accent, borderWidth: 2 },
      ]}
    >
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={first} />
            <Stop offset="48%" stopColor={first} />
            <Stop offset="48%" stopColor={second} />
            <Stop offset="100%" stopColor={second} />
          </SvgGradient>
        </Defs>
        <Rect x={0} y={0} width={size} height={size} rx={size / 2} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

/** The colourway row: swatch, name, and what the weave actually is. */
export function ColourwayPicker({
  variants,
  selectedId,
  onSelect,
  label,
}: {
  variants: Array<{ id: string; label: string; note: string | null; swatchColours: string[]; accent: string | null }>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  label: string;
}) {
  const chosen = variants.find((variant) => variant.id === selectedId) ?? null;

  return (
    <View style={s.wrap}>
      <View style={s.head}>
        <Text style={s.label}>{label}</Text>
        <Text style={[s.chosen, chosen?.accent ? { color: chosen.accent } : null]}>
          {chosen ? chosen.label : "Pick one"}
        </Text>
      </View>

      <View style={s.row}>
        {variants.map((variant) => (
          <Swatch
            key={variant.id}
            variant={variant}
            selected={variant.id === selectedId}
            onSelect={() => onSelect(variant.id)}
          />
        ))}
      </View>

      {chosen?.note ? <Text style={s.note}>{chosen.note}</Text> : null}
    </View>
  );
}

function Swatch({
  variant, selected, onSelect,
}: {
  variant: { id: string; label: string; swatchColours: string[] };
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable onPress={onSelect} accessibilityLabel={variant.label} hitSlop={4} style={s.swatchTap}>
      <Colourway colours={variant.swatchColours} selected={selected} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrap: { marginTop: 4 },
  head: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  label: { color: theme.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.3, textTransform: "uppercase" },
  chosen: { color: theme.ink, fontSize: 14, fontWeight: "800" },
  row: { flexDirection: "row", gap: 12, marginTop: 12 },
  swatchTap: { padding: 2 },
  chip: {
    borderWidth: 1,
    borderColor: theme.lineStrong,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  note: { color: theme.muted, fontSize: 12, lineHeight: 17, marginTop: 11 },
});
