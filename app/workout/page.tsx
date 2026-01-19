import { redirect } from "next/navigation";
import {
  getActiveSession,
  getCurrentExerciseAndSet,
  getLastWeightForExercise,
} from "@/lib/actions";
import { SetLogger } from "./set-logger";
import { WorkoutComplete } from "./workout-complete";
import { CancelButton } from "./cancel-button";

export const dynamic = "force-dynamic";

export default async function WorkoutPage() {
  const session = await getActiveSession();

  if (!session) {
    redirect("/");
  }

  const current = await getCurrentExerciseAndSet(session.id);

  if (!current) {
    return <WorkoutComplete workoutName={session.workoutId} />;
  }

  const suggestedWeight = await getLastWeightForExercise(current.exercise.id);

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="text-muted text-sm">{current.workout.name}</p>
        <p className="text-muted text-xs">
          Set {current.completedSets + 1} of {current.totalSets}
        </p>
      </header>

      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {current.exercise.name}
        </h1>
        <p className="text-muted">
          Set {current.setNumber} of {current.exercise.sets}
          {current.exercise.minReps === current.exercise.maxReps
            ? ""
            : ` / ${current.exercise.minReps}-${current.exercise.maxReps} reps`}
          {current.exercise.perSide && " per side"}
        </p>
      </section>

      <SetLogger
        sessionId={session.id}
        exerciseId={current.exercise.id}
        setNumber={current.setNumber}
        suggestedWeight={suggestedWeight}
        minReps={current.exercise.minReps}
        maxReps={current.exercise.maxReps}
      />

      <ProgressBar
        completed={current.completedSets}
        total={current.totalSets}
      />

      <div className="pt-4 border-t border-border">
        <CancelButton />
      </div>
    </div>
  );
}

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const percentage = (completed / total) * 100;

  return (
    <div className="space-y-2">
      <div className="h-1 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-muted text-center">
        {completed} / {total} sets completed
      </p>
    </div>
  );
}
