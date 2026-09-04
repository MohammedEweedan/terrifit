import { StyleSheet, View } from "react-native";
import { Text } from "@/components/AppText";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { fonts, theme } from "@/theme";

export type CardIcon =
  | "battery" | "load" | "sleep" | "insight" | "metrics" | "heart" | "spark" | "clock";

/**
 * A section title with its icon pinned to the far left.
 *
 * The dashboard's titles are centred, which leaves the left edge empty and the
 * eye with nothing to catch as it scans down. The icon takes that corner and
 * gives each block a mark you can find without reading it.
 */
export function CardTitle({
  icon,
  title,
  trailing,
  /** Narrow cards cannot spare 30pt of gutter either side. */
  compact = false,
}: {
  icon: CardIcon;
  title: string;
  trailing?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <View style={s.row}>
      <View style={[s.slot, compact && s.slotCompact]}>
        <Glyph name={icon} />
      </View>

      <Text style={s.title} numberOfLines={1}>
        {title}
      </Text>

      {/* Mirrors the icon's width so the title stays optically centred whether
          or not anything sits on the right. */}
      <View style={[s.slot, compact && s.slotCompact]}>{trailing}</View>
    </View>
  );
}

function Glyph({ name }: { name: CardIcon }) {
  const props = {
    stroke: theme.accent,
    strokeWidth: 1.8,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "battery":
      return (
        <Svg width={17} height={17} viewBox="0 0 24 24">
          <Rect x={2} y={7} width={17} height={10} rx={3} {...props} />
          <Path d="M21.5 10.5v3" {...props} />
          <Rect x={4.5} y={9.5} width={7} height={5} rx={1.5} fill={theme.accent} stroke="none" />
        </Svg>
      );
    case "load":
      return (
        <Svg width={17} height={17} viewBox="0 0 24 24">
          <Path d="M2 16c2.5 0 3-8 5.5-8S10 18 12.5 18 16 6 18.5 6 21 12 22 12" {...props} />
        </Svg>
      );
    case "sleep":
      return (
        <Svg width={17} height={17} viewBox="0 0 24 24">
          <Path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" {...props} />
        </Svg>
      );
    case "insight":
      return (
        <Svg width={17} height={17} viewBox="0 0 24 24">
          <Path d="M9 18h6M10 21h4M12 2.5a6.5 6.5 0 0 0-3.8 11.8c.5.4.8 1 .8 1.7h6c0-.7.3-1.3.8-1.7A6.5 6.5 0 0 0 12 2.5Z" {...props} />
        </Svg>
      );
    case "heart":
      return (
        <Svg width={17} height={17} viewBox="0 0 24 24">
          <Path d="M12 20.5S3.5 15 3.5 9.2A4.7 4.7 0 0 1 12 6.5a4.7 4.7 0 0 1 8.5 2.7C20.5 15 12 20.5 12 20.5Z" {...props} />
        </Svg>
      );
    case "spark":
      return (
        <Svg width={17} height={17} viewBox="0 0 24 24">
          <Path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2Z" {...props} />
        </Svg>
      );
    case "clock":
      return (
        <Svg width={17} height={17} viewBox="0 0 24 24">
          <Circle cx={12} cy={12} r={9} {...props} />
          <Path d="M12 7v5.2l3.4 2" {...props} />
        </Svg>
      );
    default:
      return (
        <Svg width={17} height={17} viewBox="0 0 24 24">
          <Rect x={3} y={3} width={7.5} height={7.5} rx={2} {...props} />
          <Rect x={13.5} y={3} width={7.5} height={7.5} rx={2} {...props} />
          <Rect x={3} y={13.5} width={7.5} height={7.5} rx={2} {...props} />
          <Rect x={13.5} y={13.5} width={7.5} height={7.5} rx={2} {...props} />
        </Svg>
      );
  }
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  slot: { width: 30, alignItems: "flex-start", justifyContent: "center" },
  slotCompact: { width: 19 },
  title: {
    flex: 1,
    textAlign: "center",
    color: theme.muted,
    fontSize: 10,
    fontFamily: fonts.black, fontWeight: "900",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
});
