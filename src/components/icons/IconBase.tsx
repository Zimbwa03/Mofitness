import type { ReactNode } from "react";
import Svg from "react-native-svg";

import { iconColors } from "../../theme";
import type { IconProps } from "./types";

interface IconBaseProps extends IconProps {
  children: ReactNode;
  filled?: boolean;
  viewBox?: string;
}

export function IconBase({
  children,
  color = iconColors.default,
  filled = false,
  size = 24,
  style,
  testID,
  viewBox = "0 0 24 24",
}: IconBaseProps) {
  return (
    <Svg
      color={color}
      fill={filled ? color : "none"}
      height={size}
      stroke={filled ? "none" : color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      style={style}
      testID={testID}
      viewBox={viewBox}
      width={size}
    >
      {children}
    </Svg>
  );
}
