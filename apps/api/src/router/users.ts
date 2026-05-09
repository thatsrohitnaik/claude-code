import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { db } from "@lifepilot/db";

export const usersRouter = router({
  // Get current user profile
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        plan: true,
        lifeStage: true,
        nudgeStyle: true,
        timezone: true,
        onboardingDone: true,
        createdAt: true,
      },
    });

    return user;
  }),

  // Update user profile
  update: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        avatarUrl: z.string().url().optional(),
        lifeStage: z.string().optional(),
        nudgeStyle: z.enum(["gentle", "firm", "morning-only", "on-request"]).optional(),
        timezone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.user.update({
        where: { id: ctx.user.id },
        data: input,
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        plan: user.plan,
        lifeStage: user.lifeStage,
        nudgeStyle: user.nudgeStyle,
        timezone: user.timezone,
        onboardingDone: user.onboardingDone,
      };
    }),

  // Get user stats
  stats: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const [totalGoals, activeGoals, tasksThisWeek, completedThisWeek] = await Promise.all([
      db.goal.count({ where: { userId: ctx.user.id } }),
      db.goal.count({
        where: { userId: ctx.user.id, status: { in: ["ACTIVE", "ON_TRACK", "AT_RISK"] } },
      }),
      db.task.count({
        where: { userId: ctx.user.id, createdAt: { gte: weekStart } },
      }),
      db.task.count({
        where: { userId: ctx.user.id, createdAt: { gte: weekStart }, completed: true },
      }),
    ]);

    return {
      totalGoals,
      activeGoals,
      tasksThisWeek,
      completedThisWeek,
      weekCompletionPct: tasksThisWeek > 0 ? Math.round((completedThisWeek / tasksThisWeek) * 100) : 0,
    };
  }),
});