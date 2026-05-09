import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export type User = Awaited<ReturnType<typeof db.user.findFirst>>;
export type Goal = Awaited<ReturnType<typeof db.goal.findFirst>>;
export type Task = Awaited<ReturnType<typeof db.task.findFirst>>;
export type Plan = Awaited<ReturnType<typeof db.plan_.findFirst>>;
export type ProgressLog = Awaited<ReturnType<typeof db.progressLog.findFirst>>;
export type Nudge = Awaited<ReturnType<typeof db.nudge.findFirst>>;
export type Memory = Awaited<ReturnType<typeof db.memory.findFirst>>;
export type WeeklyReport = Awaited<ReturnType<typeof db.weeklyReport.findFirst>>;

export * from "@prisma/client";