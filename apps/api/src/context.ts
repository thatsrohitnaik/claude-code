import type { inferAsyncReturnType } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { db } from "@lifepilot/db";
import { TRPCError } from "@trpc/server";

async function getUserIdFromRequest(req: CreateExpressContextOptions["req"]): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  // Expecting header format: "Bearer user_id" for simplicity during dev
  // In production, you'd parse and verify a real JWT
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return null;
}

export async function createContext(opts: CreateExpressContextOptions) {
  const req = opts.req;

  // Get Clerk user ID from authorization header
  // In production, this would verify the JWT from Clerk
  const userId = await getUserIdFromRequest(req);

  if (!userId) {
    // For development/testing without auth, create a demo user context
    // In production, this would throw UNAUTHORIZED
    return {
      db,
      userId: "demo-user-id",
      user: {
        id: "demo-user-id",
        clerkId: "demo-user-id",
        email: "demo@example.com",
        name: "Demo User",
        plan: "FREE",
      },
      isDevMode: true,
    };
  }

  // Find user in our database
  let user = await db.user.findUnique({
    where: { clerkId: userId },
  });

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
    isDevMode: false,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;