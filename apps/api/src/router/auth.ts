import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import { db } from "@lifepilot/db";

export const authRouter = router({
  // Clerk webhook - syncs user data from Clerk
  webhook: publicProcedure
    .input(
      z.object({
        type: z.string(),
        data: z.object({
          id: z.string(),
          email_addresses: z.array(
            z.object({
              email_address: z.string(),
            })
          ),
          first_name: z.string().optional(),
          last_name: z.string().optional(),
          image_url: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const { type, data } = input;

      if (type === "user.created" || type === "user.updated") {
        const email = data.email_addresses[0]?.email_address;
        const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || "User";

        await db.user.upsert({
          where: { clerkId: data.id },
          create: {
            clerkId: data.id,
            email,
            name,
            avatarUrl: data.image_url,
          },
          update: {
            email,
            name,
            avatarUrl: data.image_url,
          },
        });

        return { success: true };
      }

      if (type === "user.deleted") {
        await db.user.delete({
          where: { clerkId: data.id },
        }).catch(() => {});

        return { success: true };
      }

      return { success: true, message: "Webhook processed" };
    }),
});