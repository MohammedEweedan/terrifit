import { Text as RNText, StyleSheet, type TextProps, type TextStyle } from "react-native";
import { usePreferences } from "@/preferences";

/**
 * `Text`, with the Arabic rules applied centrally.
 *
 * Arabic broke in three ways that every screen reproduced independently, so
 * fixing them one style block at a time was never going to hold:
 *
 * 1. **`letterSpacing` shatters Arabic.** Arabic is cursive — letters join. Any
 *    positive tracking pulls those joins apart and the result is not "spaced
 *    out", it is *unreadable*, the way `T e r r i f i t` is not English. A
 *    brand that letterspaces every label at 1.2–2.4 was applying that to every
 *    Arabic label in the app.
 * 2. **Anton and Inter have no Arabic glyphs.** `theme.ts` exports `fonts.*`
 *    which already switch to Noto Kufi for Arabic, but a lot of styles reach
 *    past that to the raw `display` / `bodyBlack` constants. Those fall through
 *    to whatever the OS substitutes — a different weight, a different colour of
 *    black, obviously not the brand.
 * 3. **`textTransform: "uppercase"` is meaningless in Arabic**, which has no
 *    case. Harmless on its own, but it signals a style block written for Latin
 *    that has not been looked at since.
 *
 * Import this instead of `Text` from `react-native` and the three go away.
 * Every other script passes straight through untouched.
 */

/** Latin face → the Kufi cut that carries the same weight. */
const ARABIC_FACE: Record<string, string> = {
  Anton_400Regular: "NotoKufiArabic_900Black",
  Inter_400Regular: "NotoKufiArabic_400Regular",
  Inter_500Medium: "NotoKufiArabic_500Medium",
  Inter_600SemiBold: "NotoKufiArabic_500Medium",
  Inter_700Bold: "NotoKufiArabic_700Bold",
  Inter_800ExtraBold: "NotoKufiArabic_700Bold",
  Inter_900Black: "NotoKufiArabic_900Black",
};

/**
 * Kufi runs taller than Inter at the same point size and its ascenders clip in
 * a line box tuned for Latin, so anything with an explicit `lineHeight` gets a
 * little more room. Display sizes need proportionally more than body sizes.
 */
function arabicLineHeight(fontSize: number | undefined, lineHeight: number): number {
  const size = fontSize ?? 14;
  return Math.max(lineHeight, Math.round(size * (size >= 28 ? 1.42 : 1.35)));
}

/** Any Arabic-script codepoint, including the presentation forms. */
const ARABIC_RANGE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

function containsArabic(node: React.ReactNode): boolean {
  if (typeof node === "string") return ARABIC_RANGE.test(node);
  if (typeof node === "number") return false;
  if (Array.isArray(node)) return node.some(containsArabic);
  return false;
}

export function arabicTextStyle(style: TextStyle, rtl = true): TextStyle {
  const next: TextStyle = { ...style };

  if (next.fontFamily && ARABIC_FACE[next.fontFamily]) {
    next.fontFamily = ARABIC_FACE[next.fontFamily];
  }

  // The one non-negotiable. Tracking is a Latin device.
  if (next.letterSpacing) next.letterSpacing = 0;

  if (next.textTransform === "uppercase") next.textTransform = "none";

  if (next.lineHeight) next.lineHeight = arabicLineHeight(next.fontSize, next.lineHeight);


  // The one directional change, and only for text that is actually Arabic.
  //
  // The *layout* stays left-to-right in every locale — columns, nav, back
  // buttons and icons all keep their positions — and only the glyph run inside
  // an Arabic text box is right-to-left.
  //
  // Applying it to a Latin string is actively destructive: bidi reordering
  // pushes trailing numbers and punctuation to the wrong end, which is how
  // "6 years younger than your birthday" became "years younger than your
  // birthday 6". Until every string is translated, some are still English, and
  // an English string must stay left-to-right.
  if (rtl) {
    next.writingDirection = "rtl";
    if (!next.textAlign) next.textAlign = "right";
  }

  return next;
}

export function Text({ style, children, ...rest }: TextProps) {
  const { locale } = usePreferences();
  if (locale !== "ar") return <RNText style={style} {...rest}>{children}</RNText>;

  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  // The face and the tracking fix apply either way — Kufi renders Latin
  // perfectly well, and tracking is unwanted on both. Only the direction is
  // conditional.
  return (
    <RNText style={arabicTextStyle(flat ?? {}, containsArabic(children))} {...rest}>
      {children}
    </RNText>
  );
}
