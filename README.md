# Mofitness

Mofitness is a mobile fitness MVP built with Expo React Native, Supabase, and Google Vertex AI. The product is aimed at Sub-Saharan Africa and combines AI-generated training plans, nutrition support, wellness tracking, challenges, gamification, and a virtual coach into one app.

## Prerequisites

- Node.js 20+
- npm 10+
- Expo CLI compatible with Expo SDK 55
- Supabase project and credentials
- Supabase CLI if you want to manage migrations locally
- Google Cloud project with Vertex AI enabled
- A Vertex AI service account JSON key

## Installation

```bash
git clone <your-repo-url>
cd mofitness
npm install
```

Create a `.env` file in the project root:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
VERTEX_AI_PROJECT_ID=your-gcp-project-id
VERTEX_AI_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=./secrets/vertex-service-account.json
```

Never commit real secrets. Keep service-account files outside version control.

## Supabase Setup

1. Create a Supabase project.
2. Enable email/password authentication.
3. Run the SQL migrations under `supabase/migrations`.
4. Confirm RLS is enabled on all user-owned tables.
5. Create any storage buckets needed for workout media assets.

Phase 6 requires the gamification migration:

- `supabase/migrations/202603142230_phase6_gamification_notifications.sql`

## Vertex AI Setup

1. Enable the Vertex AI API in Google Cloud.
2. Create a service account with Vertex AI access.
3. Download the JSON key.
4. Point `GOOGLE_APPLICATION_CREDENTIALS` to that JSON file.

Current architecture note:

- `VertexAIService` is centralized in the mobile client for MVP speed.
- For production, move Vertex calls behind a server or edge-function proxy.

## Running the App

```bash
npm start
```

Common targets:

```bash
npm run android
npm run ios
npm run web
```

## Running Tests

```bash
npm test -- --runInBand
npm run typecheck
```

Nutrition smoke test against deployed Edge Functions:

```bash
NUTRITION_SMOKE_EMAIL=your-existing-user@example.com \
NUTRITION_SMOKE_PASSWORD=your-password \
npm run smoke:nutrition
```

The smoke test signs in as an existing user, ensures the required profile and preference rows exist, creates an active nutrition goal, invokes `nutrition-plan`, and then invokes `nutrition-meal-image`. It fails if meal image generation falls back to SVG instead of live Imagen output.

## Project Structure

```text
.
├── App.tsx
├── app.json
├── babel.config.js
├── supabase/
│   └── migrations/
└── src/
    ├── components/
    ├── hooks/
    ├── i18n/
    ├── models/
    ├── navigation/
    ├── screens/
    ├── services/
    ├── stores/
    ├── test/
    ├── theme/
    └── utils/
```

## Deployment

Build and ship with Expo EAS:

```bash
npx eas build --platform android
npx eas build --platform ios
```

After validation, submit with EAS Submit from the same project.

## Contributing

- Use focused feature branches.
- Keep TypeScript strict and avoid `any`.
- Run `npm run typecheck` and `npm test -- --runInBand` before merging.
- Keep Supabase schema changes in migration files.
- Keep all AI calls routed through `src/services/VertexAIService.ts`.
