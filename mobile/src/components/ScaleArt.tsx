import { Image, StyleSheet, View } from "react-native";
import { API_BASE } from "@/api";

export function ScaleArt({ colour = "black", height = 240 }: { colour?: string; height?: number }) {
  return <View style={[s.stage, { height }]}><Image accessibilityLabel={`Terrifit Scale ${colour}`} source={{ uri: `${API_BASE}/media/scale/${colour === "white" ? "white" : "black"}-v1.png` }} style={s.image} /></View>;
}
const s = StyleSheet.create({ stage: { alignItems: "center", justifyContent: "center", backgroundColor: "transparent", width: "100%" }, image: { width: "100%", height: "100%", resizeMode: "contain" } });
