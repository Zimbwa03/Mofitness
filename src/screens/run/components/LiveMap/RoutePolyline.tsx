import { Polyline } from "react-native-maps";

import type { RoutePoint } from "../../../../models";

interface RoutePolylineProps {
  points: RoutePoint[];
  color?: string;
  width?: number;
  dashed?: boolean;
  glow?: boolean;
}

export function RoutePolyline({ points, color = "#C8F135", width = 5, dashed = false, glow = false }: RoutePolylineProps) {
  if (points.length < 2) {
    return null;
  }

  return (
    <>
      {glow ? (
        <Polyline
          coordinates={points.map((point) => ({ latitude: point.lat, longitude: point.lng }))}
          strokeColor="rgba(200,241,53,0.25)"
          strokeWidth={width + 4}
        />
      ) : null}
      <Polyline
        coordinates={points.map((point) => ({ latitude: point.lat, longitude: point.lng }))}
        strokeColor={color}
        strokeWidth={width}
        lineDashPattern={dashed ? [8, 8] : undefined}
      />
    </>
  );
}
