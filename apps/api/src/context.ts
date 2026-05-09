import type { inferAsyncReturnType } from "@trpc/server";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { db } from "@lifepilot/db";
import { TRPCError } from "@trpc/server";

// For now, we'll extract the user ID from the Authorization header
// In production, you'd verify the Clerk JWT properly using @clerk/clerk-sdk-node
async function getUserIdFromRequest(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  // Expecting header format: "Bearer user_id" for simplicity during dev
  // In production, you'd parse and verify a real JWT
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return null;
}

export async function createContext(opts: FetchCreateContextFnOptions) {
  const req = opts.req;

  // Get Clerk user ID from authorization header
  // In production, this would verify the JWT from Clerk
  const userId = await getUserIdFromRequest(req);

  if (!userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "No user ID from Clerk" });
  }

  // Find user in our database
  let user = await db.user.findUnique({
    where: { clerkId: userId },
  });

  // If user doesn't exist, they'll be created via webhook or need to complete onboarding first

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