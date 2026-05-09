import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { db } from "@lifepilot/db";
import { callLLM } from "@lifepilot/ai";

export const reportsRouter = router({
  // Get weekly report
  get: protectedProcedure
    .input(
      z.object({
        weekNumber: z.number().min(1).max(53),
        year: z.number().min(2020),
      })
    )
    .query(async ({ ctx, input }) => {
      const report = await db.weeklyReport.findUnique({
        where: {
          userId_weekNumber_year: {
            userId: ctx.user.id,
            weekNumber: input.weekNumber,
            year: input.year,
          },
        },
      });

      if (!report) {
        return null;
      }

      return {
        id: report.id,
        weekNumber: report.weekNumber,
        year: report.year,
        tasksCompleted: report.tasksCompleted,
        streakDays: report.streakDays,
        weekScore: report.weekScore,
        focusHours: report.focusHours,
        goalProgress: report.goalProgress as any[],
        insights: report.insights as any[],
        recommendations: report.recommendations as any[],
        generatedAt: report.generatedAt.toISOString(),
      };
    }),

  // Get current week's report
  current: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const year = now.getFullYear();

    const report = await db.weeklyReport.findUnique({
      where: {
        userId_weekNumber_year: {
          userId: ctx.user.id,
          weekNumber,
          year,
        },
      },
    });

    if (!report) {
      return null;
    }

    return {
      id: report.id,
      weekNumber: report.weekNumber,
      year: report.year,
      tasksCompleted: report.tasksCompleted,
      streakDays: report.streakDays,
      weekScore: report.weekScore,
      focusHours: report.focusHours,
      goalProgress: report.goalProgress as any[],
      insights: report.insights as any[],
      recommendations: report.recommendations as any[],
      generatedAt: report.generatedAt.toISOString(),
    };
  }),

  // Generate weekly report with AI
  generate: protectedProcedure
    .input(
      z.object({
        weekNumber: z.number().min(1).max(53),
        year: z.number().min(2020),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { weekNumber, year } = input;

      // Calculate metrics for the week
      const weekStart = getWeekStart(weekNumber, year);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      // Get last week's report for delta calculation
      const lastWeek = weekNumber === 1 ? { weekNumber: 52, year: year - 1 } : { weekNumber: weekNumber - 1, year };
      const lastWeekReport = await db.weeklyReport.findUnique({
        where: {
          userId_weekNumber_year: {
            userId: ctx.user.id,
            weekNumber: lastWeek.weekNumber,
            year: lastWeek.year,
          },
        },
      });

      const [tasksCompleted, allGoals, recentTasks] = await Promise.all([
        db.task.count({
          where: {
            userId: ctx.user.id,
            completed: true,
            completedAt: { gte: weekStart, lt: weekEnd },
          },
        }),
        db.goal.findMany({
          where: { userId: ctx.user.id },
        }),
        db.task.findMany({
          where: {
            userId: ctx.user.id,
            completed: true,
            completedAt: { gte: weekStart, lt: weekEnd },
          },
          select: { title: true, completedAt: true },
          orderBy: { completedAt: "asc" },
        }),
      ]);

      // Calculate streak
      const streakDays = await calculateStreak(ctx.user.id);

      // Build goal progress with deltas
      const goalProgress = allGoals.map(g => {
        const lastProgress = lastWeekReport?.goalProgress as any[] | undefined;
        const lastGoal = lastProgress?.find((lg: any) => lg.goalId === g.id);
        const progressDelta = lastGoal ? g.progressPct - lastGoal.progressPct : 0;

        return {
          goalId: g.id,
          title: g.title,
          progressPct: g.progressPct,
          progressDelta,
          status: g.status.toLowerCase().replace("_", "_") as "on_track" | "at_risk" | "stalled",
        };
      });

      // Calculate week score
      const totalTasks = await db.task.count({
        where: {
          userId: ctx.user.id,
          dueDate: { gte: weekStart, lt: weekEnd },
        },
      });
      const weekScore = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;

      // Try to generate AI insights
      let insights: any[] = [];
      let recommendations: any[] = [];

      try {
        const goalsContext = goalProgress
          .map(g => `- ${g.title}: ${g.progressPct}% (${g.status})`)
          .join("\n");

        const prompt = `Generate insights and recommendations for this week's progress report.

Week stats:
- Tasks completed: ${tasksCompleted} / ${totalTasks || 0}
- Streak: ${streakDays} days
- Week score: ${weekScore}%

Goals:
${goalsContext}

Generate a JSON response with exactly this structure (no other text):
{
  "insights": [
    {
      "type": "win" | "risk" | "observation" | "pattern",
      "text": "insight description",
      "goalId": "optional goal id"
    }
  ],
  "recommendations": [
    {
      "title": "recommendation title",
      "description": "what to do",
      "resourceType": "video" | "course" | "book" | "habit" | "action",
      "goalId": "the goal id",
      "estimatedTime": "e.g. 30 mins"
    }
  ]
}

Provide 2-4 insights and 1-3 recommendations.`;

        const response = await callLLM(
          ctx.user.id,
          prompt,
          "report_generate",
          []
        );

        const jsonMatch = response.content.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          insights = parsed.insights || [];
          recommendations = parsed.recommendations || [];
        }
      } catch (error) {
        console.error("Report generation error:", error);
      }

      // Fallback insights if AI fails
      if (insights.length === 0) {
        if (weekScore >= 70) {
          insights.push({ type: "win", text: `Great week! You completed ${tasksCompleted} tasks.` });
        }
        if (streakDays >= 7) {
          insights.push({ type: "observation", text: `${streakDays}-day streak! Consistency is key.` });
        }
        const atRisk = goalProgress.filter(g => g.status === "at_risk");
        if (atRisk.length > 0) {
          insights.push({ type: "risk", text: `${atRisk.length} goal(s) need attention.` });
        }
      }

      // Create the report
      const report = await db.weeklyReport.upsert({
        where: {
          userId_weekNumber_year: {
            userId: ctx.user.id,
            weekNumber,
            year,
          },
        },
        create: {
          userId: ctx.user.id,
          weekNumber,
          year,
          tasksCompleted,
          streakDays,
          weekScore,
          focusHours: 0,
          goalProgress,
          insights,
          recommendations,
        },
        update: {
          tasksCompleted,
          streakDays,
          weekScore,
          goalProgress,
          insights,
          recommendations,
          generatedAt: new Date(),
        },
      });

      return {
        id: report.id,
        weekNumber: report.weekNumber,
        year: report.year,
        tasksCompleted: report.tasksCompleted,
        streakDays: report.streakDays,
        weekScore: report.weekScore,
        focusHours: report.focusHours,
        goalProgress: report.goalProgress as any[],
        insights: report.insights as any[],
        recommendations: report.recommendations as any[],
        generatedAt: report.generatedAt.toISOString(),
      };
    }),
});

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getWeekStart(weekNumber: number, year: number): Date {
  const jan1 = new Date(year, 0, 1);
  const dayOfWeek = jan1.getDay();
  const daysToFirstMonday = dayOfWeek <= 4 ? 1 - dayOfWeek : 8 - dayOfWeek;

  const firstMonday = new Date(jan1);
  firstMonday.setDate(jan1.getDate() + daysToFirstMonday);

  const weekStart = new Date(firstMonday);
  weekStart.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);

  return weekStart;
}

async function calculateStreak(userId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let checkDate = new Date(today);

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