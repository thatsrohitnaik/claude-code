import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { db } from "@lifepilot/db";
import { callLLM } from "@lifepilot/ai";

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

  // Generate new plan (calls AI)
  generate: protectedProcedure
    .input(
      z.object({
        weekNumber: z.number().min(1).max(53),
        year: z.number().min(2020),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get user's active goals for context
      const goals = await db.goal.findMany({
        where: {
          userId: ctx.user.id,
          status: { in: ["ACTIVE", "ON_TRACK", "AT_RISK"] },
        },
        take: 5,
      });

      if (goals.length === 0) {
        // No goals yet, create a placeholder plan
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
            planSummary: "Create some goals first, then I can help you plan your week!",
          },
          update: {
            version: { increment: 1 },
            weeklyActions: [],
            resourceLinks: [],
            planSummary: "Create some goals first, then I can help you plan your week!",
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
      }

      // Call LLM to generate the plan
      const goalsContext = goals
        .map((g) => `- ${g.title} (${g.type}, ${g.progressPct}% complete)`)
        .join("\n");

      const prompt = `Generate a weekly action plan for this user.

Their active goals:
${goalsContext}

Generate a JSON response with exactly this structure (no other text):
{
  "weekly_actions": [
    {
      "day": "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun",
      "task": "specific task description",
      "goalId": "the goal id it relates to",
      "estimatedMinutes": number,
      "scheduledFor": "morning" | "afternoon" | "evening"
    }
  ],
  "resource_links": [
    {
      "title": "resource name",
      "url": "https://...",
      "type": "video" | "course" | "book" | "article",
      "estimatedHours": number,
      "goalId": "the goal id",
      "reason": "why this is recommended"
    }
  ],
  "plan_summary": "2-3 sentence narrative about the week's focus"
}

Create 5-10 actions spread across the week and 2-3 resources relevant to their goals.`;

      try {
        const response = await callLLM(
          ctx.user.id,
          prompt,
          "plan_generate",
          []
        );

        // Parse the JSON from the response
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);

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
              weeklyActions: parsed.weekly_actions || [],
              resourceLinks: parsed.resource_links || [],
              planSummary: parsed.plan_summary || "Your personalized weekly plan.",
            },
            update: {
              version: { increment: 1 },
              weeklyActions: parsed.weekly_actions || [],
              resourceLinks: parsed.resource_links || [],
              planSummary: parsed.plan_summary || "Your personalized weekly plan.",
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
        }
      } catch (error) {
        console.error("Plan generation error:", error);
      }

      // Fallback if LLM fails
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
          planSummary: "Couldn't generate plan. Please try again.",
        },
        update: {
          version: { increment: 1 },
          weeklyActions: [],
          resourceLinks: [],
          planSummary: "Couldn't generate plan. Please try again.",
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