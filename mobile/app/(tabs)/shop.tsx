import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Text } from "@/components/AppText";
import { useRouter } from "expo-router";
import { type ShopColourway, type ShopProduct } from "@/api";
import { AppHeader } from "@/components/AppHeader";
import { CartButton } from "@/components/CartButton";
import { Colourway } from "@/components/Colourway";
import { ProductImage } from "@/components/ProductImage";
import { Screen } from "@/components/Screen";
import { Stars } from "@/components/Reviews";
import { useNotifications, useShop } from "@/data";
import { fonts, theme } from "@/theme";
import { CurrencyPicker } from "@/components/MarketPicker";
import { usePreferences } from "@/preferences";
import { commerceCategories, commerceCopy, type CommerceCopy } from "@/i18n/commerce";

/**
 * Fuel.
 *
 * A shop is a place people arrive at knowing what they want, so search comes
 * first and everything else is a way of browsing when they don't. The old
 * layout opened with a poster and buried the products under four horizontal
 * rails; this opens with the search field and puts the catalogue directly
 * beneath it.
 */
export default function ShopScreen() {
  const router = useRouter();
  const shop = useShop();
  const notices = useNotifications();
  const preferences = usePreferences();
  const copy = commerceCopy[preferences.locale];
  const categoryNames = commerceCategories[preferences.locale];

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [currencyOpen, setCurrencyOpen] = useState(false);

  const all = shop.data?.products ?? [];
  const categories = ["all", ...(shop.data?.categories ?? [])];

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((product) => {
      if (category !== "all" && product.category !== category) return false;
      if (!q) return true;
      // Searching the tagline and brand too, because people look for "protein"
      // and "magnesium" far more often than they look for a product's name.
      return [product.name, product.brand, product.tagline, product.category, ...product.badges]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [all, category, query]);

  const searching = query.trim().length > 0;

  const recommended = useMemo(() => {
    const slugs = shop.data?.recommended ?? [];
    return slugs
      .map((slug) => all.find((item) => item.slug === slug))
      .filter((item): item is ShopProduct => item != null);
  }, [shop.data, all]);

  return (
    <Screen
      eyebrow={copy.shopEyebrow}
      title={copy.shopTitle}
      titleAction={<View style={s.titleActions}><Pressable onPress={()=>setCurrencyOpen(true)} style={s.currencyButton}><Text style={s.currencyText}>{preferences.currencyCode}</Text></Pressable><CartButton /></View>}
      refreshing={shop.refreshing}
      onRefresh={shop.reload}
      header={<AppHeader unread={notices.data?.unread ?? 0}/>}
    >
      <View style={s.search}>
        <Text style={s.searchIcon}>⌕</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={preferences.t("searchProducts")}
          placeholderTextColor={theme.muted}
          style={s.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.categories}
      >
        {categories.map((item) => (
          <Pressable
            key={item}
            onPress={() => setCategory(item)}
            style={[s.category, category === item && s.categoryOn]}
          >
            <Text style={[s.categoryText, category === item && s.categoryTextOn]}>{categoryNames[item] ?? item}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {shop.error ? <Text style={s.offline}>{copy.offline}</Text> : null}

      {searching ? (
        <Text style={s.resultCount}>
          {results.length} {results.length === 1 ? copy.result : copy.results} {copy.forQuery} “{query.trim()}”
        </Text>
      ) : null}

      <View style={s.grid}>
        {results.map((product) => (
          <ProductCard key={product.slug} product={product} copy={copy} onPress={() => router.push(`/product/${product.slug}` as never)} />
        ))}
      </View>

      {results.length === 0 && !shop.loading ? (
        <View style={s.empty}>
          <Text style={s.emptyTitle}>{copy.noMatch}</Text>
          <Text style={s.emptyBody}>{copy.noMatchBody}</Text>
          <Pressable
            onPress={() => {
              setQuery("");
              setCategory("all");
            }}
            style={s.clear}
          >
            <Text style={s.clearText}>{copy.showAll}</Text>
          </Pressable>
        </View>
      ) : null}

      {/* The browsing rails sit under the catalogue, not above it — they are
          for people who did not arrive with something in mind. */}
      {!searching ? (
        <>
          {shop.data?.yourBand ? (
            <View style={s.owned}>
              <ProductImage
                uri={shop.data.yourBand.image ?? "/media/terrifit-band-new.png"}
                name={shop.data.yourBand.label}
                style={s.ownedImage}
              />
              <View style={s.flex}>
                <Text style={s.ownedLabel}>{copy.yourV1}</Text>
                <Text style={[s.ownedName, shop.data.yourBand.accent ? { color: shop.data.yourBand.accent } : null]}>
                  {shop.data.yourBand.label}
                </Text>
                <Text style={s.ownedSerial}>{shop.data.yourBand.serial}</Text>
              </View>
            </View>
          ) : null}

          {recommended.length > 0 ? (
            <>
              <Text style={s.section}>{preferences.t("pickedForYou")}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.recRow}>
                {recommended.map((product) => (
                  <Pressable
                    key={product.slug}
                    onPress={() => router.push(`/product/${product.slug}` as never)}
                    style={s.rec}
                  >
                    <ProductImage uri={product.image} name={product.name} style={s.recImage} />
                    <Text numberOfLines={1} style={s.recName}>{product.name}</Text>
                    <Text style={s.recPrice}>{product.price}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          ) : null}

          {shop.data?.colourways?.length ? (
            <>
              <Text style={s.section}>{preferences.t("straps")}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.swatchRow}
              >
                {shop.data.colourways.map((colour) => (
                  <StrapSwatch
                    key={colour.id}
                    colour={colour}
                    owned={shop.data?.yourBand?.colourway === colour.id}
                    copy={copy}
                    onPress={() => router.push("/product/v1-strap" as never)}
                  />
                ))}
              </ScrollView>
              <Pressable onPress={() => router.push("/product/v1-bicep-strap" as never)} style={s.bicep}>
                <View style={s.flex}>
                  <Text style={s.bicepTitle}>{copy.bicepTitle}</Text>
                  <Text style={s.bicepBody}>{copy.bicepBody}</Text>
                </View>
                <Text style={s.bicepArrow}>›</Text>
              </Pressable>
            </>
          ) : null}
        </>
      ) : null}
      <CurrencyPicker open={currencyOpen} onClose={()=>setCurrencyOpen(false)}/>
    </Screen>
  );
}

/** One product. Fixed proportions so a grid of them reads as a grid. */
function ProductCard({ product, copy, onPress }: { product: ShopProduct; copy: CommerceCopy; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={s.card}>
      <ProductImage uri={product.image} name={product.name} style={s.imageWrap} />
      <View style={s.badge}>
        <Text style={s.badgeText}>{product.partner ? copy.partner : copy.original}</Text>
      </View>
      {product.compareAt ? (
        <View style={s.saveBadge}>
          <Text style={s.saveText}>{copy.save}</Text>
        </View>
      ) : null}

      <View style={s.copy}>
        <Text style={s.brand} numberOfLines={1}>{product.brand}</Text>
        <Text numberOfLines={2} style={s.name}>{product.name}</Text>
        <Text numberOfLines={2} style={s.tagline}>{product.tagline}</Text>

        <View style={s.priceRow}>
          <View style={s.priceStack}>
            <Text style={s.price}>{product.price}</Text>
            {product.compareAt ? <Text style={s.compare}>{product.compareAt}</Text> : null}
          </View>
          <Stars rating={product.rating} size={10} />
        </View>
      </View>
    </Pressable>
  );
}

/** The colourway as the weave, not as a photograph of the weave. */
function StrapSwatch({
  colour, owned, copy, onPress,
}: {
  colour: ShopColourway;
  owned: boolean;
  copy: CommerceCopy;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={s.swatch}>
      <Colourway colours={colour.swatchColours} size={62} selected={owned} />
      <Text style={[s.swatchName, colour.accent ? { color: colour.accent } : null]} numberOfLines={1}>
        {colour.label}
      </Text>
      <Text style={s.swatchNote} numberOfLines={1}>{owned ? copy.yours : copy.woven}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  titleActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  currencyButton: { height: 34, minWidth: 52, borderRadius: 17, borderWidth: 1, borderColor: theme.lineStrong, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
  currencyText: { color: theme.ink, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: .6 },

  search: {
    flexDirection: "row", alignItems: "center", gap: 10,
    height: 50, borderRadius: 25, paddingHorizontal: 18,
    borderWidth: 1, borderColor: theme.lineStrong, backgroundColor: theme.surface,
  },
  searchIcon: { color: theme.muted, fontSize: 20, marginTop: -2 },
  searchInput: { flex: 1, color: theme.ink, fontSize: 15 },

  categories: { gap: 8, paddingVertical: 16 },
  category: {
    height: 34, borderRadius: 17, borderWidth: 1, borderColor: theme.line,
    paddingHorizontal: 15, justifyContent: "center",
  },
  categoryOn: { backgroundColor: theme.ink, borderColor: theme.ink },
  categoryText: { color: theme.ink2, fontSize: 11, fontFamily: fonts.black, fontWeight: "900", textTransform: "capitalize", letterSpacing: 0.4 },
  categoryTextOn: { color: theme.bg },


  resultCount: { color: theme.muted, fontSize: 12, marginBottom: 12 },
  offline: { color: theme.fair, fontSize: 12, marginBottom: 12 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: {
    width: "48.5%", borderRadius: 22, borderWidth: 1, borderColor: theme.line,
    backgroundColor: theme.surface, overflow: "hidden",
  },
  imageWrap: { height: 165 },
  badge: {
    position: "absolute", top: 9, left: 9, paddingHorizontal: 7, paddingVertical: 5,
    borderRadius: 6, backgroundColor: "rgba(8,9,10,.78)",
  },
  badgeText: { color: "#fff", fontSize: 9, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1 },
  saveBadge: {
    position: "absolute", top: 9, right: 9, paddingHorizontal: 7, paddingVertical: 5,
    borderRadius: 6, backgroundColor: theme.accent,
  },
  saveText: { color: "#fff", fontSize: 9, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1 },
  copy: { padding: 13 },
  brand: { color: theme.accent, fontSize: 9, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.1, textTransform: "uppercase" },
  name: { color: theme.ink, fontSize: 15, fontFamily: fonts.black, fontWeight: "800", marginTop: 6, lineHeight: 19 },
  tagline: { color: theme.muted, fontSize: 10, lineHeight: 14, marginTop: 4, minHeight: 28 },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 11 },
  priceStack: { flex: 1 },
  price: { color: theme.ink, fontSize: 14, fontFamily: fonts.black, fontWeight: "900" },
  compare: { color: theme.muted, fontSize: 10, textDecorationLine: "line-through", marginTop: 2 },

  empty: { paddingVertical: 40, alignItems: "center" },
  emptyTitle: { color: theme.ink, fontSize: 17, fontFamily: fonts.black, fontWeight: "900" },
  emptyBody: { color: theme.muted, fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 9, maxWidth: 280 },
  clear: {
    marginTop: 18, height: 44, borderRadius: 22, paddingHorizontal: 24,
    borderWidth: 1, borderColor: theme.accent, alignItems: "center", justifyContent: "center",
  },
  clearText: { color: theme.accent, fontSize: 11, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },

  section: {
    color: theme.accent, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.5,
    textTransform: "uppercase", marginTop: 30, marginBottom: 14,
  },

  owned: {
    flexDirection: "row", alignItems: "center", gap: 14, marginTop: 26, padding: 14,
    borderRadius: 22, borderWidth: 1, borderColor: theme.lineStrong, backgroundColor: theme.surface,
  },
  ownedImage: { width: 72, height: 72, borderRadius: 16 },
  ownedLabel: { color: theme.muted, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.3, textTransform: "uppercase" },
  ownedName: { color: theme.ink, fontSize: 18, fontFamily: fonts.black, fontWeight: "900", marginTop: 5 },
  ownedSerial: { color: theme.muted, fontSize: 10, marginTop: 3 },

  recRow: { gap: 10, paddingRight: 18 },
  rec: { width: 124 },
  recImage: { height: 118, borderRadius: 16 },
  recName: { color: theme.ink, fontSize: 12, fontFamily: fonts.black, fontWeight: "800", marginTop: 8 },
  recPrice: { color: theme.muted, fontSize: 11, fontFamily: fonts.bold, fontWeight: "700", marginTop: 3 },

  swatchRow: { gap: 12, paddingHorizontal: 2, paddingRight: 18, paddingVertical: 4 },
  swatch: { alignItems: "center", width: 74 },
  swatchName: { color: theme.ink, fontSize: 12, fontFamily: fonts.black, fontWeight: "900", marginTop: 9 },
  swatchNote: { color: theme.muted, fontSize: 10, marginTop: 2 },

  bicep: {
    flexDirection: "row", alignItems: "center", gap: 12, marginTop: 20, padding: 15,
    borderRadius: 20, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface,
  },
  bicepTitle: { color: theme.ink, fontSize: 14, fontFamily: fonts.black, fontWeight: "900" },
  bicepBody: { color: theme.muted, fontSize: 11, lineHeight: 16, marginTop: 5 },
  bicepArrow: { color: theme.accent, fontSize: 24 },
});
