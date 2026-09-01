import { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type ShopVariant } from "@/api";
import { ColourwayPicker } from "@/components/Colourway";
import { ProductImage } from "@/components/ProductImage";
import { ReviewSummary } from "@/components/Reviews";
import { useCart } from "@/cart";
import { useShop } from "@/data";
import { display, theme } from "@/theme";

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const shop = useShop();
  const cart = useCart();

  const scrollY = useRef(new Animated.Value(0)).current;
  const product = shop.data?.products.find((item) => item.slug === slug);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const variant: ShopVariant | null = useMemo(() => {
    if (!product || product.variants.length === 0) return null;
    return product.variants.find((item) => item.id === variantId) ?? product.variants[0];
  }, [product, variantId]);

  // A colourway variant carries its own photograph; sizes do not.
  const image = colourwayImage(shop.data?.colourways ?? [], variant) ?? product?.image ?? null;
  const needsChoice = Boolean(product && product.variants.length > 1 && variantId === null);

  function add() {
    if (!product) return;
    cart.add({
      slug: product.slug,
      variantId: variant?.id ?? null,
      name: product.name,
      variantLabel: variant?.label ?? null,
      priceCents: product.priceCents,
      image,
    });
    setAdded(true);
  }

  return (
    <View style={s.page}>
      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
      >
        <ProductImage uri={image} name={product?.name ?? "Terrifit"} style={s.imageWrap} />

        {shop.loading && !product ? <ActivityIndicator color={theme.accent} style={{ marginTop: 60 }} /> : null}

        {product ? (
          <View style={s.content}>
            {product.variants.length > 0 ? (
              <ColourwayPicker
                variants={product.variants}
                selectedId={variantId}
                onSelect={(id) => {
                  setVariantId(id);
                  setAdded(false);
                }}
                label={
                  needsChoice
                    ? `${product.variants.length > 1 ? "Colourway" : "Option"} · required`
                    : product.variants.length > 1
                      ? "Colourway"
                      : "Option"
                }
              />
            ) : null}

            <Text style={[s.brand, product.variants.length > 0 && s.brandAfterPicker]}>
              {product.brand} · {product.partner ? "Verified partner" : "Terrifit original"}
            </Text>
            <Text style={s.title}>{product.name}</Text>
            <Text style={s.tagline}>{product.tagline}</Text>

            <ReviewSummary slug={product.slug} />

            <View style={s.priceRow}>
              <Text style={s.price}>{variant?.price ?? product.price}</Text>
              {product.compareAt ? <Text style={s.compare}>{product.compareAt}</Text> : null}

            </View>

            <Text style={s.description}>{product.description}</Text>

            {product.highlights.length > 0 ? (
              <View style={s.highlights}>
                {product.highlights.map((item) => (
                  <View key={item} style={s.highlight}>
                    <Text style={s.check}>✓</Text>
                    <Text style={s.highlightText}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {product.specGroups && product.specGroups.length > 0 ? (
              <>
                <Text style={s.section}>The full spec sheet</Text>
                {product.specGroups.map((group) => (
                  <View key={group.title} style={s.specGroup}>
                    <Text style={s.specGroupTitle}>{group.title}</Text>
                    <View style={s.specs}>
                      {group.rows.map(([key, value]) => (
                        <View key={key} style={s.spec}>
                          <Text style={s.specKey}>{key}</Text>
                          <Text style={s.specValue}>{value}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </>
            ) : product.specs.length > 0 ? (
              <>
                <Text style={s.section}>Specification</Text>
                <View style={s.specs}>
                  {product.specs.map(([key, value]) => (
                    <View key={key} style={s.spec}>
                      <Text style={s.specKey}>{key}</Text>
                      <Text style={s.specValue}>{value}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}

            <Text style={s.ship}>{product.shipsIn}</Text>
          </View>
        ) : shop.error ? (
          <View style={s.content}>
            <Text style={s.title}>Unavailable</Text>
            <Text style={s.description}>We couldn&apos;t load this product. Pull back and try again.</Text>
          </View>
        ) : null}
      </Animated.ScrollView>

      {/* Transparent while the product is behind it, then a solid bar with the
          product's name once you have scrolled past the image — otherwise the
          copy scrolls underneath two floating circles and looks broken. */}
      <Animated.View
        pointerEvents="none"
        style={[
          s.topFill,
          {
            height: insets.top + 54,
            opacity: scrollY.interpolate({ inputRange: [IMAGE_HEIGHT - 140, IMAGE_HEIGHT - 60], outputRange: [0, 1], extrapolate: "clamp" }),
          },
        ]}
      >
        <Animated.Text numberOfLines={1} style={[s.topName, { marginTop: insets.top + 8 }]}>
          {product?.name ?? ""}
        </Animated.Text>
      </Animated.View>

      <View pointerEvents="box-none" style={[s.topBar, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} style={s.circle} accessibilityLabel="Back">
          <Text style={s.circleText}>‹</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/cart" as never)} style={s.circle} accessibilityLabel="Bag">
          <Text style={s.bagText}>◻</Text>
          {cart.count > 0 ? (
            <View style={s.badge}>
              <Text style={s.badgeText}>{cart.count > 9 ? "9+" : cart.count}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {product ? (
        <View style={[s.buyBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          {added ? (
            <Pressable onPress={() => router.push("/cart" as never)} style={[s.buy, s.buyDone]}>
              <Text style={s.buyText}>In your bag · View</Text>
            </Pressable>
          ) : (
            <Pressable onPress={add} disabled={needsChoice} style={[s.buy, needsChoice && s.dim]}>
              <Text style={s.buyText}>
                {needsChoice ? "Choose an option" : `Add to bag · ${variant?.price ?? product.price}`}
              </Text>
            </Pressable>
          )}
        </View>
      ) : null}
    </View>
  );
}

/** Colourway variants share ids with the band colourways, which carry the art. */
function colourwayImage(
  colourways: Array<{ id: string; image: string | null }>,
  variant: ShopVariant | null,
): string | null {
  if (!variant) return null;
  return colourways.find((colour) => colour.id === variant.id)?.image ?? null;
}

/** Height of the product shot, and the distance the header collapses over. */
const IMAGE_HEIGHT = 430;

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bg },
  topFill: {
    position: "absolute", top: 0, left: 0, right: 0,
    backgroundColor: theme.bg, borderBottomWidth: 1, borderBottomColor: theme.line,
    alignItems: "center",
  },
  topName: { color: theme.ink, fontSize: 13, fontWeight: "900", letterSpacing: 0.6, maxWidth: "58%" },
  topBar: {
    position: "absolute", top: 0, left: 0, right: 0,
    flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16,
  },
  circle: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(8,9,10,0.55)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center",
  },
  circleText: { color: "#fff", fontSize: 22, fontWeight: "900", lineHeight: 24, marginTop: -2 },
  bagText: { color: "#fff", fontSize: 16 },
  badge: {
    position: "absolute", top: -3, right: -3, minWidth: 19, height: 19, borderRadius: 10,
    backgroundColor: theme.accent, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 4, borderWidth: 2, borderColor: theme.bg,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "900" },
  imageWrap: { height: IMAGE_HEIGHT },
  // `contain`, not `cover`: these are product photographs on a plain ground and
  // cropping them cuts the clasp off the end of the strap.
  content: { paddingHorizontal: 20, paddingTop: 22 },
  brand: { color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.4, textTransform: "uppercase" },
  title: { color: theme.ink, fontFamily: display, fontSize: 38, textTransform: "uppercase", marginTop: 8 },
  tagline: { color: theme.ink2, fontSize: 15, lineHeight: 22, marginTop: 6 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 12, marginTop: 18, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: theme.line },
  price: { color: theme.ink, fontFamily: display, fontSize: 32 },
  compare: { color: theme.muted, fontSize: 15, textDecorationLine: "line-through" },
  brandAfterPicker: { marginTop: 24 },
  section: { color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase", marginTop: 24, marginBottom: 12 },
  // The straps are near-black products; on a dark card they need a lit stage
  // to be distinguishable from each other at thumbnail size.
  description: { color: theme.ink2, fontSize: 14, lineHeight: 22, marginTop: 22 },
  highlights: { marginTop: 18, gap: 10 },
  highlight: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  check: { color: theme.good, fontSize: 13, fontWeight: "900" },
  highlightText: { color: theme.ink, fontSize: 13, lineHeight: 19, flex: 1 },
  specGroup: { marginBottom: 14 },
  specGroupTitle: { color: theme.ink, fontSize: 13, fontWeight: "900", letterSpacing: 0.4, marginBottom: 9 },
  specs: { borderRadius: 18, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, overflow: "hidden" },
  spec: { flexDirection: "row", justifyContent: "space-between", gap: 14, padding: 14, borderBottomWidth: 1, borderBottomColor: theme.line },
  specKey: { color: theme.muted, fontSize: 12, fontWeight: "800" },
  specValue: { color: theme.ink, fontSize: 12, flex: 1, textAlign: "right" },
  ship: { color: theme.muted, fontSize: 12, marginTop: 18 },
  buyBar: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    paddingHorizontal: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.line, backgroundColor: theme.surface,
  },
  buy: { height: 54, borderRadius: 27, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" },
  buyDone: { backgroundColor: theme.good },
  dim: { opacity: 0.45 },
  buyText: { color: "#fff", fontSize: 12, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
});
