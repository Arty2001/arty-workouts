"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { logSet } from "@/lib/actions";

interface SetLoggerProps {
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  suggestedWeight: number;
  minReps: number;
  maxReps: number;
}

export function SetLogger({
  sessionId,
  exerciseId,
  setNumber,
  suggestedWeight,
  minReps,
  maxReps,
}: SetLoggerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [weight, setWeight] = useState(suggestedWeight.toString());
  const [reps, setReps] = useState(minReps === maxReps ? "1" : "");

  const isCore = minReps === 1 && maxReps === 1;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const weightNum = parseFloat(weight);
    const repsNum = parseInt(reps, 10);

    if (isNaN(weightNum) || isNaN(repsNum)) return;

    startTransition(async () => {
      await logSet(sessionId, exerciseId, setNumber, weightNum, repsNum);
      router.refresh();
    });
  }

  function adjustWeight(delta: number) {
    const current = parseFloat(weight) || 0;
    setWeight(Math.max(0, current + delta).toString());
  }

  function adjustReps(delta: number) {
    const current = parseInt(reps, 10) || 0;
    setReps(Math.max(1, current + delta).toString());
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-6">
        {!isCore && (
          <div className="space-y-3">
            <label className="text-sm text-muted block">Weight (lbs)</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => adjustWeight(-5)}
                className="w-14 h-14 border border-border rounded-lg text-xl font-medium hover:bg-neutral-50 transition-colors"
              >
                -
              </button>
              <input
                type="number"
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="flex-1 h-14 text-center text-2xl font-semibold border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                step="2.5"
                min="0"
              />
              <button
                type="button"
                onClick={() => adjustWeight(5)}
                className="w-14 h-14 border border-border rounded-lg text-xl font-medium hover:bg-neutral-50 transition-colors"
              >
                +
              </button>
            </div>
          </div>
        )}

        {!isCore && (
          <div className="space-y-3">
            <label className="text-sm text-muted block">Reps</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => adjustReps(-1)}
                className="w-14 h-14 border border-border rounded-lg text-xl font-medium hover:bg-neutral-50 transition-colors"
              >
                -
              </button>
              <input
                type="number"
                inputMode="numeric"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder={`${minReps}-${maxReps}`}
                className="flex-1 h-14 text-center text-2xl font-semibold border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                min="1"
              />
              <button
                type="button"
                onClick={() => adjustReps(1)}
                className="w-14 h-14 border border-border rounded-lg text-xl font-medium hover:bg-neutral-50 transition-colors"
              >
                +
              </button>
            </div>
            <p className="text-xs text-muted text-center">
              Target: {minReps}-{maxReps} reps
            </p>
          </div>
        )}

        {isCore && (
          <div className="p-6 border border-border rounded-lg bg-white text-center">
            <p className="text-muted">Complete your core set</p>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending || (!isCore && (!weight || !reps))}
        className="w-full py-4 bg-accent text-white font-medium rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Saving..." : "Log Set"}
      </button>
    </form>
  );
}
