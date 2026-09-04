import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, SafeAreaView, StyleSheet, TextInput, View } from "react-native";
import { Text } from "@/components/AppText";
import { MARKET_CODES } from "@/market";
import { usePreferences } from "@/preferences";
import { body, bodyBold, bodySemibold, theme } from "@/theme";

export function CountryPicker({ open, onClose }: { open: boolean; onClose: () => void }) {
  const preferences = usePreferences();
  const [query, setQuery] = useState("");
  const countries = useMemo(() => {
    const named = MARKET_CODES.map((code) => ({ code, name: preferences.countryName(code) }));
    const q = query.trim().toLocaleLowerCase();
    return named
      .filter((item) => !q || item.name.toLocaleLowerCase().includes(q) || item.code.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, preferences.locale));
  }, [preferences, query]);

  return (
    <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={s.page}>
        <View style={s.header}>
          <Text style={s.title}>{preferences.t("chooseCountry")}</Text>
          <Pressable onPress={onClose} hitSlop={12}><Text style={s.done}>{preferences.t("done")}</Text></Pressable>
        </View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={preferences.t("searchCountry")}
          placeholderTextColor={theme.muted}
          autoCapitalize="none"
          autoCorrect={false}
          style={s.search}
        />
        <FlatList
          data={countries}
          keyExtractor={(item) => item.code}
          contentContainerStyle={s.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const selected = preferences.countryCode === item.code;
            return (
              <Pressable
                onPress={() => void preferences.setMarket(item.code).then(onClose)}
                style={[s.row, selected && s.rowOn]}
              >
                <Text style={[s.rowCode, selected && s.rowTextOn]}>{item.code}</Text>
                <Text style={[s.rowName, selected && s.rowTextOn]}>{item.name}</Text>
                {selected ? <Text style={s.check}>✓</Text> : null}
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

export function CurrencyPicker({ open, onClose }: { open: boolean; onClose: () => void }) {
  const preferences = usePreferences();
  return (
    <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={s.page}>
        <View style={s.header}>
          <Text style={s.title}>{preferences.t("paymentCurrency")}</Text>
          <Pressable onPress={onClose} hitSlop={12}><Text style={s.done}>{preferences.t("done")}</Text></Pressable>
        </View>
        <Text style={s.note}>{preferences.t("currencyNote")}</Text>
        <FlatList
          data={preferences.currencies}
          keyExtractor={(item) => item.code}
          numColumns={2}
          columnWrapperStyle={s.columns}
          contentContainerStyle={s.list}
          renderItem={({ item }) => {
            const selected = preferences.currencyCode === item.code;
            return (
              <Pressable
                onPress={() => void preferences.setCurrency(item.code).then(onClose)}
                style={[s.currency, selected && s.rowOn]}
              >
                <Text style={[s.currencySymbol, selected && s.rowTextOn]}>{item.symbol}</Text>
                <View style={s.grow}>
                  <Text style={[s.currencyCode, selected && s.rowTextOn]}>{item.code}</Text>
                  <Text style={s.currencyExample}>{preferences.money(item.decimals === 0 ? 1000 : 4999, item.code)}</Text>
                </View>
                {selected ? <Text style={s.check}>✓</Text> : null}
              </Pressable>
            );
          }}
        />
        <Text style={s.appStoreNote}>{preferences.t("appStoreCurrencyNote")}</Text>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bg },
  header: { minHeight: 64, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: theme.line },
  title: { flex: 1, color: theme.ink, fontFamily: bodyBold, fontSize: 18 },
  done: { color: theme.accent, fontFamily: bodyBold, fontSize: 13 },
  search: { height: 48, margin: 16, borderRadius: 24, borderWidth: 1, borderColor: theme.lineStrong, backgroundColor: theme.surface, color: theme.ink, paddingHorizontal: 17, fontFamily: body, fontSize: 14 },
  note: { color: theme.ink2, fontFamily: body, fontSize: 12, lineHeight: 18, paddingHorizontal: 20, paddingTop: 16 },
  list: { paddingHorizontal: 16, paddingBottom: 30 },
  row: { minHeight: 54, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: theme.line, paddingHorizontal: 12 },
  rowOn: { borderColor: theme.accent, backgroundColor: theme.accentSoft },
  rowCode: { width: 46, color: theme.muted, fontFamily: bodyBold, fontSize: 11, letterSpacing: 1 },
  rowName: { flex: 1, color: theme.ink, fontFamily: bodySemibold, fontSize: 14 },
  rowTextOn: { color: theme.accent },
  check: { color: theme.accent, fontFamily: bodyBold, fontSize: 14 },
  columns: { gap: 9 },
  currency: { flex: 1, minHeight: 76, marginTop: 9, borderRadius: 18, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, flexDirection: "row", alignItems: "center", padding: 13 },
  currencySymbol: { width: 33, color: theme.ink2, fontFamily: bodyBold, fontSize: 15 },
  grow: { flex: 1 },
  currencyCode: { color: theme.ink, fontFamily: bodyBold, fontSize: 13 },
  currencyExample: { color: theme.muted, fontFamily: body, fontSize: 10, marginTop: 4 },
  appStoreNote: { color: theme.muted, fontFamily: body, fontSize: 10, lineHeight: 15, margin: 20, padding: 14, borderRadius: 14, backgroundColor: theme.surface },
});

