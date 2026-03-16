import type { PlannedMeal } from '../../models';
import supabaseService from '../SupabaseService';

class MealImageGenService {
  async generateMealImage(params: {
    meal: PlannedMeal;
    countryCode: string;
    countryName: string;
    style?: 'realistic_photo' | 'illustrated';
    planId?: string;
  }) {
    return supabaseService.invokeFunction<{ imageUrl: string; storagePath: string; mimeType: string }>('nutrition-meal-image', {
      meal: params.meal,
      countryCode: params.countryCode,
      countryName: params.countryName,
      style: params.style ?? 'realistic_photo',
      planId: params.planId,
    });
  }
}

const mealImageGenService = new MealImageGenService();

export default mealImageGenService;
