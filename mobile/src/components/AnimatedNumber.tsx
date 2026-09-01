import { useEffect, useRef, useState } from "react";
import { Animated, Text, type TextStyle, type StyleProp } from "react-native";

/**
 * Counts up to a value instead of snapping to it.
 *
 * The listener writes to state rather than driving the Text natively, because
 * a number that has to be formatted (thousands separators, one decimal) cannot
 * be interpolated on the UI thread. The animation is short enough that the
 * extra renders are cheaper than they look.
 */
export function AnimatedNumber({
  value,
  format,
  duration = 900,
  delay = 0,
  style,
}: {
  value: number | null;
  format: (value: number) => string;
  duration?: number;
  delay?: number;
  style?: StyleProp<TextStyle>;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (value == null) return;
    const listener = progress.addListener(({ value: fraction }) => setShown(fraction * value));
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: false,
    });
    animation.start();
    return () => {
      animation.stop();
      progress.removeListener(listener);
    };
  }, [progress, value, duration, delay]);

  return <Text style={style}>{value == null ? "—" : format(shown)}</Text>;
}
