import { router } from "../trpc";
import { authRouter } from "./auth";
import { usersRouter } from "./users";
import { goalsRouter } from "./goals";
import { tasksRouter } from "./tasks";
import { plansRouter } from "./plans";
import { aiRouter } from "./ai";
import { reportsRouter } from "./reports";
import { memoriesRouter } from "./memories";

export const appRouter = router({
  auth: authRouter,
  users: usersRouter,
  goals: goalsRouter,
  tasks: tasksRouter,
  plans: plansRouter,
  ai: aiRouter,
  reports: reportsRouter,
  memories: memoriesRouter,
});

export type AppRouter = typeof appRouter;