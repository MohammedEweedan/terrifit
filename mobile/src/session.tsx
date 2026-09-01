import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import { signIn as apiSignIn, signUp as apiSignUp } from "./api";
import { registerForPush, unregisterPush } from "./push";

const TOKEN_KEY = "terrifit.session";

type SessionValue = {
  token: string | null;
  name: string | null;
  /** False until the keychain has been read, so the app never flashes sign-in. */
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

/**
 * The session token lives in the keychain, not AsyncStorage.
 *
 * It is a bearer credential for somebody's health data; SecureStore puts it
 * behind the device's own encryption rather than in a plaintext sqlite file
 * any backup would pick up.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const pushToken = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    SecureStore.getItemAsync(TOKEN_KEY)
      .then((stored) => {
        if (!cancelled) setToken(stored);
      })
      .catch(() => {
        // No keychain access is the same as no session.
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const adopt = useCallback(async (result: { user: { name: string }; token: string }) => {
    await SecureStore.setItemAsync(TOKEN_KEY, result.token);
    setToken(result.token);
    setName(result.user.name);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => adopt(await apiSignIn(email, password)),
    [adopt],
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) => adopt(await apiSignUp(name, email, password)),
    [adopt],
  );

  // Registration is fire-and-forget: a denied prompt or a simulator must never
  // block someone from using the app.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    registerForPush(token)
      .then((push) => {
        if (!cancelled) pushToken.current = push;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [token]);

  const signOut = useCallback(async () => {
    if (token) await unregisterPush(token, pushToken.current).catch(() => {});
    pushToken.current = null;
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    setToken(null);
    setName(null);
  }, [token]);

  const value = useMemo<SessionValue>(
    () => ({ token, name, ready, signIn, signUp, signOut }),
    [token, name, ready, signIn, signUp, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside <SessionProvider>");
  return value;
}
