import { useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/components/AppText";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts, display, theme } from "@/theme";

/**
 * Somebody's face, or the emoji they picked instead.
 *
 * Three states in priority order — photo, emoji, then the initial of their
 * name — so there is always something in the circle and never a broken image.
 */
export function Avatar({
  image,
  emoji,
  name,
  size = 84,
}: {
  image?: string | null;
  emoji?: string | null;
  name?: string | null;
  size?: number;
}) {
  const radius = size / 2;

  if (image) {
    return <Image source={{ uri: image }} style={[s.circle, { width: size, height: size, borderRadius: radius }]} />;
  }

  return (
    <View style={[s.circle, s.fallback, { width: size, height: size, borderRadius: radius }]}>
      <Text style={emoji ? { fontSize: size * 0.52 } : [s.initial, { fontSize: size * 0.46 }]}>
        {emoji || (name ?? "T").slice(0, 1).toUpperCase()}
      </Text>
    </View>
  );
}

/** A spread wide enough to find yourself in, without being a full keyboard. */
const EMOJI = [
  "💪", "🏃", "🏋️", "🚴", "🏊", "🧘", "🥊", "⚽", "🏀", "🎾",
  "🔥", "⚡", "🌊", "🏔️", "🌅", "🎯", "🏆", "🥇", "💎", "🚀",
  "🐺", "🦁", "🦅", "🐻", "🦈", "🐉", "🦌", "🐆", "🦍", "🐎",
  "😀", "😎", "🤙", "🫡", "🤖", "👽", "🎧", "☕", "🍀", "🌙",
];

/**
 * Picking one.
 *
 * A photo is downscaled and compressed by the picker before it ever reaches
 * us, because the image is stored as a data URI on a row read on every profile
 * load — a full-resolution camera shot there would be several megabytes on
 * every request.
 */
export function AvatarPicker({
  image,
  emoji,
  name,
  onChange,
}: {
  image: string | null;
  emoji: string | null;
  name: string | null;
  onChange: (next: { avatarImage: string | null; avatarEmoji: string | null }) => void;
}) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const hasAvatar = Boolean(image || emoji);

  async function pickPhoto() {
    setBusy(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        // Small on purpose: it is displayed at 84pt and stored inline.
        quality: 0.6,
        base64: true,
      });
      if (result.canceled || !result.assets[0]?.base64) return;

      onChange({
        avatarImage: `data:image/jpeg;base64,${result.assets[0].base64}`,
        avatarEmoji: null,
      });
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Pressable onPress={() => setOpen(true)} accessibilityLabel="Change your picture" style={s.tap}>
        <Avatar image={image} emoji={emoji} name={name} />
        <View style={s.pencil}>
          <Text style={s.pencilText}>{hasAvatar ? "Edit" : "Add"}</Text>
        </View>
      </Pressable>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <View style={[s.sheet, { paddingTop: 14 }]}>
          <View style={s.sheetTop}>
            <Text style={s.sheetTitle}>Your picture</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={12}>
              <Text style={s.done}>Done</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: insets.bottom + 30 }}>
            <View style={s.preview}>
              <Avatar image={image} emoji={emoji} name={name} size={96} />
            </View>

            <Pressable onPress={() => void pickPhoto()} disabled={busy} style={s.action}>
              <Text style={s.actionText}>{busy ? "Opening…" : "Choose a photo"}</Text>
            </Pressable>

            {hasAvatar ? (
              <Pressable
                onPress={() => onChange({ avatarImage: null, avatarEmoji: null })}
                style={[s.action, s.actionQuiet]}
              >
                <Text style={[s.actionText, s.actionQuietText]}>Remove</Text>
              </Pressable>
            ) : null}

            <Text style={s.orLabel}>Or pick an emoji</Text>
            <View style={s.grid}>
              {EMOJI.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => onChange({ avatarEmoji: item, avatarImage: null })}
                  style={[s.emoji, emoji === item && s.emojiOn]}
                >
                  <Text style={s.emojiText}>{item}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  circle: { borderWidth: 2, borderColor: theme.accent },
  fallback: { backgroundColor: theme.accentSoft, alignItems: "center", justifyContent: "center" },
  initial: { color: theme.accent, fontFamily: display },

  tap: { alignSelf: "center" },
  pencil: {
    position: "absolute", bottom: -2, right: -6,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 11,
    backgroundColor: theme.accent,
  },
  pencilText: { color: "#fff", fontSize: 9, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 0.6, textTransform: "uppercase" },

  sheet: { flex: 1, backgroundColor: theme.bg },
  sheetTop: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 18, paddingBottom: 14,
  },
  sheetTitle: { color: theme.ink, fontSize: 17, fontFamily: fonts.black, fontWeight: "900" },
  done: { color: theme.accent, fontSize: 14, fontFamily: fonts.bold, fontWeight: "700" },

  preview: { alignItems: "center", paddingVertical: 22 },
  action: {
    height: 52, borderRadius: 26, backgroundColor: theme.accent,
    alignItems: "center", justifyContent: "center", marginBottom: 10,
  },
  actionText: { color: "#fff", fontSize: 12, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  actionQuiet: { backgroundColor: "transparent", borderWidth: 1, borderColor: theme.lineStrong },
  actionQuietText: { color: theme.ink2 },

  orLabel: {
    color: theme.muted, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.3,
    textTransform: "uppercase", marginTop: 22, marginBottom: 14, textAlign: "center",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center" },
  emoji: {
    width: 56, height: 56, borderRadius: 18, borderWidth: 1, borderColor: theme.line,
    backgroundColor: theme.surface, alignItems: "center", justifyContent: "center",
  },
  emojiOn: { borderColor: theme.accent, backgroundColor: theme.accentSoft },
  emojiText: { fontSize: 26 },
});
