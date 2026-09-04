import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";
import { Text } from "@/components/AppText";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ApiError,
  archiveAdminProduct,
  createAdminProduct,
  saveAdminProduct,
  type AdminCatalogProduct,
  type AdminCatalogVariant,
} from "@/api";
import { useAppState } from "@/app-state";
import { Colourway } from "@/components/Colourway";
import { TerrifitSpinner } from "@/components/TerrifitSpinner";
import { useAdminCatalog } from "@/data";
import { useSession } from "@/session";
import { fonts, display, theme } from "@/theme";

const blankProduct = (): AdminCatalogProduct => ({
  slug: "",
  name: "",
  tagline: "",
  category: "fuel",
  brand: "TERRIFUEL",
  partner: false,
  description: "",
  priceCents: 0,
  compareAtCents: null,
  rating: 0,
  reviewCount: 0,
  badges: [],
  variantLabel: null,
  highlights: [],
  specs: [],
  shipsIn: "Ships in 2–3 business days",
  fulfilment: "ship",
  subscriptionLabel: null,
  subscriptionDiscountPercent: null,
  active: false,
  featured: false,
  sortOrder: 100,
  trackInventory: true,
  stockQuantity: 0,
  lowStockThreshold: 5,
  allowBackorder: false,
  variants: [],
  media: [],
});

const blankVariant = (index: number): AdminCatalogVariant => ({
  key: `option-${index + 1}`,
  label: `Option ${index + 1}`,
  note: null,
  sku: `TF-${Date.now().toString(36).toUpperCase()}-${index + 1}`,
  priceCents: null,
  image: null,
  colours: ["#111111", "#ff5a1f"],
  accent: "#ff5a1f",
  active: true,
  sortOrder: index,
  stockQuantity: 0,
  lowStockThreshold: 5,
  allowBackorder: false,
});

const cents = (value: string, nullable = false): number | null => {
  if (nullable && value.trim() === "") return null;
  const parsed = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed * 100)) : nullable ? null : 0;
};

