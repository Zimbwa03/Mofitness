import type { MealAnalysisResult, PlannedMeal } from '../../models';
import supabaseService from '../SupabaseService';

class MealVisionService {
  async analyzeMealPhoto(params: {
    photoBase64: string;
    mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
    targetMeal: PlannedMeal;
    userDescription: string;
  }) {
    const data = await supabaseService.invokeFunction<MealAnalysisResult>('nutrition-meal-analysis', {
      photoBase64: params.photoBase64,
      mimeType: params.mimeType,
      targetMeal: params.targetMeal,
      userDescription: params.userDescription,
    });

    return data as MealAnalysisResult;
  }
}

const mealVisionService = new MealVisionService();

export default mealVisionService;
