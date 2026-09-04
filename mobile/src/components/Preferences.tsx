import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/components/AppText";
import { setAccent, setAppearance } from "@/appearance";
import { locales, localeMeta, usePreferences, type AppLocale } from "@/preferences";
import { ACCENTS, accentKey, appearanceMode, backgroundFor, scheme, theme, type AppearanceMode } from "@/theme";
import { SwapCover } from "./ThemeTransition";

const MODES: { key: AppearanceMode; glyph: string }[] = [
  { key: "dark", glyph: "●" },
  { key: "light", glyph: "○" },
  { key: "system", glyph: "◐" },
];

/**
 * Theme, accent and language, in one block.
 *
 * These three are the first thing somebody wants to change and the last thing
 * they should have to go looking for, so they sit at the top of You rather than
 * two taps into Settings — and the same block is what onboarding shows, so the
 * control is already familiar the second time it is seen.
 *
 * Theme and accent reload the bundle (the palette is fixed for its lifetime);
 * the cover hides that. Language does not, unless the writing direction changes.
 */
export function Preferences({
  onLocalePicked,
  /** Onboarding gives the block its own step heading, so it suppresses this. */
  heading = true,
}: {
  onLocalePicked?: () => void;
  heading?: boolean;
}) {
  const preferences = usePreferences();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [swapping, setSwapping] = useState<null | string>(null);

  function swap(run: () => Promise<void>, background?: string) {
    if (swapping) return;
    // The cover is presentation only — the setter runs either way, so a problem
    // with the animation can never leave a tap doing nothing.
    setSwapping(background ?? theme.bg);
    void run();
  }

  const current = localeMeta[preferences.locale];

  return (
    <View>
      {heading ? <Text style={s.section}>{preferences.t("preferences")}</Text> : null}

      <View style={s.card}>
        <View style={s.block}>
          <Text style={s.label}>{preferences.t("appearance")}</Text>
          <View style={s.segment}>
            {MODES.map((mode) => {
              const on = appearanceMode === mode.key;
              return (
                <Pressable
                  key={mode.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  onPress={() => swap(() => setAppearance(mode.key), backgroundFor(mode.key))}
                  style={[s.segmentItem, on && s.segmentOn]}
                >
                  <Text style={[s.glyph, on && { color: theme.accent }]}>{mode.glyph}</Text>
                  <Text style={[s.segmentText, on && s.segmentTextOn]}>{preferences.t(mode.key)}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={s.block}>
          <Text style={s.label}>{preferences.t("accent")}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.dots}
            // Without this the first swatch sits under the card's own padding
            // once the row has scrolled, which reads as a clipped control.
            style={s.dotsScroll}
          >
            {ACCENTS.map((item) => {
              const colour = scheme === "light" ? item.light : item.dark;
              const on = accentKey === item.key;
              return (
                <Pressable
                  key={item.key}
                  accessibilityRole="button"
                  accessibilityLabel={item.name}
                  accessibilityState={{ selected: on }}
                  onPress={() => swap(() => setAccent(item.key))}
                  style={[s.dotRing, on && { borderColor: colour }]}
                >
                  <View style={[s.dot, { backgroundColor: colour }]} />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <Pressable onPress={() => setLanguageOpen(true)} style={s.languageRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>{preferences.t("language")}</Text>
            <Text style={s.languageValue}>
              {current.label}
              {current.english === current.label ? null : (
                <Text style={s.languageEnglish}>{`  ${current.english}`}</Text>
              )}
            </Text>
          </View>
          <Text style={s.arrow}>›</Text>
        </Pressable>
      </View>

      {heading ? <Text style={s.hint}>{preferences.t("preferencesHint")}</Text> : null}

      <LanguageSheet
        open={languageOpen}
        onClose={() => setLanguageOpen(false)}
        onPicked={onLocalePicked}
      />

      {swapping ? <SwapCover background={swapping} /> : null}
    </View>
  );
}

function LanguageSheet({
  open,
  onClose,
  onPicked,
}: {
  open: boolean;
  onClose: () => void;
  onPicked?: () => void;
}) {
  const preferences = usePreferences();

  async function pick(locale: AppLocale) {
    await preferences.setLocale(locale);
    onClose();
    onPicked?.();
  }

  return (
    <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.sheet}>
        <View style={s.sheetTop}>
          <Text style={s.sheetTitle}>{preferences.t("chooseLanguage")}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={s.sheetDone}>{preferences.t("done")}</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={s.sheetBody}>
          {locales.map((locale) => {
            const meta = localeMeta[locale];
            const on = preferences.locale === locale;
            return (
              <Pressable
                key={locale}
                onPress={() => void pick(locale)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={[s.languageOption, on && s.languageOptionOn]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[s.optionNative, on && { color: theme.accent }]}>{meta.label}</Text>
                  {meta.english === meta.label ? null : (
                    <Text style={s.optionEnglish}>{meta.english}</Text>
                  )}
                </View>
                {on ? (
                  <View style={s.check}>
                    <Text style={s.checkText}>✓</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  section: {
    color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.5,
    textTransform: "uppercase", marginTop: 26, marginBottom: 10,
  },
  card: {
    borderRadius: 22, borderWidth: 1, borderColor: theme.line,
    backgroundColor: theme.surface, overflow: "hidden",
  },
  block: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: theme.line },
  label: {
    color: theme.muted, fontSize: 10, fontWeight: "900",
    letterSpacing: 1, textTransform: "uppercase",
  },
  segment: { flexDirection: "row", gap: 8, marginTop: 11 },
  segmentItem: {
    flex: 1, height: 62, borderRadius: 16, borderWidth: 1, borderColor: theme.lineStrong,
    backgroundColor: theme.bg, alignItems: "center", justifyContent: "center", gap: 5,
  },
  segmentOn: { borderColor: theme.accent, backgroundColor: theme.accentSoft },
  glyph: { color: theme.ink2, fontSize: 17 },
  segmentText: {
    color: theme.muted, fontSize: 9, fontWeight: "900",
    textTransform: "uppercase", letterSpacing: 0.8,
  },
  segmentTextOn: { color: theme.ink },
  dotsScroll: { marginTop: 12, marginHorizontal: -16 },
  dots: { flexDirection: "row", gap: 10, paddingHorizontal: 16 },
  dotRing: {
    width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: "transparent",
    alignItems: "center", justifyContent: "center",
  },
  dot: { width: 26, height: 26, borderRadius: 13 },
  languageRow: { minHeight: 68, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13 },
  languageValue: { color: theme.ink, fontSize: 14, fontWeight: "800", marginTop: 5 },
  languageEnglish: { color: theme.muted, fontSize: 11, fontWeight: "600" },
  arrow: { color: theme.muted, fontSize: 24 },
  hint: { color: theme.muted, fontSize: 10, lineHeight: 15, marginTop: 9 },

  sheet: { flex: 1, backgroundColor: theme.bg },
  sheetTop: {
    height: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: theme.line,
  },
  sheetTitle: { color: theme.ink, fontSize: 15, fontWeight: "900" },
  sheetDone: { color: theme.accent, fontSize: 13, fontWeight: "900" },
  sheetBody: { padding: 20, gap: 9 },
  languageOption: {
    minHeight: 64, flexDirection: "row", alignItems: "center", paddingHorizontal: 16,
    borderRadius: 17, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface,
  },
  languageOptionOn: { borderColor: theme.accent, backgroundColor: theme.accentSoft },
  optionNative: { color: theme.ink, fontSize: 14, fontWeight: "800" },
  optionEnglish: { color: theme.muted, fontSize: 11, marginTop: 3 },
  check: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: theme.accent,
    alignItems: "center", justifyContent: "center",
  },
  checkText: { color: "#fff", fontSize: 11, fontWeight: "900" },
});
