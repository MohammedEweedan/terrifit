import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import { ApiError, getBand, getProfile, pairBand, patchProfile, simulateBand, type Band, type BandState, type Profile, type ProfilePatch } from "./api";
import { useSession } from "./session";
import type { UnitSystem } from "./units";

const ONBOARDED_KEY = "terrifit.onboarded";
const PROFILE_DRAFT_KEY = "terrifit.profile-draft";
const BAND_PENDING_KEY = "terrifit.band-pending";
const BAND_ARM_KEY = "terrifit.band-arm";

export type WearArm = "left" | "right";

function accountKey(base: string, token: string) {
  return `${base}.${token.slice(-16).replace(/[^a-zA-Z0-9._-]/g, "_")}`;
}

type AppState = {
  profile: Profile | null;
  band: BandState | null;
  wearArm: WearArm;
  loading: boolean;
  /** True once onboarding has been completed — the gate in _layout reads this. */
  onboarded: boolean;
  refresh: () => Promise<void>;
  saveProfile: (patch: ProfilePatch) => Promise<{ synced: boolean }>;
  completeOnboarding: (patch: ProfilePatch) => Promise<{ synced: boolean }>;
  connectBand: (serial: string, colourway: string, arm?: WearArm) => Promise<{ band: Band; synced: boolean }>;
  /** True while Pro or a live trial. */
  isPro: boolean;
  /** Metric or imperial, for everything the app prints. Stored in SI regardless. */
  units: UnitSystem;
  /** Testing without hardware. Registers a real row flagged as simulated. */
  simulateV1: (colourway: string, arm?: WearArm) => Promise<Band>;
};

const AppStateContext = createContext<AppState | null>(null);

/**
 * Profile and band, loaded once and shared.
 *
 * Both decide what the app looks like rather than what one screen shows — the
 * onboarding gate reads the profile, and the Band tab only exists when a band
 * is paired — so they live here instead of being refetched per screen.
 */
