import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, SegmentedButtons, TextInput } from "react-native-paper";

import type { WellnessSnapshot } from "../../models";
import { theme } from "../../theme";

interface WellnessFormProps {
  initialValue?: WellnessSnapshot | null;
  onSubmit: (value: WellnessSnapshot) => void;
}

export function WellnessForm({ initialValue, onSubmit }: WellnessFormProps) {
  const [sleepHours, setSleepHours] = useState(initialValue?.sleep_hours?.toString() ?? "");
  const [waterLiters, setWaterLiters] = useState(initialValue?.water_liters?.toString() ?? "");
  const [stressLevel, setStressLevel] = useState(initialValue?.stress_level?.toString() ?? "5");
  const [mood, setMood] = useState(initialValue?.mood ?? "good");

  return (
    <View style={styles.container}>
      <TextInput
        accessibilityLabel="Sleep hours"
        label="Sleep (hours)"
        mode="outlined"
        keyboardType="numeric"
        value={sleepHours}
        onChangeText={setSleepHours}
        testID="wellness-sleep-input"
      />
      <TextInput
        accessibilityLabel="Water liters"
        label="Water (liters)"
        mode="outlined"
        keyboardType="numeric"
        value={waterLiters}
        onChangeText={setWaterLiters}
        testID="wellness-water-input"
      />
      <TextInput
        accessibilityLabel="Stress level"
        label="Stress 1-10"
        mode="outlined"
        keyboardType="numeric"
        value={stressLevel}
        onChangeText={setStressLevel}
        testID="wellness-stress-input"
      />
      <SegmentedButtons
        value={mood}
        onValueChange={setMood}
        buttons={[
          { label: "Great", value: "great" },
          { label: "Good", value: "good" },
          { label: "Neutral", value: "neutral" },
          { label: "Poor", value: "poor" },
        ]}
      />
      <Button
        mode="contained"
        accessibilityRole="button"
        accessibilityLabel="Save wellness log"
        testID="wellness-save-button"
        onPress={() =>
          onSubmit({
            sleep_hours: sleepHours ? Number(sleepHours) : null,
            water_liters: waterLiters ? Number(waterLiters) : null,
            stress_level: stressLevel ? Number(stressLevel) : null,
            mood,
          })
        }
      >
        Save wellness log
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
  },
});
