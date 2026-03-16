import { Circle, Line, Path, Rect } from "react-native-svg";

import { iconColors } from "../../theme";
import { IconBase } from "./IconBase";
import { TabIcon } from "./TabIcon";
import type { IconProps } from "./types";

export { TabIcon };
export type { IconProps, TabIconName } from "./types";

export function BackIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <Path d="M15 18l-6-6 6-6" />
    </IconBase>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <Path d="M4 7h16M4 12h16M4 17h16" />
    </IconBase>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <Rect x="3" y="6" width="18" height="12" rx="2.4" />
      <Path d="M4.5 7.5L12 13l7.5-5.5" />
    </IconBase>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <Rect x="4" y="11" width="16" height="10" rx="2.2" />
      <Path d="M8 11V8a4 4 0 018 0v3" />
    </IconBase>
  );
}

export function PersonIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </IconBase>
  );
}

export function ShieldCheckIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <Path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" />
      <Path d="M9 12l2 2 4-4" />
    </IconBase>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <Path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <Circle cx="12" cy="12" r="3" />
    </IconBase>
  );
}

export function EyeOffIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <Path d="M3 3l18 18" />
      <Path d="M10.6 10.6A3 3 0 0013.4 13.4" />
      <Path d="M9.9 5.2A11.6 11.6 0 0112 5c7 0 11 7 11 7a20.2 20.2 0 01-5.2 5.8" />
      <Path d="M6.2 6.2A20 20 0 001 12s4 7 11 7a11 11 0 004.3-.8" />
    </IconBase>
  );
}

export function GoogleIcon({ color = iconColors.default, ...props }: IconProps) {
  return (
    <IconBase color={color} {...props}>
      <Path d="M20 12.2c0-.6-.05-1.16-.16-1.7H12v3.2h4.48a3.9 3.9 0 01-1.66 2.56v2.66h2.68c1.56-1.44 2.5-3.56 2.5-6.74z" />
      <Path d="M12 20c2.26 0 4.16-.75 5.54-2.04l-2.68-2.66c-.74.5-1.68.8-2.86.8-2.2 0-4.06-1.48-4.72-3.48H4.52v2.74A8 8 0 0012 20z" />
      <Path d="M7.28 12.62A4.8 4.8 0 017 11c0-.56.1-1.1.28-1.62V6.64H4.52A8 8 0 004 11c0 1.28.3 2.5.84 3.56l2.44-1.94z" />
      <Path d="M12 5.9c1.22 0 2.32.42 3.18 1.24l2.38-2.38A8 8 0 0012 2a8 8 0 00-7.48 4.64l2.76 2.74C7.94 7.38 9.8 5.9 12 5.9z" />
    </IconBase>
  );
}

export function AppleIcon(props: IconProps) {
  return (
    <IconBase filled {...props}>
      <Path d="M16.6 12.7c0-2 1.65-2.95 1.73-3a3.72 3.72 0 00-2.9-1.6c-1.23-.13-2.43.73-3.05.73-.64 0-1.6-.71-2.63-.69-1.35.02-2.6.79-3.3 2-.72 1.25-.18 3.1.52 4.12.68.98 1.5 2.08 2.58 2.04 1.05-.04 1.45-.67 2.72-.67 1.28 0 1.63.67 2.74.65 1.13-.02 1.84-1.02 2.51-2 .78-1.14 1.1-2.24 1.11-2.3-.03-.01-2.13-.82-2.13-3.28z" />
      <Path d="M14.62 5.62c.56-.67.94-1.6.84-2.52-.81.03-1.8.54-2.38 1.22-.52.6-.98 1.55-.85 2.46.91.07 1.83-.46 2.39-1.16z" />
    </IconBase>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.73 21a2 2 0 01-3.46 0" />
    </IconBase>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <Circle cx="12" cy="12" r="3" />
      <Path d="M12 2v2m0 16v2M2 12h2m16 0h2m-4.22-7.78-1.42 1.42M7.64 16.36l-1.42 1.42m12.32 0L17.24 16.2M6.34 7.76 7.76 6.34" />
    </IconBase>
  );
}

export function CameraIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h3l2-3h8l2 3h3a2 2 0 012 2z" />
      <Circle cx="12" cy="13" r="4" />
    </IconBase>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <Path d="M3 9h18" />
      <Rect x="3" y="4" width="18" height="17" rx="2.4" />
      <Line x1="8" y1="2.5" x2="8" y2="6" />
      <Line x1="16" y1="2.5" x2="16" y2="6" />
    </IconBase>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <Circle cx="11" cy="11" r="6" />
      <Path d="M21 21l-5.2-5.2" />
    </IconBase>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <Path d="M12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21M5.64 5.64l1.06 1.06M17.3 17.3l1.06 1.06M5.64 18.36l1.06-1.06M17.3 6.7l1.06-1.06" />
      <Circle cx="12" cy="12" r="3" />
    </IconBase>
  );
}

export function LightningIcon(props: IconProps) {
  return (
    <IconBase filled {...props}>
      <Path d="M13 2L3 14h8l-1 8 11-13h-8l1-7z" />
    </IconBase>
  );
}

export function MoodDotIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <Circle cx="12" cy="12" r="4.5" />
    </IconBase>
  );
}
