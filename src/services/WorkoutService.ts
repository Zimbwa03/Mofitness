import type { WorkoutPlanItem } from "../models";
import { WORKOUT_CATALOG_SUMMARY, WORKOUT_TEMPLATES } from "../data/workoutCatalog";
import {
  DEFAULT_WORKOUT_FILTERS,
  type WorkoutFilters,
  type WorkoutSortBy,
  type WorkoutTemplate,
  type WeeklyWorkoutSlot,
} from "../models/workout";

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

function includesAny(values: string[], selected: string[]) {
  if (selected.length === 0) {
    return true;
  }

  return selected.some((value) => values.includes(value));
}

function includesAll(values: string[], selected: string[]) {
  if (selected.length === 0) {
    return true;
  }

  return selected.every((value) => values.includes(value));
}

function toSorted(workouts: WorkoutTemplate[], sortBy: WorkoutSortBy) {
  const ordered = [...workouts];

  switch (sortBy) {
    case "newest":
      return ordered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "duration_asc":
      return ordered.sort((a, b) => a.durationMinutes - b.durationMinutes);
    case "duration_desc":
      return ordered.sort((a, b) => b.durationMinutes - a.durationMinutes);
    case "calories_desc":
      return ordered.sort((a, b) => b.caloriesEstimate - a.caloriesEstimate);
    case "rating_desc":
      return ordered.sort((a, b) => b.rating - a.rating);
    case "most_done":
      return ordered.sort((a, b) => b.timesCompleted - a.timesCompleted);
    case "recommended":
    default:
      return ordered.sort((a, b) => {
        const featuredRank = Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured));
        if (featuredRank !== 0) {
          return featuredRank;
        }

        const ratingRank = b.rating - a.rating;
        if (ratingRank !== 0) {
          return ratingRank;
        }

        return b.timesCompleted - a.timesCompleted;
      });
  }
}

class WorkoutService {
  getAllWorkouts() {
    return WORKOUT_TEMPLATES;
  }

  getWorkoutById(workoutId: string) {
    return WORKOUT_TEMPLATES.find((workout) => workout.id === workoutId) ?? null;
  }

  getFeaturedWorkout() {
    return WORKOUT_TEMPLATES.find((workout) => workout.isFeatured) ?? WORKOUT_TEMPLATES[0] ?? null;
  }

  getCatalogSummary() {
    return WORKOUT_CATALOG_SUMMARY;
  }

  searchWorkouts(query: string, filters: WorkoutFilters = DEFAULT_WORKOUT_FILTERS) {
    const normalizedQuery = query.trim().toLowerCase();
    const scoped = this.applyFilters(WORKOUT_TEMPLATES, filters);

    if (!normalizedQuery) {
      return scoped;
    }

    return scoped.filter((workout) => {
      const searchableText = [
        workout.name,
        workout.description,
        workout.category,
        workout.difficulty,
        workout.anatomySummary,
        workout.intensitySummary,
        workout.motivationQuote,
        ...workout.muscleGroups,
        ...workout.equipment,
        ...workout.benefits,
        ...workout.goalTags,
        ...workout.goalTags.map((tag) => tag.replace(/_/g, " ")),
        ...workout.exercises.flatMap((exercise) => [exercise.exerciseName, exercise.cue ?? "", exercise.stimulusNote ?? ""]),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }

  applyFilters(workouts: WorkoutTemplate[], filters: WorkoutFilters) {
    const [minDuration, maxDuration] = filters.duration_range;

    const filtered = workouts.filter((workout) => {
      if (filters.category.length > 0 && !filters.category.includes(workout.category)) {
        return false;
      }

      if (filters.difficulty.length > 0 && !filters.difficulty.includes(workout.difficulty)) {
        return false;
      }

      if (workout.durationMinutes < minDuration || workout.durationMinutes > maxDuration) {
        return false;
      }

      if (filters.bodyweight_only && workout.equipment.length > 0) {
        return false;
      }

      if (!filters.bodyweight_only && filters.equipment.length > 0 && !includesAll(workout.equipment, filters.equipment)) {
        return false;
      }

      if (filters.format.length > 0 && !filters.format.includes(workout.format)) {
        return false;
      }

      if (!includesAny(workout.muscleGroups, filters.muscle_group)) {
        return false;
      }

      return true;
    });

    return toSorted(filtered, filters.sort_by);
  }

  sortWorkouts(workouts: WorkoutTemplate[], sortBy: WorkoutSortBy) {
    return toSorted(workouts, sortBy);
  }

  getWeeklyPlanSlots(workouts = WORKOUT_TEMPLATES): WeeklyWorkoutSlot[] {
    const today = new Date();
    const firstDate = new Date(today);
    firstDate.setDate(today.getDate() - today.getDay());

    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(firstDate);
      date.setDate(firstDate.getDate() + index);
      const isToday = date.toDateString() === today.toDateString();
      const workoutForDay = index === 0 ? null : workouts[index % workouts.length] ?? null;

      return {
        dateISO: date.toISOString().slice(0, 10),
        dayLabel: DAY_LABELS[date.getDay()],
        workoutCategory: workoutForDay?.category ?? "rest",
        workoutId: workoutForDay?.id,
        isToday,
        completed: Boolean(workoutForDay && index < today.getDay()),
      };
    });
  }

  getTodaysWorkoutFromPlan(planItems: WorkoutPlanItem[]) {
    const todayISO = new Date().toISOString().slice(0, 10);
    const scheduled = planItems.find((item) => item.scheduled_date === todayISO);

    if (!scheduled) {
      return this.getFeaturedWorkout();
    }

    return (
      this.getWorkoutById(scheduled.id) ??
      WORKOUT_TEMPLATES.find((workout) => scheduled.title.toLowerCase().includes(workout.name.toLowerCase())) ??
      this.getFeaturedWorkout()
    );
  }
}

const workoutService = new WorkoutService();

export { WorkoutService, WORKOUT_TEMPLATES };
export default workoutService;
