import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { db } from "@lifepilot/db";
import type { GoalType, Horizon, GoalStatus } from "@lifepilot/types";

export const goalsRouter = router({
  // List all goals for the user
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["ACTIVE", "ON_TRACK", "AT_RISK", "STALLED", "COMPLETED", "PAUSED"]).optional(),
        type: z.enum(["CAREER", "HEALTH", "LEARNING", "CREATIVITY", "FINANCE", "RELATIONSHIPS", "SIDE_PROJECT", "MENTAL_WELLNESS", "OTHER"]).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const goals = await db.goal.findMany({
        where: {
          userId: ctx.user.id,
          ...(input?.status && { status: input.status }),
          ...(input?.type && { type: input.type }),
        },
        orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
        include: {
          tasks: {
            where: { completed: false },
            take: 5,
          },
          _count: {
            select: { tasks: true },
          },
        },
      });

      return goals;
    }),

  // Get a single goal by ID
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const goal = await db.goal.findFirst({
        where: { id: input.id, userId: ctx.user.id },
        include: {
          tasks: {
            orderBy: { createdAt: "desc" },
          },
          progressLogs: {
            orderBy: { loggedAt: "desc" },
            take: 30,
          },
        },
      });

      if (!goal) {
        throw new Error("Goal not found");
      }

      return goal;
    }),

  // Create a new goal
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(1000).optional(),
        type: z.enum(["CAREER", "HEALTH", "LEARNING", "CREATIVITY", "FINANCE", "RELATIONSHIPS", "SIDE_PROJECT", "MENTAL_WELLNESS", "OTHER"]),
        horizon: z.enum(["DAILY", "MONTHLY", "YEARLY", "LIFETIME"]),
        targetDate: z.string().datetime().optional(),
        priority: z.number().min(0).max(100).default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check plan limits for free users
      const user = await db.user.findUnique({
        where: { id: ctx.user.id },
        select: { plan: true },
      });

      if (user?.plan === "FREE") {
        const goalCount = await db.goal.count({
          where: { userId: ctx.user.id, status: { not: "COMPLETED" } },
        });

        if (goalCount >= 3) {
          throw new Error("Free plan limited to 3 active goals. Upgrade to Pro for unlimited goals.");
        }
      }

      const goal = await db.goal.create({
        data: {
          userId: ctx.user.id,
          title: input.title,
          description: input.description,
          type: input.type,
          horizon: input.horizon,
          targetDate: input.targetDate ? new Date(input.targetDate) : null,
          priority: input.priority,
        },
      });

      return goal;
    }),

  // Update goal progress
  updateProgress: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        progressPct: z.number().min(0).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Calculate status based on progress
      let status: GoalStatus = "ACTIVE";
      if (input.progressPct >= 80) {
        status = "ON_TRACK";
      } else if (input.progressPct >= 50) {
        status = "AT_RISK";
      } else if (input.progressPct >= 100) {
        status = "COMPLETED";
      }

      const goal = await db.goal.update({
        where: { id: input.id, userId: ctx.user.id },
        data: {
          progressPct: input.progressPct,
          status,
        },
      });

      return goal;
    }),

  // Update goal details
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().max(1000).optional(),
        targetDate: z.string().datetime().optional().nullable(),
        priority: z.number().min(0).max(100).optional(),
        status: z.enum(["ACTIVE", "ON_TRACK", "AT_RISK", "STALLED", "COMPLETED", "PAUSED"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const goal = await db.goal.update({
        where: { id, userId: ctx.user.id },
        data: {
          ...data,
          targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
        },
      });

      return goal;
    }),

  // Delete a goal
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db.goal.delete({
        where: { id: input.id, userId: ctx.user.id },
      });

      return { success: true };
    }),
});