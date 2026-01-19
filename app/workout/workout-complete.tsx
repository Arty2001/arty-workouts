import Link from "next/link";
import { getWorkoutById } from "@/lib/workouts";

interface WorkoutCompleteProps {
  workoutName: string;
}

export function WorkoutComplete({ workoutName }: WorkoutCompleteProps) {
  const workout = getWorkoutById(workoutName);

  return (
    <div className="space-y-12 text-center pt-12">
      <div className="space-y-4">
        <div className="w-16 h-16 mx-auto border-2 border-success rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-success"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {workout?.name || "Workout"} Complete
        </h1>
        <p className="text-muted">All sets logged. Nice work.</p>
      </div>

      <Link
        href="/"
        className="inline-block w-full py-4 bg-accent text-white font-medium rounded-lg hover:bg-neutral-800 transition-colors text-center"
      >
        Done
      </Link>
    </div>
  );
}
