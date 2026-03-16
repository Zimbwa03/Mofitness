import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import MapView, { PROVIDER_GOOGLE, type Region } from "react-native-maps";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import type { RoutePoint, SavedRoute } from "../../../../models";
import { KmMarkers } from "./KmMarkers";
import { NearbyRoutesLayer } from "./NearbyRoutesLayer";
import { RouteOverlay } from "./RouteOverlay";
import { RoutePolyline } from "./RoutePolyline";
import { RunnerMarker } from "./RunnerMarker";
import { StartEndMarkers } from "./StartEndMarkers";

interface LiveMapViewProps {
  routePoints: RoutePoint[];
  kmMarkers: Array<{ km: number; point: RoutePoint; timestamp: number }>;
  plannedRoute?: RoutePoint[];
  nearbyRoutes?: SavedRoute[];
  onSelectNearbyRoute?: (route: SavedRoute) => void;
  fitToRouteSignal?: number;
}

const defaultRegion: Region = {
  latitude: -17.8252,
  longitude: 31.0335,
  latitudeDelta: 0.03,
  longitudeDelta: 0.03,
};

export function LiveMapView({
  routePoints,
  kmMarkers,
  plannedRoute = [],
  nearbyRoutes = [],
  onSelectNearbyRoute,
  fitToRouteSignal = 0,
}: LiveMapViewProps) {
  const mapRef = useRef<MapView | null>(null);
  const latestPoint = routePoints.length > 0 ? routePoints[routePoints.length - 1] : null;
  const [zoomDelta, setZoomDelta] = useState(0.0055);
  const [mapType, setMapType] = useState<"standard" | "satellite">("standard");
  const [followHeading, setFollowHeading] = useState(true);

  const recenter = (delta = zoomDelta) => {
    if (!latestPoint) {
      return;
    }
    if (followHeading) {
      mapRef.current?.animateCamera(
        {
          center: { latitude: latestPoint.lat, longitude: latestPoint.lng },
          zoom: Math.max(13, 17 - delta * 300),
          heading: latestPoint.heading ?? 0,
        },
        { duration: 200 },
      );
      return;
    }
    mapRef.current?.animateToRegion(
      {
        latitude: latestPoint.lat,
        longitude: latestPoint.lng,
        latitudeDelta: delta,
        longitudeDelta: delta,
      },
      200,
    );
  };

  useEffect(() => {
    if (!fitToRouteSignal || routePoints.length < 2) {
      return;
    }
    mapRef.current?.fitToCoordinates(
      routePoints.map((point) => ({ latitude: point.lat, longitude: point.lng })),
      {
        edgePadding: { top: 50, right: 50, bottom: 80, left: 50 },
        animated: true,
      },
    );
  }, [fitToRouteSignal, routePoints]);

  useEffect(() => {
    if (!latestPoint) {
      return;
    }
    recenter();
  }, [latestPoint, followHeading, zoomDelta]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={defaultRegion}
        mapType={mapType}
        loadingEnabled
        showsUserLocation
        showsCompass={false}
        showsMyLocationButton={false}
      >
        <RoutePolyline points={routePoints} glow />
        <RouteOverlay points={plannedRoute} />
        <KmMarkers markers={kmMarkers} />
        <StartEndMarkers start={routePoints[0] ?? null} end={latestPoint} />
        {latestPoint ? <RunnerMarker position={latestPoint} /> : null}
      </MapView>

      <View style={styles.controls}>
        <Pressable
          style={styles.controlBtn}
          onPress={() => recenter()}
        >
          <MaterialCommunityIcons name="crosshairs-gps" size={16} color="#FFFFFF" />
        </Pressable>
        <Pressable
          style={styles.controlBtn}
          onPress={() => {
            const next = Math.max(0.002, zoomDelta - 0.0015);
            setZoomDelta(next);
            recenter(next);
          }}
        >
          <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
        </Pressable>
        <Pressable
          style={styles.controlBtn}
          onPress={() => {
            const next = Math.min(0.02, zoomDelta + 0.0015);
            setZoomDelta(next);
            recenter(next);
          }}
        >
          <MaterialCommunityIcons name="minus" size={16} color="#FFFFFF" />
        </Pressable>
        <Pressable style={styles.controlBtn} onPress={() => setFollowHeading((prev) => !prev)}>
          <MaterialCommunityIcons name={followHeading ? "compass" : "compass-off-outline"} size={16} color="#FFFFFF" />
        </Pressable>
        <Pressable style={styles.controlBtn} onPress={() => setMapType((prev) => (prev === "standard" ? "satellite" : "standard"))}>
          <MaterialCommunityIcons name="map" size={16} color="#FFFFFF" />
        </Pressable>
      </View>

      {onSelectNearbyRoute ? <NearbyRoutesLayer routes={nearbyRoutes} onSelectRoute={onSelectNearbyRoute} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, borderRadius: 16, overflow: "hidden" },
  controls: {
    position: "absolute",
    top: 12,
    right: 12,
    gap: 8,
  },
  controlBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderWidth: 1,
    borderColor: "#2F2F2F",
  },
});
