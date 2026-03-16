import type { RoutePoint } from "../../../../models";
import { RoutePolyline } from "./RoutePolyline";

export function RouteOverlay({ points }: { points: RoutePoint[] }) {
  return <RoutePolyline points={points} color="rgba(245,166,35,0.7)" width={3} dashed />;
}
