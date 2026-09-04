import { useState } from "react";
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Text } from "@/components/AppText";
import { API_BASE } from "@/api";
import { display, theme } from "@/theme";

/**
 * A product photograph, or a designed stand-in when there isn't one yet.
 *
 * Most of the catalogue's art has not been shot. Rendering a blank white
 * rectangle for those reads as a broken app; a branded tile with the product's
 * initials reads as a considered placeholder, and it is the same approach the
 * website's `Shot` component takes for the same reason.
 */
export function ProductImage({
  uri,
  name,
  style,
  contain = true,
}: {
  uri: string | null;
  name: string;
  style?: StyleProp<ViewStyle>;
  contain?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const source = uri ? (/^https?:|^data:/.test(uri) ? uri : `${API_BASE}${uri}`) : null;

  if (!source || failed) {
    const initials = name
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
    return (
      <View style={[s.stage, s.fallback, style]}>
        <Text style={s.initials}>{initials}</Text>
      </View>
    );
  }

  return (
    <View style={[s.stage, style]}>
      <Image
        source={{ uri: source }}
        onError={() => setFailed(true)}
        style={[s.image, { resizeMode: contain ? "contain" : "cover" }]}
      />
    </View>
  );
}

const s = StyleSheet.create({
  // A light ground: the straps and the band are near-black products and vanish
  // on the app's own background.
  stage: { backgroundColor: "#eceae5", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  fallback: { backgroundColor: theme.raised, borderWidth: 1, borderColor: theme.line },
  initials: { color: theme.muted, fontFamily: display, fontSize: 26, letterSpacing: 1 },
  image: { width: "88%", height: "88%" },
});
