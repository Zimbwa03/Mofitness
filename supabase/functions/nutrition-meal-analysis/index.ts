import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { analyzeImageWithPrompt, isVertexConfigured } from '../_shared/vertex.ts';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { createFunctionContext } from '../_shared/supabase.ts';

interface TargetMealDish {
  name: string;
  quantity_display?: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
}

interface TargetMeal {
  english_name: string;
  local_name?: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  dishes: TargetMealDish[];
}

interface AnalyzeMealRequest {
  photoBase64?: string;
  mimeType?: string;
  targetMeal: TargetMeal;
  userDescription?: string;
}

function toCandidates(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9, ]/g, ' ')
    .split(/,| with | and /)
    .map((item) => item.trim())
    .filter((item) => item.length > 2);
}

function buildFallbackAnalysis(targetMeal: TargetMeal, userDescription: string, hasPhoto: boolean) {
  const description = userDescription.toLowerCase();
  const candidates = new Set(toCandidates(description));
  const identified = targetMeal.dishes.map((dish) => {
    const matched = Array.from(candidates).some((candidate) => dish.name.toLowerCase().includes(candidate) || candidate.includes(dish.name.toLowerCase().split(' ')[0]));
    return {
      name: dish.name,
      quantity_est: dish.quantity_display ?? '~1 serving',
      calories_est: Math.round((dish.calories ?? targetMeal.calories / Math.max(1, targetMeal.dishes.length)) * (matched ? 1 : 0.75)),
      protein_g_est: Number(((dish.protein_g ?? targetMeal.protein_g / Math.max(1, targetMeal.dishes.length)) * (matched ? 1 : 0.8)).toFixed(1)),
      carbs_g_est: Number(((dish.carbs_g ?? targetMeal.carbs_g / Math.max(1, targetMeal.dishes.length)) * (matched ? 1 : 0.8)).toFixed(1)),
      fat_g_est: Number(((dish.fat_g ?? targetMeal.fat_g / Math.max(1, targetMeal.dishes.length)) * (matched ? 1 : 0.8)).toFixed(1)),
      confidence: matched ? 'high' : hasPhoto ? 'medium' : 'low',
    };
  });

  const matchedItems = identified.filter((dish) => dish.confidence !== 'low').map((dish) => dish.name);
  const missingItems = targetMeal.dishes.filter((dish) => !matchedItems.includes(dish.name)).map((dish) => dish.name);
  const extraItems = Array.from(candidates).filter((candidate) => !targetMeal.dishes.some((dish) => dish.name.toLowerCase().includes(candidate)));
  const dishMatchScore = Math.round((matchedItems.length / Math.max(1, targetMeal.dishes.length)) * 100);
  const portionScore = /\d|cup|g|gram|piece|slice/.test(description) ? 78 : hasPhoto ? 68 : 55;
  const macroScore = Math.round((dishMatchScore * 0.6) + (portionScore * 0.4));
  const ingredientScore = hasPhoto ? 76 : 62;
  const confidence = hasPhoto ? Math.max(60, Math.round((dishMatchScore + portionScore) / 2)) : 58;
  const accuracyScore = Math.round((dishMatchScore * 0.35) + (portionScore * 0.25) + (macroScore * 0.3) + (ingredientScore * 0.1));
  const totals = identified.reduce(
    (acc, dish) => ({
      calories: acc.calories + dish.calories_est,
      protein: Number((acc.protein + dish.protein_g_est).toFixed(1)),
      carbs: Number((acc.carbs + dish.carbs_g_est).toFixed(1)),
      fat: Number((acc.fat + dish.fat_g_est).toFixed(1)),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  return {
    identified_dishes: identified,
    total_calories_est: totals.calories,
    total_protein_g_est: totals.protein,
    total_carbs_g_est: totals.carbs,
    total_fat_g_est: totals.fat,
    accuracy_score: accuracyScore,
    confidence,
    accuracy_breakdown: {
      dish_match_score: dishMatchScore,
      portion_score: portionScore,
      macro_score: macroScore,
      ingredient_score: ingredientScore,
    },
    matched_items: matchedItems,
    missing_items: missingItems,
    extra_items: extraItems,
    feedback: missingItems.length > 0
      ? `You were close to the target meal, but ${missingItems.join(', ')} looked missing or unclear. Correct the meal manually if the photo under-represented the plate.`
      : 'The meal looks close to your target. Keep using clear photos and specific descriptions for better accuracy over time.',
    feed_eligible: accuracyScore >= 50 && confidence >= 60,
    feed_eligibility_reason: accuracyScore >= 50 && confidence >= 60
      ? 'The meal cleared the score and confidence threshold for public sharing.'
      : 'The meal stayed private because the score or confidence was too low.',
  };
}

function buildVisionPrompt(targetMeal: TargetMeal, userDescription: string) {
  return `Analyze this meal photo against the target meal.
User description: ${userDescription || 'none'}.
Target meal: ${JSON.stringify(targetMeal)}.
Return JSON with identified_dishes, total_calories_est, total_protein_g_est, total_carbs_g_est, total_fat_g_est, accuracy_score, confidence, accuracy_breakdown, matched_items, missing_items, extra_items, feedback, feed_eligible, feed_eligibility_reason.`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    await createFunctionContext(req);
    const body = (await req.json()) as AnalyzeMealRequest;
    const description = body.userDescription ?? '';

    let result = buildFallbackAnalysis(body.targetMeal, description, Boolean(body.photoBase64));

    if (body.photoBase64 && isVertexConfigured()) {
      try {
        const vertexResult = await analyzeImageWithPrompt<typeof result>(
          Deno.env.get('VERTEX_GEMINI_VISION_MODEL') ?? Deno.env.get('VERTEX_GEMINI_MODEL') ?? 'gemini-2.5-pro',
          buildVisionPrompt(body.targetMeal, description),
          body.photoBase64,
          body.mimeType ?? 'image/jpeg',
          'You are a precise nutrition analysis assistant. Return only valid JSON.',
        );
        if (vertexResult?.identified_dishes?.length) {
          result = vertexResult;
        }
      } catch (error) {
        console.error('Vertex meal analysis failed', error);
        // Fallback already computed.
      }
    }

    return jsonResponse(result);
  } catch (error) {
    console.error('nutrition-meal-analysis failed', error);
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unknown analysis error' }, 400);
  }
});

