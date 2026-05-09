import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { db } from "@lifepilot/db";

export const tasksRouter = router({
  // List tasks for the user
  list: protectedProcedure
    .input(
      z.object({
        goalId: z.string().optional(),
        completed: z.boolean().optional(),
        dueToday: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      const tasks = await db.task.findMany({
        where: {
          userId: ctx.user.id,
          ...(input?.goalId && { goalId: input.goalId }),
          ...(input?.completed !== undefined && { completed: input.completed }),
          ...(input?.dueToday && {
            dueDate: {
              gte: todayStart,
              lte: todayEnd,
            },
          }),
        },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        include: {
          goal: {
            select: { id: true, title: true },
          },
        },
      });

      return tasks;
    }),

  // Create a new task
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        goalId: z.string().optional(),
        recurrence: z.enum(["daily", "weekly", "weekdays"]).optional(),
        dueDate: z.string().datetime().optional(),
        scheduledFor: z.enum(["morning", "afternoon", "evening"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const task = await db.task.create({
        data: {
          userId: ctx.user.id,
          title: input.title,
          goalId: input.goalId,
          recurrence: input.recurrence || null,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          scheduledFor: input.scheduledFor || null,
        },
      });

      return task;
    }),

  // Complete a task
  complete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const task = await db.task.update({
        where: { id: input.id, userId: ctx.user.id },
        data: {
          completed: true,
          completedAt: new Date(),
        },
      });

      // Check if task was recurring and create next occurrence
      if (task.recurrence && task.goalId) {
        const nextDueDate = calculateNextDueDate(task.dueDate, task.recurrence);

        await db.task.create({
          data: {
            userId: ctx.user.id,
            goalId: task.goalId,
            title: task.title,
            recurrence: task.recurrence,
            dueDate: nextDueDate,
            scheduledFor: task.scheduledFor,
          },
        });
      }

      // Calculate streak
      const streakDays = await calculateStreak(ctx.user.id);

      return {
        task,
        streakDays,
        nudgeFired: false, // Would be triggered by BullMQ worker
      };
    }),

  // Uncomplete a task (mark as incomplete)
  uncomplete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const task = await db.task.update({
        where: { id: input.id, userId: ctx.user.id },
        data: {
          completed: false,
          completedAt: null,
        },
      });

      return task;
    }),

  // Skip a recurring task for today
  skip: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const task = await db.task.update({
        where: { id: input.id, userId: ctx.user.id },
        data: {
          skipped: true,
        },
      });

      return task;
    }),

  // Update task details
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        dueDate: z.string().datetime().optional().nullable(),
        scheduledFor: z.enum(["morning", "afternoon", "evening"]).optional(),
        goalId: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const task = await db.task.update({
        where: { id, userId: ctx.user.id },
        data: {
          ...data,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        },
      });

      return task;
    }),

  // Delete a task
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db.task.delete({
        where: { id: input.id, userId: ctx.user.id },
      });

      return { success: true };
    }),
});

function calculateNextDueDate(currentDueDate: Date | null, recurrence: string): Date {
  const now = new Date();
  const base = currentDueDate || now;

  switch (recurrence) {
    case "daily":
      base.setDate(base.getDate() + 1);
      break;
    case "weekly":
      base.setDate(base.getDate() + 7);
      break;
    case "weekdays":
      do {
        base.setDate(base.getDate() + 1);
      } while (base.getDay() === 0 || base.getDay() === 6);
      break;
  }

  return base;
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