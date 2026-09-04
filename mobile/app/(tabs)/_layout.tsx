import { Tabs } from "expo-router";
import { useAppState } from "@/app-state";
import { PremiumTabBar } from "@/components/PremiumTabBar";
import { theme } from "@/theme";
import { usePreferences } from "@/preferences";

export default function TabsLayout() {
  const { band } = useAppState();
  const preferences = usePreferences();
  return (
    <Tabs
      tabBar={(props)=><PremiumTabBar {...props}/>}
      screenOptions={{
        headerShown: false,
        // A tab scene with no background of its own falls through to the window,
        // which is black — that is the blank screen that appeared after going
        // back and cleared as soon as the scene re-rendered.
        sceneStyle: { backgroundColor: theme.bg },
        // `shift` with a custom spring left scenes blank part-way through the
        // transition. The default fade is boring and correct.
        animation: "fade",
      }}
    >
      <Tabs.Screen name="index" options={{ title: preferences.t("home") }} />
      <Tabs.Screen name="maps" options={{ title: preferences.t("maps") }} />
      <Tabs.Screen name="band" options={{ title: band?.band ? "V1" : preferences.t("connect") }} />
      <Tabs.Screen name="shop" options={{ title: preferences.t("fuel") }} />
      <Tabs.Screen name="profile" options={{ title: preferences.t("profile") }} />
      <Tabs.Screen name="trends" options={{ href: null }} />
      <Tabs.Screen name="body" options={{ href: null }} />
    </Tabs>
  );
}
