"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./db";
import {
  WORKOUT_SEQUENCE,
  getWorkoutById,
  getExerciseById,
  getDefaultWeight,
} from "./workouts";

export async function getAppState() {
  let state = await prisma.appState.findUnique({
    where: { id: "singleton" },
  });

  if (!state) {
    state = await prisma.appState.create({
      data: { id: "singleton", nextWorkoutIndex: 0 },
    });
  }

  return state;
}

export async function getNextWorkout() {
  const state = await getAppState();
  const workoutId = WORKOUT_SEQUENCE[state.nextWorkoutIndex % WORKOUT_SEQUENCE.length];
  return getWorkoutById(workoutId)!;
}

export async function getActiveSession() {
  const state = await getAppState();
  if (!state.activeSessionId) return null;

  const session = await prisma.workoutSession.findUnique({
    where: { id: state.activeSessionId },
    include: { sets: true },
  });

  return session;
}

export async function startWorkout() {
  const state = await getAppState();
  const workoutId = WORKOUT_SEQUENCE[state.nextWorkoutIndex % WORKOUT_SEQUENCE.length];

  const session = await prisma.workoutSession.create({
    data: { workoutId },
  });

  await prisma.appState.update({
    where: { id: "singleton" },
    data: { activeSessionId: session.id },
  });

  revalidatePath("/");
  return session;
}

export async function getCurrentExerciseAndSet(sessionId: string) {
  const session = await prisma.workoutSession.findUnique({
    where: { id: sessionId },
    include: { sets: { orderBy: { loggedAt: "asc" } } },
  });

  if (!session) return null;

  const workout = getWorkoutById(session.workoutId);
  if (!workout) return null;

  for (const exercise of workout.exercises) {
    const setsForExercise = session.sets.filter((s) => s.exerciseId === exercise.id);
    if (setsForExercise.length < exercise.sets) {
      return {
        exercise,
        setNumber: setsForExercise.length + 1,
        workout,
        completedSets: session.sets.length,
        totalSets: workout.exercises.reduce((sum, ex) => sum + ex.sets, 0),
      };
    }
  }

  return null;
}

export async function getLastWeightForExercise(exerciseId: string): Promise<number> {
  const progression = await prisma.exerciseProgression.findUnique({
    where: { exerciseId },
  });

  if (progression) {
    return progression.currentWeight;
  }

  const lastSet = await prisma.setLog.findFirst({
    where: { exerciseId },
    orderBy: { loggedAt: "desc" },
  });

  return lastSet?.weight ?? getDefaultWeight(exerciseId);
}

export async function logSet(
  sessionId: string,
  exerciseId: string,
  setNumber: number,
  weight: number,
  reps: number,
  duration?: number
) {
  const set = await prisma.setLog.create({
    data: {
      workoutSessionId: sessionId,
      exerciseId,
      setNumber,
      weight,
      reps,
      ...(duration != null && { duration }),
    },
  });

  await prisma.exerciseProgression.upsert({
    where: { exerciseId },
    update: { currentWeight: weight, lastUpdated: new Date() },
    create: { exerciseId, currentWeight: weight },
  });

  const session = await prisma.workoutSession.findUnique({
    where: { id: sessionId },
    include: { sets: true },
  });

  if (session) {
    const workout = getWorkoutById(session.workoutId);
    if (workout) {
      const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets, 0);
      if (session.sets.length >= totalSets) {
        await completeWorkout(sessionId);
      }
    }
  }

  revalidatePath("/");
  revalidatePath("/workout");
  return set;
}

async function completeWorkout(sessionId: string) {
  const session = await prisma.workoutSession.findUnique({
    where: { id: sessionId },
    include: { sets: true },
  });

  if (!session) return;

  await prisma.workoutSession.update({
    where: { id: sessionId },
    data: { completedAt: new Date() },
  });

  const state = await getAppState();
  const newIndex = (state.nextWorkoutIndex + 1) % WORKOUT_SEQUENCE.length;

  await prisma.appState.update({
    where: { id: "singleton" },
    data: {
      nextWorkoutIndex: newIndex,
      activeSessionId: null,
    },
  });

  await applyProgressionLogic(session.workoutId, session.sets);
}

