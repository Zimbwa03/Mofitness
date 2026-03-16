import { useEffect, useMemo, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { MoInput } from '../../components/common/MoInput';
import type { CountryCuisine } from '../../models';
import type { OnboardingStackParamList } from '../../navigation/types';
import nutritionService from '../../services/NutritionService';
import { useAuthStore } from '../../stores/authStore';
import { colors, theme, typography } from '../../theme';
import { OnboardingLayout } from './OnboardingLayout';

const restrictionOptions = ['vegetarian', 'vegan', 'halal', 'low_carb', 'gluten_free', 'dairy_free'];

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Step7Nutrition'>;

export function Step7NutritionScreen({ navigation }: Props) {
  const preferences = useAuthStore((state) => state.preferences);
  const setPreferences = useAuthStore((state) => state.setPreferences);

  const [selectedRestrictions, setSelectedRestrictions] = useState(preferences.dietary_restrictions);
  const [customRestriction, setCustomRestriction] = useState('');
  const [countryCode, setCountryCode] = useState(preferences.country_code ?? 'ZW');
  const [allergiesText, setAllergiesText] = useState((preferences.allergies ?? []).join(', '));
  const [countryCuisines, setCountryCuisines] = useState<CountryCuisine[]>([]);
  const [selectedCuisine, setSelectedCuisine] = useState<string[]>(preferences.cuisine_preferences ?? []);

  useEffect(() => {
    nutritionService.getCountryCuisines().then(setCountryCuisines).catch(() => undefined);
  }, []);

  const activeCountry = useMemo(
    () => countryCuisines.find((row) => row.country_code === countryCode) ?? countryCuisines[0],
    [countryCode, countryCuisines],
  );

  const toggleRestriction = (item: string) => {
    setSelectedRestrictions((current) => (current.includes(item) ? current.filter((value) => value !== item) : [...current, item]));
  };

  return (
    <OnboardingLayout
      step={7}
      title="How do you eat?"
      subtitle="Set baseline nutrition preferences so your meal planning starts with the right country, cuisine, and restrictions."
      onBack={() => navigation.goBack()}
      onNext={() => {
        const combined = customRestriction.trim() ? [...selectedRestrictions, customRestriction.trim()] : selectedRestrictions;
        setPreferences({
          dietary_restrictions: combined,
          country_code: countryCode,
          allergies: allergiesText.split(',').map((item) => item.trim()).filter(Boolean),
          cuisine_preferences: selectedCuisine,
        });
        navigation.navigate('Step8Medical');
      }}
    >
      <Text style={styles.label}>Country</Text>
      <View style={styles.grid}>
        {countryCuisines.map((row) => {
          const active = row.country_code === countryCode;
          return (
            <Pressable key={row.country_code} onPress={() => setCountryCode(row.country_code)} style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{row.country_name}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.label}>Dietary Restrictions</Text>
      <View style={styles.grid}>
        {restrictionOptions.map((item) => {
          const active = selectedRestrictions.includes(item);
          return (
            <Pressable key={item} onPress={() => toggleRestriction(item)} style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.replaceAll('_', ' ')}</Text>
            </Pressable>
          );
        })}
      </View>
      <MoInput label="Other restriction (optional)" onChangeText={setCustomRestriction} value={customRestriction} />
      <MoInput label="Allergies (comma separated)" onChangeText={setAllergiesText} value={allergiesText} />
      {activeCountry ? (
        <>
          <Text style={styles.label}>Preferred Cuisines</Text>
          <View style={styles.grid}>
            {activeCountry.cuisine_tags.map((item) => {
              const active = selectedCuisine.includes(item);
              return (
                <Pressable
                  key={item}
                  onPress={() => setSelectedCuisine((current) => (active ? current.filter((value) => value !== item) : [...current, item]))}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.replaceAll('_', ' ')}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.label,
    color: colors.text_secondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    borderRadius: theme.radius.full,
    backgroundColor: colors.bg_surface,
    borderWidth: 1,
    borderColor: colors.border_subtle,
  },
  chipActive: {
    borderColor: colors.accent_green,
    backgroundColor: colors.bg_elevated,
  },
  chipText: {
    ...typography.body_sm,
    color: colors.text_primary,
    textTransform: 'capitalize',
  },
  chipTextActive: {
    color: colors.accent_green,
  },
});
