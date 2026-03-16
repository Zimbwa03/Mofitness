import { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { Marker } from "react-native-maps";
import { Text, View } from "react-native";

import type { RoutePoint } from "../../../../models";

interface KmMarker {
  km: number;
  point: RoutePoint;
}

export function KmMarkers({ markers }: { markers: KmMarker[] }) {
  return (
    <>
      {markers.map((marker) => (
        <AnimatedKmMarker key={`km-${marker.km}-${marker.point.timestamp}`} marker={marker} />
      ))}
    </>
  );
}

function AnimatedKmMarker({ marker }: { marker: KmMarker }) {
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.2, useNativeDriver: false, friction: 5 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: false, friction: 7 }),
    ]).start();
  }, [scale]);

  return (
    <Marker coordinate={{ latitude: marker.point.lat, longitude: marker.point.lng }}>
      <Animated.View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: "#1A1A1A",
          borderWidth: 1,
          borderColor: "#FFFFFF40",
          alignItems: "center",
          justifyContent: "center",
          transform: [{ scale }],
        }}
      >
        <Text style={{ color: "#FFF", fontSize: 10, fontWeight: "700" }}>{marker.km}</Text>
      </Animated.View>
    </Marker>
  );
}
