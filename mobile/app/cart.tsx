import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/components/AppText";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type TogetherProduct } from "@/api";
import { ProductImage } from "@/components/ProductImage";
import { useCart } from "@/cart";
import { useTogether } from "@/data";
import { fonts, display, scheme, theme } from "@/theme";
import { ModalHeader } from "@/components/ModalHeader";
import { usePreferences } from "@/preferences";
import { commerceCopy, type CommerceCopy } from "@/i18n/commerce";

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cart = useCart();
  const preferences = usePreferences();
  const copy = commerceCopy[preferences.locale];
  const money = preferences.money;
  const together = useTogether(cart.lines.map((line) => line.slug));

  return (
    <View style={s.page}>
      <ModalHeader title={`${copy.yourBag} · ${preferences.currencyCode}`}
        left={<Pressable onPress={cart.clear} hitSlop={10} disabled={cart.lines.length === 0}><Text style={[s.clear, cart.lines.length === 0 && s.dim]}>{copy.clear}</Text></Pressable>}
      />

      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 200 }]}>
        {cart.lines.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>{copy.emptyBag}</Text>
            <Text style={s.emptyBody}>{copy.emptyBagBody}</Text>
            <Pressable onPress={() => router.replace("/shop" as never)} style={s.primary}>
              <Text style={s.primaryText}>{copy.openShop}</Text>
            </Pressable>
          </View>
        ) : null}

        {cart.lines.map((line) => (
          <View key={`${line.slug}-${line.variantId ?? ""}`} style={s.line}>
            <ProductImage uri={line.image} name={line.name} style={s.thumb} />
            <View style={s.flex}>
              <Text style={s.name}>{line.name}</Text>
              {line.variantLabel ? <Text style={s.variant}>{line.variantLabel}</Text> : null}
              <Text style={s.price}>{money(line.priceCents)}</Text>
              <View style={s.stepper}>
                <Pressable
                  onPress={() => cart.setQuantity(line.slug, line.variantId, line.quantity - 1)}
                  style={s.step}
                  accessibilityLabel={`${copy.fewer} ${line.name}`}
                >
                  <Text style={s.stepText}>−</Text>
                </Pressable>
                <Text style={s.quantity}>{line.quantity}</Text>
                <Pressable
                  onPress={() => cart.setQuantity(line.slug, line.variantId, line.quantity + 1)}
                  style={s.step}
                  accessibilityLabel={`${copy.more} ${line.name}`}
                >
                  <Text style={s.stepText}>+</Text>
                </Pressable>
                <Pressable onPress={() => cart.remove(line.slug, line.variantId)} style={s.removeButton}>
                  <Text style={s.remove}>{copy.remove}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}

        {cart.lines.length > 0 && (together.data?.products.length ?? 0) > 0 ? (
          <View style={s.together}>
            <Text style={s.togetherTitle}>{copy.boughtTogether}</Text>
            <Text style={s.togetherNote}>
              {together.data?.basis === "orders"
                ? copy.pastOrders(together.data.sampleSize)
                : copy.pickedTogether}
            </Text>
            {together.data?.products.map((item) => (
              <Suggestion
                key={item.slug}
                item={item}
                onAdd={() =>
                  cart.add({
                    slug: item.slug,
                    variantId: item.variantId,
                    name: item.name,
                    variantLabel: item.variantLabel,
                    priceCents: item.priceCents,
                    image: item.image,
                  })
                }
                onOpen={() => router.push(`/product/${item.slug}` as never)}
                copy={copy}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>

      {cart.lines.length > 0 ? (
        <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          {/* The total is the last thing read before paying, so it gets its
              own block: centred, on the opposite ground to the page, with the
              figure in the accent. Inverted in dark mode so the contrast holds
              either way round. */}
          <View style={s.totalBox}>
            <Text style={s.totalLabel}>{copy.subtotal}</Text>
            <Text style={s.totalValue}>{money(cart.subtotalCents)}</Text>
            <Text style={s.totalNote}>{copy.taxShipping}</Text>
          </View>
          <Pressable onPress={() => router.push("/checkout" as never)} style={s.primary}>
            <Text style={s.primaryText}>{copy.checkout}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

/**
 * One suggestion.
 *
 * Anything with a choice to make opens its page instead of dropping a guessed
 * variant into the bag — picking someone's colourway for them is how a strap
 * gets returned.
 */
function Suggestion({
  item,
  onAdd,
  onOpen,
  copy,
}: {
  item: TogetherProduct;
  onAdd: () => void;
  onOpen: () => void;
  copy: CommerceCopy;
}) {
  return (
    <Pressable onPress={onOpen} style={s.suggestion}>
      <ProductImage uri={item.image} name={item.name} style={s.suggestionThumb} />
      <View style={s.flex}>
        <Text style={s.suggestionName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={s.suggestionTagline} numberOfLines={2}>
          {item.tagline}
        </Text>
        <Text style={s.suggestionPrice}>{item.price}</Text>
      </View>
      <Pressable
        onPress={item.needsChoice ? onOpen : onAdd}
        style={s.suggestionAdd}
        accessibilityLabel={item.needsChoice ? `Choose options for ${item.name}` : `Add ${item.name}`}
      >
        <Text style={s.suggestionAddText}>{item.needsChoice ? copy.choose : copy.add}</Text>
      </Pressable>
    </Pressable>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bg },
  flex: { flex: 1 },
  top: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.line,
  },
  close: { color: theme.accent, fontSize: 14, fontFamily: fonts.bold, fontWeight: "700" },
  topTitle: { color: theme.ink, fontSize: 11, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase" },
  clear: { color: theme.ink2, fontSize: 13, fontFamily: fonts.bold, fontWeight: "700" },
  dim: { opacity: 0.35 },
  content: { paddingHorizontal: 18, paddingTop: 14 },
  line: { flexDirection: "row", gap: 14, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.line },
  thumb: { width: 84, height: 84, borderRadius: 16 },
  name: { color: theme.ink, fontSize: 15, fontFamily: fonts.black, fontWeight: "900" },
  variant: { color: theme.muted, fontSize: 12, marginTop: 3 },
  price: { color: theme.ink2, fontSize: 14, fontFamily: fonts.bold, fontWeight: "700", marginTop: 6 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  step: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: theme.lineStrong,
    alignItems: "center", justifyContent: "center",
  },
  stepText: { color: theme.ink, fontSize: 16, fontFamily: fonts.black, fontWeight: "900" },
  quantity: { color: theme.ink, fontSize: 15, fontFamily: fonts.black, fontWeight: "900", minWidth: 20, textAlign: "center" },
  removeButton: { marginLeft: "auto" },
  remove: { color: theme.muted, fontSize: 12, fontFamily: fonts.bold, fontWeight: "700" },
  together: { marginTop: 26 },
  togetherTitle: { color: theme.accent, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase" },
  togetherNote: { color: theme.muted, fontSize: 11, lineHeight: 16, marginTop: 6, marginBottom: 14 },
  suggestion: {
    flexDirection: "row", alignItems: "center", gap: 12, padding: 11, marginBottom: 10,
    borderRadius: 18, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface,
  },
  suggestionThumb: { width: 62, height: 62, borderRadius: 13 },
  suggestionName: { color: theme.ink, fontSize: 14, fontFamily: fonts.black, fontWeight: "900" },
  suggestionTagline: { color: theme.muted, fontSize: 11, lineHeight: 15, marginTop: 3 },
  suggestionPrice: { color: theme.ink2, fontSize: 12, fontFamily: fonts.black, fontWeight: "800", marginTop: 5 },
  suggestionAdd: { borderRadius: 999, borderWidth: 1, borderColor: theme.accent, paddingHorizontal: 15, paddingVertical: 9 },
  suggestionAddText: { color: theme.accent, fontSize: 11, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 0.6, textTransform: "uppercase" },
  empty: { alignItems: "center", paddingVertical: 60 },
  emptyTitle: { color: theme.ink, fontFamily: display, fontSize: 24, textTransform: "uppercase" },
  emptyBody: { color: theme.ink2, fontSize: 13, marginTop: 8, textAlign: "center" },
  footer: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    paddingHorizontal: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.line, backgroundColor: theme.surface,
  },
  totalBox: {
    alignItems: "center",
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    // Black card in light mode, white in dark: the opposite of whatever the
    // page is, so the total separates from the list above it.
    backgroundColor: scheme === "light" ? "#0d0e10" : "#f4f5f7",
  },
  totalLabel: {
    color: scheme === "light" ? "rgba(255,255,255,0.62)" : "rgba(0,0,0,0.55)",
    fontSize: 11, fontFamily: fonts.black, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase",
  },
  totalValue: { color: theme.accent, fontFamily: display, fontSize: 40, marginTop: 6 },
  totalNote: {
    color: scheme === "light" ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)",
    fontSize: 11, marginTop: 8, textAlign: "center",
  },
  primary: { height: 52, borderRadius: 26, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center", marginTop: 16 },
  primaryText: { color: "#fff", fontSize: 11, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
});
