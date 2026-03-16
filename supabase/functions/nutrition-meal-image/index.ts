import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { createFunctionContext } from '../_shared/supabase.ts';
import { generateImagenBase64, isVertexConfigured } from '../_shared/vertex.ts';

interface MealImageRequest {
  meal: {
    english_name: string;
    local_name?: string;
    dishes?: Array<{ name: string; quantity_display?: string }>;
  };
  countryCode: string;
  countryName: string;
  style?: 'realistic_photo' | 'illustrated';
  planId?: string;
}

function toBytes(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function buildPrompt(request: MealImageRequest) {
  const dishes = (request.meal.dishes ?? []).map((dish) => `${dish.name} ${dish.quantity_display ?? ''}`.trim()).join(', ');
  const styleLead = request.style === 'illustrated'
    ? 'Vibrant illustrated food art, warm palette, crisp vector-inspired shapes.'
    : 'Professional food photography, overhead shot, natural lighting, styled plating.';

  return `${styleLead} Meal: ${request.meal.english_name}. Local name: ${request.meal.local_name ?? 'n/a'}. Country: ${request.countryName} (${request.countryCode}). Show plated dishes: ${dishes || request.meal.english_name}. Square composition. No text. No people. Traditional tableware. Appetizing and realistic.`;
}

function buildFallbackSvg(request: MealImageRequest) {
  const dishLines = (request.meal.dishes ?? []).slice(0, 3).map((dish, index) => `
    <text x="40" y="${130 + index * 28}" fill="#F4F7EE" font-size="18" font-family="Arial">${dish.name}</text>`).join('');

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#13231A" />
        <stop offset="100%" stop-color="#32492F" />
      </linearGradient>
    </defs>
    <rect width="1080" height="1080" fill="url(#bg)" rx="64" />
    <circle cx="540" cy="560" r="250" fill="#F5A623" opacity="0.18" />
    <circle cx="540" cy="560" r="220" fill="#1E2E23" stroke="#C8F135" stroke-width="16" />
    <text x="40" y="80" fill="#C8F135" font-size="28" font-family="Arial">${request.countryName}</text>
    <text x="40" y="120" fill="#F4F7EE" font-size="44" font-family="Arial" font-weight="700">${request.meal.local_name ?? request.meal.english_name}</text>
    <text x="40" y="170" fill="#D2DAC7" font-size="24" font-family="Arial">${request.meal.english_name}</text>
    ${dishLines}
    <text x="40" y="980" fill="#D2DAC7" font-size="22" font-family="Arial">Fallback visual used because live image generation is not configured.</text>
  </svg>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { admin, userId } = await createFunctionContext(req);
    const body = (await req.json()) as MealImageRequest;
    const objectPath = `${userId}/${crypto.randomUUID()}.${isVertexConfigured() ? 'png' : 'svg'}`;

    let mimeType = 'image/svg+xml';
    let uploadBody: Blob | Uint8Array = new Blob([buildFallbackSvg(body)], { type: mimeType });

    if (isVertexConfigured()) {
      try {
        const imageBase64 = await generateImagenBase64(buildPrompt(body));
        if (imageBase64) {
          mimeType = 'image/png';
          uploadBody = toBytes(imageBase64);
        }
      } catch (error) {
        console.error('Vertex meal image generation failed', error);
        // Fallback SVG remains in place.
      }
    }

    const { error: uploadError } = await admin.storage.from('meal-plan-images').upload(objectPath, uploadBody, {
      contentType: mimeType,
      upsert: false,
    });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = admin.storage.from('meal-plan-images').getPublicUrl(objectPath);

    if (body.planId) {
      await admin.from('daily_meal_plans').update({ generated_image_url: publicUrlData.publicUrl }).eq('id', body.planId).eq('user_id', userId);
    }

    return jsonResponse({ imageUrl: publicUrlData.publicUrl, storagePath: objectPath, mimeType });
  } catch (error) {
    console.error('nutrition-meal-image failed', error);
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unknown image generation error' }, 400);
  }
});

