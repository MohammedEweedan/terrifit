import { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Text } from "@/components/AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getReviews, writeReview, type ProductReviews } from "@/api";
import { useSession } from "@/session";
import { fonts, display, theme } from "@/theme";
import { TerrifitSpinner } from "./TerrifitSpinner";
import { appScreens } from "@/i18n/app-screens";
import { usePreferences } from "@/preferences";

const STARS = [1, 2, 3, 4, 5];

/** Filled to `rating`, hollow after. One size everywhere it appears. */
export function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <View style={s.stars}>
      {STARS.map((star) => (
        <Text key={star} style={[s.star, { fontSize: size }, star <= Math.round(rating) && s.starOn]}>
          ★
        </Text>
      ))}
    </View>
  );
}

/**
 * The rating row on a product page, and the sheet behind it.
 *
 * The number shown is whatever real reviews say. A product nobody has reviewed
 * says so and invites the first one — it does not borrow a rating, because a
 * star count nobody wrote is the fastest way to lose the trust the stars exist
 * to build.
 */
export function ReviewSummary({ slug }: { slug: string }) {
  const copy = appScreens[usePreferences().locale].reviews;
  const { token } = useSession();
  const [data, setData] = useState<ProductReviews | null>(null);
  const [open, setOpen] = useState(false);
  const [writing, setWriting] = useState(false);

  const load = useCallback(() => {
    void getReviews(token, slug)
      .then(setData)
      .catch(() => setData(null));
  }, [token, slug]);

  useEffect(load, [load]);

  const average = data?.average ?? null;
  const total = data?.total ?? 0;

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={s.summary} accessibilityLabel={copy.readTheReviews}>
        <Stars rating={average ?? 0} />
        <Text style={s.summaryText}>
          {average == null
            ? copy.noneYet
            : `${average.toFixed(1)} · ${total} ${total === 1 ? "review" : "reviews"}`}
        </Text>
        <Text style={s.summaryChevron}>›</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <ReviewSheet
          slug={slug}
          data={data}
          onClose={() => setOpen(false)}
          onWrite={() => setWriting(true)}
          reload={load}
        />
        <WriteReview
          visible={writing}
          slug={slug}
          onClose={() => setWriting(false)}
          onSaved={() => {
            setWriting(false);
            load();
          }}
        />
      </Modal>
    </>
  );
}

