/** Places gained per person who joins through your link. */
export const REFERRAL_BOOST = 10;

/**
 * Crockford-style alphabet: no I, L, O, U — so a code read aloud or copied
 * off a screenshot cannot be mistyped into someone else's code.
 */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function generateReferralCode(length = 7): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let code = "";
  for (const byte of bytes) code += ALPHABET[byte % ALPHABET.length];
  return code;
}

/**
 * Raw signup order minus the referral boost. Never better than first place,
 * and the raw position is kept in the database so the maths stays auditable.
 */
export function displayPosition(position: number, referrals: number): number {
  return Math.max(1, position - referrals * REFERRAL_BOOST);
}

export function referralUrl(origin: string, locale: string, code: string): string {
  return `${origin}/${locale}?ref=${code}`;
}
