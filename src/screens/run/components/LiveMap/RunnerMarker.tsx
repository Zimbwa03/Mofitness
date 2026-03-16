import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";

import type { RoutePoint } from "../../../../models";

interface RunnerMarkerProps {
  position: RoutePoint;
}

export function RunnerMarker({ position }: RunnerMarkerProps) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 400, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 400, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Marker
      coordinate={{ latitude: position.lat, longitude: position.lng }}
      anchor={{ x: 0.5, y: 0.5 }}
      flat
      tracksViewChanges={false}
    >
      <View style={styles.wrapper}>
        <Animated.View
          style={[
            styles.outerRing,
            {
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) }],
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0.05] }),
            },
          ]}
        />
        <View style={styles.innerDot} />
        <Animated.View
          style={[
            styles.arrow,
            {
              transform: [{ rotate: `${position.heading ?? 0}deg` }],
            },
          ]}
        />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  outerRing: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(200,241,53,0.3)",
  },
  innerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#C8F135",
    borderWidth: 1,
    borderColor: "#101010",
  },
  arrow: {
    position: "absolute",
    top: 1,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 9,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#C8F135",
  },
});
