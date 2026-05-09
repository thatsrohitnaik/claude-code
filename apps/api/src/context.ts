import type { inferAsyncReturnType } from "@trpc/server";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { db } from "@lifepilot/db";
import { getAuth } from "clerk/express";
import { TRPCError } from "@trpc/server";

export async function createContext(opts: FetchCreateContextFnOptions) {
  const req = opts.req;

  // Get Clerk auth - this works in Express context
  const { userId } = getAuth(req as any);

  if (!userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "No user ID from Clerk" });
  }

  // Find or create user in our database
  let user = await db.user.findUnique({
    where: { clerkId: userId },
  });

  // If user doesn't exist, they'll be created via webhook or need to complete onboarding first
  // For now, we'll allow the request through but they won't have full access until onboarding

  return {
    db,
    userId,
    user: user
      ? {
          id: user.id,
          clerkId: user.clerkId,
          email: user.email,
          name: user.name,
          plan: user.plan,
        }
      : null,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;