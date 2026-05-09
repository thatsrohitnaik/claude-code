import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { db } from "@lifepilot/db";

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

  // Generate weekly report (calls AI - implemented in Phase 4)
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

      const [tasksCompleted, allGoals] = await Promise.all([
        db.task.count({
          where: {
            userId: ctx.user.id,
            completed: true,
            completedAt: { gte: weekStart, lt: weekEnd },
          },
        }),
        db.goal.findMany({
          where: { userId: ctx.user.id },
          select: { id: true, title: true, progressPct: true, status: true },
        }),
      ]);

      // For now, create a basic report - AI generation comes in Phase 4
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
          streakDays: 0, // Would calculate properly
          weekScore: Math.min(100, tasksCompleted * 10), // Simplified
          focusHours: 0,
          goalProgress: allGoals.map((g) => ({
            goalId: g.id,
            title: g.title,
            progressPct: g.progressPct,
            progressDelta: 0,
            status: g.status.toLowerCase().replace("_", "_"),
          })),
          insights: [
            { type: "observation", text: "Keep up the momentum!" },
          ],
          recommendations: [],
        },
        update: {
          tasksCompleted,
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