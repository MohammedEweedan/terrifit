import { Pressable, StyleSheet } from "react-native";
import { Text } from "@/components/AppText";
import { useRouter } from "expo-router";
import { usePreferences } from "@/preferences";
import { fonts, theme } from "@/theme";
import { screenCopy } from "@/i18n/screens";

/**
 * The Coach, in the header rather than floating over the list.
 *
 * It started as a floating button in the bottom-right, which fought the tab
 * bar for the same thumb and covered the last row of whatever you were
 * reading. In the top-left it sits beside the order mark, which is where this
 * app already puts "things you might want to jump to", and it shrinks to an
 * icon when an order is in flight so the two never crowd each other.
 */
export function CoachButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { locale } = usePreferences();
  const label = screenCopy[locale].askCoach;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => router.push("/coach-chat" as never)}
      hitSlop={8}
      style={[s.button, compact ? s.compact : null]}
    >
      <Text style={s.mark}>✦</Text>
      {compact ? null : <Text style={s.label} numberOfLines={1}>{label}</Text>}
    </Pressable>
  );
}

const s = StyleSheet.create({
  button: {
    flexDirection: "row", alignItems: "center", gap: 5,
    height: 30, paddingHorizontal: 10, borderRadius: 15,
    borderWidth: 1, borderColor: theme.accentLine, backgroundColor: theme.accentSoft,
  },
  compact: { width: 30, paddingHorizontal: 0, justifyContent: "center" },
  mark: { color: theme.accent, fontSize: 12 },
  label: {
    color: theme.accent, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 0.4,
  },
});