function ReviewSheet({
  slug, data, onClose, onWrite, reload,
}: {
  slug: string;
  data: ProductReviews | null;
  onClose: () => void;
  onWrite: () => void;
  reload: () => void;
}) {
  const copy = appScreens[usePreferences().locale].reviews;
  const insets = useSafeAreaInsets();
  useEffect(reload, [reload, slug]);

  const total = data?.total ?? 0;
  const average = data?.average ?? null;

  return (
    <View style={[s.sheet, { paddingTop: insets.top + 8 }]}>
      <View style={s.sheetTop}>
        <Text style={s.sheetTitle}>Reviews</Text>
        <Pressable onPress={onClose} hitSlop={10}>
          <Text style={s.done}>Done</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: insets.bottom + 40 }}>
        {data == null ? (
          <TerrifitSpinner style={{ marginTop: 40 }} />
        ) : total === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>{copy.nobodyHasWritten}</Text>
            <Text style={s.emptyBody}>
              Reviews here come from people who bought the thing, and we do not carry over a score from anywhere
              else. If you own it, yours would be the first.
            </Text>
          </View>
        ) : (
          <>
            <View style={s.overall}>
              <Text style={s.average}>{average?.toFixed(1)}</Text>
              <View style={s.flex}>
                <Stars rating={average ?? 0} size={16} />
                <Text style={s.overallCount}>
                  {total} {total === 1 ? "review" : "reviews"}
                </Text>
              </View>
            </View>

            <View style={s.breakdown}>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = data.counts[star - 1] ?? 0;
                return (
                  <View key={star} style={s.breakdownRow}>
                    <Text style={s.breakdownStar}>{star}★</Text>
                    <View style={s.breakdownTrack}>
                      <View
                        style={[
                          s.breakdownFill,
                          { width: total > 0 ? `${(count / total) * 100}%` : "0%" },
                        ]}
                      />
                    </View>
                    <Text style={s.breakdownCount}>{count}</Text>
                  </View>
                );
              })}
            </View>

            {data.reviews.map((review) => (
              <View key={review.id} style={s.review}>
                <View style={s.reviewHead}>
                  <Stars rating={review.rating} />
                  {review.verified ? <Text style={s.verified}>{copy.verifiedPurchase}</Text> : null}
                </View>
                <Text style={s.reviewTitle}>{review.title}</Text>
                <Text style={s.reviewBody}>{review.body}</Text>
                <Text style={s.reviewMeta}>
                  {review.author} · {new Date(review.date).toLocaleDateString()}
                  {review.mine ? " · yours" : ""}
                </Text>
              </View>
            ))}
          </>
        )}

        <Pressable onPress={onWrite} style={s.write}>
          <Text style={s.writeText}>{data?.mine ? copy.editYourReview : copy.writeAReview}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function WriteReview({
  visible, slug, onClose, onSaved,
}: {
  visible: boolean;
  slug: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const copy = appScreens[usePreferences().locale].reviews;
  const insets = useSafeAreaInsets();
  const { token } = useSession();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const ready = title.trim().length >= 2 && body.trim().length >= 10;

  async function save() {
    if (!ready || busy) return;
    setBusy(true);
    setError("");
    try {
      await writeReview(token, { slug, rating, title: title.trim(), body: body.trim() });
      setTitle("");
      setBody("");
      onSaved();
    } catch {
      setError(copy.saveFailed);
    }
    setBusy(false);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={[s.sheet, { paddingTop: insets.top + 8 }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={s.sheetTop}>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={s.done}>Cancel</Text>
          </Pressable>
          <Text style={s.sheetTitle}>{copy.yourReview}</Text>
          <Pressable onPress={() => void save()} disabled={!ready || busy} hitSlop={10}>
            <Text style={[s.done, (!ready || busy) && s.doneOff]}>{busy ? copy.saving : "Post"}</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
          <Text style={s.fieldLabel}>Rating</Text>
          <View style={s.ratingRow}>
            {STARS.map((star) => (
              <Pressable key={star} onPress={() => setRating(star)} hitSlop={6}>
                <Text style={[s.bigStar, star <= rating && s.starOn]}>★</Text>
              </Pressable>
            ))}
          </View>

          <Text style={s.fieldLabel}>{copy.headline}</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            style={s.input}
            placeholder={copy.headlinePlaceholder}
            placeholderTextColor={theme.muted}
            maxLength={80}
          />

          <Text style={s.fieldLabel}>{copy.whatYouThought}</Text>
          <TextInput
            value={body}
            onChangeText={setBody}
            style={[s.input, s.textarea]}
            placeholder={copy.bodyPlaceholder}
            placeholderTextColor={theme.muted}
            multiline
            maxLength={2000}
          />

          <Text style={s.hint}>
            If you bought this on your account it will show as a verified purchase. Your first name or handle is
            shown, never your email.
          </Text>

          {error ? <Text style={s.error}>{error}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  stars: { flexDirection: "row", gap: 1 },
  star: { color: theme.lineStrong },
  starOn: { color: theme.accent },

  summary: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
  summaryText: { color: theme.ink2, fontSize: 12, fontFamily: fonts.bold, fontWeight: "700" },
  summaryChevron: { color: theme.muted, fontSize: 15 },

  sheet: { flex: 1, backgroundColor: theme.bg },
  sheetTop: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 18, paddingBottom: 14,
  },
  sheetTitle: { color: theme.ink, fontSize: 17, fontFamily: fonts.black, fontWeight: "900" },
  done: { color: theme.accent, fontSize: 14, fontFamily: fonts.bold, fontWeight: "700" },
  doneOff: { color: theme.muted },

  empty: { paddingVertical: 30 },
  emptyTitle: { color: theme.ink, fontSize: 17, fontFamily: fonts.black, fontWeight: "900" },
  emptyBody: { color: theme.ink2, fontSize: 13, lineHeight: 20, marginTop: 10 },

  overall: { flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 10 },
  average: { color: theme.ink, fontFamily: display, fontSize: 52 },
  overallCount: { color: theme.muted, fontSize: 12, marginTop: 5 },

  breakdown: { gap: 6, marginTop: 12, marginBottom: 20 },
  breakdownRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  breakdownStar: { color: theme.muted, fontSize: 11, width: 24 },
  breakdownTrack: { flex: 1, height: 5, borderRadius: 3, backgroundColor: theme.line, overflow: "hidden" },
  breakdownFill: { height: 5, borderRadius: 3, backgroundColor: theme.accent },
  breakdownCount: { color: theme.muted, fontSize: 11, width: 24, textAlign: "right" },

  review: { paddingVertical: 16, borderTopWidth: 1, borderTopColor: theme.line },
  reviewHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  verified: { color: theme.good, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 0.6, textTransform: "uppercase" },
  reviewTitle: { color: theme.ink, fontSize: 15, fontFamily: fonts.black, fontWeight: "900", marginTop: 9 },
  reviewBody: { color: theme.ink2, fontSize: 13, lineHeight: 20, marginTop: 6 },
  reviewMeta: { color: theme.muted, fontSize: 11, marginTop: 9 },

  write: {
    height: 52, borderRadius: 26, borderWidth: 1, borderColor: theme.accent,
    alignItems: "center", justifyContent: "center", marginTop: 24,
  },
  writeText: { color: theme.accent, fontSize: 12, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },

  fieldLabel: { color: theme.muted, fontSize: 10, fontFamily: fonts.black, fontWeight: "900", letterSpacing: 1.1, textTransform: "uppercase", marginTop: 20, marginBottom: 9 },
  ratingRow: { flexDirection: "row", gap: 10 },
  bigStar: { color: theme.lineStrong, fontSize: 34 },
  input: {
    minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: theme.lineStrong,
    paddingHorizontal: 14, paddingVertical: 13, color: theme.ink, fontSize: 15, backgroundColor: theme.surface,
  },
  textarea: { minHeight: 130, textAlignVertical: "top" },
  hint: { color: theme.muted, fontSize: 11, lineHeight: 16, marginTop: 14 },
  error: { color: theme.poor, fontSize: 13, marginTop: 14 },
});
