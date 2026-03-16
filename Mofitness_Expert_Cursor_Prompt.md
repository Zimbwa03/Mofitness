# MOFITNESS MVP â€” EXPERT CURSOR PROMPT
> Paste this entire document into Cursor as your project-level instruction. Build the complete MVP from scratch, phase by phase, with zero gaps.

---

## 0. ROLE & MISSION

You are a **senior full-stack mobile engineer** with deep expertise in React Native (Expo), Supabase, and Google Cloud / Vertex AI. Your mission is to build the **Mofitness MVP** â€” a fitness super-app targeting Sub-Saharan Africa â€” from an empty folder to a fully deployable application.

**Read this entire prompt before writing a single line of code.** Internalize the architecture, then implement phase by phase in the order defined in Section 8.

---

## 1. PRODUCT VISION

Mofitness makes fitness **accessible and results-driven** in Sub-Saharan Africa. The MVP delivers:

- Personalized AI training plans
- Gamified challenges & leaderboards
- AI-generated nutrition plans (region-aware)
- Recovery & wellness tracking
- A virtual AI coach
- Smart equipment stubs with wearable-ready architecture

Every AI feature is powered by **Google Vertex AI**. There is no on-device ML engine.

---

## 2. TECH STACK â€” NON-NEGOTIABLE

| Layer | Technology |
|---|---|
| Mobile framework | React Native via **Expo SDK 51+** (managed workflow) |
| Language | **TypeScript** (strict mode, no `any`) |
| Backend / DB / Auth | **Supabase** (PostgreSQL + Row Level Security + Realtime + Storage) |
| AI / ML | **Google Vertex AI** â€” Gemini 2.5 Pro via `@google-cloud/vertexai` |
| State management | **Zustand** (lightweight, typed stores) |
| Navigation | `@react-navigation/native` â€” Tab + Stack navigators |
| UI components | **React Native Paper** + custom themed components |
| Charts | **Victory Native** |
| Notifications | **Expo Notifications** |
| Secure local storage | **expo-secure-store** |
| Offline cache | **@react-native-async-storage/async-storage** |
| i18n | `react-i18next` |
| Testing | Jest + React Native Testing Library |
| Env vars | `react-native-dotenv` + `.env` file (never commit secrets) |

---

## 3. VERTEX AI INTEGRATION ARCHITECTURE

### 3.1 Services Used

| Vertex AI Capability | Used For |
|---|---|
| **Gemini 2.5 Pro** (text generation) | Training plan generation, meal plan generation, virtual coach dialogue, recovery recommendations, wellness analysis |
| **Gemini 2.5 Pro** (function calling / structured output) | All responses that feed the database must return strict JSON via Gemini function-calling to guarantee parsability |
| **Vertex AI Embeddings** (`text-embedding-004`) | User preference vectors for semantic similarity-based workout/meal recommendations |
| **Vertex AI Matching Engine** (stubbed for MVP) | Production-scale ANN lookup; for MVP, compute cosine similarity in a Supabase RPC function |

### 3.2 VertexAIService â€” Singleton

Create `/src/services/VertexAIService.ts`. This is the **only** file that imports and configures the Vertex AI SDK. All other services call methods on this singleton.

```typescript
// Responsibilities:
// - Initialize VertexAI client with project ID and location from env
// - Expose generateContent(prompt, systemInstruction, schema?) â†’ string
// - Expose generateEmbedding(text) â†’ number[]
// - Handle retries (3x with exponential back-off)
// - Handle quota errors gracefully (return cached fallback)
// - Log all token usage to Supabase table `ai_usage_logs`
```

**Environment variables required:**
```
VERTEX_AI_PROJECT_ID=your-gcp-project-id
VERTEX_AI_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### 3.3 Structured Output Pattern

Every Vertex AI call that produces data for the DB **must** use Gemini function-calling with a typed response schema. Example pattern:

```typescript
const schema = {
  type: "object",
  properties: {
    workouts: { type: "array", items: { $ref: "#/definitions/WorkoutSlot" } }
  },
  required: ["workouts"]
};
await vertexAI.generateContent(prompt, systemInstruction, schema);
// Parse response.candidates[0].content.parts[0].functionCall.args
```

Never ask Gemini to return "JSON in a markdown code block" â€” always use function-calling.

### 3.4 Cost-Control Rules

- Cache all Gemini responses in Supabase (`ai_cache` table keyed by SHA-256 of prompt + userId) for 24 hours before re-calling.
- Never call Vertex AI from a `useEffect` directly â€” always go through a service method that checks the cache first.
- Embedding generation: only re-embed a user vector when their preferences or last 5 workouts change (detected via a hash stored in `ml_models`).

---

## 4. DATABASE SCHEMA (Supabase / PostgreSQL)

Run all DDL via Supabase migrations. Enable **Row Level Security** on every table.

### 4.1 Core Tables

```sql
-- users (extends auth.users)
CREATE TABLE public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  gender        TEXT CHECK (gender IN ('male','female','non_binary','prefer_not_to_say')),
  date_of_birth DATE,
  height_cm     NUMERIC(5,1),
  weight_kg     NUMERIC(5,1),
  body_fat_pct  NUMERIC(4,1),
  experience_level TEXT CHECK (experience_level IN ('beginner','intermediate','advanced')) NOT NULL DEFAULT 'beginner',
  goals         TEXT[],          -- e.g. ['muscle_gain','weight_loss']
  activity_level TEXT CHECK (activity_level IN ('sedentary','lightly_active','active','highly_active')),
  points        INTEGER NOT NULL DEFAULT 0,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- preferences
