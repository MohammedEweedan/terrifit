import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/AppText";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { ACTIVITIES } from "@/activities";
import { fonts, theme } from "@/theme";

/**
 * Choosing what you are about to go and do.
 *
 * Six tiles rather than a wheel: the list is short enough to see at once, and
 * the choice only changes which figure is headlined and whether climbing is
 * shown, so nobody should be made to think hard about it.
 */
export default function ActivityPickerScreen() {
  const router = useRouter();

  return (
    <Screen title="Go outside." eyebrow="Record">
      <Text style={s.intro}>
        Your route, your distance and your pace, drawn as you go. Everything is recorded on your
        phone and only leaves it when you save the activity.
      </Text>

      <View style={s.grid}>
        {ACTIVITIES.map((activity) => (
          <Pressable
            key={activity.kind}
            style={s.tile}
            onPress={() => router.push(`/activity/${activity.kind}` as never)}
          >
            <View style={[s.stripe, { backgroundColor: activity.colour }]} />
            <Text style={s.label}>{activity.label}</Text>
            <Text style={s.note}>{activity.note}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  intro: { color: theme.ink2, fontSize: 13, lineHeight: 20, marginBottom: 20 },
  grid: { gap: 10 },
  tile: {
    padding: 16, borderRadius: 14, backgroundColor: theme.surface,
    borderWidth: 1, borderColor: theme.line, overflow: "hidden",
  },
  stripe: { position: "absolute", left: 0, top: 0, bottom: 0, width: 3 },
  label: { color: theme.ink, fontSize: 16, fontFamily: fonts.black, fontWeight: "900" },
  note: { color: theme.ink2, fontSize: 12, marginTop: 4, lineHeight: 17 },
});
