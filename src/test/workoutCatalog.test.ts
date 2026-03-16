import exerciseLibraryService from "../services/ExerciseLibraryService";
import workoutService from "../services/WorkoutService";

describe("workout catalog expansion", () => {
  it("builds a large detailed exercise library", () => {
    const exercises = exerciseLibraryService.getAllExercises();
    const sample = exerciseLibraryService.getExerciseByName("Barbell Back Squat");

    expect(exercises.length).toBeGreaterThan(1000);
    expect(sample).not.toBeNull();
    expect(sample?.anatomyFocus.length).toBeGreaterThan(20);
    expect(sample?.benefits.length).toBeGreaterThanOrEqual(2);
    expect(sample?.medicalConsiderations.length).toBeGreaterThanOrEqual(2);
    expect(sample?.motivationQuote.length).toBeGreaterThan(10);
  });

  it("creates rich workout templates from the expanded library", () => {
    const workouts = workoutService.getAllWorkouts();
    const featured = workoutService.getFeaturedWorkout();

    expect(workouts.length).toBeGreaterThanOrEqual(30);
    expect(featured).not.toBeNull();
    expect(featured?.anatomySummary.length).toBeGreaterThan(20);
    expect(featured?.benefits.length).toBeGreaterThan(0);
    expect(featured?.medicalConsiderations.length).toBeGreaterThan(0);
    expect(featured?.exercises.every((exercise) => typeof exercise.stimulusNote === "string" && exercise.stimulusNote.length > 15)).toBe(
      true,
    );
  });

  it("searches across the new anatomy and goal metadata", () => {
    const workoutResults = workoutService.searchWorkouts("glute strength");
    const exerciseResults = exerciseLibraryService.search("posterior chain");

    expect(workoutResults.length).toBeGreaterThan(0);
    expect(exerciseResults.length).toBeGreaterThan(0);
  });
});
