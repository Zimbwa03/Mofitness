import { EXERCISE_LIBRARY, WORKOUT_CATALOG_SUMMARY } from "../data/workoutCatalog";
import type { Exercise } from "../models/workout";

class ExerciseLibraryService {
  getAllExercises() {
    return EXERCISE_LIBRARY;
  }

  getExerciseById(exerciseId: string) {
    return EXERCISE_LIBRARY.find((exercise) => exercise.id === exerciseId) ?? null;
  }

  getExerciseByName(name: string) {
    const normalizedName = name.trim().toLowerCase();
    return EXERCISE_LIBRARY.find((exercise) => exercise.name.toLowerCase() === normalizedName) ?? null;
  }

  getByCategory(category: Exercise["category"]) {
    return EXERCISE_LIBRARY.filter((exercise) => exercise.category === category);
  }

  search(query: string) {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return EXERCISE_LIBRARY;
    }

    return EXERCISE_LIBRARY.filter((exercise) => {
      const searchable = [
        exercise.name,
        exercise.category,
        exercise.description,
        exercise.movementPattern,
        exercise.anatomyFocus,
        exercise.setImpact,
        exercise.motivationQuote,
        ...exercise.musclePrimary,
        ...exercise.muscleSecondary,
        ...exercise.equipment,
        ...exercise.benefits,
        ...exercise.medicalConsiderations,
        ...exercise.goalTags,
        ...exercise.goalTags.map((tag) => tag.replace(/_/g, " ")),
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }

  getAnimationExercises(animationKey: string) {
    return EXERCISE_LIBRARY.filter((exercise) => exercise.animationKey === animationKey);
  }

  getCatalogSummary() {
    return {
      exerciseCount: WORKOUT_CATALOG_SUMMARY.exerciseCount,
      workoutCount: WORKOUT_CATALOG_SUMMARY.workoutCount,
    };
  }
}

const exerciseLibraryService = new ExerciseLibraryService();

export { ExerciseLibraryService };
export default exerciseLibraryService;
