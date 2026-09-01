import Svg, { Circle, Path, Rect } from "react-native-svg";

/**
 * Payment rail marks, drawn rather than shipped as images.
 *
 * These are generic marks, not the processors' logos: Apple, Google, PayPal
 * and the card networks all licence their marks under brand guidelines that a
 * hand-traced copy would breach. A recognisable silhouette in our own ink is
 * both legal and consistent with the rest of the app.
 */
export function PayIcon({ method, color, size = 22 }: { method: string; color: string; size?: number }) {
  switch (method) {
    case "card":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x={2} y={5} width={20} height={14} rx={3} stroke={color} strokeWidth={1.7} />
          <Path d="M2 9.5h20" stroke={color} strokeWidth={1.7} />
          <Path d="M5.5 15h4" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
        </Svg>
      );

    case "apple_pay":
      // The Apple silhouette: a bitten disc with a leaf.
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M16.3 12.6c0-2 1.6-3 1.7-3-.9-1.4-2.4-1.5-2.9-1.6-1.2-.1-2.4.7-3 .7-.6 0-1.6-.7-2.6-.7-1.3 0-2.6.8-3.3 2-1.4 2.4-.4 6 1 8 .7 1 1.5 2.1 2.5 2 1-.1 1.4-.6 2.6-.6s1.5.6 2.6.6c1.1 0 1.8-1 2.4-2 .8-1.1 1.1-2.2 1.1-2.3-.1 0-2.1-.8-2.1-3.1Z"
            fill={color}
          />
          <Path d="M14.4 6.6c.5-.7.9-1.6.8-2.6-.8 0-1.8.6-2.4 1.3-.5.6-1 1.6-.8 2.5.9.1 1.8-.5 2.4-1.2Z" fill={color} />
        </Svg>
      );

    case "google_pay":
      // A 'G' arc, the one part of the Google mark that reads at 22px.
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M20 12.2c0 4.5-3.1 7.7-7.7 7.7A8 8 0 0 1 12.3 4c2.2 0 4 .8 5.3 2.1l-2.2 2.1a4.5 4.5 0 0 0-3.1-1.2 5 5 0 0 0 0 10c2.9 0 4.2-1.7 4.5-3.4h-4.5v-2.8H20c.1.5.1.9.1 1.4Z"
            fill={color}
          />
        </Svg>
      );

    case "paypal":
      // The overlapping double-P, reduced to two nested shells.
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M8.4 20 9 16.2h2.6c3.5 0 5.7-1.8 6.2-5.1.2-1.5-.2-2.6-1.1-3.3.9 1.9.2 4.6-1.4 5.9-1 .8-2.4 1.2-4.1 1.2H9.4L8.4 20Z"
            fill={color}
            opacity={0.55}
          />
          <Path
            d="M6 18.4 8.3 4h5.2c2.9 0 4.6 1.4 4.2 4-.4 3.1-2.6 4.8-5.9 4.8H9.4l-.9 5.6H6Zm4.2-8.1h1.6c1.5 0 2.5-.7 2.7-2 .2-1.1-.5-1.7-1.8-1.7h-1.7l-.8 3.7Z"
            fill={color}
          />
        </Svg>
      );

    case "crypto":
      // A coin with the horizontal bars every ledger token shares.
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={8.6} stroke={color} strokeWidth={1.7} />
          <Path d="M9.5 8.2h3.2a2 2 0 0 1 0 3.9H9.5m0 0h3.6a2 2 0 0 1 0 3.9H9.5m0-7.8v7.8" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M11 6.6v1.6M11 15.9v1.6M13.2 6.6v1.6M13.2 15.9v1.6" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
        </Svg>
      );

    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={8.6} stroke={color} strokeWidth={1.7} />
        </Svg>
      );
  }
}
