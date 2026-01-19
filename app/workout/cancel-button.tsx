"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelWorkout } from "@/lib/actions";

export function CancelButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleCancel() {
    if (!confirm("Cancel this workout? Progress will be lost.")) return;

    startTransition(async () => {
      await cancelWorkout();
      router.push("/");
    });
  }

  return (
    <button
      onClick={handleCancel}
      disabled={isPending}
      className="text-sm text-muted hover:text-foreground transition-colors disabled:opacity-50"
    >
      {isPending ? "Canceling..." : "Cancel workout"}
    </button>
  );
}
