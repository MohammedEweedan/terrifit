import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/AppText";
import { syncHealth } from "@/api";
import { hasAnyReading, healthAvailable, readHealth, requestHealthAccess } from "@/health";
import { useSession } from "@/session";
import { fonts, theme } from "@/theme";
import { TerrifitSpinner } from "./TerrifitSpinner";

type Phase = "idle" | "asking" | "reading" | "sending" | "done" | "error";

/**
 * Pulls the last ninety days out of Apple Health and sends them up.
 *
 * This is the difference between the app being useful on the day someone
 * installs it and being a viewer for data they have to fetch themselves — the
 * band is not out until November 2027.
 */
export function HealthSync({ onDone }: { onDone?: () => void }) {
  const { token } = useSession();
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");

  if (!healthAvailable()) return null;

  async function sync() {
    if (!token || phase === "reading" || phase === "sending") return;
    setMessage("");
    setPhase("asking");

    const access = await requestHealthAccess();
    if (!access.ok) {
      setPhase("error");
      setMessage(
        access.reason === "unsupported"
          ? "Apple Health is only on iPhone. On Android, connect Health Connect instead."
          : access.reason === "unavailable"
            ? "Apple Health is not available on this device."
            // The real error, not a guess. Every cause used to surface as
            // "access was not granted", which sent people to Settings to fix
            // a permission that was already switched on.
            : `Health couldn't be reached: ${access.detail ?? "unknown error"}`,
      );
      return;
    }

    setPhase("reading");
    const days = await readHealth(90).catch(() => null);
    if (!days) {
      setPhase("error");
      setMessage("We couldn't read from Health. Try again in a moment.");
      return;
    }

    // Apple never tells an app that a read type was denied — it returns an
    // empty result, exactly as it would for somebody with no data. So an empty
    // read has two causes and the message has to name both rather than pick.
    if (!hasAnyReading(days)) {
      setPhase("error");
      setMessage(
        "Health returned nothing. Either there are no readings yet for the metrics "
        + "Terrifit uses, or their switches are off in Settings › Health › Data Access "
        + "& Devices › Terrifit. iOS does not tell apps which of the two it is.",
      );
      return;
    }

    setPhase("sending");
    const result = await syncHealth(token, "apple_health", days).catch(() => null);
    if (!result) {
      setPhase("error");
      setMessage("We couldn't reach Terrifit. Your data stayed on the phone.");
      return;
    }

    setPhase("done");
    setMessage(`${result.written} ${result.written === 1 ? "day" : "days"} synced. ${result.totalDays} on file.`);
    onDone?.();
  }

  const busy = phase === "asking" || phase === "reading" || phase === "sending";

  return (
    <View style={s.card}>
      <View style={s.head}>
        <View style={s.mark}>
          <Text style={s.markText}>♥</Text>
        </View>
        <View style={s.flex}>
          <Text style={s.title}>Apple Health</Text>
          <Text style={s.body}>
            {phase === "done"
              ? message
              : "Bring in HRV, resting heart rate, sleep, steps, energy and weight. Read-only — Terrifit never writes to Health."}
          </Text>
        </View>
      </View>

      {phase === "error" ? <Text style={s.error}>{message}</Text> : null}

      <Pressable onPress={() => void sync()} disabled={busy} style={[s.button, busy && s.buttonBusy]}>
        {busy ? <TerrifitSpinner size={22} /> : null}
        <Text style={s.buttonText}>
          {phase === "asking"
            ? "Waiting for permission…"
            : phase === "reading"
              ? "Reading Health…"
              : phase === "sending"
                ? "Syncing…"
                : phase === "done"
                  ? "Sync again"
                  : "Connect Apple Health"}
        </Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 22, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, padding: 16 },
  flex: { flex: 1 },
  head: { flexDirection: "row", gap: 13, alignItems: "flex-start" },
  mark: { width: 40, height: 40, borderRadius: 14, backgroundColor: theme.accentSoft, alignItems: "center", justifyContent: "center" },
  markText: { color: theme.accent, fontSize: 18 },
  title: { color: theme.ink, fontSize: 15, fontFamily: fonts.black, fontWeight: "900" },
  body: { color: theme.ink2, fontSize: 12, lineHeight: 18, marginTop: 5 },
  error: { color: theme.fair, fontSize: 12, lineHeight: 18, marginTop: 12 },
  button: {
    height: 48, borderRadius: 24, backgroundColor: theme.accent, marginTop: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9,
  },
  buttonBusy: { opacity: 0.7 },
  buttonText: { color: "#fff", fontSize: 11, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
});