const dollars = (value: number | null) => value == null ? "" : (value / 100).toFixed(2);
const integer = (value: string) => Math.max(0, Math.round(Number(value.replace(/[^0-9]/g, "")) || 0));
const lines = (value: string) => value.split("\n").map((line) => line.trim()).filter(Boolean);
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function AdminProductScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { slug: rawSlug } = useLocalSearchParams<{ slug?: string }>();
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug ?? "new";
  const creating = slug === "new";
  const { token } = useSession();
  const { profile } = useAppState();
  const catalog = useAdminCatalog();
  const [product, setProduct] = useState<AdminCatalogProduct | null>(creating ? blankProduct() : null);
  const [loadedSlug, setLoadedSlug] = useState<string | null>(creating ? "new" : null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (creating || loadedSlug === slug || !catalog.data) return;
    const found = catalog.data.products.find((item) => item.slug === slug);
    if (found) {
      setProduct(structuredClone(found));
      setLoadedSlug(slug);
    }
  }, [catalog.data, creating, loadedSlug, slug]);

  const totalStock = useMemo(() => {
    if (!product) return 0;
    return product.variants.length
      ? product.variants.reduce((total, variant) => total + variant.stockQuantity, 0)
      : product.stockQuantity;
  }, [product]);

  if (profile && !profile.user.isAdmin) {
    return <View style={[s.page, s.centre]}><Text style={s.title}>Staff only</Text></View>;
  }
  if (!product) {
    return <View style={[s.page, s.centre]}>{catalog.loading ? <TerrifitSpinner /> : <Text style={s.message}>Product not found.</Text>}</View>;
  }
  const currentProduct = product;

  const patch = <K extends keyof AdminCatalogProduct>(key: K, value: AdminCatalogProduct[K]) =>
    setProduct((current) => current ? { ...current, [key]: value } : current);

  const patchVariant = <K extends keyof AdminCatalogVariant>(index: number, key: K, value: AdminCatalogVariant[K]) =>
    patch("variants", product.variants.map((variant, variantIndex) => variantIndex === index ? { ...variant, [key]: value } : variant));

  async function pickImage(target: { kind: "media" } | { kind: "variant"; index: number }) {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photo access needed", "Allow photo access to add a product image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.72,
      base64: true,
    });
    const asset = result.canceled ? null : result.assets[0];
    if (!asset?.base64) return;
    const mime = asset.mimeType === "image/png" || asset.mimeType === "image/webp" ? asset.mimeType : "image/jpeg";
    const source = `data:${mime};base64,${asset.base64}`;
    if (target.kind === "variant") {
      patchVariant(target.index, "image", source);
      return;
    }
    patch("media", [...currentProduct.media, { src: source, alt: currentProduct.name || "Product image", ratio: 1, sortOrder: currentProduct.media.length }]);
  }

  function validate(): string | null {
    if (!currentProduct.slug || !/^[a-z0-9][a-z0-9-]+$/.test(currentProduct.slug)) return "Use a lowercase slug with letters, numbers and hyphens.";
    if (!currentProduct.name.trim() || !currentProduct.tagline.trim() || !currentProduct.description.trim()) return "Name, tagline and description are required.";
    if (!currentProduct.category.trim() || !currentProduct.brand.trim() || !currentProduct.shipsIn.trim()) return "Category, brand and shipping copy are required.";
    if (currentProduct.active && currentProduct.fulfilment === "ship" && currentProduct.priceCents === 0) return "Set a price before making a physical product live.";
    if (new Set(currentProduct.variants.map((item) => item.key)).size !== currentProduct.variants.length) return "Every option needs a unique key.";
    if (new Set(currentProduct.variants.map((item) => item.sku)).size !== currentProduct.variants.length) return "Every option needs a unique SKU.";
    if (currentProduct.variants.some((item) => !item.key || !item.label.trim() || !item.sku.trim())) return "Every option needs a key, name and SKU.";
    if (currentProduct.variants.some((item) => item.colours.some((colour) => !/^#[0-9a-f]{6}$/i.test(colour)))) return "Strap colours must be six-digit hex values such as #ff5a1f.";
    return null;
  }

  async function save() {
    const error = validate();
    if (error) { setMessage(error); return; }
    if (!token) return;
    setSaving(true); setMessage("");
    try {
      if (creating) await createAdminProduct(token, currentProduct);
      else await saveAdminProduct(token, currentProduct);
      catalog.reload();
      Alert.alert("Saved", `${currentProduct.name} is now ${currentProduct.active ? "live" : "archived"}.`, [
        { text: "Done", onPress: () => router.replace("/admin") },
      ]);
    } catch (caught) {
      setMessage(caught instanceof ApiError ? caught.detail ?? caught.message : "The product could not be saved.");
    } finally { setSaving(false); }
  }

  function archive() {
    if (creating || !token) return;
    Alert.alert("Archive product?", "It disappears from the shop, but orders and product data are kept.", [
      { text: "Cancel", style: "cancel" },
      { text: "Archive", style: "destructive", onPress: () => void (async () => {
        setSaving(true);
        try { await archiveAdminProduct(token, currentProduct.slug); router.replace("/admin"); }
        catch { setMessage("The product could not be archived."); }
        finally { setSaving(false); }
      })() },
    ]);
  }

  return (
    <KeyboardAvoidingView style={s.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[s.top, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Text style={s.back}>‹ Console</Text></Pressable>
        <Text style={s.topTitle}>{creating ? "New product" : "Edit product"}</Text>
        <Pressable disabled={saving} onPress={() => void save()} hitSlop={10}><Text style={[s.save, saving && s.dim]}>{saving ? "Saving" : "Save"}</Text></Pressable>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}>
        <View style={s.summary}>
          <View><Text style={s.kicker}>Catalog control</Text><Text style={s.title}>{product.name || "Untitled product"}</Text></View>
          <View style={s.stockSummary}><Text style={s.stockNumber}>{totalStock}</Text><Text style={s.stockWord}>stock</Text></View>
        </View>

        <Section title="Identity">
          <Field label="Product name" value={product.name} onChangeText={(value) => { patch("name", value); if (creating && !product.slug) patch("slug", slugify(value)); }} />
          <Field label="Slug" value={product.slug} editable={creating} autoCapitalize="none" onChangeText={(value) => patch("slug", slugify(value))} note={creating ? "Permanent after creation" : "Permanent product address"} />
          <Field label="Tagline" value={product.tagline} onChangeText={(value) => patch("tagline", value)} />
          <View style={s.two}><Field box label="Category" value={product.category} autoCapitalize="none" onChangeText={(value) => patch("category", value.toLowerCase())} /><Field box label="Brand" value={product.brand} onChangeText={(value) => patch("brand", value)} /></View>
          <Field label="Description" value={product.description} multiline onChangeText={(value) => patch("description", value)} />
          <Toggle label="Active in shop" note="Turn this off to keep a draft or hide a product without deleting it." value={product.active} onValueChange={(value) => patch("active", value)} />
          <Toggle label="Featured" value={product.featured} onValueChange={(value) => patch("featured", value)} />
          <Toggle label="Partner product" value={product.partner} onValueChange={(value) => patch("partner", value)} />
        </Section>

        <Section title="Price & fulfilment">
          <View style={s.two}><Field box label="Price (USD)" value={dollars(product.priceCents)} keyboardType="decimal-pad" onChangeText={(value) => patch("priceCents", cents(value) ?? 0)} /><Field box label="Compare at" value={dollars(product.compareAtCents)} keyboardType="decimal-pad" onChangeText={(value) => patch("compareAtCents", cents(value, true))} /></View>
          <Field label="Shipping message" value={product.shipsIn} onChangeText={(value) => patch("shipsIn", value)} />
          <View style={s.segment}><Choice selected={product.fulfilment === "ship"} label="Physical" onPress={() => patch("fulfilment", "ship")} /><Choice selected={product.fulfilment === "subscription"} label="Subscription" onPress={() => patch("fulfilment", "subscription")} /></View>
          {product.fulfilment === "subscription" ? <><Field label="Subscription label" value={product.subscriptionLabel ?? ""} onChangeText={(value) => patch("subscriptionLabel", value || null)} /><Field label="Subscription discount %" value={String(product.subscriptionDiscountPercent ?? "")} keyboardType="number-pad" onChangeText={(value) => patch("subscriptionDiscountPercent", value ? integer(value) : null)} /></> : null}
        </Section>

        <Section title="Inventory">
          <Toggle label="Track stock" note="Checkout blocks quantities you do not have unless backorders are enabled." value={product.trackInventory} onValueChange={(value) => patch("trackInventory", value)} />
          {product.variants.length === 0 ? <View style={s.two}><Field box label="Units in stock" value={String(product.stockQuantity)} keyboardType="number-pad" onChangeText={(value) => patch("stockQuantity", integer(value))} /><Field box label="Low-stock alert" value={String(product.lowStockThreshold)} keyboardType="number-pad" onChangeText={(value) => patch("lowStockThreshold", integer(value))} /></View> : <Text style={s.help}>Stock is controlled per option below.</Text>}
          <Toggle label="Allow backorders" value={product.allowBackorder} onValueChange={(value) => patch("allowBackorder", value)} />
        </Section>

        <Section title="Images">
          <View style={s.images}>{product.media.map((item, index) => <View key={`${item.src.slice(0, 30)}-${index}`} style={s.imageTile}><Image source={{ uri: item.src }} style={s.image} /><Pressable onPress={() => patch("media", product.media.filter((_, itemIndex) => itemIndex !== index))} style={s.removeImage}><Text style={s.removeImageText}>×</Text></Pressable><TextInput value={item.alt} placeholder="Alt text" placeholderTextColor={theme.muted} onChangeText={(value) => patch("media", product.media.map((media, mediaIndex) => mediaIndex === index ? { ...media, alt: value } : media))} style={s.altInput} /></View>)}</View>
          <Pressable onPress={() => void pickImage({ kind: "media" })} style={s.outline}><Text style={s.outlineText}>+ Add image</Text></Pressable>
        </Section>

        <Section title="Shop copy">
          <Field label="Badges" note="One per line" value={product.badges.join("\n")} multiline onChangeText={(value) => patch("badges", lines(value))} />
          <Field label="Highlights" note="One per line" value={product.highlights.join("\n")} multiline onChangeText={(value) => patch("highlights", lines(value))} />
          <Field label="Specifications" note="One per line: Label | Value" value={product.specs.map(([key, value]) => `${key} | ${value}`).join("\n")} multiline onChangeText={(value) => patch("specs", lines(value).map((line) => { const [key, ...rest] = line.split("|"); return [key.trim(), rest.join("|").trim()] as [string, string]; }).filter(([key, value]) => key && value))} />
        </Section>

        <Section title="Options, colours & strap stock">
          <Field label="Option label" value={product.variantLabel ?? ""} placeholder="Colourway, size, protein…" onChangeText={(value) => patch("variantLabel", value || null)} />
          {product.variants.map((variant, index) => (
            <View key={`${variant.key}-${index}`} style={s.variant}>
              <View style={s.variantTop}><View style={s.variantIdentity}>{variant.colours.length ? <Colourway colours={variant.colours} selected={false} size={42} /> : null}<Text style={s.variantName}>{variant.label}</Text></View><Pressable onPress={() => patch("variants", product.variants.filter((_, itemIndex) => itemIndex !== index))}><Text style={s.remove}>Remove</Text></Pressable></View>
              <View style={s.two}><Field box label="Name" value={variant.label} onChangeText={(value) => patchVariant(index, "label", value)} /><Field box label="Key" value={variant.key} autoCapitalize="none" onChangeText={(value) => patchVariant(index, "key", slugify(value))} /></View>
              <Field label="Description" value={variant.note ?? ""} onChangeText={(value) => patchVariant(index, "note", value || null)} />
              <View style={s.two}><Field box label="SKU" value={variant.sku} autoCapitalize="characters" onChangeText={(value) => patchVariant(index, "sku", value.toUpperCase().replace(/\s/g, "-"))} /><Field box label="Price override" value={dollars(variant.priceCents)} keyboardType="decimal-pad" onChangeText={(value) => patchVariant(index, "priceCents", cents(value, true))} /></View>
              <View style={s.two}><Field box label="Units in stock" value={String(variant.stockQuantity)} keyboardType="number-pad" onChangeText={(value) => patchVariant(index, "stockQuantity", integer(value))} /><Field box label="Low-stock alert" value={String(variant.lowStockThreshold)} keyboardType="number-pad" onChangeText={(value) => patchVariant(index, "lowStockThreshold", integer(value))} /></View>
              <Field label="Colour combination" note="Comma-separated hex colours; the shop draws the woven circle from these." value={variant.colours.join(", ")} autoCapitalize="none" onChangeText={(value) => patchVariant(index, "colours", value.split(",").map((item) => item.trim()).filter(Boolean))} />
              <Field label="Name accent" value={variant.accent ?? ""} autoCapitalize="none" onChangeText={(value) => patchVariant(index, "accent", value || null)} />
              {variant.image ? <Image source={{ uri: variant.image }} style={s.variantImage} /> : null}
              <Pressable onPress={() => void pickImage({ kind: "variant", index })} style={s.outline}><Text style={s.outlineText}>{variant.image ? "Replace option image" : "+ Option image"}</Text></Pressable>
              <Toggle label="Option active" value={variant.active} onValueChange={(value) => patchVariant(index, "active", value)} />
              <Toggle label="Allow backorders" value={variant.allowBackorder} onValueChange={(value) => patchVariant(index, "allowBackorder", value)} />
            </View>
          ))}
          <Pressable onPress={() => patch("variants", [...product.variants, blankVariant(product.variants.length)])} style={s.outline}><Text style={s.outlineText}>+ Add option</Text></Pressable>
        </Section>

        {message ? <Text style={s.message}>{message}</Text> : null}
        <Pressable disabled={saving} onPress={() => void save()} style={s.primary}><Text style={s.primaryText}>{saving ? "Saving…" : creating ? "Create product" : "Save changes"}</Text></Pressable>
        {!creating ? <Pressable disabled={saving} onPress={archive} style={s.archive}><Text style={s.archiveText}>Archive product</Text></Pressable> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={s.section}><Text style={s.sectionTitle}>{title}</Text>{children}</View>;
}

function Field({ label, note, box, ...props }: React.ComponentProps<typeof TextInput> & { label: string; note?: string; box?: boolean }) {
  return <View style={[s.field, box && s.fieldBox]}><Text style={s.label}>{label}</Text><TextInput placeholderTextColor={theme.muted} style={[s.input, props.multiline && s.multiline, props.editable === false && s.readonly]} {...props} />{note ? <Text style={s.fieldNote}>{note}</Text> : null}</View>;
}

function Toggle({ label, note, value, onValueChange }: { label: string; note?: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return <View style={s.toggle}><View style={s.toggleCopy}><Text style={s.toggleLabel}>{label}</Text>{note ? <Text style={s.fieldNote}>{note}</Text> : null}</View><Switch value={value} onValueChange={onValueChange} trackColor={{ false: theme.lineStrong, true: theme.accentLine }} thumbColor={value ? theme.accent : theme.muted} /></View>;
}

function Choice({ selected, label, onPress }: { selected: boolean; label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[s.choice, selected && s.choiceOn]}><Text style={[s.choiceText, selected && s.choiceTextOn]}>{label}</Text></Pressable>;
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bg },
  centre: { alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.line },
  back: { color: theme.ink2, fontSize: 13, fontFamily: fonts.black, fontWeight: "800", width: 72 },
  topTitle: { color: theme.ink, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase" },
  save: { color: theme.accent, fontSize: 13, fontFamily: fonts.black, fontWeight: "900", width: 72, textAlign: "right" },
  dim: { opacity: 0.45 },
  content: { paddingHorizontal: 18, paddingTop: 18 },
  summary: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  kicker: { color: theme.accent, fontSize: 9, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase" },
  title: { color: theme.ink, fontFamily: display, fontSize: 27, textTransform: "uppercase", marginTop: 4 },
  stockSummary: { alignItems: "center" }, stockNumber: { color: theme.ink, fontFamily: display, fontSize: 25 }, stockWord: { color: theme.muted, fontSize: 8, fontWeight: "900", textTransform: "uppercase" },
  section: { borderRadius: 20, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, padding: 15, marginTop: 14 },
  sectionTitle: { color: theme.accent, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 16 },
  field: { marginBottom: 14 }, fieldBox: { flex: 1 },
  label: { color: theme.muted, fontSize: 9, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 },
  input: { minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: theme.lineStrong, backgroundColor: theme.bg, color: theme.ink, paddingHorizontal: 13, paddingVertical: 12, fontSize: 13 },
  multiline: { minHeight: 90, textAlignVertical: "top" }, readonly: { opacity: 0.55 },
  fieldNote: { color: theme.muted, fontSize: 10, lineHeight: 15, marginTop: 5 },
  two: { flexDirection: "row", gap: 10 },
  toggle: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: 1, borderTopColor: theme.line, paddingVertical: 10 },
  toggleCopy: { flex: 1 }, toggleLabel: { color: theme.ink, fontSize: 13, fontFamily: fonts.black, fontWeight: "800" },
  help: { color: theme.ink2, fontSize: 11, lineHeight: 17, marginBottom: 12 },
  segment: { flexDirection: "row", borderRadius: 14, backgroundColor: theme.bg, padding: 4, marginBottom: 14 },
  choice: { flex: 1, minHeight: 40, alignItems: "center", justifyContent: "center", borderRadius: 11 },
  choiceOn: { backgroundColor: theme.accentSoft }, choiceText: { color: theme.muted, fontSize: 11, fontFamily: fonts.black, fontWeight: "900", textTransform: "uppercase" }, choiceTextOn: { color: theme.accent },
  images: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  imageTile: { width: "48%", borderRadius: 14, borderWidth: 1, borderColor: theme.line, overflow: "hidden", backgroundColor: theme.bg },
  image: { width: "100%", aspectRatio: 1, backgroundColor: theme.raised },
  removeImage: { position: "absolute", right: 6, top: 6, width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(0,0,0,.7)", alignItems: "center", justifyContent: "center" },
  removeImageText: { color: "#fff", fontSize: 20, lineHeight: 22 },
  altInput: { minHeight: 42, color: theme.ink2, fontSize: 10, paddingHorizontal: 9 },
  outline: { minHeight: 46, borderRadius: 23, borderWidth: 1, borderColor: theme.lineStrong, alignItems: "center", justifyContent: "center", marginTop: 8 },
  outlineText: { color: theme.ink, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 0.8, textTransform: "uppercase" },
  variant: { borderTopWidth: 1, borderTopColor: theme.line, paddingTop: 15, marginTop: 6, marginBottom: 12 },
  variantTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  variantIdentity: { flexDirection: "row", alignItems: "center", gap: 10 }, variantName: { color: theme.ink, fontSize: 15, fontFamily: fonts.black, fontWeight: "900" },
  remove: { color: theme.poor, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", textTransform: "uppercase" },
  variantImage: { width: "100%", aspectRatio: 1.6, borderRadius: 14, backgroundColor: theme.raised, resizeMode: "contain" },
  message: { color: theme.poor, fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 18 },
  primary: { height: 54, borderRadius: 27, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center", marginTop: 20 },
  primaryText: { color: "#fff", fontSize: 11, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.1, textTransform: "uppercase" },
  archive: { height: 50, alignItems: "center", justifyContent: "center", marginTop: 8 }, archiveText: { color: theme.poor, fontSize: 11, fontFamily: fonts.black, fontWeight: "800" },
});
