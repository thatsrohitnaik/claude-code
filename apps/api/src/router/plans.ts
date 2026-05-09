import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { db } from "@lifepilot/db";

export const plansRouter = router({
  // Get weekly plan
  get: protectedProcedure
    .input(
      z.object({
        weekNumber: z.number().min(1).max(53),
        year: z.number().min(2020),
      })
    )
    .query(async ({ ctx, input }) => {
      const plan = await db.plan_.findUnique({
        where: {
          userId_weekNumber_year: {
            userId: ctx.user.id,
            weekNumber: input.weekNumber,
            year: input.year,
          },
        },
      });

      if (!plan) {
        return null;
      }

      return {
        id: plan.id,
        weekNumber: plan.weekNumber,
        year: plan.year,
        weeklyActions: plan.weeklyActions as any[],
        resourceLinks: plan.resourceLinks as any[],
        planSummary: plan.planSummary,
        generatedAt: plan.generatedAt.toISOString(),
      };
    }),

  // Get current week's plan
  current: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const year = now.getFullYear();

    const plan = await db.plan_.findUnique({
      where: {
        userId_weekNumber_year: {
          userId: ctx.user.id,
          weekNumber,
          year,
        },
      },
    });

    if (!plan) {
      return null;
    }

    return {
      id: plan.id,
      weekNumber: plan.weekNumber,
      year: plan.year,
      weeklyActions: plan.weeklyActions as any[],
      resourceLinks: plan.resourceLinks as any[],
      planSummary: plan.planSummary,
      generatedAt: plan.generatedAt.toISOString(),
    };
  }),

  // Generate new plan (calls AI - implemented in Phase 3)
  generate: protectedProcedure
    .input(
      z.object({
        weekNumber: z.number().min(1).max(53),
        year: z.number().min(2020),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // This would call AI in Phase 3
      // For now, return empty plan structure
      const plan = await db.plan_.upsert({
        where: {
          userId_weekNumber_year: {
            userId: ctx.user.id,
            weekNumber: input.weekNumber,
            year: input.year,
          },
        },
        create: {
          userId: ctx.user.id,
          weekNumber: input.weekNumber,
          year: input.year,
          weeklyActions: [],
          resourceLinks: [],
          planSummary: "Plan generation coming soon!",
        },
        update: {
          version: { increment: 1 },
          weeklyActions: [],
          resourceLinks: [],
          planSummary: "Plan regeneration coming soon!",
          generatedAt: new Date(),
        },
      });

      return {
        id: plan.id,
        weekNumber: plan.weekNumber,
        year: plan.year,
        weeklyActions: plan.weeklyActions as any[],
        resourceLinks: plan.resourceLinks as any[],
        planSummary: plan.planSummary,
        generatedAt: plan.generatedAt.toISOString(),
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