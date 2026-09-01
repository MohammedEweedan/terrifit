import { useMemo, useRef } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop, Text as SvgText } from "react-native-svg";
import { theme } from "@/theme";

export type Point = { date: string; value: number | null };

/** Width reserved for the fixed axis column. */
const AXIS_WIDTH = 52;
const PAD_TOP = 18;
const PAD_BOTTOM = 26;

/**
 * One metric over time.
 *
 * The y axis is a fixed column outside the scroller, not text drawn inside the
 * plot: when it lived in the scrolling SVG it slid out of view the moment the
 * chart scrolled, which is exactly as useful as no axis at all.
 *
 * Gaps break the line rather than interpolating across them — a day you did
 * not wear the band is not a day of average sleep.
 */
export function MetricChart({
  points,
  colour,
  format,
  height = 230,
  minSpacing = 13,
  viewWidth,
  better = "neutral",
}: {
  points: Point[];
  colour: string;
  format: (value: number) => string;
  height?: number;
  minSpacing?: number;
  viewWidth: number;
  /** Which direction is good, so peaks and troughs can be marked meaningfully. */
  better?: "higher" | "lower" | "neutral";
}) {
  const scroller = useRef<ScrollView>(null);
  const present = points.filter((point): point is { date: string; value: number } => point.value != null);

  const plotWidth = Math.max(viewWidth - AXIS_WIDTH, points.length * minSpacing);
  const plotHeight = height - PAD_TOP - PAD_BOTTOM;

  const { min, max } = useMemo(() => {
    if (present.length === 0) return { min: 0, max: 1 };
    const values = present.map((point) => point.value);
    const low = Math.min(...values);
    const high = Math.max(...values);
    const pad = (high - low || Math.abs(high) || 1) * 0.15;
    return { min: low - pad, max: high + pad };
  }, [present]);

  const span = max - min || 1;
  const step = points.length > 1 ? plotWidth / (points.length - 1) : 0;
  const x = (index: number) => index * step;
  const y = (value: number) => PAD_TOP + (1 - (value - min) / span) * plotHeight;

  const { line, area, lastIndex } = useMemo(() => {
    let path = "";
    let fill = "";
    let open = false;
    // The index of the last point actually plotted. The fill used to close at
    // `points.length - 1` instead, so a series that ends before the range does
    // — a weight you last logged on Tuesday inside a year view — had its area
    // and its endpoint marker running on past where the line stopped.
    let drawn = -1;
    const floor = (PAD_TOP + plotHeight).toFixed(1);

    points.forEach((point, index) => {
      if (point.value == null) {
        if (open) fill += `L${x(drawn).toFixed(1)} ${floor} Z `;
        open = false;
        return;
      }
      const px = x(index).toFixed(1);
      const py = y(point.value).toFixed(1);
      path += `${open ? "L" : "M"}${px} ${py} `;
      fill += open ? `L${px} ${py} ` : `M${px} ${floor} L${px} ${py} `;
      open = true;
      drawn = index;
    });

    if (open && drawn >= 0) fill += `L${x(drawn).toFixed(1)} ${floor} Z`;
    return { line: path.trim(), area: fill.trim(), lastIndex: drawn };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, plotWidth, min, max, height]);

  if (present.length < 2) {
    return (
      <View style={[s.empty, { height }]}>
        <Text style={s.emptyText}>
          {present.length === 0
            ? "No readings in this range."
            : "One reading in this range — two are needed to draw a line."}
        </Text>
      </View>
    );
  }

  const lastValue = lastIndex >= 0 ? points[lastIndex].value : null;
  const mid = (max + min) / 2;
  const ticks = [max, mid, min];

  return (
    <View style={[s.row, { height }]}>
      {/* Fixed axis. Stays put while the plot scrolls under it. */}
      <View style={[s.axis, { width: AXIS_WIDTH, height }]}>
        {ticks.map((value, index) => (
          <Text key={index} style={[s.axisLabel, { top: y(value) - 7 }]} numberOfLines={1}>
            {format(value)}
          </Text>
        ))}
      </View>

      <ScrollView
        ref={scroller}
        horizontal
        showsHorizontalScrollIndicator={false}
        // Opens at the most recent reading, which is the one people look for.
        contentOffset={{ x: Math.max(0, plotWidth - (viewWidth - AXIS_WIDTH)), y: 0 }}
        decelerationRate="normal"
        directionalLockEnabled
        style={s.scroller}
      >
        <Svg width={plotWidth} height={height}>
          <Defs>
            {/* Vertical ramps: high readings take the hot end, low the warm. */}
            <LinearGradient id="metricStroke" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={theme.poor} />
              <Stop offset="0.28" stopColor={colour} />
              <Stop offset="0.72" stopColor={colour} />
              <Stop offset="1" stopColor={theme.accent} />
            </LinearGradient>
            <LinearGradient id="metricFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={theme.poor} stopOpacity={0.26} />
              <Stop offset="0.45" stopColor={colour} stopOpacity={0.12} />
              <Stop offset="1" stopColor={theme.accent} stopOpacity={0} />
            </LinearGradient>
          </Defs>

          {ticks.map((value, index) => (
            <Line
              key={index}
              x1={0}
              x2={plotWidth}
              y1={y(value)}
              y2={y(value)}
              stroke={theme.line}
              strokeWidth={1}
              strokeDasharray={index === 1 ? "3 5" : undefined}
            />
          ))}

          <Path d={area} fill="url(#metricFill)" />
          <Path d={line} stroke="url(#metricStroke)" strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />

          {lastValue != null ? (
            <>
              <Circle cx={x(lastIndex)} cy={y(lastValue)} r={9} fill={colour} opacity={0.18} />
              <Circle cx={x(lastIndex)} cy={y(lastValue)} r={4.5} fill={colour} stroke={theme.surface} strokeWidth={2} />
            </>
          ) : null}

          {points.map((point, index) =>
            index % Math.max(1, Math.ceil(points.length / 6)) === 0 ? (
              <SvgText
                key={`tick-${index}`}
                x={x(index)}
                y={height - 8}
                fill={theme.muted}
                fontSize={10}
                textAnchor="middle"
              >
                {new Date(point.date).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
              </SvgText>
            ) : null,
          )}
        </Svg>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row" },
  axis: { position: "relative" },
  axisLabel: {
    position: "absolute",
    left: 8,
    right: 4,
    color: theme.muted,
    fontSize: 10,
    fontWeight: "700",
  },
  scroller: { flex: 1 },
  empty: { alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  emptyText: { color: theme.ink2, fontSize: 13, textAlign: "center", lineHeight: 19 },
});
