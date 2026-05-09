import { db } from "@lifepilot/db";
import { differenceInDays, subDays, format } from "date-fns";
import OpenAI from "openai";
import type { PromptVariables } from "./prompts/system";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GoalWithMeta {
  id: string;
  title: string;
  type: string;
  horizon: string;
  progressPct: number;
  targetDate: Date | null;
  status: string;
  daysRemaining: number | null;
  lastActivityDate: string | null;
}

interface TodayTask {
  id: string;
  title: string;
  completed: boolean;
  goalTitle: string | null;
}

interface RecentLog {
  date: string;
  note: string | null;
  mood: string | null;
  score: number;
}

interface RelevantMemory {
  category: string;
  content: string;
}

export interface BuildContextResult {
  user: {
    id: string;
    name: string;
    lifeStage: string | null;
    nudgeStyle: string;
    createdAt: string;
    plan: string;
    timezone: string;
  };
  goals: GoalWithMeta[];
  todayTasks: TodayTask[];
  weekCompletionPct: number;
  streakDays: number;
  recentLogs: RecentLog[];
  memories: RelevantMemory[];
}

export async function buildContext(userId: string, userMessage: string): Promise<BuildContextResult> {
  const now = new Date();

  const [user, goals, todayTasks, recentLogs] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        lifeStage: true,
        nudgeStyle: true,
        createdAt: true,
        plan: true,
        timezone: true,
      },
    }),
    db.goal.findMany({
      where: { userId, status: { in: ["ACTIVE", "AT_RISK", "ON_TRACK"] } },
      orderBy: [{ priority: "asc" }, { targetDate: "asc" }],
      take: 5,
    }),
    getTodayTasks(userId),
    db.progressLog.findMany({
      where: { userId, loggedAt: { gte: subDays(now, 7) } },
      orderBy: { loggedAt: "desc" },
      select: {
        note: true,
        mood: true,
        score: true,
        loggedAt: true,
      },
    }),
  ]);

  if (!user) {
    throw new Error("User not found");
  }

  // Calculate days remaining and last activity for each goal
  const goalsWithMeta: GoalWithMeta[] = goals.map((g) => ({
    ...g,
    daysRemaining: g.targetDate ? differenceInDays(g.targetDate, now) : null,
    lastActivityDate: null, // Would need a separate query to get this
  }));

  // Calculate week completion percentage
  const weekStart = subDays(now, now.getDay());
  const tasksThisWeek = await db.task.count({
    where: {
      userId,
      createdAt: { gte: weekStart },
    },
  });
  const completedThisWeek = await db.task.count({
    where: {
      userId,
      createdAt: { gte: weekStart },
      completed: true,
    },
  });
  const weekCompletionPct = tasksThisWeek > 0 ? Math.round((completedThisWeek / tasksThisWeek) * 100) : 0;

  // Calculate streak (simplified - counts consecutive days with completed tasks)
  const streakDays = await calculateStreak(userId);

  // Format recent logs
  const formattedLogs: RecentLog[] = recentLogs.map((log) => ({
    date: format(log.loggedAt, "MMM d"),
    note: log.note,
    mood: log.mood,
    score: log.score,
  }));

  // Get relevant memories via vector search
  const memories = await retrieveRelevantMemories(userId, userMessage);

  return {
    user: {
      id: user.id,
      name: user.name,
      lifeStage: user.lifeStage,
      nudgeStyle: user.nudgeStyle,
      createdAt: format(user.createdAt, "MMMM d, yyyy"),
      plan: user.plan,
      timezone: user.timezone,
    },
    goals: goalsWithMeta,
    todayTasks,
    weekCompletionPct,
    streakDays,
    recentLogs: formattedLogs,
    memories,
  };
}

async function getTodayTasks(userId: string): Promise<TodayTask[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tasks = await db.task.findMany({
    where: {
      userId,
      completed: false,
      dueDate: {
        gte: today,
        lt: tomorrow,
      },
    },
    include: {
      goal: {
        select: { title: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    completed: t.completed,
    goalTitle: t.goal?.title || null,
  }));
}

async function calculateStreak(userId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let checkDate = today;

  while (true) {
    const dayStart = new Date(checkDate);
    const dayEnd = new Date(checkDate);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const completedTask = await db.task.findFirst({
      where: {
        userId,
        completed: true,
        completedAt: {
          gte: dayStart,
          lt: dayEnd,
        },
      },
    });

    if (completedTask) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export async function retrieveRelevantMemories(
  userId: string,
  query: string
): Promise<RelevantMemory[]> {
  try {
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });

    const vector = embeddingResponse.data[0].embedding;

    // Use raw SQL for pgvector similarity search
    const memories = await db.$queryRaw<Array<{ category: string; content: string }>>`
      SELECT category, content
      FROM "Memory"
      WHERE "userId" = ${userId}
      ORDER BY embedding <=> ${vector}::vector
      LIMIT 5
    `;

    return memories.map((m) => ({
      category: m.category,
      content: m.content,
    }));
  } catch (error) {
    // If no memories exist yet, return empty array
    return [];
  }
}

export function promptVariablesFromContext(
  ctx: BuildContextResult,
  intent: "chat" | "plan_generate" | "report_generate" | "onboarding_response" | "nudge_card",
  userMessage: string
): PromptVariables {
  const now = new Date();

  return {
    user: {
      name: ctx.user.name,
      lifeStage: ctx.user.lifeStage,
      nudgeStyle: ctx.user.nudgeStyle,
      createdAt: ctx.user.createdAt,
      plan: ctx.user.plan,
      timezone: ctx.user.timezone,
    },
    goals: ctx.goals.map((g) => ({
      title: g.title,
      type: g.type,
      horizon: g.horizon,
      progressPct: g.progressPct,
      targetDate: g.targetDate ? format(g.targetDate, "MMMM d, yyyy") : null,
      status: g.status,
      daysRemaining: g.daysRemaining,
      lastActivityDate: g.lastActivityDate,
    })),
    todayTasks: ctx.todayTasks.map((t) => ({
      title: t.title,
      goalTitle: t.goalTitle,
      completed: t.completed,
    })),
    weekCompletionPct: ctx.weekCompletionPct,
    streakDays: ctx.streakDays,
    recentLogs: ctx.recentLogs,
    memories: ctx.memories,
    intent,
    currentDate: format(now, "MMMM d, yyyy"),
    dayOfWeek: format(now, "EEEE"),
    weekNumber: getWeekNumber(now),
    userMessage,
  };
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}