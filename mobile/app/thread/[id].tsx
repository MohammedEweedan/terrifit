import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Text } from "@/components/AppText";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { sendMessage } from "@/api";
import { useThread } from "@/data";
import { useSession } from "@/session";
import { fonts, theme } from "@/theme";
import { TerrifitSpinner } from "@/components/TerrifitSpinner";

/**
 * A conversation with a coach.
 *
 * This is the one piece of messaging the app keeps: the social feed is parked,
 * but a member who has bought into somebody's twelve-week programme needs a way
 * to ask them a question about it.
 */
export default function ThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useSession();
  const thread = useThread(id ?? "");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scroller = useRef<ScrollView>(null);

  const data = thread.data;

  useEffect(() => {
    if (data) setTimeout(() => scroller.current?.scrollToEnd({ animated: false }), 60);
  }, [data]);

  async function send() {
    const body = draft.trim();
    if (!token || !id || !body || sending) return;
    setSending(true);
    setDraft("");
    const sent = await sendMessage(token, id, body).catch(() => null);
    if (sent && thread.data) {
      thread.set({ ...thread.data, messages: [...thread.data.messages, sent] });
      setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 60);
    } else if (!sent) {
      // Put the text back rather than losing what somebody typed.
      setDraft(body);
    }
    setSending(false);
  }

  return (
    <KeyboardAvoidingView style={s.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[s.top, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={s.back}>‹ Back</Text>
        </Pressable>
        <Text style={s.topTitle} numberOfLines={1}>
          {data?.title ?? "Conversation"}
        </Text>
        <View style={{ width: 52 }} />
      </View>

      <ScrollView ref={scroller} contentContainerStyle={s.content}>
        {thread.loading && !data ? <TerrifitSpinner style={{ marginTop: 50 }} /> : null}
        {data?.messages.length === 0 ? (
          <Text style={s.empty}>
            Ask about the programme — a movement that does not feel right, a week you had to miss, a weight that is
            not moving.
          </Text>
        ) : null}
        {data?.messages.map((message) => (
          <View key={message.id} style={[s.bubbleRow, message.mine && s.bubbleRowMine]}>
            <View style={[s.bubble, message.mine ? s.mine : s.theirs]}>
              <Text style={[s.body, message.mine && s.bodyMine]}>{message.body}</Text>
              <Text style={[s.time, message.mine && s.timeMine]}>
                {new Date(message.createdAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[s.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Message…"
          placeholderTextColor={theme.muted}
          style={s.input}
          multiline
        />
        <Pressable onPress={() => void send()} disabled={!draft.trim() || sending} style={[s.send, (!draft.trim() || sending) && s.sendOff]}>
          <Text style={s.sendText}>↑</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bg },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.line },
  back: { color: theme.accent, fontSize: 14, fontFamily: fonts.bold, fontWeight: "700", width: 52 },
  topTitle: { color: theme.ink, fontSize: 13, fontFamily: fonts.black, fontWeight: "900", flex: 1, textAlign: "center" },
  content: { padding: 16, gap: 8 },
  empty: { color: theme.muted, fontSize: 13, lineHeight: 20, textAlign: "center", marginTop: 40, paddingHorizontal: 20 },
  bubbleRow: { flexDirection: "row" },
  bubbleRowMine: { justifyContent: "flex-end" },
  bubble: { maxWidth: "80%", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 },
  theirs: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line, borderBottomLeftRadius: 6 },
  mine: { backgroundColor: theme.accent, borderBottomRightRadius: 6 },
  body: { color: theme.ink, fontSize: 14, lineHeight: 20 },
  bodyMine: { color: "#fff" },
  time: { color: theme.muted, fontSize: 10, marginTop: 5 },
  timeMine: { color: "rgba(255,255,255,.75)" },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: 10, paddingHorizontal: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.line, backgroundColor: theme.surface },
  input: { flex: 1, minHeight: 44, maxHeight: 120, borderRadius: 22, borderWidth: 1, borderColor: theme.lineStrong, paddingHorizontal: 16, paddingVertical: 12, color: theme.ink, fontSize: 15 },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" },
  sendOff: { opacity: 0.4 },
  sendText: { color: "#fff", fontSize: 20, fontFamily: fonts.black, fontWeight: "900" },
});
