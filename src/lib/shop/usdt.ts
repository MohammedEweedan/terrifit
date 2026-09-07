import { findCurrency } from "./currency";

/**
 * USDT on Tron (TRC-20), paid directly to our wallet.
 *
 * This is not a payment processor. Nobody confirms the transfer for us, there
 * is no webhook, and no redirect: the customer sends the funds themselves and
 * the order stays `pending` until the transfer is checked on-chain. Everything
 * here is therefore about being unambiguous — the right network, the right
 * amount, and an order number to tie the transfer to the order.
 */

export const USDT_NETWORK = "TRC-20 (Tron)";

/**
 * A Tron mainnet address: base58check, always 34 characters, always leading T.
 *
 * Validated rather than trusted because the failure mode is silent and total —
 * a mistyped address renders on the checkout page, customers send real money to
 * it, and nothing anywhere reports an error. Better to refuse to offer the rail.
 */
const TRON_ADDRESS = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;

export const isTronAddress = (value: string): boolean => TRON_ADDRESS.test(value.trim());

export function usdtWallet(): string | null {
  const address = process.env.USDT_TRC20_ADDRESS?.trim();
  if (!address) return null;
  if (!isTronAddress(address)) {
    console.error("USDT_TRC20_ADDRESS is not a valid Tron address — the USDT rail stays off");
    return null;
  }
  return address;
}

/**
 * What to ask for, in USDT, for an order priced in any supported currency.
 *
 * USDT tracks the dollar, so the amount owed is the order's USD equivalent. The
 * catalogue's per-currency rates are anchors used to *set* prices rather than
 * live FX (see `currency.ts`), but they are the same anchors the local price was
 * derived from, so reversing them returns the price the customer would have paid
 * in USD. Rounded up to the cent: rounding down would leave every order a
 * fraction short and permanently unsettled.
 */
export function usdtAmountDue(totalCents: number, currencyCode: string): number {
  const currency = findCurrency(currencyCode);
  const rate = currency?.rate ?? 1;
  const decimals = currency?.decimals ?? 2;
  // JPY and friends carry no minor unit, so their "cents" are whole yen.
  const major = decimals === 0 ? totalCents : totalCents / 100;
  return Math.ceil((major / rate) * 100) / 100;
}
