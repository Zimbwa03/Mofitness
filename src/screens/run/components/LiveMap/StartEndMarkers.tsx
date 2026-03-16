import { Marker } from "react-native-maps";
import { Text, View } from "react-native";

import type { RoutePoint } from "../../../../models";

interface StartEndMarkersProps {
  start: RoutePoint | null;
  end: RoutePoint | null;
}

export function StartEndMarkers({ start, end }: StartEndMarkersProps) {
  return (
    <>
      {start ? (
        <Marker coordinate={{ latitude: start.lat, longitude: start.lng }}>
          <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: "#1A1A1A" }}>
            <Text style={{ color: "#C8F135", fontWeight: "700", fontSize: 11 }}>START</Text>
          </View>
        </Marker>
      ) : null}
      {end ? (
        <Marker coordinate={{ latitude: end.lat, longitude: end.lng }}>
          <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: "#2A2A2A" }}>
            <Text style={{ color: "#F5A623", fontWeight: "700", fontSize: 11 }}>END</Text>
          </View>
        </Marker>
      ) : null}
    </>
  );
}
