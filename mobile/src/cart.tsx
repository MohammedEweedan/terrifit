import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import Storage from "expo-sqlite/kv-store";
import { usePreferences } from "./preferences";

const KEY = (currency: string) => `terrifit.cart.${currency}`;

export type CartLine = {
  slug: string;
  variantId: string | null;
  quantity: number;
  /** Held only to render the bag; the server re-prices every line at checkout. */
  name: string;
  variantLabel: string | null;
  priceCents: number;
  image: string | null;
};

type Cart = {
  lines: CartLine[];
  count: number;
  subtotalCents: number;
  currency: string;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (slug: string, variantId: string | null, quantity: number) => void;
  remove: (slug: string, variantId: string | null) => void;
  clear: () => void;
};

const CartContext = createContext<Cart | null>(null);

const same = (line: CartLine, slug: string, variantId: string | null) =>
  line.slug === slug && (line.variantId ?? null) === (variantId ?? null);

/**
 * The bag.
 *
 * Prices are carried for display only. Checkout sends slugs, variants and
 * quantities, and the server re-resolves every price from the catalogue — a
 * cart payload has to be assumed hostile, and a tampered one must not be able
 * to invent a cheaper total.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const { currencyCode } = usePreferences();
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    try {
      const stored = Storage.getItemSync(KEY(currencyCode));
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) setLines(parsed as CartLine[]);
      } else setLines([]);
    } catch {
      // A corrupt bag is an empty bag rather than a crash on launch.
      setLines([]);
    }
  }, [currencyCode]);

  const write = useCallback((next: CartLine[]) => {
    setLines(next);
    void Storage.setItem(KEY(currencyCode), JSON.stringify(next)).catch(() => {});
  }, [currencyCode]);

  const add = useCallback(
    (line: Omit<CartLine, "quantity">, quantity = 1) => {
      const existing = lines.find((item) => same(item, line.slug, line.variantId));
      write(
        existing
          ? lines.map((item) =>
              same(item, line.slug, line.variantId)
                ? { ...item, quantity: Math.min(20, item.quantity + quantity) }
                : item,
            )
          : [...lines, { ...line, quantity }],
      );
    },
    [lines, write],
  );

  const setQuantity = useCallback(
    (slug: string, variantId: string | null, quantity: number) => {
      write(
        quantity <= 0
          ? lines.filter((item) => !same(item, slug, variantId))
          : lines.map((item) =>
              same(item, slug, variantId) ? { ...item, quantity: Math.min(20, quantity) } : item,
            ),
      );
    },
    [lines, write],
  );

  const remove = useCallback(
    (slug: string, variantId: string | null) => write(lines.filter((item) => !same(item, slug, variantId))),
    [lines, write],
  );

  const clear = useCallback(() => write([]), [write]);

  const value = useMemo<Cart>(
    () => ({
      lines,
      count: lines.reduce((total, line) => total + line.quantity, 0),
      subtotalCents: lines.reduce((total, line) => total + line.priceCents * line.quantity, 0),
      currency: currencyCode,
      add,
      setQuantity,
      remove,
      clear,
    }),
    [lines, currencyCode, add, setQuantity, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): Cart {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
