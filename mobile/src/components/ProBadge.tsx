import { StyleSheet, View } from "react-native";
import { Text } from "@/components/AppText";
import { fonts, theme } from "@/theme";

/**
 * The Pro mark.
 *
 * Sits beside a handle at `small`, and under the wordmark at `wordmark` — the
 * same orange as the logo tiles, so it reads as part of the brand rather than
 * a sticker stuck on top of it.
 */
export function ProBadge({ size = "small" }: { size?: "small" | "wordmark" }) {
  return (
    <View style={[s.badge, size === "wordmark" && s.wordmark]}>
      <Text style={[s.text, size === "wordmark" && s.wordmarkText]}>PRO</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: {
    borderRadius: 5,
    backgroundColor: theme.accent,
    paddingHorizontal: 5,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  text: { color: "#fff", fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1 },
  wordmark: { backgroundColor: "transparent", paddingHorizontal: 0, paddingVertical: 0 },
  wordmarkText: { color: theme.accent, fontSize: 10, letterSpacing: 3.4 },
});
