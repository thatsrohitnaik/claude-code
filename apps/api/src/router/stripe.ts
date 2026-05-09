import { router, protectedProcedure, publicProcedure } from "../trpc";
import { z } from "zod";
import { db } from "@lifepilot/db";

// Stripe configuration
const STRIPE_PRICES = {
  PRO_MONTHLY: "price_pro_monthly",
  PRO_YEARLY: "price_pro_yearly",
  PREMIUM_MONTHLY: "price_premium_monthly",
  PREMIUM_YEARLY: "price_premium_yearly",
};

export const stripeRouter = router({
  // Get user's subscription status
  subscription: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.user.findUnique({
      where: { id: ctx.user.id },
      select: { plan: true },
    });

    return {
      plan: user?.plan || "FREE",
    };
  }),

  // Create checkout session
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        priceId: z.enum(["PRO_MONTHLY", "PRO_YEARLY", "PREMIUM_MONTHLY", "PREMIUM_YEARLY"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // In production, create a Stripe checkout session
      // For now, return a placeholder
      const priceMap: Record<string, string> = {
        PRO_MONTHLY: "price_pro_monthly",
        PRO_YEARLY: "price_pro_yearly",
        PREMIUM_MONTHLY: "price_premium_monthly",
        PREMIUM_YEARLY: "price_premium_yearly",
      };

      return {
        sessionId: "cs_demo_" + Date.now(),
        url: "https://checkout.stripe.com/demo",
      };
    }),

  // Create portal session (for managing subscription)
  createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    // In production, create a Stripe customer portal session
    return {
      url: "https://billing.stripe.com/demo",
    };
  }),

  // Webhook handler (called by Stripe)
  webhook: publicProcedure
    .input(
      z.object({
        type: z.string(),
        data: z.any(),
      })
    )
    .mutation(async ({ input }) => {
      const { type, data } = input;

      switch (type) {
        case "customer.subscription.created":
        case "customer.subscription.updated": {
          const subscription = data.object;
          const customerId = subscription.customer;

          // Find user by stripe customer ID (would need to store this)
          // Update plan based on subscription status
          console.log("Subscription updated:", subscription.status);
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = data.object;
          // Downgrade to free
          console.log("Subscription cancelled");
          break;
        }

        case "invoice.payment_succeeded": {
          const invoice = data.object;
          console.log("Payment succeeded:", invoice.id);
          break;
        }

        case "invoice.payment_failed": {
          const invoice = data.object;
          console.log("Payment failed:", invoice.id);
          break;
        }
      }

      return { received: true };
    }),

  // Check feature access
  checkAccess: protectedProcedure
    .input(
      z.object({
        feature: z.enum(["unlimited_goals", "unlimited_ai", "smart_nudges", "weekly_reports", "resource_curation"]),
      })
    )
    .query(async ({ ctx, input }) => {
      const user = await db.user.findUnique({
        where: { id: ctx.user.id },
        select: { plan: true },
      });

      const plan = user?.plan || "FREE";

      const featureAccess: Record<string, Record<string, boolean>> = {
        unlimited_goals: { FREE: false, PRO: true, PREMIUM: true },
        unlimited_ai: { FREE: false, PRO: true, PREMIUM: true },
        smart_nudges: { FREE: false, PRO: true, PREMIUM: true },
        weekly_reports: { FREE: false, PRO: true, PREMIUM: true },
        resource_curation: { FREE: false, PRO: true, PREMIUM: true },
      };

      return {
        hasAccess: featureAccess[input.feature][plan] || false,
        plan,
      };
    }),
});