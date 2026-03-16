import type { AvatarSegmentName } from "./types";

export interface AvatarPivot {
  x: number;
  y: number;
}

export const SEGMENT_PIVOTS: Record<AvatarSegmentName, AvatarPivot> = {
  head: { x: 50, y: 58 },
  torso: { x: 50, y: 95 },
  upperArmL: { x: 46, y: 78 },
  foreArmL: { x: 56, y: 103 },
  upperArmR: { x: 46, y: 78 },
  foreArmR: { x: 36, y: 105 },
  thighL: { x: 50, y: 120 },
  shinL: { x: 50, y: 155 },
  thighR: { x: 50, y: 120 },
  shinR: { x: 50, y: 155 },
  foot: { x: 50, y: 196 },
};

export const AVATAR_PATHS = {
  ground: "M10 200 Q50 195 90 200",
  shinR: "M50 155 Q48 178 47 195",
  thighR: "M50 120 Q51 138 50 155",
  shinL: "M50 155 Q52 178 53 195",
  thighL: "M50 120 Q49 138 50 155",
  torso: "M44 120 Q45 100 46 75",
  upperArmR: "M46 78 Q38 92 36 105",
  foreArmR: "M36 105 Q32 117 31 128",
  upperArmL: "M46 78 Q54 90 56 103",
  foreArmL: "M56 103 Q60 115 62 126",
  foot: "M42 196 Q50 198 58 196",
};
