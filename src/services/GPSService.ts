import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

import type { RoutePoint } from "../models";
import { useRunStore } from "../stores/runStore";

export const BACKGROUND_LOCATION_TASK = "MOFITNESS_RUN_TRACKING";

if (!TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK)) {
  TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
    if (error) {
      console.error("GPS Task Error:", error);
      return;
    }

    const payload = data as { locations?: Location.LocationObject[] } | undefined;
    const locations = payload?.locations ?? [];

    for (const location of locations) {
      const point: RoutePoint = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        alt: location.coords.altitude ?? 0,
        timestamp: location.timestamp,
        speed: Math.max(0, location.coords.speed ?? 0) * 3.6,
        accuracy: location.coords.accuracy ?? 99,
        heading: location.coords.heading ?? 0,
      };

      if (point.accuracy > 30) {
        continue;
      }

      useRunStore.getState().addRoutePoint(point);
    }
  });
}

class GPSService {
  async requestPermissions() {
    const foreground = await Location.requestForegroundPermissionsAsync();
    if (foreground.status !== "granted") {
      throw new Error("Foreground location permission denied.");
    }

    const background = await Location.requestBackgroundPermissionsAsync();
    if (background.status !== "granted") {
      throw new Error("Background location permission denied.");
    }
  }

  async startTracking() {
    await this.requestPermissions();

    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 3000,
      distanceInterval: 5,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: "Mo is tracking your run",
        notificationBody: "Tap to return to your session",
        notificationColor: "#C8F135",
      },
    });
  }

  async stopTracking() {
    const started = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    if (started) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }
  }

  async getCurrentPosition() {
    return Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation });
  }

  distanceBetween(p1: RoutePoint, p2: RoutePoint) {
    const R = 6371000;
    const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
    const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((p1.lat * Math.PI) / 180) * Math.cos((p2.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  smoothPoint(prev: RoutePoint, curr: RoutePoint, alpha = 0.7): RoutePoint {
    return {
      lat: prev.lat * (1 - alpha) + curr.lat * alpha,
      lng: prev.lng * (1 - alpha) + curr.lng * alpha,
      alt: prev.alt * (1 - alpha) + curr.alt * alpha,
      timestamp: curr.timestamp,
      speed: curr.speed,
      accuracy: curr.accuracy,
      heading: curr.heading,
      heartRate: curr.heartRate,
    };
  }
}

const gpsService = new GPSService();

export default gpsService;