export function AppStateProvider({ children }: { children: ReactNode }) {
  const { token } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [band, setBand] = useState<BandState | null>(null);
  const [wearArm, setWearArm] = useState<WearArm>("left");
  const [loading, setLoading] = useState(true);
  const [localOnboarded, setLocalOnboarded] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      setProfile(null);
      setBand(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const onboardedKey = accountKey(ONBOARDED_KEY, token);
    const profileDraftKey = accountKey(PROFILE_DRAFT_KEY, token);
    const bandPendingKey = accountKey(BAND_PENDING_KEY, token);
    const bandArmKey = accountKey(BAND_ARM_KEY, token);
    const [storedOnboarded, storedBand, storedDraft, storedArm] = await Promise.all([
      SecureStore.getItemAsync(onboardedKey).catch(() => null),
      SecureStore.getItemAsync(bandPendingKey).catch(() => null),
      SecureStore.getItemAsync(profileDraftKey).catch(() => null),
      SecureStore.getItemAsync(bandArmKey).catch(() => null),
    ]);
    if (storedArm === "left" || storedArm === "right") setWearArm(storedArm);
    setLocalOnboarded(storedOnboarded === "1");
    let pendingBand: BandState | null = null;
    if (storedBand) {
      try {
        pendingBand = JSON.parse(storedBand) as BandState;
        setBand(pendingBand);
      } catch { /* Ignore a corrupt local draft. */ }
    }

    if (storedDraft) {
      try {
        await patchProfile(token, JSON.parse(storedDraft) as ProfilePatch);
        await SecureStore.deleteItemAsync(profileDraftKey);
      } catch { /* Keep it encrypted for the next connection. */ }
    }

    const [nextProfile, nextBand] = await Promise.all([
      getProfile(token).catch(() => null),
      getBand(token).catch(() => null),
    ]);
    if (nextProfile) {
      setProfile(nextProfile);
      if (nextProfile.profile?.onboardedAt) {
        setLocalOnboarded(true);
        await SecureStore.setItemAsync(onboardedKey, "1").catch(() => {});
      }
    }
    if (nextBand?.band) {
      setBand(nextBand);
      await SecureStore.setItemAsync(bandPendingKey, JSON.stringify(nextBand)).catch(() => {});
    } else if (pendingBand?.band?.id.startsWith("pending-")) {
      // A physical BLE connection may have succeeded while the API was down.
      // Retry ownership registration without hiding the connected band from UI.
      try {
        const result = await pairBand(token, pendingBand.band.serial, pendingBand.band.colourway);
        const registered = { band: result.band, colourways: nextBand?.colourways ?? pendingBand.colourways };
        setBand(registered);
        await SecureStore.setItemAsync(bandPendingKey, JSON.stringify(registered));
      } catch { setBand(pendingBand); }
    } else if (nextBand) {
      setBand(nextBand);
      await SecureStore.setItemAsync(bandPendingKey, JSON.stringify(nextBand)).catch(() => {});
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const completeOnboarding = useCallback(async (patch: ProfilePatch) => {
    if (!token) throw new Error("No active session");
    let synced = true;
    try {
      await patchProfile(token, patch);
    } catch (caught) {
      if (caught instanceof ApiError) throw caught;
      synced = false;
      await SecureStore.setItemAsync(accountKey(PROFILE_DRAFT_KEY, token), JSON.stringify(patch));
    }
    await SecureStore.setItemAsync(accountKey(ONBOARDED_KEY, token), "1");
    setLocalOnboarded(true);
    if (synced) await load();
    return { synced };
  }, [token, load]);

  const saveProfile = useCallback(async (patch: ProfilePatch) => {
    if (!token) throw new Error("No active session");
    let synced = true;
    try {
      await patchProfile(token, patch);
    } catch (caught) {
      if (caught instanceof ApiError) throw caught;
      synced = false;
      const key = accountKey(PROFILE_DRAFT_KEY, token);
      const existing = await SecureStore.getItemAsync(key).catch(() => null);
      const queued = existing ? JSON.parse(existing) as ProfilePatch : {};
      await SecureStore.setItemAsync(key, JSON.stringify({ ...queued, ...patch }));
    }
    setProfile(current => current ? {
      ...current,
      user: {
        ...current.user,
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.handle !== undefined ? { handle: patch.handle } : {}),
      },
      profile: current.profile ? {
        ...current.profile,
        ...(patch.bio !== undefined ? { bio: patch.bio } : {}),
        ...(patch.goal !== undefined ? { goal: patch.goal } : {}),
        ...(patch.activityLevel !== undefined ? { activityLevel: patch.activityLevel } : {}),
        ...(patch.trainingDays !== undefined ? { trainingDays: patch.trainingDays } : {}),
        ...(patch.units !== undefined ? { units: patch.units } : {}),
        ...(patch.heightCm !== undefined ? { heightCm: patch.heightCm } : {}),
        ...(patch.weightKg !== undefined ? { weightKg: patch.weightKg } : {}),
        ...(patch.shareWithCreators !== undefined ? { shareWithCreators: patch.shareWithCreators } : {}),
      } : current.profile,
    } : current);
    if (synced) await load();
    return { synced };
  }, [token, load]);

  const connectBand = useCallback(async (serial: string, colourway: string, arm: WearArm = "left") => {
    if (!token) throw new Error("No active session");
    setWearArm(arm);
    await SecureStore.setItemAsync(accountKey(BAND_ARM_KEY, token), arm);
    try {
      const result = await pairBand(token, serial, colourway);
      const next = { band: result.band, colourways: band?.colourways ?? [] };
      setBand(next);
      await SecureStore.setItemAsync(accountKey(BAND_PENDING_KEY, token), JSON.stringify(next));
      return { band: result.band, synced: true };
    } catch (caught) {
      if (caught instanceof ApiError) throw caught;
      const pending: Band = {
        id: `pending-${serial}`,
        serial,
        colourway,
        firmware: "Pending device sync",
        batteryPercent: 0,
        pairedAt: new Date().toISOString(),
        lastSyncAt: null,
      };
      const next = { band: pending, colourways: band?.colourways ?? [] };
      setBand(next);
      await SecureStore.setItemAsync(accountKey(BAND_PENDING_KEY, token), JSON.stringify(next));
      return { band: pending, synced: false };
    }
  }, [token, band?.colourways]);

  const simulateV1 = useCallback(async (colourway: string, arm: WearArm = "left") => {
    if (!token) throw new Error("No active session");
    const result = await simulateBand(token, colourway);
    const next = { band: result.band, colourways: band?.colourways ?? [] };
    setBand(next);
    setWearArm(arm);
    await Promise.all([
      SecureStore.setItemAsync(accountKey(BAND_PENDING_KEY, token), JSON.stringify(next)),
      SecureStore.setItemAsync(accountKey(BAND_ARM_KEY, token), arm),
    ]);
    return result.band;
  }, [token, band?.colourways]);

  const value = useMemo<AppState>(
    () => ({
      profile,
      band,
      isPro: profile?.user.plan === "pro" || profile?.user.plan === "trial",
      units: profile?.profile?.units === "imperial" ? "imperial" : "metric",
      wearArm,
      loading,
      onboarded: localOnboarded || Boolean(profile?.profile?.onboardedAt),
      refresh: load,
      saveProfile,
      completeOnboarding,
      connectBand,
      simulateV1,
    }),
    [profile, band, wearArm, loading, localOnboarded, load, saveProfile, completeOnboarding, connectBand, simulateV1],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppState {
  const value = useContext(AppStateContext);
  if (!value) throw new Error("useAppState must be used inside <AppStateProvider>");
  return value;
}
