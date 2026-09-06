import { Platform, StyleSheet, View } from "react-native";
import { Text } from "@/components/AppText";
import { theme } from "@/theme";

/**
 * The map, isolated behind a guard.
 *
 * `expo-maps` resolves its native module at import time, so a build that does
 * not contain it throws the moment the module is required. That would be a
 * contained failure if the map were only reachable from one screen — but
 * expo-router walks and imports *every* route file when it builds the route
 * tree, so the throw happened during startup and took down the entire app.
 * A member with a slightly older build could not open Terrifit at all.
 *
 * Requiring it lazily inside a try means the worst case is a screen that says
 * the map is unavailable, which is what a missing optional native module
 * should cost.
 */

type LatLng = { latitude: number; longitude: number };

/** Resolved once. `require` rather than `import` so the failure is catchable. */
const maps: { View: React.ComponentType<Record<string, unknown>> } | null = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module = require("expo-maps") as {
      AppleMaps: { View: React.ComponentType<Record<string, unknown>> };
      GoogleMaps: { View: React.ComponentType<Record<string, unknown>> };
    };
    return { View: Platform.OS === "ios" ? module.AppleMaps.View : module.GoogleMaps.View };
  } catch {
    return null;
  }
})();

export const mapAvailable = maps != null;

export function RouteMap({
  camera,
  route,
  start,
  colour,
  unavailableLabel,
}: {
  camera?: { coordinates: LatLng; zoom: number };
  route: LatLng[];
  start: LatLng | null;
  colour: string;
  unavailableLabel: string;
}) {
  if (!maps) {
    return (
      <View style={s.missing}>
        <Text style={s.missingText}>{unavailableLabel}</Text>
      </View>
    );
  }

  const MapView = maps.View;
  return (
    <MapView
      style={StyleSheet.absoluteFill}
      cameraPosition={camera}
      properties={{ isMyLocationEnabled: true }}
      polylines={route.length > 1 ? [{ id: "route", coordinates: route, color: colour, width: 6 }] : []}
      markers={start ? [{ coordinates: start, title: "Start" }] : []}
    />
  );
}

const s = StyleSheet.create({
  missing: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30, backgroundColor: theme.surface },
  missingText: { color: theme.ink2, fontSize: 13, lineHeight: 20, textAlign: "center" },
});
