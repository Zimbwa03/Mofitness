import { useEffect, useMemo, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoachMessageBubble } from '../../components/coach/CoachMessageBubble';
import { MoButton } from '../../components/common/MoButton';
import { MoCard } from '../../components/common/MoCard';
import { MoInput } from '../../components/common/MoInput';
import { useAuth } from '../../hooks/useAuth';
import type { MealAnalysisResult, MealSlot, PlannedDish, PlannedMeal, RegionalFood } from '../../models';
import type { NutritionStackParamList } from '../../navigation/types';
import mealVisionService from '../../services/ai/MealVisionService';
import nutritionService from '../../services/NutritionService';
import { useOfflineQueueStore } from '../../stores/offlineQueueStore';
import { useNutritionStore } from '../../stores/nutritionStore';
import { colors, layout, theme, typography } from '../../theme';
import { formatMealSlot } from '../../utils/nutrition';
import { getScreenBottomPadding } from '../../utils/screen';
import { MealPhotoAnalyzer } from './components/MealPhotoAnalyzer';
import { PendingSyncBanner } from './components/PendingSyncBanner';
import { PhotoScanLoader } from './components/PhotoScanLoader';

type Props = NativeStackScreenProps<NutritionStackParamList, 'MealLog'>;

type Mode = 'photo' | 'manual';

interface PreparedPhoto {
  uri: string;
  base64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  extension: string;
}

function foodToDish(food: RegionalFood, grams: number): PlannedDish {
  const scale = grams / 100;
  return {
    name: food.name,
    local_name: food.local_name,
    quantity_g: grams,
    quantity_display: `${grams}g`,
    calories: Math.round(food.calories_per_100g * scale),
    protein_g: Number((food.protein_g * scale).toFixed(1)),
    carbs_g: Number((food.carbs_g * scale).toFixed(1)),
    fat_g: Number((food.fat_g * scale).toFixed(1)),
    fiber_g: Number((food.fiber_g * scale).toFixed(1)),
    sodium_mg: Number(((food.sodium_mg ?? 0) * scale).toFixed(1)),
    cooking_method: 'Logged manually.',
    nutritional_benefit: `Tracked from the regional food database in the ${food.category} category.`,
  };
}

function analysisDishToPlannedDish(dish: MealAnalysisResult['identified_dishes'][number]): PlannedDish {
  const grams = Number(dish.quantity_est.match(/\d+/)?.[0] ?? 0);
  return {
    name: dish.name,
    local_name: null,
    quantity_g: grams,
    quantity_display: dish.quantity_est,
    calories: Math.round(dish.calories_est),
    protein_g: Number(dish.protein_g_est.toFixed(1)),
    carbs_g: Number(dish.carbs_g_est.toFixed(1)),
    fat_g: Number(dish.fat_g_est.toFixed(1)),
    fiber_g: 0,
    sodium_mg: 0,
    cooking_method: 'Estimated from photo analysis.',
    nutritional_benefit: `AI estimate from the meal photo with ${dish.confidence} confidence.`,
  };
}

