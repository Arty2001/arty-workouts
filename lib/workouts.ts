export type ExerciseType = "compound" | "isolation";

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  minReps: number;
  maxReps: number;
  type: ExerciseType;
  perSide?: boolean;
}

export interface Workout {
  id: string;
  name: string;
  exercises: Exercise[];
}

export const WORKOUTS: Workout[] = [
  {
    id: "upper-a",
    name: "Upper A",
    exercises: [
      { id: "incline-db-press", name: "Incline DB Press", sets: 4, minReps: 6, maxReps: 10, type: "compound" },
      { id: "flat-db-bench", name: "Flat DB Bench", sets: 3, minReps: 8, maxReps: 12, type: "compound" },
      { id: "seated-db-shoulder-press", name: "Seated DB Shoulder Press", sets: 3, minReps: 8, maxReps: 10, type: "compound" },
      { id: "cable-lateral-raise-a", name: "Cable Lateral Raise", sets: 4, minReps: 12, maxReps: 20, type: "isolation" },
      { id: "cable-triceps-pushdown", name: "Cable Triceps Pushdown", sets: 3, minReps: 10, maxReps: 15, type: "isolation" },
      { id: "overhead-triceps-extension", name: "Overhead Triceps Extension", sets: 3, minReps: 12, maxReps: 15, type: "isolation" },
    ],
  },
  {
    id: "lower-a",
    name: "Lower A",
    exercises: [
      { id: "smith-squat", name: "Smith Squat", sets: 4, minReps: 6, maxReps: 10, type: "compound" },
      { id: "db-romanian-deadlift", name: "DB Romanian Deadlift", sets: 3, minReps: 8, maxReps: 12, type: "compound" },
      { id: "walking-lunges", name: "Walking Lunges", sets: 3, minReps: 10, maxReps: 12, type: "compound", perSide: true },
      { id: "standing-calf-raise", name: "Standing Calf Raise", sets: 4, minReps: 12, maxReps: 20, type: "isolation" },
      { id: "core-a", name: "Core", sets: 3, minReps: 1, maxReps: 1, type: "isolation" },
    ],
  },
  {
    id: "upper-b",
    name: "Upper B",
    exercises: [
      { id: "neutral-pulldown", name: "Neutral Pulldown", sets: 4, minReps: 8, maxReps: 12, type: "compound" },
      { id: "single-arm-db-row", name: "Single-Arm DB Row", sets: 3, minReps: 8, maxReps: 12, type: "compound", perSide: true },
      { id: "cable-face-pull", name: "Cable Face Pull", sets: 4, minReps: 12, maxReps: 20, type: "isolation" },
      { id: "incline-db-curl", name: "Incline DB Curl", sets: 3, minReps: 10, maxReps: 15, type: "isolation" },
      { id: "cable-lateral-raise-b", name: "Cable Lateral Raise", sets: 3, minReps: 15, maxReps: 20, type: "isolation" },
      { id: "hammer-curl", name: "Hammer Curl", sets: 3, minReps: 10, maxReps: 14, type: "isolation" },
    ],
  },
  {
    id: "lower-b",
    name: "Lower B",
    exercises: [
      { id: "smith-rdl", name: "Smith RDL", sets: 4, minReps: 6, maxReps: 10, type: "compound" },
      { id: "goblet-squat", name: "Goblet Squat", sets: 3, minReps: 10, maxReps: 12, type: "compound" },
      { id: "hip-thrust", name: "Hip Thrust", sets: 3, minReps: 8, maxReps: 12, type: "compound" },
      { id: "seated-calf-raise", name: "Seated Calf Raise", sets: 4, minReps: 12, maxReps: 20, type: "isolation" },
      { id: "core-b", name: "Core", sets: 3, minReps: 1, maxReps: 1, type: "isolation" },
    ],
  },
];

export const WORKOUT_SEQUENCE = ["upper-a", "lower-a", "upper-b", "lower-b"] as const;

export function getWorkoutById(id: string): Workout | undefined {
  return WORKOUTS.find((w) => w.id === id);
}

export function getExerciseById(workoutId: string, exerciseId: string): Exercise | undefined {
  const workout = getWorkoutById(workoutId);
  return workout?.exercises.find((e) => e.id === exerciseId);
}

export function getNextWorkoutId(currentIndex: number): string {
  return WORKOUT_SEQUENCE[currentIndex % WORKOUT_SEQUENCE.length];
}

export function getTotalSetsForWorkout(workoutId: string): number {
  const workout = getWorkoutById(workoutId);
  if (!workout) return 0;
  return workout.exercises.reduce((sum, ex) => sum + ex.sets, 0);
}

export function getDefaultWeight(exerciseId: string): number {
  const defaults: Record<string, number> = {
    "incline-db-press": 65,
    "flat-db-bench": 65,
    "seated-db-shoulder-press": 45,
    "cable-lateral-raise-a": 20,
    "cable-triceps-pushdown": 45,
    "overhead-triceps-extension": 35,
    "smith-squat": 135,
    "db-romanian-deadlift": 55,
    "walking-lunges": 35,
    "standing-calf-raise": 90,
    "core-a": 0,
    "neutral-pulldown": 110,
    "single-arm-db-row": 55,
    "cable-face-pull": 35,
    "incline-db-curl": 20,
    "cable-lateral-raise-b": 20,
    "hammer-curl": 25,
    "smith-rdl": 115,
    "goblet-squat": 45,
    "hip-thrust": 90,
    "seated-calf-raise": 70,
    "core-b": 0,
  };
  return defaults[exerciseId] ?? 20;
}
