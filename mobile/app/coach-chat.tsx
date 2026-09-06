import { useRef, useState } from "react";
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View,
} from "react-native";
import { Text } from "@/components/AppText";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { askCoach, type CoachTurn } from "@/api";
import { useSession } from "@/session";
import { TerrifitSpinner } from "@/components/TerrifitSpinner";
import { fonts, display, theme } from "@/theme";

/**
 * Talking to the Coach.
 *
 * The history is held here and posted with each turn rather than stored on the
 * server. A training conversation is not a medical record and there is no
 * reason to keep one: closing the screen ends it, which is also the honest
 * answer to "what do you do with what I tell it".
 */

const OPENERS = [
  "My squat has stalled — what now?",
  "Should I train on six hours' sleep?",
  "How do I stop my elbows flaring on bench?",
];

export default function CoachChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useSession();
  const [turns, setTurns] = useState<CoachTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef<ScrollView>(null);

  async function send(message: string) {
    const trimmed = message.trim();
    if (!token || !trimmed || busy) return;

    const history = turns;
    setTurns([...history, { role: "user", content: trimmed }]);
    setDraft("");
    setBusy(true);
    requestAnimationFrame(() => scroller.current?.scrollToEnd({ animated: true }));

    const result = await askCoach(token, trimmed, history).catch(() => null);
    setBusy(false);
    setTurns((current) => [
      ...current,
      {
        role: "assistant",
        content: result?.reply ?? "I could not reach the Coach just then. Try again in a moment.",
      },
    ]);
    requestAnimationFrame(() => scroller.current?.scrollToEnd({ animated: true }));
  }

  return (
    <KeyboardAvoidingView style={s.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[s.top, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={s.close}>Close</Text>
        </Pressable>
        <Text style={s.title}>Coach</Text>
        <View style={s.spacer} />
      </View>

      <ScrollView
        ref={scroller}
        contentContainerStyle={[s.thread, { paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        {turns.length === 0 ? (
          <View style={s.intro}>
            <Text style={s.introTitle}>Ask about your training.</Text>
            <Text style={s.introBody}>
              The Coach can see your Map, what you have logged this week and your recent readings,
              so you do not have to explain them. It cannot help with pain, injuries or anything
              medical — that needs a clinician.
            </Text>
            {OPENERS.map((opener) => (
              <Pressable key={opener} style={s.opener} onPress={() => void send(opener)}>
                <Text style={s.openerText}>{opener}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {turns.map((turn, index) => (
          <View key={index} style={[s.bubble, turn.role === "user" ? s.mine : s.theirs]}>
            <Text style={turn.role === "user" ? s.mineText : s.theirsText}>{turn.content}</Text>
          </View>
        ))}

        {busy ? <TerrifitSpinner style={{ marginTop: 14, alignSelf: "flex-start" }} /> : null}
      </ScrollView>

      <View style={[s.composer, { paddingBottom: insets.bottom + 10 }]}>
        <TextInput
          style={s.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Ask the Coach"
          placeholderTextColor={theme.muted}
          multiline
          maxLength={2000}
          onSubmitEditing={() => void send(draft)}
        />
        <Pressable
          style={[s.send, draft.trim() && !busy ? { backgroundColor: theme.accent } : null]}
          onPress={() => void send(draft)}
          disabled={!draft.trim() || busy}
        >
          <Text style={s.sendMark}>↑</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bg },
  top: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: theme.line,
  },
  close: { color: theme.ink2, fontSize: 14 },
  title: { color: theme.ink, fontFamily: display, fontSize: 18 },
  spacer: { width: 44 },
  thread: { padding: 16, gap: 10 },
  intro: { gap: 10, paddingVertical: 8 },
  introTitle: { color: theme.ink, fontFamily: display, fontSize: 24, lineHeight: 30 },
  introBody: { color: theme.ink2, fontSize: 13, lineHeight: 20, marginBottom: 6 },
  opener: {
    padding: 13, borderRadius: 11,
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line,
  },
  openerText: { color: theme.ink, fontSize: 13 },
  bubble: { maxWidth: "88%", padding: 12, borderRadius: 14 },
  mine: { alignSelf: "flex-end", backgroundColor: theme.accent, borderBottomRightRadius: 4 },
  theirs: {
    alignSelf: "flex-start", backgroundColor: theme.surface,
    borderWidth: 1, borderColor: theme.line, borderBottomLeftRadius: 4,
  },
  mineText: { color: "#0b0b0c", fontSize: 14, lineHeight: 20 },
  theirsText: { color: theme.ink, fontSize: 14, lineHeight: 21 },
  composer: {
    flexDirection: "row", alignItems: "flex-end", gap: 9,
    paddingHorizontal: 14, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: theme.line,
  },
  input: {
    flex: 1, maxHeight: 130, minHeight: 44,
    paddingHorizontal: 14, paddingVertical: 11,
    borderRadius: 20, borderWidth: 1, borderColor: theme.lineStrong,
    backgroundColor: theme.surface, color: theme.ink, fontSize: 14,
  },
  send: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center", backgroundColor: theme.raised,
  },
  sendMark: { color: "#0b0b0c", fontSize: 19, fontFamily: fonts.black, fontWeight: "900" },
});
