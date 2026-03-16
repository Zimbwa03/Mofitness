import { useEffect } from "react";
import { View } from "react-native";

import type { MofitnessPoseViewProps } from "./MofitnessPose.types";

export default function MofitnessPoseView({ active, onStatusChange, style }: MofitnessPoseViewProps) {
  useEffect(() => {
    onStatusChange?.({
      nativeEvent: {
        status: active ? "unavailable" : "paused",
        message: "Native pose tracking requires an Android or iOS development build.",
      },
    });
  }, [active, onStatusChange]);

  return <View style={style} />;
}
