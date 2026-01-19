"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { logBodyWeight } from "@/lib/actions";

interface WeightLoggerProps {
  suggestedWeight: number;
}

export function WeightLogger({ suggestedWeight }: WeightLoggerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [weight, setWeight] = useState(suggestedWeight.toString());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) return;

    startTransition(async () => {
      await logBodyWeight(weightNum);
      router.refresh();
    });
  }

  function adjustWeight(delta: number) {
    const current = parseFloat(weight) || 0;
    setWeight(Math.max(0, current + delta).toFixed(1));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => adjustWeight(-1)}
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
            step="0.1"
            min="0"
          />
          <button
            type="button"
            onClick={() => adjustWeight(1)}
            className="w-14 h-14 border border-border rounded-lg text-xl font-medium hover:bg-neutral-50 transition-colors"
          >
            +
          </button>
        </div>
        <p className="text-xs text-muted text-center">Weight in lbs</p>
      </div>

      <button
        type="submit"
        disabled={isPending || !weight}
        className="w-full py-4 bg-accent text-white font-medium rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Saving..." : "Log Weight"}
      </button>
    </form>
  );
}
