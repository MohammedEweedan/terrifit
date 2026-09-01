import { createContext, useContext } from "react";
import { Animated } from "react-native";

/**
 * How far the current screen has scrolled.
 *
 * Lives in context so the header can react to a scroll view it does not own —
 * every screen passes its header to `Screen` as a prop, and threading a shared
 * Animated.Value through all of them by hand would be noise at each call site.
 */
export const ScrollContext = createContext<Animated.Value | null>(null);

export function useScrollY(): Animated.Value | null {
  return useContext(ScrollContext);
}
