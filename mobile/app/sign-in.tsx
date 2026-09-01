import { useState } from "react";
import {
  Linking,
  KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSession } from "@/session";
import { display, theme } from "@/theme";
import { API_BASE, ApiError, MIN_PASSWORD } from "@/api";
import { TerrifitMark } from "@/components/TerrifitMark";

type Mode = "in" | "up";

export default function SignInScreen() {
  const { signIn, signUp } = useSession();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const creating = mode === "up";
  const ready = email.trim().length > 3 && password.length > 0 && (!creating || name.trim().length > 0);

  async function submit() {
    if (!ready || busy) return;
    if (creating && password.length < MIN_PASSWORD) {
      setError(`Passwords need at least ${MIN_PASSWORD} characters.`);
      return;
    }

    setBusy(true);
    setError("");
    try {
      if (creating) await signUp(name.trim(), email.trim(), password);
      else await signIn(email.trim(), password);
    } catch (caught) {
      setError(message(caught, creating));
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={[s.wrap, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        <TerrifitMark size={34} />
        <Text style={s.title}>{creating ? "Start here" : "Welcome back"}</Text>
        <Text style={s.lede}>
          {creating
            ? "One account covers the app, the shop and everything you bring in from your other health apps."
            : "Pick up where you left off."}
        </Text>

        {creating ? (
          <>
            <Text style={s.label}>Name</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoComplete="name"
              placeholder="Your name"
              placeholderTextColor={theme.muted}
            />
          </>
        ) : null}

        <Text style={s.label}>Email</Text>
        <TextInput
          style={s.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          placeholder="you@example.com"
          placeholderTextColor={theme.muted}
        />

        <Text style={s.label}>Password</Text>
        <TextInput
          style={s.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={creating ? "new-password" : "current-password"}
          placeholder={creating ? `At least ${MIN_PASSWORD} characters` : "••••••••"}
          placeholderTextColor={theme.muted}
          onSubmitEditing={submit}
          returnKeyType="go"
        />

        {error ? <Text style={s.error}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [s.button, (busy || !ready || pressed) && s.buttonDim]}
          onPress={submit}
          disabled={busy || !ready}
        >
          <Text style={s.buttonText}>
            {busy ? (creating ? "Creating…" : "Signing in…") : creating ? "Create account" : "Sign in"}
          </Text>
        </Pressable>

        <Pressable
          style={s.switch}
          onPress={() => {
            setMode(creating ? "in" : "up");
            setError("");
          }}
        >
          <Text style={s.switchText}>
            {creating ? "Already have an account? Sign in" : "New here? Create an account"}
          </Text>
        </Pressable>

        <Text style={s.footnote}>
          {creating
            ? "By creating an account you agree to the terms on terrifit.com."
            : "Forgot your password? Tap below to reset it, then come back and sign in."}
        </Text>

        {/* Opens the reset page in the browser: setting a password from a link
            in an email is a web flow, and duplicating it here would mean a
            second place for the token logic to go wrong. */}
        {!creating ? (
          <Pressable
            onPress={() => void Linking.openURL(`${API_BASE}/en/reset`).catch(() => {})}
            style={s.switch}
          >
            <Text style={s.switchText}>Reset my password</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Turns an API failure into something worth reading. */
function message(caught: unknown, creating: boolean): string {
  if (!(caught instanceof ApiError)) return "We couldn't reach Terrifit. Check your connection and try again.";
  if (caught.status === 401) return "That email and password don't match. Have another go.";
  if (caught.status === 409) return "There's already an account on that email. Sign in instead.";
  if (caught.status === 422) return `Check the ${creating ? "details" : "email"} you typed — something isn't valid.`;
  if (caught.status === 429) return "Too many attempts. Give it a minute.";
  return "Something went wrong at our end. Try again in a moment.";
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.bg },
  wrap: { paddingHorizontal: 24 },
  title: { color: theme.ink, fontFamily: display, fontSize: 40, marginTop: 22, textTransform: "uppercase" },
  lede: { color: theme.ink2, fontSize: 15, lineHeight: 22, marginTop: 8 },
  label: { color: theme.ink2, fontSize: 11, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 8, marginTop: 20 },
  input: {
    height: 52, borderWidth: 1, borderColor: theme.lineStrong, borderRadius: 3,
    paddingHorizontal: 14, color: theme.ink, fontSize: 16, backgroundColor: theme.surface,
  },
  error: { color: theme.poor, fontSize: 13, lineHeight: 19, marginTop: 16 },
  button: {
    height: 52, borderRadius: 999, marginTop: 28,
    alignItems: "center", justifyContent: "center", backgroundColor: theme.accent,
  },
  buttonDim: { opacity: 0.55 },
  buttonText: { color: "#fff", fontSize: 13, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" },
  switch: { marginTop: 18, alignSelf: "center", paddingVertical: 8 },
  switchText: { color: theme.accent, fontSize: 13, fontWeight: "700" },
  footnote: { color: theme.muted, fontSize: 12, lineHeight: 18, marginTop: 14, textAlign: "center" },
});
