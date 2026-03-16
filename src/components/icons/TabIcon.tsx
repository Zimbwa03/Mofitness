import { Circle, Line, Path, Rect } from "react-native-svg";

import { iconColors } from "../../theme";
import { IconBase } from "./IconBase";
import type { IconProps, TabIconName } from "./types";

interface TabIconProps extends IconProps {
  name: TabIconName;
}

function renderIconPath(name: TabIconName, color: string) {
  switch (name) {
    case "home":
      return <Path d="M3 9.5L12 3l9 6.5V21h-6v-6H9v6H3z" />;
    case "workouts":
      return (
        <>
          <Rect x="2.5" y="9" width="3" height="6" rx="1.2" />
          <Rect x="18.5" y="9" width="3" height="6" rx="1.2" />
          <Line x1="5.5" y1="12" x2="18.5" y2="12" />
          <Line x1="5.5" y1="10.5" x2="5.5" y2="13.5" />
          <Line x1="18.5" y1="10.5" x2="18.5" y2="13.5" />
        </>
      );
    case "challenges":
      return (
        <>
          <Path d="M6 2h12v7a6 6 0 01-12 0V2z" stroke={color} />
          <Path d="M6 7H4a2 2 0 000 4h2" stroke={color} />
          <Path d="M18 7h2a2 2 0 010 4h-2" stroke={color} />
          <Line x1="12" y1="15" x2="12" y2="19" stroke={color} />
          <Line x1="9" y1="21" x2="15" y2="21" stroke={color} />
        </>
      );
    case "nutrition":
      return (
        <>
          <Path d="M12 22V12" />
          <Path d="M12 12C12 12 7 9.5 5 5c4 0 9 2.5 10 7" />
          <Path d="M12 12c0 0 3-2.5 6-2.5-1 4.5-4 6.5-6 7.5" />
        </>
      );
    case "wellness":
      return <Path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />;
    case "profile":
      return (
        <>
          <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <Circle cx="12" cy="7" r="4" />
        </>
      );
    default:
      return <Circle cx="12" cy="12" r="8" />;
  }
}

export function TabIcon({ color = iconColors.default, name, size = 24, style, testID }: TabIconProps) {
  return (
    <IconBase color={color} size={size} style={style} testID={testID}>
      {renderIconPath(name, color)}
    </IconBase>
  );
}
