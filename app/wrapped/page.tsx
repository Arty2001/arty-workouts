import Link from "next/link";
import { getWrappedData } from "@/lib/actions";
import { WORKOUTS } from "@/lib/workouts";

export const dynamic = "force-dynamic";

function getExerciseName(exerciseId: string): string {
  for (const workout of WORKOUTS) {
    const exercise = workout.exercises.find((e) => e.id === exerciseId);
    if (exercise) return exercise.name;
  }
  return exerciseId;
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const KEY_EXERCISES = [
  "incline-db-press",
  "smith-squat",
  "neutral-pulldown",
  "smith-rdl",
  "hip-thrust",
];

export default async function WrappedPage() {
  const data = await getWrappedData();

  const keyLiftsProgress = KEY_EXERCISES.map((id) => ({
    id,
    name: getExerciseName(id),
    stats: data.exerciseStats[id],
  })).filter((l) => l.stats);

  const strongestLifts = Object.entries(data.exerciseStats)
    .map(([id, stats]) => ({
      id,
      name: getExerciseName(id),
      maxWeight: stats.maxWeight,
    }))
    .sort((a, b) => b.maxWeight - a.maxWeight)
    .slice(0, 5);

  return (
    <div className="space-y-12">
      <header className="space-y-2">
        <Link
          href="/"
          className="text-muted text-sm hover:text-foreground transition-colors"
        >
          Back
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Summary</h1>
        <p className="text-muted text-sm">All-time training data</p>
      </header>

      {data.totalWorkouts === 0 ? (
        <div className="p-8 border border-border rounded-lg bg-white text-center">
          <p className="text-muted">No workouts completed yet.</p>
          <p className="text-muted text-sm mt-2">Start your first workout to see your progress.</p>
        </div>
      ) : (
        <>
          <section className="space-y-4">
            <p className="text-muted text-sm uppercase tracking-wide">Overview</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 border border-border rounded-lg bg-white">
                <p className="text-3xl font-semibold">{data.totalWorkouts}</p>
                <p className="text-sm text-muted mt-1">Workouts</p>
              </div>
              <div className="p-5 border border-border rounded-lg bg-white">
                <p className="text-3xl font-semibold">{data.totalSets}</p>
                <p className="text-sm text-muted mt-1">Total sets</p>
              </div>
            </div>
            <div className="p-5 border border-border rounded-lg bg-white">
              <div className="flex justify-between text-sm">
                <span className="text-muted">First workout</span>
                <span>{formatDate(data.firstWorkoutDate)}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-muted">Last workout</span>
                <span>{formatDate(data.lastWorkoutDate)}</span>
              </div>
            </div>
          </section>

          {strongestLifts.length > 0 && (
            <section className="space-y-4">
              <p className="text-muted text-sm uppercase tracking-wide">Strongest Lifts</p>
              <div className="border border-border rounded-lg bg-white divide-y divide-border">
                {strongestLifts.map((lift) => (
                  <div key={lift.id} className="p-4 flex justify-between items-center">
                    <span className="text-sm">{lift.name}</span>
                    <span className="font-semibold">{lift.maxWeight} lbs</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {keyLiftsProgress.length > 0 && (
            <section className="space-y-4">
              <p className="text-muted text-sm uppercase tracking-wide">Progress</p>
              <div className="border border-border rounded-lg bg-white divide-y divide-border">
                {keyLiftsProgress.map((lift) => {
                  const gain = lift.stats.latestWeight - lift.stats.firstWeight;
                  return (
                    <div key={lift.id} className="p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">{lift.name}</span>
                        {gain > 0 && (
                          <span className="text-sm text-success font-medium">
                            +{gain} lbs
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between text-xs text-muted mt-1">
                        <span>First: {lift.stats.firstWeight} lbs</span>
                        <span>Latest: {lift.stats.latestWeight} lbs</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}

      {data.bodyWeightStats && (
        <section className="space-y-4">
          <p className="text-muted text-sm uppercase tracking-wide">Body Weight</p>
          <div className="p-5 border border-border rounded-lg bg-white">
            <div className="flex justify-between items-baseline">
              <div>
                <p className="text-3xl font-semibold">{data.bodyWeightStats.latestWeight} lbs</p>
                <p className="text-sm text-muted mt-1">Current</p>
              </div>
              <div className="text-right">
                <p className={`text-xl font-semibold ${
                  data.bodyWeightStats.change < 0 ? "text-success" :
                  data.bodyWeightStats.change > 0 ? "text-red-500" : ""
                }`}>
                  {data.bodyWeightStats.change > 0 ? "+" : ""}{data.bodyWeightStats.change.toFixed(1)} lbs
                </p>
                <p className="text-sm text-muted">Total change</p>
              </div>
            </div>
          </div>
          <div className="p-5 border border-border rounded-lg bg-white">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted">Starting</span>
                <p className="font-medium">{data.bodyWeightStats.firstWeight} lbs</p>
              </div>
              <div>
                <span className="text-muted">Lowest</span>
                <p className="font-medium">{data.bodyWeightStats.lowestWeight} lbs</p>
              </div>
              <div>
                <span className="text-muted">Highest</span>
                <p className="font-medium">{data.bodyWeightStats.highestWeight} lbs</p>
              </div>
              <div>
                <span className="text-muted">Entries</span>
                <p className="font-medium">{data.bodyWeightStats.totalEntries}</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
