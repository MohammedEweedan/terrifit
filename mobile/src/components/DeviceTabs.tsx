import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "./AppText";
import { fonts, theme } from "@/theme";
import { usePreferences } from "@/preferences";
import { deviceCopy } from "@/i18n/devices";

export function DeviceTabs({ selected, onSelect }: { selected: "band" | "scale"; onSelect: (value: "band" | "scale") => void }) {
  const t = deviceCopy(usePreferences().locale);
  return <View style={s.tabs} accessibilityRole="tablist">{(["band", "scale"] as const).map(key => <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: key === selected }} onPress={() => onSelect(key)} style={s.tab}><Text style={[s.label, selected === key && s.active]}>{t[key]}</Text><View style={[s.line, selected === key && s.selected]} /></Pressable>)}</View>;
}
const s = StyleSheet.create({
  tabs: { flexDirection: "row", alignSelf: "center", gap: 36, marginTop: 8, marginBottom: 26, backgroundColor: "transparent" },
  tab: { minWidth: 80, minHeight: 46, alignItems: "center", justifyContent: "center", backgroundColor: "transparent" },
  label: { color: theme.muted, fontFamily: fonts.black, fontSize: 15 }, active: { color: theme.ink },
  line: { height: 2, width: 22, marginTop: 10, borderRadius: 1, backgroundColor: "transparent" }, selected: { backgroundColor: theme.accent },
});
