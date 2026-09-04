import { useId } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/AppText";
import Svg, { Defs, Rect, Stop, LinearGradient as SvgGradient } from "react-native-svg";
import { fonts, theme } from "@/theme";

/**
 * A colourway chip, drawn the way the web shop draws it.
 *
 * The straps are an interwoven two-tone yarn, so the swatch is a hard-edged
 * alternating diagonal stripe rather than a blend — the same repeating weave
 * shown on the website. Single-colour options fall back to a flat fill, and an
 * option with no colour at all gets the surface tone rather than a black hole.
 */
export function Colourway({ colours, size = 54, selected }: { colours: string[]; size?: number; selected: boolean }) {
  const id = `weave-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [first, second] = [colours[0] ?? theme.lineStrong, colours[1] ?? colours[0] ?? theme.lineStrong];
  // The web gradient changes yarn every 3 px. A diagonal is longer than the
  // circle's width, so use its hypotenuse to keep the stripe density the same.
  const stripeCount = Math.max(2, Math.ceil((Math.SQRT2 * size) / 3));
  const stops = Array.from({ length: stripeCount }, (_, index) => {
    const start = index / stripeCount;
    const end = (index + 1) / stripeCount;
    const colour = index % 2 === 0 ? first : second;
    return [
      <Stop key={`${index}-start`} offset={start} stopColor={colour} />,
      <Stop key={`${index}-end`} offset={end} stopColor={colour} />,
    ];
  }).flat();

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
          <SvgGradient id={id} x1="0%" y1="100%" x2="100%" y2="0%">
            {stops}
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
  label: { color: theme.muted, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.3, textTransform: "uppercase" },
  chosen: { color: theme.ink, fontSize: 14, fontFamily: fonts.black, fontWeight: "800" },
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
