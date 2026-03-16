# Nutrition Feature Backlog

## Status
- Foundation is live: schema, storage buckets, core edge functions, and baseline screens.
- Nutrition is not yet spec-complete against `deep-research-report.md`.
- This backlog tracks the gap-closing order.

## Phase 1: UI Completeness
- [x] Add backlog and execution order.
- [ ] Add `MealPlanGeneratorScreen` for date-specific generation/regeneration.
- [ ] Add missing reusable nutrition components:
  - `MealDetailCard`
  - `NutrientRow`
  - `MealTimeline`
  - `PrePostMealCard`
  - `MealImageGenerator`
  - `MealPhotoAnalyzer`
- [ ] Upgrade `NutritionScreen` with:
  - top actions for edit goal/history
  - meal timeline
  - key nutrient section
  - regenerate action
- [ ] Upgrade `MealDetailScreen` with:
  - image generator component
  - micros tab
  - pre/post action cards
  - richer dish cards

## Phase 2: Goal Engine Completeness
- [ ] Add conditional target inputs for body-fat and muscle-mass goals.
- [ ] Surface goal pace summary and unrealistic-goal warnings.
- [ ] Persist non-empty `safety_flags` from client goal creation.
- [ ] Add explicit restriction review UI instead of allergies-only entry.

## Phase 3: Health Feed Completeness
- [ ] Finish feed card presentation and remove placeholder markers.
- [ ] Add stats-card toggle to post creation.
- [ ] Add reply UI for threaded comments.
- [ ] Implement `following` filter.
- [ ] Implement `trending` sort.
- [ ] Add search and post-detail flow.
- [ ] Add notifications entry point.

## Phase 4: Data Depth
- [ ] Expand `country_cuisines` beyond the starter seed set.
- [ ] Expand `regional_foods` to a production-scale seed set.
- [ ] Extend nutrient depth for more reliable micronutrient coverage.

## Phase 5: Offline, Motion, and Testing
- [ ] Wire `OfflineSyncService` into meal plan/feed flows.
- [ ] Add nutrition-specific motion states and reveal animations.
- [ ] Add unit tests for nutrition math and gating.
- [ ] Add screen-flow tests for nutrition and feed.
- [ ] Add edge-function integration coverage.