async function prepareSelectedPhoto(fromCamera: boolean) {
  const permissions = fromCamera
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permissions.granted) {
    throw new Error(fromCamera ? 'Camera permission is required.' : 'Photo library permission is required.');
  }

  const result = fromCamera
    ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 })
    : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const asset = result.assets[0];
  const manipulated = await ImageManipulator.manipulateAsync(
    asset.uri,
    [{ resize: { width: 1200 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
  );
  const base64 = await FileSystem.readAsStringAsync(manipulated.uri, { encoding: FileSystem.EncodingType.Base64 });

  return {
    uri: manipulated.uri,
    base64,
    mimeType: 'image/jpeg',
    extension: 'jpg',
  } satisfies PreparedPhoto;
}

export function MealLogScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const mealPlans = useNutritionStore((state) => state.mealPlans);
  const regionalFoods = useNutritionStore((state) => state.regionalFoods);
  const setRegionalFoods = useNutritionStore((state) => state.setRegionalFoods);
  const upsertMealLog = useNutritionStore((state) => state.upsertMealLog);
  const setMealAnalysisDraft = useNutritionStore((state) => state.setMealAnalysisDraft);
  const mealAnalysisDraft = useNutritionStore((state) => state.mealAnalysisDraft);
  const pendingSyncCount = useOfflineQueueStore((state) => state.pendingCount);
  const [mode, setMode] = useState<Mode>('photo');
  const [mealSlot, setMealSlot] = useState<MealSlot>((route.params?.mealSlot as MealSlot | undefined) ?? 'breakfast');
  const [mealName, setMealName] = useState('');
  const [description, setDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [manualDishes, setManualDishes] = useState<PlannedDish[]>([]);
  const [preparedPhoto, setPreparedPhoto] = useState<PreparedPhoto | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  const plan = mealPlans.find((row) => row.id === route.params?.planId) ?? mealPlans[0] ?? null;
  const targetMeal = useMemo<PlannedMeal | null>(() => plan?.meals.find((row) => row.slot === mealSlot) ?? null, [mealSlot, plan]);

  useEffect(() => {
    if (regionalFoods.length > 0) {
      return;
    }

    nutritionService.getRegionalFoods().then((rows) => setRegionalFoods(rows)).catch(() => undefined);
  }, [regionalFoods.length, setRegionalFoods]);

  const filteredFoods = useMemo(
    () => regionalFoods.filter((food) => food.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 6),
    [regionalFoods, searchTerm],
  );

  const photoDishFallback = useMemo<PlannedDish[]>(() => {
    if (mealAnalysisDraft?.identified_dishes?.length) {
      return mealAnalysisDraft.identified_dishes.map(analysisDishToPlannedDish);
    }

    return targetMeal?.dishes ?? [];
  }, [mealAnalysisDraft, targetMeal]);

  const canPostToFeed = Boolean(mealAnalysisDraft?.feed_eligible && (mealAnalysisDraft?.confidence ?? 0) >= 60);
  const analysisPose =
    (mealAnalysisDraft?.confidence ?? 0) >= 80 ? 'celebration' : (mealAnalysisDraft?.confidence ?? 0) >= 50 ? 'chat' : 'warning';

  const handleAnalyze = async () => {
    if (!preparedPhoto || !targetMeal) {
      return;
    }

    setAnalyzing(true);
    setMealAnalysisDraft(null);
    try {
      const result = await mealVisionService.analyzeMealPhoto({
        photoBase64: preparedPhoto.base64,
        mimeType: preparedPhoto.mimeType,
        targetMeal,
        userDescription: description,
      });
      setMealAnalysisDraft(result);
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePickPhoto = async (fromCamera: boolean) => {
    try {
      const result = await prepareSelectedPhoto(fromCamera);
      setPreparedPhoto(result);
    } catch (error) {
      console.warn(error);
    }
  };

  const handleSave = async (postAfter = false) => {
    if (!user) {
      return;
    }

    setSaving(true);
    try {
      const dishes = mode === 'manual' ? manualDishes : photoDishFallback;
      const savedLog = await nutritionService.saveMealLogWithOfflineSupport(
        user.id,
        {
        planId: route.params?.planId ?? plan?.id ?? null,
        mealSlot,
        logDate: plan?.plan_date ?? new Date().toISOString().slice(0, 10),
        logMethod: mode === 'manual' ? 'manual' : 'photo',
        mealName: mealName || targetMeal?.english_name || null,
        dishes,
        description,
        analysis: mode === 'photo' ? mealAnalysisDraft : null,
        },
        {
          localPhoto: mode === 'photo' ? preparedPhoto : null,
        },
      );
      upsertMealLog(savedLog);
      setMealAnalysisDraft(null);
      if (savedLog.pending_sync) {
        Alert.alert(
          'Saved Offline',
          postAfter
            ? 'Your meal log is queued and will sync automatically. Feed posting will be available after the sync completes.'
            : 'Your meal log is queued and will sync automatically when the network is back.',
        );
        navigation.goBack();
        return;
      }
      if (postAfter && savedLog.feed_eligible && (savedLog.ai_confidence ?? 0) >= 60) {
        navigation.replace('HealthFeedPost', { mealLogId: savedLog.id });
        return;
      }
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: getScreenBottomPadding(insets.bottom, theme.spacing.xxl) }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Log Your Meal</Text>
      <PendingSyncBanner count={pendingSyncCount} body="Queued meal logs, likes, comments, and other nutrition actions will sync automatically when the network is back." />
      <View style={styles.slotRow}>
        {['breakfast', 'lunch', 'dinner', 'snack_1'].map((slot) => {
          const active = slot === mealSlot;
          return (
            <Pressable key={slot} onPress={() => setMealSlot(slot as MealSlot)} style={[styles.slotChip, active && styles.slotChipActive]}>
              <Text style={[styles.slotChipText, active && styles.slotChipTextActive]}>{formatMealSlot(slot)}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.modeRow}>
        {[
          { label: 'Photo Log', value: 'photo' },
          { label: 'Manual Log', value: 'manual' },
        ].map((item) => {
          const active = item.value === mode;
          return (
            <Pressable key={item.value} onPress={() => setMode(item.value as Mode)} style={[styles.modeChip, active && styles.modeChipActive]}>
              <Text style={[styles.modeChipText, active && styles.modeChipTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {mode === 'photo' ? (
        <View style={styles.stack}>
          <MoCard>
            {preparedPhoto ? (
              <Image source={{ uri: preparedPhoto.uri }} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.placeholderText}>Take or choose a meal photo</Text>
              </View>
            )}
            <View style={styles.actionRow}>
              <MoButton size="small" onPress={() => void handlePickPhoto(true)}>
                Take Photo
              </MoButton>
              <MoButton size="small" onPress={() => void handlePickPhoto(false)} variant="secondary">
                Gallery
              </MoButton>
            </View>
          </MoCard>
          <MoCard>
            <MoInput label="Meal Description" multiline onChangeText={setDescription} value={description} placeholder="Describe what you ate and the portion size." />
            {targetMeal ? <Text style={styles.helper}>Target meal: {targetMeal.english_name}</Text> : null}
            <MoButton loading={analyzing} onPress={() => void handleAnalyze()} variant="amber">
              Analyze Meal
            </MoButton>
          </MoCard>
          {analyzing ? (
            <MoCard variant="glass">
              <PhotoScanLoader photoUri={preparedPhoto?.uri} />
            </MoCard>
          ) : null}
          {mealAnalysisDraft ? (
            <MoCard variant="highlight">
              <CoachMessageBubble
                feature="Nutrition"
                pose={analysisPose}
                message={
                  (mealAnalysisDraft?.confidence ?? 0) >= 80
                    ? 'Excellent scan quality. This is a strong nutrition match.'
                    : (mealAnalysisDraft?.confidence ?? 0) >= 50
                      ? 'Good scan. Review dish portions before saving.'
                      : 'Low confidence detected. Adjust lighting or angle and scan again for better accuracy.'
                }
              />
              <MealPhotoAnalyzer analysis={mealAnalysisDraft} targetMeal={targetMeal} canPostToFeed={canPostToFeed} />
              {!canPostToFeed ? <Text style={styles.warning}>Feed posting stays locked until confidence reaches 60%.</Text> : null}
            </MoCard>
          ) : null}
        </View>
      ) : null}

      {mode === 'manual' ? (
        <View style={styles.stack}>
          <MoCard>
            <MoInput label="Meal Name" onChangeText={setMealName} value={mealName} />
            <MoInput label="Search Foods" onChangeText={setSearchTerm} value={searchTerm} />
            <View style={styles.stack}>
              {filteredFoods.map((food) => (
                <Pressable key={food.id} onPress={() => setManualDishes((current) => [...current, foodToDish(food, 100)])} style={styles.foodRow}>
                  <Text style={styles.foodName}>{food.name}</Text>
                  <Text style={styles.foodMeta}>{food.calories_per_100g} kcal / 100g</Text>
                </Pressable>
              ))}
            </View>
          </MoCard>
          {manualDishes.map((dish, index) => (
            <MoCard key={`${dish.name}-${index}`}>
              <Text style={styles.foodName}>{dish.name}</Text>
              <MoInput
                keyboardType="numeric"
                label="Grams"
                onChangeText={(value) => {
                  const grams = Number(value || 0);
                  setManualDishes((current) =>
                    current.map((row, rowIndex) => {
                      if (rowIndex !== index) {
                        return row;
                      }
                      const matchedFood = regionalFoods.find((food) => food.name === row.name || food.local_name === row.local_name);
                      return matchedFood ? foodToDish(matchedFood, grams) : { ...row, quantity_g: grams, quantity_display: `${grams}g` };
                    }),
                  );
                }}
                value={String(dish.quantity_g)}
              />
              <Text style={styles.foodMeta}>{dish.calories} kcal · {dish.protein_g}g P · {dish.carbs_g}g C · {dish.fat_g}g F</Text>
              <MoButton size="small" onPress={() => setManualDishes((current) => current.filter((_, rowIndex) => rowIndex !== index))} variant="ghost">
                Remove
              </MoButton>
            </MoCard>
          ))}
        </View>
      ) : null}

      <View style={styles.actionRow}>
        <MoButton loading={saving} onPress={() => void handleSave()}>
          Save Meal Log
        </MoButton>
        {mode === 'photo' && canPostToFeed ? (
          <MoButton loading={saving} onPress={() => void handleSave(true)} variant="secondary">
            Post To Feed
          </MoButton>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg_primary },
  content: { paddingHorizontal: layout.screen_padding_h, paddingVertical: theme.spacing.lg },
  title: { ...typography.display_md, marginBottom: theme.spacing.md },
  slotRow: { flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap', marginBottom: theme.spacing.md },
  slotChip: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderRadius: theme.radius.full, backgroundColor: colors.bg_elevated },
  slotChipActive: { backgroundColor: colors.accent_green },
  slotChipText: { ...typography.body_sm },
  slotChipTextActive: { color: colors.text_inverse, fontFamily: theme.typography.bold },
  modeRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  modeChip: { flex: 1, alignItems: 'center', paddingVertical: theme.spacing.sm, backgroundColor: colors.bg_elevated, borderRadius: theme.radius.full },
  modeChipActive: { backgroundColor: colors.accent_amber },
  modeChipText: { ...typography.body_sm },
  modeChipTextActive: { color: colors.text_inverse, fontFamily: theme.typography.bold },
  stack: { gap: theme.spacing.md },
  photoPreview: { width: '100%', aspectRatio: 1, borderRadius: theme.radius.md, marginBottom: theme.spacing.md },
  photoPlaceholder: { minHeight: 240, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg_elevated, borderRadius: theme.radius.md, marginBottom: theme.spacing.md },
  placeholderText: { ...typography.body_md, color: colors.text_secondary },
  helper: { ...typography.body_sm, color: colors.text_secondary, marginTop: theme.spacing.xs },
  warning: { ...typography.body_sm, color: colors.accent_amber, marginTop: theme.spacing.sm },
  actionRow: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md },
  foodRow: { paddingVertical: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border_subtle },
  foodName: { ...typography.body_md },
  foodMeta: { ...typography.body_sm, color: colors.text_secondary },
});
