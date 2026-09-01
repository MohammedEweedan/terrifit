import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { useFonts, Anton_400Regular } from "@expo-google-fonts/anton";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SessionProvider, useSession } from "@/session";
import { AppStateProvider, useAppState } from "@/app-state";
import { PreferencesProvider, usePreferences } from "@/preferences";
import { StatPreferencesProvider } from "@/stats";
import { CartProvider } from "@/cart";
import { PaymentsProvider } from "@/payments";
import { theme } from "@/theme";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Anton_400Regular });

  return (
    <SafeAreaProvider>
      <PreferencesProvider><StatPreferencesProvider><CartProvider><PaymentsProvider><SessionProvider><AppStateProvider><AppRoot fontsLoaded={fontsLoaded}/></AppStateProvider></SessionProvider></PaymentsProvider></CartProvider></StatPreferencesProvider></PreferencesProvider>
    </SafeAreaProvider>
  );
}

function AppRoot({fontsLoaded}:{fontsLoaded:boolean}){const preferences=usePreferences();return <><StatusBar style={preferences.scheme==="light"?"dark":"light"}/>{fontsLoaded&&preferences.ready?<Gate/>:<Splash/>}</>}

function Splash() {
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={theme.accent} />
    </View>
  );
}

/**
 * Sends people to sign-in or to the tabs, once — and only once the keychain
 * has actually been read. Redirecting before `ready` would bounce a signed-in
 * user through the login screen on every cold start.
 */
function Gate() {
  const { token, ready } = useSession();
  const { loading, onboarded } = useAppState();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    const root = segments[0];
    const inTabs = root === "(tabs)";
    const inAuth = root === "sign-in";
    const inSetup = root === "onboarding" || root === "pair-band";

    if (!token && !inAuth) router.replace("/sign-in");
    else if (token && !loading && !onboarded && !inSetup) router.replace("/onboarding");
    else if (token && !loading && onboarded && (inAuth || root === "onboarding")) router.replace("/");
    else if (token && !loading && onboarded && !inTabs && !inSetup && root == null) router.replace("/");
  }, [ready, token, loading, onboarded, segments, router]);

  if (!ready || (Boolean(token) && loading)) return <Splash />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="pair-band" />
      <Stack.Screen name="notifications" options={{ presentation: "modal" }} />
      <Stack.Screen name="map/[id]" />
      <Stack.Screen name="map/[id]/history" />
      <Stack.Screen name="exercise/[name]" />
      <Stack.Screen name="thread/[id]" />
      <Stack.Screen name="product/[slug]" />
      <Stack.Screen name="edit-profile" options={{ presentation: "modal" }} />
      <Stack.Screen name="settings" />
      <Stack.Screen name="customise-stats" options={{ presentation: "modal" }} />
      <Stack.Screen name="metric/[id]" options={{ presentation: "modal" }} />
      <Stack.Screen name="session/[map]/[id]" options={{ presentation: "fullScreenModal" }} />
      <Stack.Screen name="cart" options={{ presentation: "modal" }} />
      <Stack.Screen name="checkout" />
      <Stack.Screen name="admin" />
      <Stack.Screen name="signal" options={{ presentation: "modal" }} />
      <Stack.Screen name="fitness-age" options={{ presentation: "modal" }} />
      <Stack.Screen name="pro" options={{ presentation: "modal" }} />
      <Stack.Screen name="insights" options={{ presentation: "modal" }} />
    </Stack>
  );
}
