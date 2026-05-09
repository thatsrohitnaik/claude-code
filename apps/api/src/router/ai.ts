import { router, protectedProcedure, publicProcedure } from "../trpc";
import { z } from "zod";
import { db } from "@lifepilot/db";
import { callLLM, streamLLM, processAIResponse, type Intent } from "@lifepilot/ai";

export const aiRouter = router({
  // Chat with Pilot
  chat: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1).max(2000),
        conversationHistory: z.array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
          })
        ).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const response = await callLLM(
        ctx.user.id,
        input.message,
        "chat",
        input.conversationHistory
      );

      const processed = await processAIResponse(response.content, ctx.user.id);

      return {
        content: processed.cleanResponse,
        memory: processed.memory,
      };
    }),

  // Stream chat with Pilot
  streamChat: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1).max(2000),
        conversationHistory: z.array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
          })
        ).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // For SSE streaming, we'd use a different approach in production
      // Here we'll return a non-streaming response for simplicity
      const response = await callLLM(
        ctx.user.id,
        input.message,
        "chat",
        input.conversationHistory
      );

      const processed = await processAIResponse(response.content, ctx.user.id);

      return {
        content: processed.cleanResponse,
        memory: processed.memory,
      };
    }),

  // Get morning nudge
  nudge: protectedProcedure.query(async ({ ctx }) => {
    const response = await callLLM(
      ctx.user.id,
      "Generate my morning nudge",
      "nudge_card"
    );

    const processed = await processAIResponse(response.content, ctx.user.id);

    return {
      content: processed.cleanResponse,
    };
  }),

  // Complete onboarding
  onboardingComplete: publicProcedure
    .input(
      z.object({
        clerkId: z.string(),
        lifeStage: z.string(),
        goals: z.array(
          z.object({
            title: z.string(),
            horizon: z.enum(["DAILY", "MONTHLY", "YEARLY", "LIFETIME"]),
            type: z.enum(["CAREER", "HEALTH", "LEARNING", "CREATIVITY", "FINANCE", "RELATIONSHIPS", "SIDE_PROJECT", "MENTAL_WELLNESS", "OTHER"]),
          })
        ),
        growthAreas: z.array(z.string()),
        nudgeStyle: z.enum(["gentle", "firm", "morning-only", "on-request"]),
        activeTime: z.string(),
        lifetimeDream: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Find user by clerkId
      const user = await db.user.findUnique({
        where: { clerkId: input.clerkId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Update user with onboarding data
      const updatedUser = await db.user.update({
        where: { id: user.id },
        data: {
          lifeStage: input.lifeStage,
          nudgeStyle: input.nudgeStyle,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          onboardingDone: true,
        },
      });

      // Create initial goals
      const createdGoals = await Promise.all(
        input.goals.map((goal, index) =>
          db.goal.create({
            data: {
              userId: user.id,
              title: goal.title,
              type: goal.type,
              horizon: goal.horizon,
              priority: index,
              status: "ACTIVE",
            },
          })
        )
      );

      // Create lifetime dream memory
      await db.memory.create({
        data: {
          userId: user.id,
          category: "context",
          content: input.lifetimeDream,
          embedding: null, // Would generate in production
        },
      });

      // Create first weekly plan
      const now = new Date();
      const weekNumber = getWeekNumber(now);
      const year = now.getFullYear();

      const initialPlan = await db.plan_.create({
        data: {
          userId: user.id,
          weekNumber,
          year,
          weeklyActions: [],
          resourceLinks: [],
          planSummary: "Your first week - let's start small and build from there!",
        },
      });

      return {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          plan: updatedUser.plan,
          lifeStage: updatedUser.lifeStage,
          onboardingDone: updatedUser.onboardingDone,
        },
        firstGoals: createdGoals,
        initialPlan: {
          id: initialPlan.id,
          weekNumber: initialPlan.weekNumber,
          year: initialPlan.year,
          planSummary: initialPlan.planSummary,
        },
      };
    }),

  // Check if user has completed onboarding
  onboardingStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        onboardingDone: true,
        lifeStage: true,
      },
    });

    return {
      completed: user?.onboardingDone || false,
      lifeStage: user?.lifeStage,
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