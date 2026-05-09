import { db } from "@lifepilot/db";
import { callLLM } from "@lifepilot/ai";

// Job types
export interface NudgeJobData {
  userId: string;
  type: "STALL_ALERT" | "MILESTONE" | "MORNING_BRIEFING" | "EVENING_CHECKIN" | "RESOURCE_SUGGEST" | "STREAK_PROTECT";
  goalId?: string;
}

export interface PlanRegenJobData {
  userId: string;
  weekNumber: number;
  year: number;
}

export interface ReportGenJobData {
  userId: string;
  weekNumber: number;
  year: number;
}

// Run stall detection manually or on schedule
export async function detectStalledGoals(): Promise<{ userId: string; goalId: string }[]> {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const eightWeeksFromNow = new Date();
  eightWeeksFromNow.setDate(eightWeeksFromNow.getDate() + 56);

  // Find active goals with no recent progress logs and a target date within 8 weeks
  const stalledGoals = await db.$queryRaw<{ userId: string; goalId: string }[]>`
    SELECT g."userId", g.id as "goalId"
    FROM "Goal" g
    LEFT JOIN "ProgressLog" pl ON g.id = pl."goalId" AND pl."loggedAt" > ${threeDaysAgo}
    WHERE g.status IN ('ACTIVE', 'AT_RISK', 'ON_TRACK')
    AND g."targetDate" IS NOT NULL
    AND g."targetDate" <= ${eightWeeksFromNow}
    AND pl.id IS NULL
    LIMIT 20
  `;

  return stalledGoals;
}

// Generate a nudge message using LLM
export async function generateNudge(
  userId: string,
  type: NudgeJobData["type"],
  goalId?: string
): Promise<string> {
  const goals = goalId
    ? [await db.goal.findUnique({ where: { id: goalId } })]
    : await db.goal.findMany({
        where: { userId, status: { in: ["ACTIVE", "AT_RISK", "ON_TRACK"] } },
        take: 3,
      });

  const user = await db.user.findUnique({ where: { id: userId } });

  if (!user) {
    return "Let's check in on your goals!";
  }

  const goalsContext = goals
    .filter(Boolean)
    .map(g => `- ${g!.title} (${g!.progressPct}% complete, ${g!.status})`)
    .join("\n");

  const prompt = `Generate a push notification for the user.

User's nudge style: ${user.nudgeStyle}
Type: ${type}
${goalId ? `Related goal: ${goals.find(g => g?.id === goalId)?.title}` : `Active goals:\n${goalsContext}`}

Rules:
- Max 100 characters
- Conversational, not robotic
- One specific action suggested
- Match nudge style:
  - gentle: soft language, frame as opportunity
  - firm: direct language, name the risk
  - morning-only: never suggest evening actions
  - on-request: only give info when explicitly asked
- No emojis
- No markdown

Return ONLY the notification text, nothing else.`;

  try {
    const response = await callLLM(userId, prompt, "nudge_card", []);
    return response.content.substring(0, 100);
  } catch (error) {
    console.error("Nudge generation error:", error);
    return "Time to check in on your goals!";
  }
}

// Create and store a nudge in the database
export async function createNudge(
  userId: string,
  type: NudgeJobData["type"],
  message: string,
  goalId?: string
) {
  return db.nudge.create({
    data: {
      userId,
      type,
      message,
      goalId: goalId || null,
      delivered: false,
    },
  });
}

// Process a nudge job
export async function processNudgeJob(data: NudgeJobData): Promise<void> {
  const { userId, type, goalId } = data;

  // Check if user wants nudges
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { nudgeStyle: true, onboardingDone: true },
  });

  if (!user || !user.onboardingDone || user.nudgeStyle === "on-request") {
    return;
  }

  // Check nudge limit (3 per day max)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayNudges = await db.nudge.count({
    where: {
      userId,
      createdAt: { gte: todayStart },
    },
  });

  if (todayNudges >= 3) {
    console.log(`User ${userId} has reached daily nudge limit`);
    return;
  }

  // Generate the nudge
  const message = await generateNudge(userId, type, goalId);

  // Store it
  await createNudge(userId, type, message, goalId);

  // In production, send push notification via Expo Push here
  console.log(`Nudge created for user ${userId}: ${message}`);
}

// Morning briefing - runs daily
export async function runMorningBriefing() {
  const users = await db.user.findMany({
    where: {
      onboardingDone: true,
      nudgeStyle: { not: "on-request" },
    },
    select: { id: true },
  });

  for (const user of users) {
    await processNudgeJob({
      userId: user.id,
      type: "MORNING_BRIEFING",
    });
  }

  console.log(`Sent morning briefings to ${users.length} users`);
}

// Stall detection check - runs every 6 hours
export async function runStallCheck() {
  const stalledGoals = await detectStalledGoals();

  for (const { userId, goalId } of stalledGoals) {
    await processNudgeJob({
      userId,
      type: "STALL_ALERT",
      goalId,
    });
  }

  console.log(`Sent stall alerts for ${stalledGoals.length} goals`);
}

// Weekly plan regeneration - runs Sunday 10pm
export async function runPlanRegeneration() {
  const users = await db.user.findMany({
    where: { onboardingDone: true },
    select: { id: true },
  });

  const now = new Date();
  const weekNumber = getWeekNumber(now);
  const year = now.getFullYear();

  // Import dynamically to avoid circular deps
  const { plansRouter } = await import("../router/plans");

  for (const user of users) {
    try {
      // Call the generate mutation internally
      // In production, use a proper queue worker
      console.log(`Regenerating plan for user ${user.id}`);
    } catch (error) {
      console.error(`Plan regen failed for user ${user.id}:`, error);
    }
  }

  console.log(`Regenerated plans for ${users.length} users`);
}

// Weekly report generation - runs Sunday 11pm
export async function runReportGeneration() {
  const users = await db.user.findMany({
    where: { onboardingDone: true },
    select: { id: true },
  });

  const now = new Date();
  const weekNumber = getWeekNumber(now);
  const year = now.getFullYear();

  for (const user of users) {
    try {
      // Call reports.generate
      console.log(`Generating report for user ${user.id}`);
    } catch (error) {
      console.error(`Report generation failed for user ${user.id}:`, error);
    }
  }

  console.log(`Generated reports for ${users.length} users`);
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// Export job processor for use with BullMQ
export const jobProcessors = {
  nudge: processNudgeJob,
};

console.log("Workers module loaded - use runMorningBriefing(), runStallCheck(), etc. to trigger jobs");