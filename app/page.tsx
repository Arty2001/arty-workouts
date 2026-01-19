import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getNextWorkout,
  getActiveSession,
  startWorkout,
  getCompletedWorkoutsCount,
  getRecentProgress,
  getTodayWeight,
  getLatestBodyWeight,
} from "@/lib/actions";

export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default async function Home() {
  const [nextWorkout, activeSession, completedCount, recentSessions, todayWeight, latestWeight] = await Promise.all([
    getNextWorkout(),
    getActiveSession(),
    getCompletedWorkoutsCount(),
    getRecentProgress(),
    getTodayWeight(),
    getLatestBodyWeight(),
  ]);

  if (activeSession && !activeSession.completedAt) {
    redirect("/workout");
  }

  const strengthGains = calculateStrengthGains(recentSessions);

  async function handleStartWorkout() {
    "use server";
    await startWorkout();
    redirect("/workout");
  }

  return (
    <div className="space-y-12">
      <header className="space-y-1">
        <p className="text-muted text-sm">{formatDate(new Date())}</p>
        <h1 className="text-2xl font-semibold tracking-tight">Workout</h1>
      </header>

      <section className="space-y-6">
        <div className="space-y-3">
          <p className="text-muted text-sm uppercase tracking-wide">Next</p>
          <div className="p-6 border border-border rounded-lg bg-white">
            <h2 className="text-xl font-medium">{nextWorkout.name}</h2>
            <p className="text-muted mt-1">
              {nextWorkout.exercises.length} exercises
            </p>
            <ul className="mt-4 space-y-1">
              {nextWorkout.exercises.map((ex) => (
                <li key={ex.id} className="text-sm text-muted">
                  {ex.name}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <form action={handleStartWorkout}>
          <button
            type="submit"
            className="w-full py-4 bg-accent text-white font-medium rounded-lg hover:bg-neutral-800 transition-colors"
          >
            Start Workout
          </button>
        </form>
      </section>

      {completedCount > 0 && (
        <section className="space-y-4">
          <p className="text-muted text-sm uppercase tracking-wide">Progress</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border border-border rounded-lg bg-white">
              <p className="text-3xl font-semibold">{completedCount}</p>
              <p className="text-sm text-muted mt-1">Workouts completed</p>
            </div>
            {strengthGains.length > 0 && (
              <div className="p-4 border border-border rounded-lg bg-white">
                <p className="text-3xl font-semibold text-success">
                  +{strengthGains.reduce((a, b) => a + b.gain, 0).toFixed(1)}lbs
                </p>
                <p className="text-sm text-muted mt-1">Recent gains</p>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <p className="text-muted text-sm uppercase tracking-wide">Body Weight</p>
        <Link href="/weight" className="block p-4 border border-border rounded-lg bg-white hover:bg-neutral-50 transition-colors">
          {todayWeight ? (
            <div className="flex justify-between items-center">
              <span className="text-muted text-sm">Today</span>
              <span className="text-lg font-semibold">{todayWeight.weight} lbs</span>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-muted text-sm">
                {latestWeight ? `Last: ${latestWeight.weight} lbs` : "No entries yet"}
              </span>
              <span className="text-sm text-accent font-medium">Log weight</span>
            </div>
          )}
        </Link>
      </section>

      <nav className="pt-4 border-t border-border flex flex-col gap-2">
        <Link
          href="/wrapped"
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          View all-time summary
        </Link>
      </nav>
    </div>
  );
}

interface SetWithExercise {
  exerciseId: string;
  weight: number;
}

interface SessionWithSets {
  sets: SetWithExercise[];
}

function calculateStrengthGains(sessions: SessionWithSets[]) {
  if (sessions.length < 2) return [];

  const exerciseWeights: Record<string, { first: number; last: number }> = {};

  for (const session of sessions) {
    for (const set of session.sets) {
      if (!exerciseWeights[set.exerciseId]) {
        exerciseWeights[set.exerciseId] = { first: set.weight, last: set.weight };
      }
      exerciseWeights[set.exerciseId].last = set.weight;
    }
  }

  return Object.entries(exerciseWeights)
    .map(([id, { first, last }]) => ({
      exerciseId: id,
      gain: last - first,
    }))
    .filter((g) => g.gain > 0);
}
