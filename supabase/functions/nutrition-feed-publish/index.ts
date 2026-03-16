import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { createFunctionContext } from '../_shared/supabase.ts';

interface PublishFeedRequest {
  mealLogId: string;
  caption?: string;
  audience?: 'everyone' | 'fitness_community' | 'following';
  showStatsCard?: boolean;
}

function extensionFor(path: string) {
  const parts = path.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : 'jpg';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { admin, userId } = await createFunctionContext(req);
    const body = (await req.json()) as PublishFeedRequest;

    const { data: mealLog, error: mealLogError } = await admin
      .from('meal_logs')
      .select('*')
      .eq('id', body.mealLogId)
      .eq('user_id', userId)
      .single();

    if (mealLogError || !mealLog) {
      throw new Error('Meal log not found');
    }

    if (!mealLog.feed_eligible || Number(mealLog.ai_confidence ?? 0) < 60 || Number(mealLog.ai_accuracy_score ?? 0) < 50) {
      throw new Error('Meal log is not eligible for public posting yet');
    }

    if (!mealLog.photo_storage_path) {
      throw new Error('A photo-backed meal log is required for feed publishing');
    }

    const { data: existingPost } = await admin
      .from('feed_posts')
      .select('id')
      .eq('meal_log_id', mealLog.id)
      .maybeSingle();

    if (existingPost) {
      return jsonResponse(existingPost);
    }

    const [{ data: sourceFile, error: downloadError }, { data: plan }] = await Promise.all([
      admin.storage.from('meal-photos').download(mealLog.photo_storage_path),
      mealLog.plan_id
        ? admin.from('daily_meal_plans').select('goal_id').eq('id', mealLog.plan_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    if (downloadError || !sourceFile) {
      throw new Error('Unable to load the meal photo for publishing');
    }

    const goalId = plan?.goal_id ?? null;
    const { data: goal } = goalId
      ? await admin.from('nutrition_goals').select('goal_type, country_code').eq('id', goalId).maybeSingle()
      : { data: null };

    const targetPath = `${userId}/${crypto.randomUUID()}.${extensionFor(mealLog.photo_storage_path)}`;
    const { error: uploadError } = await admin.storage.from('meal-feed').upload(targetPath, sourceFile, {
      upsert: false,
      contentType: sourceFile.type || 'image/jpeg',
    });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = admin.storage.from('meal-feed').getPublicUrl(targetPath);
    const dishes = Array.isArray(mealLog.dishes) ? mealLog.dishes : [];
    const fallbackMealName = mealLog.meal_name || dishes[0]?.name || mealLog.meal_slot;

    const { data: post, error: postError } = await admin
      .from('feed_posts')
      .insert({
        user_id: userId,
        meal_log_id: mealLog.id,
        caption: body.caption ?? null,
        audience: body.audience ?? 'everyone',
        show_stats_card: body.showStatsCard ?? true,
        public_photo_url: publicUrlData.publicUrl,
        public_photo_path: targetPath,
        meal_name: fallbackMealName,
        total_calories: mealLog.total_calories,
        protein_g: mealLog.total_protein_g,
        carbs_g: mealLog.total_carbs_g,
        fat_g: mealLog.total_fat_g,
        ai_accuracy_score: mealLog.ai_accuracy_score,
        confidence_score: mealLog.ai_confidence,
        country_code: goal?.country_code ?? null,
        cuisine_tag: fallbackMealName,
        goal_tag: goal?.goal_type ?? null,
      })
      .select('*')
      .single();

    if (postError) {
      throw postError;
    }

    return jsonResponse(post);
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unknown feed publish error' }, 400);
  }
});

