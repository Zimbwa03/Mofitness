import { Text } from "react-native-paper";

import { typography } from "../../../theme";

function toClock(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function RunTimer({ seconds }: { seconds: number }) {
  return (
    <Text style={{ ...typography.display_sm, color: "#FFFFFF" }} allowFontScaling>
      {toClock(seconds)}
    </Text>
  );
}
