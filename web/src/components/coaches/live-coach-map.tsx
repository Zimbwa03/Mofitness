"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { CoachRecord } from "@shared/features/findCoach/shared/types";

const DEFAULT_CENTER = { lat: -17.8252, lng: 31.0335 };
const GOOGLE_MAP_SCRIPT_ID = "mofitness-google-maps-script";

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#131313" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#7a7a7a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0a0a0a" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d2035" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#0a1a0a" }] },
] as const;

type EnrichedCoach = {
  coach: CoachRecord;
  distanceKm: number | null;
};

function isFiniteCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function getMapApiKey() {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
}

export function LiveCoachMap({
  coaches,
  selectedCoachId,
  radiusKm,
  onSelectCoach,
  onRadiusChange,
}: {
  coaches: EnrichedCoach[];
  selectedCoachId: string | null;
  radiusKm: number | null;
  onSelectCoach: (coachId: string) => void;
  onRadiusChange: (radiusKm: number | null) => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const userMarkerRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapUnavailableReason, setMapUnavailableReason] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const coachesWithCoordinates = useMemo(
    () =>
      coaches.filter(
        (entry) =>
          isFiniteCoordinate(entry.coach.lat) && isFiniteCoordinate(entry.coach.lng),
      ),
    [coaches],
  );

  useEffect(() => {
    const apiKey = getMapApiKey();
    if (!apiKey) {
      setMapUnavailableReason(
        "Google Maps is unavailable because NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not configured.",
      );
      return;
    }

    const initializeMap = () => {
      if (!mapContainerRef.current || !(window as any).google?.maps) {
        return;
      }

      const google = (window as any).google;
      mapRef.current = new google.maps.Map(mapContainerRef.current, {
        center: DEFAULT_CENTER,
        zoom: 11,
        styles: DARK_MAP_STYLE as any,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      setMapReady(true);
    };

    if ((window as any).google?.maps) {
      initializeMap();
      return;
    }

    let script = document.getElementById(GOOGLE_MAP_SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = GOOGLE_MAP_SCRIPT_ID;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
      script.async = true;
      script.defer = true;
      script.onerror = () =>
        setMapUnavailableReason("Unable to load Google Maps script.");
      document.body.appendChild(script);
    }

    script.addEventListener("load", initializeMap);
    return () => {
      script?.removeEventListener("load", initializeMap);
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !(window as any).google?.maps) {
      return;
    }

    const google = (window as any).google;
    for (const marker of markersRef.current.values()) {
      marker.setMap(null);
    }
    markersRef.current.clear();

    const bounds = new google.maps.LatLngBounds();
    for (const { coach } of coachesWithCoordinates) {
      const lat = Number(coach.lat);
      const lng = Number(coach.lng);
      const isSelected = coach.id === selectedCoachId;

      const marker = new google.maps.Marker({
        map: mapRef.current,
        position: { lat, lng },
        title: coach.full_name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: isSelected ? "#C8F135" : "#8ea62a",
          fillOpacity: 1,
          strokeColor: "#C8F135",
          strokeWeight: isSelected ? 3 : 2,
          scale: isSelected ? 12 : 9,
        },
      });

      marker.addListener("click", () => onSelectCoach(coach.id));
      markersRef.current.set(coach.id, marker);
      bounds.extend({ lat, lng });
    }

    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, 80);
    } else {
      mapRef.current.setCenter(DEFAULT_CENTER);
      mapRef.current.setZoom(11);
    }
  }, [coachesWithCoordinates, mapReady, onSelectCoach, selectedCoachId]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !(window as any).google?.maps) {
      return;
    }

    const google = (window as any).google;
    for (const [coachId, marker] of markersRef.current.entries()) {
      const isSelected = coachId === selectedCoachId;
      marker.setIcon({
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: isSelected ? "#C8F135" : "#8ea62a",
        fillOpacity: 1,
        strokeColor: "#C8F135",
        strokeWeight: isSelected ? 3 : 2,
        scale: isSelected ? 12 : 9,
      });
    }

    if (selectedCoachId) {
      const selectedMarker = markersRef.current.get(selectedCoachId);
      if (selectedMarker) {
        mapRef.current.panTo(selectedMarker.getPosition());
      }
    }
  }, [mapReady, selectedCoachId]);

  function centerOnUserLocation() {
    if (!mapRef.current || !navigator.geolocation || !(window as any).google?.maps) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(nextLocation);
        mapRef.current.panTo(nextLocation);
        mapRef.current.setZoom(13);

        const google = (window as any).google;
        if (userMarkerRef.current) {
          userMarkerRef.current.setMap(null);
        }
        userMarkerRef.current = new google.maps.Marker({
          map: mapRef.current,
          position: nextLocation,
          title: "Your location",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: "#C8F135",
            fillOpacity: 1,
            strokeColor: "#C8F135",
            strokeWeight: 2,
            scale: 7,
          },
        });
      },
      () => {
        setMapUnavailableReason("Location permission denied. Enable it to recenter the map.");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  if (mapUnavailableReason) {
    return (
      <div className="h-full min-h-[720px] rounded-2xl border border-white/5 bg-[radial-gradient(circle_at_top,rgba(200,241,53,0.18),transparent_28%),linear-gradient(180deg,#111,#0b0b0b)] p-6 text-sm text-muted">
        {mapUnavailableReason}
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[720px] overflow-hidden rounded-2xl border border-white/5">
      <div ref={mapContainerRef} className="absolute inset-0" />

      <div className="absolute right-4 top-4 z-10 flex flex-col gap-2">
        <button
          type="button"
          onClick={centerOnUserLocation}
          className="rounded-xl border border-white/10 bg-black/70 px-3 py-2 text-xs uppercase tracking-[0.16em] text-white"
        >
          My Location
        </button>
        <button
          type="button"
          onClick={() => mapRef.current?.setZoom((mapRef.current?.getZoom?.() ?? 11) + 1)}
          className="rounded-xl border border-white/10 bg-black/70 px-3 py-2 text-xs uppercase tracking-[0.16em] text-white"
        >
          + Zoom
        </button>
        <button
          type="button"
          onClick={() => mapRef.current?.setZoom((mapRef.current?.getZoom?.() ?? 11) - 1)}
          className="rounded-xl border border-white/10 bg-black/70 px-3 py-2 text-xs uppercase tracking-[0.16em] text-white"
        >
          - Zoom
        </button>
      </div>

      <div className="absolute left-4 top-4 z-10 rounded-xl border border-white/10 bg-black/70 p-2">
        <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-muted">
          Radius
        </div>
        <div className="flex gap-2">
          {[
            { label: "5km", value: 5 },
            { label: "10km", value: 10 },
            { label: "25km", value: 25 },
            { label: "Any", value: null },
          ].map((option) => {
            const active = radiusKm === option.value;
            return (
              <button
                key={option.label}
                type="button"
                onClick={() => onRadiusChange(option.value)}
                className={`rounded-md px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${
                  active ? "bg-lime text-black" : "bg-black/80 text-white"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {userLocation ? (
        <div className="absolute bottom-4 left-4 z-10 rounded-lg border border-white/10 bg-black/70 px-3 py-2 text-xs text-muted">
          You: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
        </div>
      ) : null}
    </div>
  );
}
