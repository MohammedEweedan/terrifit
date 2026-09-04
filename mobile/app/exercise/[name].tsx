import { ScrollView, StyleSheet, View, Pressable } from "react-native";
import { Text } from "@/components/AppText";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProductImage } from "@/components/ProductImage";
import type { Exercise } from "@/api";
import { fonts, display, theme } from "@/theme";
import { appScreens } from "@/i18n/app-screens";
import { usePreferences } from "@/preferences";

/**
 * How to do the movement.
 *
 * The prescription tells you what to lift; this is the part that decides
 * whether the next twelve weeks work. Where a demonstration has not been shot
 * the placeholder names the shot that belongs there rather than pretending.
 */
export default function ExerciseScreen() {
  const copy = appScreens[usePreferences().locale].exercise;
  const { name, payload } = useLocalSearchParams<{ name: string; payload?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  let exercise: Exercise | null = null;
  try {
    exercise = payload ? (JSON.parse(payload) as Exercise) : null;
  } catch {
    exercise = null;
  }

  return (
    <View style={s.page}>
      <View style={[s.top, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={s.back}>‹ Back</Text>
        </Pressable>
        <Text style={s.topTitle} numberOfLines={1}>
          {name}
        </Text>
        <View style={{ width: 52 }} />
      </View>

      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}>
        <ProductImage
          uri={exercise?.media?.image ?? null}
          name={exercise?.name ?? name ?? copy.movement}
          style={s.media}
        />
        {exercise?.media?.alt ? <Text style={s.mediaNote}>{exercise.media.alt}</Text> : null}

        <Text style={s.name}>{exercise?.name ?? name}</Text>
        <View style={s.schemeRow}>
          {exercise?.scheme ? <Text style={s.scheme}>{exercise.scheme}</Text> : null}
          {exercise?.intensity ? <Text style={s.intensity}>{exercise.intensity}</Text> : null}
          {exercise?.restSeconds ? <Text style={s.rest}>{exercise.restSeconds}s rest</Text> : null}
        </View>

        {exercise?.targets?.length ? (
          <View style={s.targets}>
            {exercise.targets.map((target) => (
              <Text key={target} style={s.target}>
                {target}
              </Text>
            ))}
          </View>
        ) : null}

        {exercise?.cue ? (
          <View style={s.cue}>
            <Text style={s.cueLabel}>{copy.theOneCue}</Text>
            <Text style={s.cueText}>{exercise.cue}</Text>
          </View>
        ) : null}

        {exercise?.technique?.length ? (
          <>
            <Text style={s.section}>{copy.howToDoIt}</Text>
            {exercise.technique.map((step, index) => (
              <View key={step} style={s.step}>
                <View style={s.stepNumber}>
                  <Text style={s.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={s.stepText}>{step}</Text>
              </View>
            ))}
          </>
        ) : null}

        {exercise?.mistakes?.length ? (
          <>
            <Text style={s.section}>{copy.whatGoesWrong}</Text>
            {exercise.mistakes.map((mistake) => (
              <View key={mistake} style={s.mistake}>
                <Text style={s.mistakeMark}>!</Text>
                <Text style={s.mistakeText}>{mistake}</Text>
              </View>
            ))}
          </>
        ) : null}

        {exercise?.progression ? (
          <>
            <Text style={s.section}>{copy.howToGetBetter}</Text>
            <Text style={s.progression}>{exercise.progression}</Text>
          </>
        ) : null}

        {!exercise?.technique?.length ? (
          <Text style={s.thin}>
            Full coaching for this movement is still being written. The cue above is the one thing that matters most.
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bg },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.line },
  back: { color: theme.accent, fontSize: 14, fontFamily: fonts.bold, fontWeight: "700", width: 52 },
  topTitle: { color: theme.ink, fontSize: 12, fontFamily: fonts.black, fontWeight: "900", flex: 1, textAlign: "center" },
  content: { paddingHorizontal: 20, paddingTop: 18 },
  media: { height: 210, borderRadius: 20 },
  mediaNote: { color: theme.muted, fontSize: 11, lineHeight: 16, marginTop: 10, fontStyle: "italic" },
  name: { color: theme.ink, fontFamily: display, fontSize: 32, textTransform: "uppercase", marginTop: 18 },
  schemeRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
  scheme: { color: theme.accent, fontSize: 14, fontFamily: fonts.black, fontWeight: "900" },
  intensity: { color: theme.ink2, fontSize: 14, fontFamily: fonts.bold, fontWeight: "700" },
  rest: { color: theme.muted, fontSize: 13 },
  targets: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 14 },
  target: { color: theme.ink2, fontSize: 11, fontFamily: fonts.bold, fontWeight: "700", borderWidth: 1, borderColor: theme.line, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6, overflow: "hidden" },
  cue: { marginTop: 20, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: theme.accent, backgroundColor: theme.accentSoft },
  cueLabel: { color: theme.accent, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.4, textTransform: "uppercase" },
  cueText: { color: theme.ink, fontSize: 15, lineHeight: 22, marginTop: 8 },
  section: { color: theme.accent, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase", marginTop: 30, marginBottom: 14 },
  step: { flexDirection: "row", gap: 13, marginBottom: 14 },
  stepNumber: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: theme.lineStrong, alignItems: "center", justifyContent: "center" },
  stepNumberText: { color: theme.ink2, fontSize: 12, fontFamily: fonts.black, fontWeight: "900" },
  stepText: { color: theme.ink, fontSize: 14, lineHeight: 21, flex: 1 },
  mistake: { flexDirection: "row", gap: 13, marginBottom: 12 },
  mistakeMark: { color: theme.fair, fontSize: 15, fontFamily: fonts.black, fontWeight: "900", width: 26, textAlign: "center" },
  mistakeText: { color: theme.ink2, fontSize: 14, lineHeight: 21, flex: 1 },
  progression: { color: theme.ink, fontSize: 14, lineHeight: 22 },
  thin: { color: theme.muted, fontSize: 12, lineHeight: 18, marginTop: 24 },
});
