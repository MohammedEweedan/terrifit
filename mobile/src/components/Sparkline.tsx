import { View } from "react-native";
import Svg, { Path, Circle, Line } from "react-native-svg";
import { theme } from "@/theme";

type Props = {
  points: Array<number | null>;
  height?: number;
  width: number;
  colour?: string;
  /** Draws the horizontal mean, so a run of numbers reads as above or below par. */
  showBaseline?: boolean;
};

/**
 * A trend line for a single metric.
 *
 * Gaps in the data break the path instead of interpolating across them — a
 * night you didn't wear the band is not a night of average sleep.
 */
export function Sparkline({ points, height = 64, width, colour = theme.accent, showBaseline = true }: Props) {
  const present = points.filter((p): p is number => p != null);
  if (present.length < 2 || width <= 0) return <View style={{ height }} />;

  const min = Math.min(...present);
  const max = Math.max(...present);
  const span = max - min || 1;
  const pad = 6;
  const usable = height - pad * 2;
  const step = points.length > 1 ? width / (points.length - 1) : width;

  const x = (i: number) => i * step;
  const y = (v: number) => pad + (1 - (v - min) / span) * usable;

  let d = "";
  let open = false;
  points.forEach((point, i) => {
    if (point == null) {
      open = false;
      return;
    }
    d += `${open ? "L" : "M"}${x(i).toFixed(1)} ${y(point).toFixed(1)} `;
    open = true;
  });

  const lastIndex = points.reduce<number>((found, point, i) => (point == null ? found : i), -1);
  const lastValue = lastIndex >= 0 ? points[lastIndex] : null;
  const mean = present.reduce((sum, v) => sum + v, 0) / present.length;

  return (
    <Svg width={width} height={height}>
      {showBaseline ? (
        <Line
          x1={0}
          x2={width}
          y1={y(mean)}
          y2={y(mean)}
          stroke={theme.line}
          strokeWidth={1}
          strokeDasharray="3 4"
        />
      ) : null}
      <Path d={d.trim()} stroke={colour} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {lastValue != null ? (
        <Circle
          cx={x(lastIndex)}
          cy={y(lastValue)}
          r={4}
          fill={colour}
          stroke={theme.bg}
          strokeWidth={2}
        />
      ) : null}
    </Svg>
  );
}
