import { Tabs } from "expo-router";
import { useAppState } from "@/app-state";
import { PremiumTabBar } from "@/components/PremiumTabBar";

export default function TabsLayout() {
  const { band } = useAppState();
  return (
    <Tabs
      tabBar={(props)=><PremiumTabBar {...props}/>}
      screenOptions={{
        headerShown: false,
        animation: "shift",
        transitionSpec: { animation: "spring", config: { damping: 24, stiffness: 240, mass: .8 } },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="maps" options={{ title: "Maps" }} />
      <Tabs.Screen name="band" options={{ title: band?.band ? "V1" : "Connect" }} />
      <Tabs.Screen name="shop" options={{ title: "Fuel" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      <Tabs.Screen name="trends" options={{ href: null }} />
      <Tabs.Screen name="body" options={{ href: null }} />
    </Tabs>
  );
}
