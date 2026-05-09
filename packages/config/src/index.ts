import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Auth (Clerk)
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().min(1),

  // AI
  ANTHROPIC_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),

  // Payments (Stripe)
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_PUBLISHABLE_KEY: z.string().min(1),

  // Push notifications (Expo)
  EXPO_ACCESS_TOKEN: z.string().min(1),

  // Storage (AWS S3)
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_S3_BUCKET: z.string().min(1),

  // Cache / Queue
  REDIS_URL: z.string().url(),

  // Analytics (Posthog)
  POSTHOG_API_KEY: z.string().min(1),

  // App
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  API_URL: z.string().url(),
  APP_URL: z.string().url(),
});

export type Env = z.infer<typeof envSchema>;

let env: Env | null = null;

export function getEnv(): Env {
  if (env) return env;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("Invalid environment variables:", result.error.format());
    throw new Error("Invalid environment configuration");
  }

  env = result.data;
  return env;
}

export const env: Env = getEnv();