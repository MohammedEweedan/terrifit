import { useCallback, useEffect, useState } from "react";
import {
  ApiError, getBody, getDashboard, getMap, getMaps, getNotifications, getOrders,
  getAdminCatalog, getAdminOrders, getAdminOverview, getMapHistory, getPlan, getSessionRuntime, getShop, getThread, getTogether,
  type ActiveMap, type BodyScan, type Dashboard, type MapDetail,
  type AdminCatalogProduct, type AdminOrder, type AdminOverview, type MapSummary, type Notification,
  type MapHistory, type PlanInfo, type SessionRuntime, type Shop, type Thread, type TogetherProduct,
  type TrackedOrder,
} from "./api";
import { useSession } from "./session";
import { usePreferences } from "./preferences";

export type Async<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  refreshing: boolean;
  reload: () => void;
  /** Lets a screen patch what it already has after a write, instead of refetching. */
  set: (next: T) => void;
};

/**
 * Fetches once on mount and again on pull-to-refresh.
 *
 * A 401 signs the user out rather than showing an error — the token expired or
 * was revoked, and the only useful next step is the sign-in screen.
 */
export function useEndpoint<T>(fetcher: (token: string) => Promise<T>, deps: unknown[] = []): Async<T> {
  const { token, signOut } = useSession();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    fetcher(token)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        if (caught instanceof ApiError && caught.status === 401) {
          void signOut();
          return;
        }
        setError("We couldn't reach Terrifit. Pull down to try again.");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setRefreshing(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, nonce, signOut, ...deps]);

  const reload = useCallback(() => {
    setRefreshing(true);
    setNonce((n) => n + 1);
  }, []);

  return {
    data,
    error,
    // Derived, not stored. The effect returns early when there is no token, so
    // a stored `loading` would stay true for ever and every screen gated on it
    // would show a spinner that never resolves — which is exactly what an
    // expired session looked like: it loaded, then froze.
    loading: token ? loading : false,
    refreshing: token ? refreshing : false,
    reload,
    set: setData,
  };
}

export const useDashboard = () => useEndpoint<Dashboard>(getDashboard);
export const useBody = () => useEndpoint<{ scans: BodyScan[] }>(getBody);
export function useShop() {
  const { currencyCode, locale } = usePreferences();
  const fetcher = useCallback((token: string) => getShop(token, currencyCode, locale), [currencyCode, locale]);
  return useEndpoint<Shop>(fetcher, [currencyCode, locale]);
}
export const useOrders = () => useEndpoint<{ orders: TrackedOrder[]; active: number }>(getOrders);
export const useNotifications = () =>
  useEndpoint<{ unread: number; notifications: Notification[] }>(getNotifications);

export const useMaps = () =>
  useEndpoint<{ active: ActiveMap[]; maps: MapSummary[]; total: number }>(getMaps);

export function useMap(id: string) {
  const fetcher = useCallback((token: string) => getMap(token, id), [id]);
  return useEndpoint<MapDetail>(fetcher, [id]);
}

export function useSessionRuntime(mapId: string, sessionId: string) {
  const fetcher = useCallback((token: string) => getSessionRuntime(token, mapId, sessionId), [mapId, sessionId]);
  return useEndpoint<SessionRuntime>(fetcher, [mapId, sessionId]);
}

export const useAdminOverview = () => useEndpoint<AdminOverview>(getAdminOverview);
export const useAdminOrders = () => useEndpoint<{ orders: AdminOrder[] }>(getAdminOrders);
export const useAdminCatalog = () => useEndpoint<{ products: AdminCatalogProduct[] }>(getAdminCatalog);

export function useTogether(slugs: string[]) {
  const { currencyCode, locale } = usePreferences();
  const key = slugs.join(",");
  const fetcher = useCallback(
    (token: string) => getTogether(token, key ? key.split(",") : [], currencyCode, locale),
    [key, currencyCode, locale],
  );
  return useEndpoint<{ basis: "orders" | "curated"; sampleSize: number; products: TogetherProduct[] }>(fetcher, [key, currencyCode, locale]);
}

export function useMapHistory(mapId: string) {
  const fetcher = useCallback((token: string) => getMapHistory(token, mapId), [mapId]);
  return useEndpoint<MapHistory>(fetcher, [mapId]);
}

export function useThread(id: string) {
  const fetcher = useCallback((token: string) => getThread(token, id), [id]);
  return useEndpoint<Thread>(fetcher, [id]);
}

export const usePlan = () => useEndpoint<PlanInfo>(getPlan);
