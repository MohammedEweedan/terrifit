import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { bandColour, display, theme, type Band } from "@/theme";

type Props = {
  value: number | null;
  band: Band;
  size?: number;
  label?: string;
  suffix?: string;
};

/**
 * The big readiness ring.
 *
 * Drawn with stroke-dashoffset on a rotated circle rather than an arc path —
 * one shape, no trigonometry, and it renders identically on both platforms.
 */
export function Dial({ value, band, size = 190, label, suffix = "%" }: Props) {
  const stroke = size >= 150 ? 12 : 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = value == null ? 0 : Math.max(0, Math.min(100, value)) / 100;
  const colour = bandColour(band);

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.line}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colour}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={[s.value, { fontSize: size * 0.3, color: value == null ? theme.muted : theme.ink }]}>
        {value == null ? "—" : Math.round(value)}
        {value == null ? "" : <Text style={{ fontSize: size * 0.13, color: theme.ink2 }}>{suffix}</Text>}
      </Text>
      {label ? <Text style={s.label}>{label}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  value: { fontFamily: display, includeFontPadding: false },
  label: {
    color: theme.ink2, fontSize: 10, fontWeight: "800",
    letterSpacing: 1.6, textTransform: "uppercase", marginTop: 4,
  },
});
