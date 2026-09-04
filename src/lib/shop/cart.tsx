"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { findVariant, unitPriceCents, type Product, type Variant } from "./catalog";
import { useHydrated } from "@/lib/client-value";

const STORAGE_KEY = "terrifit.cart.v1";

/**
 * What is persisted. Deliberately just identity and intent — never a price.
 * A cart written in March must not be able to buy at March's price, and a cart
 * edited in devtools must not be able to buy at any price it likes.
 */
export type CartItem = {
  slug: string;
  variantId?: string;
  quantity: number;
  /** Recurring delivery, where the product offers it. */
  subscribe?: boolean;
};

/** A cart item joined against the live catalogue. */
export type CartLine = CartItem & {
  key: string;
  product: Product;
  variant?: Variant;
  unitCents: number;
  lineCents: number;
  savedCents: number;
};

/* -------------------------------------------------------------------------- */
/* The bag is localStorage, not React state.                                   */
/*                                                                             */
/* Mirroring storage into `useState` inside an effect is a cascading render on  */
/* every mount, and it drifts the moment a second tab writes. Treating storage  */
/* as the external store it already is makes `useSyncExternalStore` do the      */
/* hydration, the cross-tab sync and the server snapshot for free.             */
/* -------------------------------------------------------------------------- */

/** Stable identity matters: React compares snapshots by reference. */
const EMPTY: CartItem[] = [];

let cachedRaw: string | null = null;
let cachedItems: CartItem[] = EMPTY;

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function onStorage(event: StorageEvent) {
  // A second tab is the same bag. Without this, adding on one tab and checking
  // out on the other silently drops the item.
  if (event.key === STORAGE_KEY) {
    cachedRaw = null;
    cachedItems = EMPTY;
    emit();
  }
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

function parse(raw: string): CartItem[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    const items = parsed.flatMap((value) => {
      if (!value || typeof value !== "object") return [];
      const item = value as Partial<CartItem>;
      if (typeof item.slug !== "string") return [];
      return [{
        slug: item.slug,
        variantId: typeof item.variantId === "string" ? item.variantId : undefined,
        quantity: Math.min(20, Math.max(1, Math.floor(Number(item.quantity) || 1))),
        subscribe: item.subscribe === true,
      }];
    });
    return items.length > 0 ? items : EMPTY;
  } catch {
    return EMPTY;
  }
}

function getSnapshot(): CartItem[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    // A private window or blocked storage means an empty, in-memory bag.
    return cachedItems;
  }
  if (raw === cachedRaw) return cachedItems;
  cachedRaw = raw;
  cachedItems = raw ? parse(raw) : EMPTY;
  return cachedItems;
}

function getServerSnapshot(): CartItem[] {
  return EMPTY;
}

function write(items: CartItem[]) {
  cachedItems = items;
  cachedRaw = JSON.stringify(items);
  try {
    localStorage.setItem(STORAGE_KEY, cachedRaw);
  } catch {
    // A full or blocked quota must not break the session in progress; the bag
    // simply lives in memory for this page view.
  }
  emit();
}

/* -------------------------------------------------------------------------- */

type CartValue = {
  /** The current server-supplied catalogue, also used by recommendations. */
  catalog: Product[];
  items: CartItem[];
  lines: CartLine[];
  count: number;
  subtotalCents: number;
  savingsCents: number;
  /** False during the server render and the first client paint. */
  ready: boolean;
  add: (item: CartItem) => void;
  setQty: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const CartContext = createContext<CartValue | null>(null);

/** One line per product + variant + delivery mode. */
export function lineKey(item: Pick<CartItem, "slug" | "variantId" | "subscribe">): string {
  return `${item.slug}::${item.variantId ?? "-"}::${item.subscribe ? "sub" : "one"}`;
}

export function CartProvider({ children, catalog }: { children: ReactNode; catalog: Product[] }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = useHydrated();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!drawerOpen) return;
    const key = (event: KeyboardEvent) => event.key === "Escape" && setDrawerOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", key);
    };
  }, [drawerOpen]);

  // Mutations read the current bag from storage rather than closing over a
  // render's copy, so two rapid clicks cannot overwrite each other.
  const add = useCallback((item: CartItem) => {
    const key = lineKey(item);
    const current = getSnapshot();
    const existing = current.find((entry) => lineKey(entry) === key);
    write(
      existing
        ? current.map((entry) =>
            lineKey(entry) === key
              ? { ...entry, quantity: Math.min(20, entry.quantity + Math.max(1, item.quantity)) }
              : entry,
          )
        : [...current, { ...item, quantity: Math.max(1, item.quantity) }],
    );
    setDrawerOpen(true);
  }, []);

  const setQty = useCallback((key: string, quantity: number) => {
    const current = getSnapshot();
    write(
      quantity <= 0
        ? current.filter((entry) => lineKey(entry) !== key)
        : current.map((entry) =>
            lineKey(entry) === key ? { ...entry, quantity: Math.min(20, quantity) } : entry,
          ),
    );
  }, []);

  const remove = useCallback((key: string) => {
    write(getSnapshot().filter((entry) => lineKey(entry) !== key));
  }, []);

  const clear = useCallback(() => write(EMPTY), []);

  const value = useMemo<CartValue>(() => {
    const lines: CartLine[] = items.flatMap((item) => {
      const product = catalog.find((candidate) => candidate.slug === item.slug);
      if (!product) return [];
      const variant = findVariant(product, item.variantId);
      const base = unitPriceCents(product, variant?.id);
      const discount = item.subscribe ? (product.subscription?.discountPercent ?? 0) : 0;
      const unitCents = Math.round(base * (1 - discount / 100));
      return [{
        ...item,
        variantId: variant?.id ?? item.variantId,
        key: lineKey({ ...item, variantId: variant?.id ?? item.variantId }),
        product,
        variant,
        unitCents,
        lineCents: unitCents * item.quantity,
        savedCents: (base - unitCents) * item.quantity,
      }];
    });

    return {
      catalog,
      items,
      lines,
      count: lines.reduce((total, line) => total + line.quantity, 0),
      subtotalCents: lines.reduce((total, line) => total + line.lineCents, 0),
      savingsCents: lines.reduce((total, line) => total + line.savedCents, 0),
      ready,
      add,
      setQty,
      remove,
      clear,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    };
  }, [items, ready, add, setQty, remove, clear, drawerOpen, catalog]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside <CartProvider>");
  return value;
}

/**
 * The cart if there is one, otherwise null.
 *
 * The site header is shared by the marketing pages and the shop, and a route
 * that never wraps itself in a CartProvider should render a header without a
 * bag rather than crash the whole page.
 */
export function useOptionalCart(): CartValue | null {
  return useContext(CartContext);
}