async function applyProgressionLogic(
  workoutId: string,
  sets: { exerciseId: string; weight: number; reps: number }[]
) {
  const workout = getWorkoutById(workoutId);
  if (!workout) return;

  for (const exercise of workout.exercises) {
    const exerciseSets = sets.filter((s) => s.exerciseId === exercise.id);
    if (exerciseSets.length === 0) continue;

    const allHitTopReps = exerciseSets.every((s) => s.reps >= exercise.maxReps);
    const currentWeight = exerciseSets[0].weight;

    if (allHitTopReps) {
      const increment = exercise.type === "compound" ? 5 : 2.5;
      const newWeight = currentWeight + increment;

      await prisma.exerciseProgression.upsert({
        where: { exerciseId: exercise.id },
        update: { currentWeight: newWeight, lastUpdated: new Date() },
        create: { exerciseId: exercise.id, currentWeight: newWeight },
      });
    }
  }
}

export async function cancelWorkout() {
  const state = await getAppState();
  if (state.activeSessionId) {
    await prisma.workoutSession.delete({
      where: { id: state.activeSessionId },
    });

    await prisma.appState.update({
      where: { id: "singleton" },
      data: { activeSessionId: null },
    });
  }

  revalidatePath("/");
}

export async function getCompletedWorkoutsCount(): Promise<number> {
  return prisma.workoutSession.count({
    where: { completedAt: { not: null } },
  });
}

export async function getTotalSetsLogged(): Promise<number> {
  return prisma.setLog.count();
}

export async function getRecentProgress() {
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const recentSessions = await prisma.workoutSession.findMany({
    where: {
      completedAt: { not: null },
      startedAt: { gte: twoWeeksAgo },
    },
    include: { sets: true },
    orderBy: { startedAt: "desc" },
    take: 8,
  });

  return recentSessions;
}

export async function getWrappedData() {
  const [totalWorkouts, totalSets, allSets, firstSession, lastSession, allBodyWeights] = await Promise.all([
    prisma.workoutSession.count({ where: { completedAt: { not: null } } }),
    prisma.setLog.count(),
    prisma.setLog.findMany({
      orderBy: { loggedAt: "asc" },
    }),
    prisma.workoutSession.findFirst({
      where: { completedAt: { not: null } },
      orderBy: { startedAt: "asc" },
    }),
    prisma.workoutSession.findFirst({
      where: { completedAt: { not: null } },
      orderBy: { startedAt: "desc" },
    }),
    prisma.bodyWeight.findMany({
      orderBy: { date: "asc" },
    }),
  ]);

  const exerciseStats: Record<
    string,
    { firstWeight: number; latestWeight: number; maxWeight: number; totalSets: number }
  > = {};

  for (const set of allSets) {
    if (!exerciseStats[set.exerciseId]) {
      exerciseStats[set.exerciseId] = {
        firstWeight: set.weight,
        latestWeight: set.weight,
        maxWeight: set.weight,
        totalSets: 0,
      };
    }
    exerciseStats[set.exerciseId].latestWeight = set.weight;
    exerciseStats[set.exerciseId].maxWeight = Math.max(
      exerciseStats[set.exerciseId].maxWeight,
      set.weight
    );
    exerciseStats[set.exerciseId].totalSets++;
  }

  const bodyWeightStats = allBodyWeights.length > 0
    ? {
        firstWeight: allBodyWeights[0].weight,
        latestWeight: allBodyWeights[allBodyWeights.length - 1].weight,
        lowestWeight: Math.min(...allBodyWeights.map((w) => w.weight)),
        highestWeight: Math.max(...allBodyWeights.map((w) => w.weight)),
        totalEntries: allBodyWeights.length,
        change: allBodyWeights[allBodyWeights.length - 1].weight - allBodyWeights[0].weight,
      }
    : null;

  return {
    totalWorkouts,
    totalSets,
    exerciseStats,
    firstWorkoutDate: firstSession?.startedAt,
    lastWorkoutDate: lastSession?.completedAt,
    bodyWeightStats,
  };
}

// Body weight tracking
export async function logBodyWeight(weight: number) {
  const entry = await prisma.bodyWeight.create({
    data: { weight },
  });

  revalidatePath("/");
  revalidatePath("/weight");
  revalidatePath("/wrapped");
  return entry;
}

export async function getTodayWeight() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return prisma.bodyWeight.findFirst({
    where: {
      date: {
        gte: today,
        lt: tomorrow,
      },
    },
    orderBy: { date: "desc" },
  });
}

export async function getRecentBodyWeights(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return prisma.bodyWeight.findMany({
    where: {
      date: { gte: startDate },
    },
    orderBy: { date: "desc" },
  });
}

export async function getLatestBodyWeight() {
  return prisma.bodyWeight.findFirst({
    orderBy: { date: "desc" },
  });
}
