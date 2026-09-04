import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/components/AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { deleteAddress, getAddresses, type SavedAddress } from "@/api";
import { ModalHeader } from "@/components/ModalHeader";
import { TerrifitSpinner } from "@/components/TerrifitSpinner";
import { useSession } from "@/session";
import { fonts, theme } from "@/theme";

/**
 * The address book.
 *
 * Read-only apart from deleting: addresses are added at checkout, where
 * somebody is already typing one, rather than through a form they would have
 * to seek out and fill in for no immediate reason.
 */
export default function AddressesScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useSession();
  const [addresses, setAddresses] = useState<SavedAddress[] | null>(null);

  const load = useCallback(() => {
    void getAddresses(token)
      .then((result) => setAddresses(result.addresses))
      .catch(() => setAddresses([]));
  }, [token]);

  // Loaded on first render via the ref callback rather than an effect, which
  // this codebase does not allow to call setState.
  const [started, setStarted] = useState(false);
  if (!started) {
    setStarted(true);
    load();
  }

  function remove(address: SavedAddress) {
    Alert.alert("Remove this address?", `${address.line1}, ${address.city}`, [
      { text: "Keep", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          // Optimistic: the row goes now and comes back if the server disagrees.
          setAddresses((current) => (current ?? []).filter((item) => item.id !== address.id));
          void deleteAddress(token, address.id).catch(load);
        },
      },
    ]);
  }

  return (
    <View style={s.page}>
      <ModalHeader title="Addresses" />

      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}>
        {addresses === null ? (
          <View style={s.centre}>
            <TerrifitSpinner />
          </View>
        ) : addresses.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>No addresses saved</Text>
            <Text style={s.emptyBody}>
              Tick &ldquo;save this address&rdquo; when you order something and it will be here next time.
            </Text>
          </View>
        ) : (
          addresses.map((address) => (
            <View key={address.id} style={s.card}>
              <View style={s.flex}>
                <View style={s.headRow}>
                  <Text style={s.name}>{address.name}</Text>
                  {address.isDefault ? <Text style={s.default}>Default</Text> : null}
                </View>
                <Text style={s.lines}>
                  {[address.line1, address.line2, address.city, address.postcode, address.country]
                    .filter(Boolean)
                    .join("\n")}
                </Text>
                {address.phone ? <Text style={s.phone}>{address.phone}</Text> : null}
              </View>

              <Pressable onPress={() => remove(address)} hitSlop={10}>
                <Text style={s.remove}>Remove</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bg },
  flex: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 16 },
  centre: { alignItems: "center", paddingVertical: 40 },
  empty: { paddingVertical: 40, alignItems: "center" },
  emptyTitle: { color: theme.ink, fontSize: 17, fontFamily: fonts.black, fontWeight: "900" },
  emptyBody: { color: theme.muted, fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 9, maxWidth: 280 },
  card: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    borderRadius: 18, borderWidth: 1, borderColor: theme.line,
    backgroundColor: theme.surface, padding: 16, marginBottom: 10,
  },
  headRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  name: { color: theme.ink, fontSize: 15, fontFamily: fonts.black, fontWeight: "900" },
  default: {
    color: theme.accent, fontSize: 9, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1,
    textTransform: "uppercase", borderWidth: 1, borderColor: theme.accent,
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  lines: { color: theme.ink2, fontSize: 13, lineHeight: 19, marginTop: 8 },
  phone: { color: theme.muted, fontSize: 12, marginTop: 6 },
  remove: { color: theme.poor, fontSize: 12, fontFamily: fonts.black, fontWeight: "800" },
});
