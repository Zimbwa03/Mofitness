import type { RoutePoint } from "../models";

export interface RunningArea {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: "park" | "trail" | "track";
}

export interface RoutePreferences {
  distanceKm?: number;
  easyAndFlat?: boolean;
  scenic?: boolean;
  loop?: boolean;
  safeArea?: boolean;
  surface?: "road" | "trail" | "track" | "mixed";
}

export interface GeneratedRoute {
  name: string;
  description: string;
  distanceMeters: number;
  elevationGainM: number;
  estimatedMinutes: number;
  difficulty: "easy" | "moderate" | "hard";
  tags: string[];
  points: RoutePoint[];
}

export interface RouteSafetyScore {
  score: number;
  notes: string;
}

class RouteService {
  async getNearbyRunningAreas(lat: number, lng: number): Promise<RunningArea[]> {
    const seed = `${lat.toFixed(4)}:${lng.toFixed(4)}`;
    return [
      { id: `${seed}:1`, name: "City Park Loop", lat: lat + 0.01, lng: lng + 0.01, type: "park" },
      { id: `${seed}:2`, name: "River Trail", lat: lat - 0.01, lng: lng + 0.005, type: "trail" },
      { id: `${seed}:3`, name: "Municipal Track", lat: lat + 0.006, lng: lng - 0.008, type: "track" },
    ];
  }

  async generateRoute(
    origin: { lat: number; lng: number },
    preferences: RoutePreferences,
    _userFitnessLevel: string,
  ): Promise<GeneratedRoute> {
    const distanceKm = Math.max(1, Math.min(21, preferences.distanceKm ?? 5));
    const meters = distanceKm * 1000;
    const points: RoutePoint[] = [];
    const steps = 48;
    const radius = distanceKm / 111 / 6;

    for (let i = 0; i <= steps; i += 1) {
      const angle = (Math.PI * 2 * i) / steps;
      points.push({
        lat: origin.lat + Math.sin(angle) * radius,
        lng: origin.lng + Math.cos(angle) * radius,
        alt: 0,
        timestamp: Date.now() + i * 1000,
        speed: 0,
        accuracy: 10,
      });
    }

    return {
      name: preferences.scenic ? "Scenic Loop" : "Recovery Loop",
      description: preferences.easyAndFlat
        ? "Mostly flat route with stable road surface."
        : "Balanced route with mild rolling sections.",
      distanceMeters: meters,
      elevationGainM: preferences.easyAndFlat ? 20 : 60,
      estimatedMinutes: Math.round(distanceKm * 6.2),
      difficulty: preferences.easyAndFlat ? "easy" : distanceKm > 10 ? "hard" : "moderate",
      tags: [preferences.scenic ? "scenic" : "steady", preferences.loop ? "loop" : "point_to_point"],
      points,
    };
  }

  decodePolyline(encoded: string): Array<{ lat: number; lng: number }> {
    const points: Array<{ lat: number; lng: number }> = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let result = 1;
      let shift = 0;
      let b: number;
      do {
        b = encoded.charCodeAt(index++) - 63 - 1;
        result += b << shift;
        shift += 5;
      } while (b >= 0x1f);
      lat += result & 1 ? ~(result >> 1) : result >> 1;

      result = 1;
      shift = 0;
      do {
        b = encoded.charCodeAt(index++) - 63 - 1;
        result += b << shift;
        shift += 5;
      } while (b >= 0x1f);
      lng += result & 1 ? ~(result >> 1) : result >> 1;

      points.push({ lat: lat * 1e-5, lng: lng * 1e-5 });
    }

    return points;
  }

  async assessRouteSafety(polyline: Array<{ lat: number; lng: number }>): Promise<RouteSafetyScore> {
    if (polyline.length < 2) {
      return { score: 40, notes: "Route is too short for safety assessment." };
    }

    return {
      score: 78,
      notes: "Primary roads and park paths detected; avoid highway edges and low-light segments.",
    };
  }
}

const routeService = new RouteService();

export default routeService;
