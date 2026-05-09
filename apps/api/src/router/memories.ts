import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { db } from "@lifepilot/db";
import { retrieveRelevantMemories } from "@lifepilot/ai";

export const memoriesRouter = router({
  // Get all memories for user
  list: protectedProcedure
    .input(
      z.object({
        category: z.enum(["preference", "habit", "struggle", "milestone", "context", "hobby", "relationship"]).optional(),
        limit: z.number().min(1).max(100).default(50),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const memories = await db.memory.findMany({
        where: {
          userId: ctx.user.id,
          ...(input?.category && { category: input.category }),
        },
        orderBy: { createdAt: "desc" },
        take: input?.limit || 50,
      });

      return memories.map((m) => ({
        id: m.id,
        category: m.category,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      }));
    }),

  // Get relevant memories for a context
  relevant: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1).max(500),
        limit: z.number().min(1).max(10).default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      const memories = await retrieveRelevantMemories(ctx.user.id, input.query);

      return memories.map((m) => ({
        category: m.category,
        content: m.content,
      }));
    }),

  // Get memory by ID
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const memory = await db.memory.findFirst({
        where: {
          id: input.id,
          userId: ctx.user.id,
        },
      });

      if (!memory) {
        throw new Error("Memory not found");
      }

      return {
        id: memory.id,
        category: memory.category,
        content: memory.content,
        createdAt: memory.createdAt.toISOString(),
      };
    }),
});