import { Pressable, StyleSheet, Text, View } from "react-native";

import type { SavedRoute } from "../../../../models";

interface NearbyRoutesLayerProps {
  routes: SavedRoute[];
  onSelectRoute: (route: SavedRoute) => void;
}

export function NearbyRoutesLayer({ routes, onSelectRoute }: NearbyRoutesLayerProps) {
  if (routes.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {routes.slice(0, 3).map((route) => (
        <Pressable key={route.id} style={styles.card} onPress={() => onSelectRoute(route)}>
          <Text style={styles.name}>{route.name}</Text>
          <Text style={styles.meta}>{((route.distance_meters ?? 0) / 1000).toFixed(1)}km · {route.difficulty ?? "moderate"}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: "absolute", left: 12, right: 12, bottom: 12, gap: 8 },
  card: {
    backgroundColor: "rgba(15,15,15,0.92)",
    borderWidth: 1,
    borderColor: "#2F2F2F",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  name: { color: "#FFF", fontWeight: "700", fontSize: 12 },
  meta: { color: "#B6B6B6", marginTop: 2, fontSize: 11 },
});