CREATE TABLE public.preferences (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  training_days_per_week  INTEGER CHECK (training_days_per_week BETWEEN 1 AND 7),
  available_equipment     TEXT[],
  preferred_workout_time  TEXT CHECK (preferred_workout_time IN ('morning','afternoon','evening')),
  dietary_restrictions    TEXT[],
  medical_conditions      TEXT,
  activity_type           TEXT CHECK (activity_type IN ('strength','cardio','flexibility','mixed')),
  sport_focus             TEXT,
  interest_in_mindfulness BOOLEAN DEFAULT FALSE,
  wants_challenges        BOOLEAN DEFAULT TRUE,
  has_wearable            BOOLEAN DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- workouts (catalog)
CREATE TABLE public.workouts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  category          TEXT NOT NULL,   -- 'strength','cardio','flexibility','sport','recovery'
  description       TEXT,
  duration_minutes  INTEGER,
  equipment_required TEXT[],
  calories_estimate INTEGER,
  difficulty        TEXT CHECK (difficulty IN ('beginner','intermediate','advanced')),
  sport_tag         TEXT,            -- e.g. 'soccer','running'
  video_url         TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_workouts_category ON public.workouts(category);
CREATE INDEX idx_workouts_difficulty ON public.workouts(difficulty);

-- user_workouts
CREATE TABLE public.user_workouts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  workout_id     UUID NOT NULL REFERENCES public.workouts(id),
  scheduled_date DATE,
  completed_date TIMESTAMPTZ,
  reps           JSONB,             -- { "exercise_name": [12,10,8] }
  weight_used    JSONB,             -- { "exercise_name": [40,45,50] }
  rating         INTEGER CHECK (rating BETWEEN 1 AND 5),
  perceived_difficulty INTEGER CHECK (perceived_difficulty BETWEEN 1 AND 5),
  calories_burned INTEGER,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_user_workouts_user_date ON public.user_workouts(user_id, scheduled_date);

-- challenges
CREATE TABLE public.challenges (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT NOT NULL,
  description    TEXT,
  start_date     DATE NOT NULL,
  end_date       DATE NOT NULL,
  metric         TEXT NOT NULL,     -- 'calories_burned','workout_streak','workouts_completed'
  reward_points  INTEGER NOT NULL DEFAULT 100,
  created_by     UUID REFERENCES public.users(id),
  is_public      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- challenge_participants
CREATE TABLE public.challenge_participants (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id     UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  progress_metric  NUMERIC DEFAULT 0,
  rank             INTEGER,
  completed        BOOLEAN DEFAULT FALSE,
  joined_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

-- meal_plans
CREATE TABLE public.meal_plans (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  meals      JSONB NOT NULL,  -- [{meal:'breakfast', dishes:[{name, calories, protein_g, carbs_g, fat_g, ingredients:[]}]}]
  total_calories INTEGER,
  ai_generated   BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- wellness_logs
CREATE TABLE public.wellness_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  sleep_hours  NUMERIC(3,1),
  water_liters NUMERIC(3,1),
  stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 10),
  mood         TEXT CHECK (mood IN ('great','good','neutral','poor','terrible')),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ml_models (user embedding vectors)
CREATE TABLE public.ml_models (
  user_id             UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  preferences_vector  JSONB,          -- float[] from Vertex Embeddings
  input_hash          TEXT,           -- SHA-256 of inputs; skip re-embedding if unchanged
  last_updated        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ai_cache (cost control)
CREATE TABLE public.ai_cache (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key    TEXT UNIQUE NOT NULL,  -- SHA-256(prompt + userId)
  response     TEXT NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_cache_key ON public.ai_cache(cache_key);
CREATE INDEX idx_ai_cache_expires ON public.ai_cache(expires_at);

-- ai_usage_logs
CREATE TABLE public.ai_usage_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES public.users(id),
  feature      TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  model        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.2 RLS Policies (apply to every table)

```sql
-- Example for user_workouts; replicate pattern for all user-owned tables:
ALTER TABLE public.user_workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can manage own workouts"
  ON public.user_workouts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- challenges & workouts catalog: read-only for all authenticated users
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read workouts"
  ON public.workouts FOR SELECT USING (auth.role() = 'authenticated');
```

### 4.3 Supabase RPC Functions

```sql
-- Cosine similarity between two float arrays (used for recommendation engine)
CREATE OR REPLACE FUNCTION cosine_similarity(a FLOAT[], b FLOAT[])
RETURNS FLOAT LANGUAGE plpgsql AS $$
DECLARE dot FLOAT := 0; mag_a FLOAT := 0; mag_b FLOAT := 0; i INT;
BEGIN
  FOR i IN 1..array_length(a,1) LOOP
    dot   := dot   + a[i]*b[i];
    mag_a := mag_a + a[i]^2;
    mag_b := mag_b + b[i]^2;
  END LOOP;
  IF mag_a = 0 OR mag_b = 0 THEN RETURN 0; END IF;
  RETURN dot / (sqrt(mag_a) * sqrt(mag_b));
END;$$;

-- Top-N similar users for collaborative filtering
CREATE OR REPLACE FUNCTION get_similar_users(target_user_id UUID, top_n INT DEFAULT 5)
RETURNS TABLE(user_id UUID, similarity FLOAT) LANGUAGE plpgsql AS $$
DECLARE target_vec FLOAT[];
BEGIN
  SELECT (preferences_vector::TEXT::FLOAT[]) INTO target_vec
  FROM public.ml_models WHERE user_id = target_user_id;
  RETURN QUERY
    SELECT m.user_id,
           cosine_similarity(target_vec, m.preferences_vector::TEXT::FLOAT[]) AS similarity
    FROM public.ml_models m
    WHERE m.user_id <> target_user_id
      AND m.preferences_vector IS NOT NULL
    ORDER BY similarity DESC
    LIMIT top_n;
END;$$;
```

---

## 5. AI FEATURES â€” DETAILED SPECIFICATION

Each feature maps to a TypeScript service class under `/src/services/ai/`. Every service **extends** a base `BaseAIService` that injects `VertexAIService` and `SupabaseService`.

---

### 5.1 TrainingPlanService

**File:** `/src/services/ai/TrainingPlanService.ts`

**Trigger:** Called after onboarding completes, and again after any `user_workout` is inserted with a `completed_date`.

**Vertex AI Call:**
- Model: `gemini-2.5-pro`
- System instruction: "You are an expert personal trainer specializing in athletes from Sub-Saharan Africa. Return only structured JSON conforming to the provided schema."
- User prompt: Build from user profile, preferences, last 10 `user_workouts`, wellness logs from the past 7 days.
- Function-calling schema: `{ weeklyPlan: [{ day: string, workouts: [{ workout_id, sets, reps, rest_seconds, notes }] }] }`

**Logic:**
1. Fetch user profile + preferences from Supabase.
2. Fetch available workouts matching user's equipment and difficulty.
3. Check `ai_cache`; if hit and not expired, return cached plan.
4. Build prompt (see Section 7 for prompt templates).
5. Call `VertexAIService.generateContent()` with function-calling schema.
6. Parse structured response â†’ insert/upsert rows into `user_workouts`.
7. Save raw response to `ai_cache`.
8. After each completed workout, call `adjustPlanAfterWorkout(userId, userWorkoutId)` which sends performance data back to Gemini and receives adjustment instructions.

**Dynamic Adjustment Logic:**
- `perceived_difficulty <= 2` AND `rating >= 4` â†’ increase weight/reps by 10% next session.
- `perceived_difficulty >= 4` OR `rating <= 2` â†’ drop intensity; schedule easier variant.
- Wellness: if last 3 days avg `stress_level >= 7` OR avg `sleep_hours < 6` â†’ replace strength sessions with recovery/flexibility.

---

### 5.2 NutritionService

**File:** `/src/services/ai/NutritionService.ts`

**Trigger:** Called daily at meal-plan generation time; also triggered when user logs a meal.

**Vertex AI Call:**
- Build prompt with: user goals, weight, height, activity level, dietary restrictions, today's workout, regional food context ("prefer locally available African ingredients such as ugali, sadza, samp, morogo, biltong, tilapia, cassava, plantain, groundnut stew").
- Function-calling schema:
  ```json
  { "date": "YYYY-MM-DD", "meals": [{ "meal": "breakfast|lunch|dinner|snack", "dishes": [{ "name": "string", "calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0, "ingredients": ["string"] }] }], "total_calories": 0, "hydration_target_liters": 0 }
  ```
- Insert result into `meal_plans`.

**Meal Logging:**
- Manual entry form: dish name, calories, macros.
- Photo stub: user selects from a pre-seeded `local_dishes` lookup table (name + macros) â€” no live image recognition in MVP.
- Each logged meal updates the day's `meal_plans.meals` JSONB.

---

### 5.3 WellnessService

**File:** `/src/services/ai/WellnessService.ts`

**Trigger:** Daily, after user submits wellness log; also after any training plan update.

**Vertex AI Call:**
- Input: last 14 days of `wellness_logs` + last 14 days of `user_workouts` (intensity, calories_burned).
- System instruction: "You are a holistic wellness coach. Identify over-training risk and give actionable recommendations."
- Function-calling schema:
  ```json
  { "overtraining_risk": "low|medium|high", "sleep_recommendation_hours": 0, "hydration_recommendation_liters": 0, "stress_tips": ["string"], "suggested_activities": ["string"], "alert_message": "string|null" }
  ```
- If `overtraining_risk === 'high'`, push an Expo notification and flag the dashboard.

**Injury Risk Indicator:**
- Local rule (no AI needed): if last 5 workouts have avg `perceived_difficulty >= 4` AND last 3 wellness logs have `stress_level >= 7` AND avg `sleep_hours < 6` â†’ show red injury-risk banner.

---

### 5.4 VirtualCoachService

**File:** `/src/services/ai/VirtualCoachService.ts`

**Trigger:** During an active workout session (WorkoutPlayerScreen).

**Capabilities:**
1. **Spoken cues** â€” Use `expo-speech` to read exercise instructions and motivational cues aloud.
2. **Chat interface** â€” A floating "Ask Coach" button opens a chat modal. Messages are sent to Gemini with full workout context.
3. **Rest countdown** â€” Timer component; when rest ends, coach speaks the next exercise name.
4. **Form tips** â€” Pre-written tips per exercise stored in the `workouts.description` field; displayed as cards during the set. Gemini is only called for the chat Q&A, not for pre-scripted tips.

**Vertex AI Call (chat only):**
- System instruction: "You are a motivational fitness coach named Mo. You are currently coaching a session. Be concise, energetic, and encouraging. Only answer fitness-related questions."
- Maintain a conversation history array capped at last 10 turns to manage context window.

---

### 5.5 RecommendationEngine

**File:** `/src/services/ai/RecommendationEngine.ts`

This is the core personalization layer. It runs **after** any data-change event (new workout logged, wellness log submitted, meal logged, preferences updated).

**Algorithm: Hybrid Embedding + Rule-Based**

```
Step 1 â€” Feature Text Construction
  Combine: goals, experience_level, preferred categories, avg calories_burned,
           completion_rate, avg sleep, avg stress, dietary_restrictions, sport_focus
  â†’ One natural-language sentence per user

Step 2 â€” Embedding via Vertex AI
  Call VertexAIService.generateEmbedding(featureText) â†’ float[768]
  Store in ml_models.preferences_vector
  Only re-embed if SHA-256(featureText) !== ml_models.input_hash

Step 3 â€” Collaborative Filtering
  Call Supabase RPC get_similar_users(userId, topN=5)
  Fetch workouts completed & rated >= 4 by those similar users
  Rank by (similarity_weight Ã— avg_rating)

Step 4 â€” Rule-Based Filters (applied AFTER collaborative filtering)
  - Remove workouts requiring unavailable equipment
  - If beginner: filter out 'advanced' difficulty
  - If overtraining_risk = 'high': only show 'recovery' or 'flexibility'
  - If active challenge: boost challenge-relevant workout categories
  - If sport_focus set: boost workouts with matching sport_tag

Step 5 â€” Output
  Return top-5 workout recommendations, top-3 meal recommendations,
  1 wellness recommendation
  Store in Zustand recommendationStore
```

**Methods to implement:**
- `updatePreferenceVector(userId: string): Promise<void>`
- `getWorkoutRecommendations(userId: string): Promise<Workout[]>`
- `getMealRecommendations(userId: string): Promise<MealSuggestion[]>`
- `getWellnessRecommendations(userId: string): Promise<WellnessTip[]>`

---

### 5.6 ChallengesService

**File:** `/src/services/ChallengesService.ts` (no Vertex AI needed)

- CRUD for challenges and participants via Supabase.
- **Realtime leaderboard:** subscribe to `challenge_participants` table changes using `supabase.channel()` with `postgres_changes`.
- **Points system:** award points on `user_workouts` insert (10 pts), challenge completion (100 pts), daily wellness log (5 pts). Use a Supabase database trigger to auto-update `users.points`.
- **Push notifications:** when a user is overtaken in a leaderboard, fire Expo push notification via a Supabase Edge Function (stub for MVP).

---

## 6. PROJECT STRUCTURE

```
/
â”œâ”€â”€ .env                          # Never commit â€” add to .gitignore
â”œâ”€â”€ app.json
â”œâ”€â”€ App.tsx                       # Entry: providers, navigation root
â”œâ”€â”€ babel.config.js
â”œâ”€â”€ tsconfig.json                 # strict: true
â”œâ”€â”€ jest.config.js
â”œâ”€â”€ README.md
â””â”€â”€ src/
    â”œâ”€â”€ navigation/
    â”‚   â”œâ”€â”€ RootNavigator.tsx     # Auth guard â†’ Onboarding or Main
    â”‚   â”œâ”€â”€ MainTabNavigator.tsx  # Bottom tabs
    â”‚   â””â”€â”€ stacks/               # Per-tab stack navigators
    â”œâ”€â”€ screens/
    â”‚   â”œâ”€â”€ auth/
    â”‚   â”‚   â”œâ”€â”€ LoginScreen.tsx
    â”‚   â”‚   â””â”€â”€ SignUpScreen.tsx
    â”‚   â”œâ”€â”€ onboarding/
    â”‚   â”‚   â”œâ”€â”€ OnboardingNavigator.tsx
    â”‚   â”‚   â”œâ”€â”€ Step1_PersonalDetails.tsx
    â”‚   â”‚   â”œâ”€â”€ Step2_FitnessGoals.tsx
    â”‚   â”‚   â”œâ”€â”€ Step3_ExperienceActivity.tsx
    â”‚   â”‚   â”œâ”€â”€ Step4_Equipment.tsx
    â”‚   â”‚   â”œâ”€â”€ Step5_Schedule.tsx
    â”‚   â”‚   â”œâ”€â”€ Step6_SportFocus.tsx   # Conditional on sport goal
    â”‚   â”‚   â”œâ”€â”€ Step7_Nutrition.tsx
    â”‚   â”‚   â”œâ”€â”€ Step8_Medical.tsx
    â”‚   â”‚   â”œâ”€â”€ Step9_Wellness.tsx
    â”‚   â”‚   â””â”€â”€ Step10_Wearables.tsx
    â”‚   â”œâ”€â”€ dashboard/
    â”‚   â”‚   â””â”€â”€ DashboardScreen.tsx
    â”‚   â”œâ”€â”€ workouts/
    â”‚   â”‚   â”œâ”€â”€ WorkoutsScreen.tsx
    â”‚   â”‚   â”œâ”€â”€ WorkoutDetailScreen.tsx
    â”‚   â”‚   â””â”€â”€ WorkoutPlayerScreen.tsx  # Active workout + virtual coach
    â”‚   â”œâ”€â”€ challenges/
    â”‚   â”‚   â”œâ”€â”€ ChallengesScreen.tsx
    â”‚   â”‚   â””â”€â”€ LeaderboardScreen.tsx
    â”‚   â”œâ”€â”€ nutrition/
    â”‚   â”‚   â”œâ”€â”€ NutritionScreen.tsx
    â”‚   â”‚   â””â”€â”€ MealLogScreen.tsx
    â”‚   â”œâ”€â”€ wellness/
    â”‚   â”‚   â””â”€â”€ WellnessScreen.tsx
    â”‚   â””â”€â”€ profile/
    â”‚       â”œâ”€â”€ ProfileScreen.tsx
    â”‚       â”œâ”€â”€ SettingsScreen.tsx
    â”‚       â”œâ”€â”€ PrivacyPolicyScreen.tsx
    â”‚       â””â”€â”€ WearablesScreen.tsx      # Bluetooth stub
    â”œâ”€â”€ services/
    â”‚   â”œâ”€â”€ SupabaseService.ts           # Singleton Supabase client
    â”‚   â”œâ”€â”€ VertexAIService.ts           # Singleton Vertex AI client
    â”‚   â”œâ”€â”€ SmartDumbbellService.ts      # BLE stub with event emitter
    â”‚   â”œâ”€â”€ NotificationService.ts       # Expo push notifications
    â”‚   â”œâ”€â”€ OfflineSyncService.ts        # AsyncStorage + sync queue
    â”‚   â””â”€â”€ ai/
    â”‚       â”œâ”€â”€ BaseAIService.ts
    â”‚       â”œâ”€â”€ TrainingPlanService.ts
    â”‚       â”œâ”€â”€ NutritionService.ts
    â”‚       â”œâ”€â”€ WellnessService.ts
    â”‚       â”œâ”€â”€ VirtualCoachService.ts
    â”‚       â””â”€â”€ RecommendationEngine.ts
    â”œâ”€â”€ stores/                          # Zustand stores
    â”‚   â”œâ”€â”€ authStore.ts
    â”‚   â”œâ”€â”€ workoutStore.ts
    â”‚   â”œâ”€â”€ nutritionStore.ts
    â”‚   â”œâ”€â”€ wellnessStore.ts
    â”‚   â”œâ”€â”€ challengeStore.ts
    â”‚   â””â”€â”€ recommendationStore.ts
    â”œâ”€â”€ hooks/
    â”‚   â”œâ”€â”€ useAuth.ts
    â”‚   â”œâ”€â”€ useWorkouts.ts
    â”‚   â”œâ”€â”€ useRecommendations.ts
    â”‚   â”œâ”€â”€ useWellness.ts
    â”‚   â””â”€â”€ useRealtime.ts
    â”œâ”€â”€ components/
    â”‚   â”œâ”€â”€ common/               # Button, Card, Input, Badge, Avatar, Modal
    â”‚   â”œâ”€â”€ charts/               # CaloriesChart, SleepChart, ProgressBar
    â”‚   â”œâ”€â”€ workout/              # ExerciseCard, WorkoutTimer, SetLogger
    â”‚   â”œâ”€â”€ nutrition/            # MealCard, MacroRing
    â”‚   â”œâ”€â”€ wellness/             # WellnessForm, InjuryRiskBanner
    â”‚   â””â”€â”€ coach/                # CoachChatModal, CoachCue
    â”œâ”€â”€ models/                   # TypeScript interfaces (mirror DB schema)
    â”‚   â””â”€â”€ index.ts
    â”œâ”€â”€ i18n/
    â”‚   â”œâ”€â”€ index.ts
    â”‚   â”œâ”€â”€ en.json
    â”‚   â””â”€â”€ sn.json               # Shona translations
    â”œâ”€â”€ theme/
    â”‚   â””â”€â”€ index.ts              # Colors, typography, spacing, dark mode
    â””â”€â”€ utils/
        â”œâ”€â”€ hash.ts               # SHA-256 helper
        â”œâ”€â”€ calories.ts           # TDEE / BMR calculations
        â””â”€â”€ validators.ts
```

---

## 7. PROMPT TEMPLATES FOR VERTEX AI

Store these as constants in `/src/services/ai/prompts.ts`.

### 7.1 Training Plan Generation

```typescript
export const buildTrainingPlanPrompt = (user: User, prefs: Preferences, availableWorkouts: Workout[], recentLogs: UserWorkout[]) => `
Generate a 7-day personalized training plan for the following user.

USER PROFILE:
- Age: ${calculateAge(user.date_of_birth)} years
- Gender: ${user.gender}
- Experience: ${user.experience_level}
- Activity level: ${user.activity_level}
- Goals: ${user.goals.join(', ')}
- Sport focus: ${prefs.sport_focus ?? 'none'}

CONSTRAINTS:
- Available equipment: ${prefs.available_equipment.join(', ')}
- Training days per week: ${prefs.training_days_per_week}
- Preferred time: ${prefs.preferred_workout_time}
- Medical conditions: ${prefs.medical_conditions ?? 'none'}

RECENT PERFORMANCE (last 5 workouts):
${recentLogs.map(l => `- ${l.workout_id}: rating=${l.rating}, difficulty=${l.perceived_difficulty}`).join('\n')}

AVAILABLE WORKOUT IDs (select only from these):
${availableWorkouts.map(w => `- id:${w.id} name:${w.name} category:${w.category} difficulty:${w.difficulty}`).join('\n')}

Return a weekly plan using ONLY the workout IDs listed above. Distribute rest days appropriately.
`;
```

### 7.2 Meal Plan Generation

```typescript
export const buildMealPlanPrompt = (user: User, prefs: Preferences, todayWorkout: Workout | null) => `
Create a full-day meal plan for the following person. Prioritize locally available African ingredients (sadza, ugali, morogo, biltong, tilapia, groundnut stew, cassava, plantain, samp, pap, beans, sweet potato, mango, avocado).

PROFILE:
- Age: ${calculateAge(user.date_of_birth)}, Gender: ${user.gender}
- Weight: ${user.weight_kg}kg, Height: ${user.height_cm}cm
- Goals: ${user.goals.join(', ')}
- Dietary restrictions: ${prefs.dietary_restrictions.join(', ') || 'none'}
- Today's workout: ${todayWorkout ? `${todayWorkout.name} (${todayWorkout.calories_estimate} kcal estimated burn)` : 'Rest day'}

Calculate TDEE and set meal calories accordingly. Include breakfast, lunch, dinner, and 1â€“2 snacks.
`;
```

### 7.3 Wellness Analysis

```typescript
export const buildWellnessPrompt = (logs: WellnessLog[], workouts: UserWorkout[]) => `
Analyze this athlete's wellness and recovery data for the past 14 days and provide recommendations.

WELLNESS LOGS:
${logs.map(l => `${l.date}: sleep=${l.sleep_hours}h, water=${l.water_liters}L, stress=${l.stress_level}/10, mood=${l.mood}`).join('\n')}

TRAINING LOAD:
${workouts.map(w => `${w.completed_date}: calories=${w.calories_burned}, difficulty=${w.perceived_difficulty}/5`).join('\n')}

Identify patterns. Assess over-training risk. Provide 3 specific, actionable wellness tips tailored to this data.
`;
```

---

## 8. IMPLEMENTATION PHASES

Implement in strict phase order. Do not start a new phase until the current one compiles and runs.

### Phase 1 â€” Project Bootstrap (Day 1)
- [ ] `npx create-expo-app mofitness --template expo-template-blank-typescript`
- [ ] Install all dependencies from Section 2
- [ ] Configure `tsconfig.json` (strict), `babel.config.js`, `.env`, `.gitignore`
- [ ] Set up Supabase project; run all DDL from Section 4
- [ ] Implement `SupabaseService.ts` singleton
- [ ] Implement `VertexAIService.ts` singleton (test with a simple `generateContent` call)
- [ ] Set up `App.tsx` with navigation shell (empty screens)
- [ ] Configure theme (`/src/theme/index.ts`) â€” dark mode, color palette, typography

### Phase 2 â€” Auth & Onboarding (Day 2)
- [ ] Build `LoginScreen` and `SignUpScreen` with Supabase Auth
- [ ] Implement `authStore` (Zustand) and `useAuth` hook
- [ ] Build all 10 onboarding steps with validation and a progress bar
- [ ] On completion: persist to `users` + `preferences` tables, set `onboarding_completed = true`
- [ ] `RootNavigator`: if `!onboarding_completed` â†’ Onboarding; else â†’ MainTabNavigator

### Phase 3 â€” Core Data Layer (Day 3)
- [ ] Implement all Zustand stores (typed)
- [ ] Implement `OfflineSyncService`: cache workouts and meal plans to AsyncStorage; sync on reconnect
- [ ] Set up `react-i18next` with `en.json` and `sn.json` (Shona) stubs; wire language switcher

### Phase 4 â€” AI Services (Days 4â€“5)
- [ ] Implement `RecommendationEngine.ts` (embedding + cosine similarity via Supabase RPC)
- [ ] Implement `TrainingPlanService.ts` (generation + dynamic adjustment)
- [ ] Implement `NutritionService.ts` (meal plan generation + meal logging)
- [ ] Implement `WellnessService.ts` (analysis + overtraining detection)
- [ ] Implement `VirtualCoachService.ts` (speech + chat)
- [ ] Wire `ai_cache` and `ai_usage_logs` throughout

### Phase 5 â€” UI Screens (Days 6â€“7)
- [ ] `DashboardScreen`: next workout card, active challenge widget, today's macros ring, wellness summary, AI recommendations row
- [ ] `WorkoutsScreen`: weekly plan view, exercise cards, filter by category
- [ ] `WorkoutPlayerScreen`: timer, set logger, coach cues, `expo-speech`, SmartDumbbell stub metrics panel
- [ ] `ChallengesScreen` + `LeaderboardScreen` (Supabase Realtime subscription)
- [ ] `NutritionScreen` + `MealLogScreen`
- [ ] `WellnessScreen`: log form, charts (Victory Native), injury risk banner
- [ ] `ProfileScreen`, `SettingsScreen`, `WearablesScreen`, `PrivacyPolicyScreen`

### Phase 6 â€” Gamification & Notifications (Day 8)
- [ ] Points system via Supabase DB trigger
- [ ] Badges/rewards redemption page
- [ ] Expo push notifications (register token, store in `users`, send from Edge Function stub)
- [ ] `NotificationService.ts`: schedule workout reminders, meal reminders, wellness reminders

### Phase 7 â€” Polish, Testing & Docs (Day 9)
- [ ] Write Jest unit tests for `RecommendationEngine` and `TrainingPlanService`
- [ ] Write RNT Library component tests for `OnboardingStep1`, `WellnessForm`
- [ ] Accessibility: minimum touch target 44Ã—44pt, VoiceOver labels on all interactive elements
- [ ] Performance: memoize heavy list renders with `React.memo` and `useCallback`
- [ ] Write `README.md` (setup, env vars, Supabase config, running tests, deploying to Expo EAS)

---

## 9. UI / UX REQUIREMENTS

### Design Language
- **Palette:** Deep charcoal background (`#0F0F0F`) with electric green primary (`#39FF14`), warm amber accent (`#FFB347`). Avoid generic purple gradients.
- **Typography:** Display font â€” `Bebas Neue` for headings; body â€” `DM Sans` for readable body text.
- **Cards:** 12px border radius, subtle `rgba(255,255,255,0.05)` glass surface.
- **Dark mode only** for MVP (no light mode toggle needed).

### Navigation
- Bottom tab: **Dashboard Â· Workouts Â· Challenges Â· Nutrition Â· Wellness**
- Profile accessible via avatar in header.

### Charts
- Use Victory Native: `VictoryBar` for weekly calories, `VictoryLine` for sleep trend, `VictoryPie` for macro breakdown.

### Accessibility
- All images: `accessibilityLabel` prop
- All buttons: min 44Ã—44pt hit area
- Text contrast ratio â‰¥ 4.5:1

---

## 10. SMART EQUIPMENT STUB

**File:** `/src/services/SmartDumbbellService.ts`

```typescript
// Emit simulated sensor events during active workout sessions.
// When real BLE hardware is integrated, replace the interval-based
// simulation with react-native-ble-plx calls.

interface SmartDumbbellEvents {
  repetitionCompleted: { repNumber: number; timeMs: number };
  weightChanged: { newWeightKg: number };
  formCorrected: { issue: 'range_of_motion' | 'speed' | 'asymmetry'; severity: 'mild' | 'severe' };
  heartRateUpdate: { bpm: number };
}

class SmartDumbbellService extends EventEmitter<SmartDumbbellEvents> {
  isConnected: boolean = false;
  // startSimulation(), stopSimulation(), connect(deviceId), disconnect()
}
```

Display simulated metrics (reps, weight, HR) in `WorkoutPlayerScreen`. Show a "Connect Device" CTA in `WearablesScreen`.

---

## 11. TESTING REQUIREMENTS

Minimum test coverage before the MVP is considered complete:

```typescript
// RecommendationEngine.test.ts
describe('RecommendationEngine', () => {
  it('recommends only beginner workouts for a new beginner user', async () => { ... });
  it('filters out workouts requiring unavailable equipment', async () => { ... });
  it('boosts recovery workouts when overtraining risk is high', async () => { ... });
  it('updates preference vector hash to avoid redundant re-embedding', async () => { ... });
});

// TrainingPlanService.test.ts
describe('TrainingPlanService', () => {
  it('reduces intensity after low rating and high perceived difficulty', async () => { ... });
  it('schedules lighter workouts when sleep < 6h for 3 consecutive days', async () => { ... });
});
```

Mock `VertexAIService` and `SupabaseService` in all tests using Jest `jest.mock()`.

---

## 12. SECURITY & PRIVACY

- All health data in Supabase protected by RLS (Section 4.2).
- Local sensitive data stored via `expo-secure-store` (not AsyncStorage).
- No Vertex AI call includes PII beyond anonymized metrics â€” strip `full_name` and `email` before building prompts.
- `PrivacyPolicyScreen`: display policy, include "Delete My Account" button that triggers Supabase `auth.admin.deleteUser()` via an Edge Function.
- Never log API keys or user data to the console in production builds (`__DEV__` guard on all `console.log`).

---

## 13. README TEMPLATE

Generate `README.md` covering:

1. **Project overview** â€” what Mofitness is
2. **Prerequisites** â€” Node 18+, Expo CLI, Supabase CLI, GCP account with Vertex AI API enabled
3. **Installation** â€” `git clone`, `npm install`, `.env` setup
4. **Supabase setup** â€” run migrations, configure Auth, Storage bucket for workout videos
5. **Vertex AI setup** â€” enable API, create service account, download JSON key, set `GOOGLE_APPLICATION_CREDENTIALS`
6. **Running the app** â€” `npx expo start`, iOS/Android
7. **Running tests** â€” `npm test`
8. **Project structure** â€” link to Section 6
9. **Deployment** â€” Expo EAS Build + Submit
10. **Contributing** â€” branch naming, PR checklist

---

## FINAL INSTRUCTION TO CURSOR

1. **Start with Phase 1.** Do not skip ahead.
2. After each phase, verify the app compiles (`npx expo start --no-dev`) before proceeding.
3. Every TypeScript file must have zero `any` types and pass `tsc --noEmit`.
4. Every Vertex AI call must go through `VertexAIService` â€” never call the SDK directly from a screen or store.
5. Every database write must respect RLS â€” never use the service-role key on the client.
6. Comment every non-obvious algorithm section with a `// WHY:` explanation.
7. At the end of each phase, output a summary of what was built and flag any decisions that deviate from this spec.

