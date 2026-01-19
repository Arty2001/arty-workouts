import Link from "next/link";
import {
  getTodayWeight,
  getRecentBodyWeights,
  getLatestBodyWeight,
} from "@/lib/actions";
import { WeightLogger } from "./weight-logger";

export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default async function WeightPage() {
  const [todayWeight, recentWeights, latestWeight] = await Promise.all([
    getTodayWeight(),
    getRecentBodyWeights(14),
    getLatestBodyWeight(),
  ]);

  const suggestedWeight = latestWeight?.weight ?? 150;

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <Link
          href="/"
          className="text-muted text-sm hover:text-foreground transition-colors"
        >
          Back
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Body Weight</h1>
      </header>

      {todayWeight ? (
        <section className="p-6 border border-border rounded-lg bg-white">
          <p className="text-sm text-muted">Today</p>
          <p className="text-4xl font-semibold mt-1">{todayWeight.weight} lbs</p>
          <p className="text-xs text-muted mt-2">
            Logged at {new Date(todayWeight.date).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </section>
      ) : (
        <section className="space-y-4">
          <p className="text-muted text-sm">Log today's weight</p>
          <WeightLogger suggestedWeight={suggestedWeight} />
        </section>
      )}

      {recentWeights.length > 0 && (
        <section className="space-y-4">
          <p className="text-muted text-sm uppercase tracking-wide">Recent</p>
          <div className="border border-border rounded-lg bg-white divide-y divide-border">
            {recentWeights.map((entry) => (
              <div key={entry.id} className="p-4 flex justify-between items-center">
                <span className="text-sm text-muted">{formatDate(entry.date)}</span>
                <span className="font-medium">{entry.weight} lbs</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {recentWeights.length >= 2 && (
        <WeightTrend weights={recentWeights} />
      )}
    </div>
  );
}

interface WeightEntry {
  weight: number;
  date: Date;
}

function WeightTrend({ weights }: { weights: WeightEntry[] }) {
  const sorted = [...weights].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const first = sorted[0].weight;
  const last = sorted[sorted.length - 1].weight;
  const change = last - first;

  return (
    <section className="space-y-4">
      <p className="text-muted text-sm uppercase tracking-wide">Trend</p>
      <div className="p-5 border border-border rounded-lg bg-white">
        <p className={`text-2xl font-semibold ${change < 0 ? "text-success" : change > 0 ? "text-red-500" : ""}`}>
          {change > 0 ? "+" : ""}{change.toFixed(1)} lbs
        </p>
        <p className="text-sm text-muted mt-1">
          Last {sorted.length} entries
        </p>
      </div>
    </section>
  );
}
