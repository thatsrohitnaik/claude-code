# LifePilot — Product Requirements Document (AI Build Edition)
**Version:** 1.0  
**Audience:** AI coding agents (Claude, GPT-4o, Cursor, etc.)  
**Purpose:** Complete specification to build LifePilot from scratch  
**Reading order:** Sequential. Each section depends on the previous.

---

## 0. HOW TO READ THIS DOCUMENT (for AI agents)

This PRD is written so an AI agent can build LifePilot autonomously. Each section follows this pattern:

- **WHAT** — what to build
- **WHY** — the intent, so you can make good decisions when the spec is ambiguous
- **HOW** — exact implementation instructions
- **CONTRACTS** — data shapes, API signatures, and DB schemas written as TypeScript types or SQL
- **TESTS** — what to verify before moving on

When this document says "emit", it means write a JSON block to stdout that the orchestrating process will persist. When it says "inject", it means read from the database/environment and include in a prompt.

Do not skip sections. If a section says "depends on Section N", implement Section N first.

---

## 1. PRODUCT OVERVIEW

### 1.1 What is LifePilot?

LifePilot is an AI-powered mobile life co-pilot. It is not a task manager. It is not a habit tracker. It is a proactive AI companion that:

1. Knows your goals (daily tasks, monthly targets, lifetime dreams)
2. Builds and maintains a living plan to achieve them
3. Sends context-aware nudges (not dumb reminders)
4. Curates learning resources matched to your exact goal stage
5. Generates weekly progress reports with honest insights
6. Remembers everything you tell it and gets smarter over time

### 1.2 The core differentiator

Every other app stores your goals and reminds you about them. LifePilot **thinks about your goals for you** — noticing when you're stalling before you do, recalibrating your plan when life gets in the way, and surfacing the exact resource you need at the exact right moment.

### 1.3 Target user

Someone who has goals but struggles with consistency. Mid-career professional, ambitious student, or anyone trying to grow intentionally. Not a productivity nerd — someone who wants results without the overhead of managing a complex system.

---

## 2. TECH STACK

### 2.1 Frontend

| Layer | Technology | Reason |
|---|---|---|
| Mobile framework | React Native 0.74 | Single codebase for iOS + Android |
| Build tooling | Expo SDK 51 | OTA updates, push notifications, EAS Build |
| State management | Zustand 4 | Lightweight, no boilerplate |
| Server state | TanStack Query 5 | Caching, background refetch for AI calls |
| Navigation | Expo Router (file-based) | Familiar, supports deep links |
| Animations | React Native Reanimated 3 | 60fps native animations |
| UI primitives | Custom (no component library) | Full control over design |
| Fonts | Expo Google Fonts | Inter for body, custom display font |

### 2.2 Backend

| Layer | Technology | Reason |
|---|---|---|
| Runtime | Node.js 20 LTS | Non-blocking I/O for AI streaming |
| Framework | Express 4 + tRPC 11 | End-to-end type safety with React Native |
| Auth | Clerk | Social login (Google, Apple), JWT, webhooks |
| Job queue | BullMQ 5 + Redis 7 | Scheduled nudges, background AI jobs |
| Payments | Stripe | Subscription billing, webhooks |
| Push notifications | Expo Push + FCM + APNs | Cross-platform push delivery |
| File storage | AWS S3 | Generated PDF reports, user assets |

### 2.3 AI Layer

| Layer | Technology | Reason |
|---|---|---|
| Primary LLM | Claude claude-sonnet-4-20250514 (Anthropic) | Best instruction-following, long context |
| Fallback LLM | gpt-4o (OpenAI) | Fallback if Anthropic is down |
| Orchestration | LangChain.js | Agent memory, chains, tool use |
| Embeddings | text-embedding-3-small (OpenAI) | Fast, cheap, 1536 dimensions |
| Vector store | pgvector (PostgreSQL extension) | No extra service needed at launch |
| Voice input | Whisper API (OpenAI) | Speech-to-text for voice notes |
| RAG pipeline | Custom (see Section 7) | Tutorial + resource curation |

### 2.4 Data Layer

| Layer | Technology | Reason |
|---|---|---|
| Primary database | PostgreSQL 16 + pgvector | Relational data + vector embeddings |
| ORM | Prisma 5 | Type-safe queries, migrations |
| Cache | Redis 7 | Session store, BullMQ, response cache |
| Analytics | Posthog | User behaviour, funnel analysis |

### 2.5 Infrastructure

| Layer | Technology |
|---|---|
| Hosting (start) | Render.com (web service + PostgreSQL + Redis) |
| Hosting (scale) | AWS ECS Fargate + RDS + ElastiCache |
| CI/CD | GitHub Actions |
| Error tracking | Sentry |
| Containers | Docker |
| Secrets | Doppler |

### 2.6 Monorepo structure

```
lifepilot/
├── apps/
│   ├── mobile/          # React Native / Expo app
│   └── api/             # Express + tRPC server
├── packages/
│   ├── db/              # Prisma schema + migrations + client
│   ├── types/           # Shared TypeScript types
│   ├── ai/              # LangChain chains, prompts, memory
│   └── config/          # Shared env validation (zod)
├── docker-compose.yml   # Local dev: postgres, redis
├── turbo.json           # Turborepo build config
└── package.json         # Root workspace
```

---

## 3. DATABASE SCHEMA

### 3.1 Full Prisma schema

Create this file at `packages/db/schema.prisma`:

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgvector(map: "vector")]
}

model User {
  id               String    @id @default(uuid())
  clerkId          String    @unique
  email            String    @unique
  name             String
  avatarUrl        String?
  plan             Plan      @default(FREE)
  lifeStage        String?   // "student" | "early-career" | "mid-career" | "freelancer" | "parent"
  nudgeStyle       String    @default("gentle")  // "gentle" | "firm" | "morning-only" | "on-request"
  timezone         String    @default("UTC")
  onboardingDone   Boolean   @default(false)
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  goals            Goal[]
  tasks            Task[]
  plans            Plan_[]
  progressLogs     ProgressLog[]
  nudges           Nudge[]
  memories         Memory[]
  weeklyReports    WeeklyReport[]
}

enum Plan {
  FREE
  PRO
  PREMIUM
}

model Goal {
  id           String      @id @default(uuid())
  userId       String
  user         User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  title        String
  description  String?
  type         GoalType
  horizon      Horizon
  progressPct  Int         @default(0)   // 0-100
  targetDate   DateTime?
  status       GoalStatus  @default(ACTIVE)
  priority     Int         @default(0)   // lower = higher priority
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  tasks        Task[]
  progressLogs ProgressLog[]
}

enum GoalType {
  CAREER
  HEALTH
  LEARNING
  CREATIVITY
  FINANCE
  RELATIONSHIPS
  SIDE_PROJECT
  MENTAL_WELLNESS
  OTHER
}

enum Horizon {
  DAILY
  MONTHLY
  YEARLY
  LIFETIME
}

enum GoalStatus {
  ACTIVE
  ON_TRACK
  AT_RISK
  STALLED
  COMPLETED
  PAUSED
}

model Task {
  id           String      @id @default(uuid())
  userId       String
  user         User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  goalId       String?
  goal         Goal?       @relation(fields: [goalId], references: [id], onDelete: SetNull)
  title        String
  recurrence   String?     // "daily" | "weekly" | "weekdays" | null (one-off)
  dueDate      DateTime?
  scheduledFor String?     // "morning" | "afternoon" | "evening"
  completed    Boolean     @default(false)
  completedAt  DateTime?
  skipped      Boolean     @default(false)
  createdAt    DateTime    @default(now())
}

model Plan_ {
  id             String   @id @default(uuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  weekNumber     Int      // ISO week number
  year           Int
  weeklyActions  Json     // WeeklyAction[]
  resourceLinks  Json     // ResourceLink[]
  planSummary    String
  version        Int      @default(1)
  generatedAt    DateTime @default(now())

  @@unique([userId, weekNumber, year])
}

model ProgressLog {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  goalId    String?
  goal      Goal?    @relation(fields: [goalId], references: [id], onDelete: SetNull)
  score     Int      // 1-10
  note      String?
  mood      String?  // "energised" | "neutral" | "tired" | "stressed"
  loggedAt  DateTime @default(now())
}

model Nudge {
  id          String      @id @default(uuid())
  userId      String
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  type        NudgeType
  message     String
  goalId      String?
  delivered   Boolean     @default(false)
  opened      Boolean     @default(false)
  sentAt      DateTime?
  createdAt   DateTime    @default(now())
}

enum NudgeType {
  STALL_ALERT       // goal hasn't been touched in 3+ days
  MILESTONE         // user is close to a goal milestone
  MORNING_BRIEFING  // daily morning summary
  EVENING_CHECKIN   // evening reflection prompt
  RESOURCE_SUGGEST  // "here's something for your goal"
  STREAK_PROTECT    // "you're about to lose your streak"
}

model Memory {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  category    String   // "preference" | "habit" | "struggle" | "milestone" | "context" | "hobby"
  content     String   // human-readable memory text
  embedding   Unsupported("vector(1536)")?  // pgvector embedding
  createdAt   DateTime @default(now())

  @@index([userId])
}

model WeeklyReport {
  id             String   @id @default(uuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  weekNumber     Int
  year           Int
  tasksCompleted Int
  streakDays     Int
  weekScore      Int      // 0-100
  focusHours     Float
  goalProgress   Json     // GoalProgressSnapshot[]
  insights       Json     // Insight[]
  recommendations Json    // Recommendation[]
  generatedAt    DateTime @default(now())

  @@unique([userId, weekNumber, year])
}
```

### 3.2 JSON type contracts

These types live in `packages/types/src/index.ts`:

```typescript
// Plan_.weeklyActions shape
export type WeeklyAction = {
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  task: string;
  goalId: string;
  estimatedMinutes: number;
  scheduledFor: "morning" | "afternoon" | "evening";
};

// Plan_.resourceLinks shape
export type ResourceLink = {
  title: string;
  url: string;
  type: "video" | "course" | "book" | "article" | "podcast";
  estimatedHours: number;
  goalId: string;
  reason: string; // Why this was recommended
};

// WeeklyReport.goalProgress shape
export type GoalProgressSnapshot = {
  goalId: string;
  title: string;
  progressPct: number;
  progressDelta: number; // Change since last week
  status: "on_track" | "at_risk" | "stalled";
};

// WeeklyReport.insights shape
export type Insight = {
  type: "win" | "risk" | "observation" | "pattern";
  text: string;
  goalId?: string;
};

// WeeklyReport.recommendations shape
export type Recommendation = {
  title: string;
  description: string;
  resourceType: "video" | "course" | "book" | "habit" | "action";
  url?: string;
  estimatedTime: string; // e.g. "30 mins"
  goalId: string;
};
```

---

## 4. API LAYER

### 4.1 tRPC router structure

Create at `apps/api/src/router/index.ts`:

```typescript
export const appRouter = router({
  auth:     authRouter,     // Clerk webhook sync
  users:    usersRouter,    // Profile CRUD
  goals:    goalsRouter,    // Goal CRUD + progress update
  tasks:    tasksRouter,    // Task CRUD + completion
  plans:    plansRouter,    // Fetch/generate weekly plan
  ai:       aiRouter,       // Chat, onboarding, nudge generation
  reports:  reportsRouter,  // Weekly report fetch/generate
  memories: memoriesRouter, // Read memories (write is internal only)
});
```

### 4.2 Key endpoint contracts

```typescript
// goals.create
input: {
  title: string;
  type: GoalType;
  horizon: Horizon;
  targetDate?: Date;
  description?: string;
}
output: Goal

// goals.updateProgress
input: { goalId: string; progressPct: number }
output: Goal

// tasks.complete
input: { taskId: string }
output: { task: Task; streakDays: number; nudgeFired?: boolean }

// ai.chat
input: {
  message: string;
  conversationHistory: { role: "user" | "assistant"; content: string }[];
}
output: ReadableStream  // SSE stream of text chunks

// ai.generatePlan
input: { weekNumber: number; year: number }
output: Plan_

// ai.onboardingComplete
input: {
  lifeStage: string;
  goals: { title: string; horizon: Horizon; type: GoalType }[];
  growthAreas: GoalType[];
  nudgeStyle: string;
  activeTime: string;
  lifetimeDream: string;
}
output: { user: User; initialPlan: Plan_; firstGoals: Goal[] }

// reports.getWeekly
input: { weekNumber: number; year: number }
output: WeeklyReport

// reports.generate
input: { weekNumber: number; year: number }
output: WeeklyReport
```

### 4.3 Authentication middleware

Every tRPC procedure (except `auth.webhook`) must run through this middleware:

```typescript
const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const { userId } = getAuth(ctx.req); // Clerk
  if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not in DB" });
  return next({ ctx: { ...ctx, user } });
});
```

---

## 5. AI SYSTEM PROMPT

This is the exact prompt template injected before every LLM call. It lives at `packages/ai/src/prompts/system.ts`. Template variables use `{{handlebars}}` syntax.

### 5.1 Full system prompt

```
You are Pilot, an AI life co-pilot inside the LifePilot mobile app.

=== IDENTITY ===
- You are a trusted, honest friend who knows this user's goals deeply
- You are proactive — surface what matters, not just what the user asks about
- You are direct — skip filler phrases ("Great question!", "Certainly!"), get to the point
- You are warm but honest — celebrate wins, flag stalls without guilt-tripping
- Your name is Pilot. Never refer to yourself as an AI, assistant, or language model

=== TONE ===
- Conversational, never corporate
- Like a smart friend who happens to be a life coach
- Short by default: 2–4 sentences for conversational replies
- Longer when the user is planning or needs a breakdown

=== USER PROFILE ===
Name: {{user.name}}
Life stage: {{user.lifeStage}}
Notification style: {{user.nudgeStyle}}
Member since: {{user.createdAt}}
Plan: {{user.plan}}
Timezone: {{user.timezone}}

=== ACTIVE GOALS (ordered by urgency) ===
{{#each goals}}
Goal: {{title}}
  Type: {{type}}
  Horizon: {{horizon}}
  Progress: {{progressPct}}%
  Target date: {{targetDate}}
  Status: {{status}}
  Days remaining: {{daysRemaining}}
  Last activity: {{lastActivityDate}}
---
{{/each}}

=== TODAY'S TASKS ===
{{#each todayTasks}}
[{{#if completed}}DONE{{else}}PENDING{{/if}}] {{title}} — goal: {{goalTitle}}
{{/each}}

Week completion rate: {{weekCompletionPct}}%
Current streak: {{streakDays}} days

=== RECENT ACTIVITY (last 7 days) ===
{{#each recentLogs}}
{{date}}: {{note}} (mood: {{mood}}, score: {{score}}/10)
{{/each}}

=== RETRIEVED MEMORIES (semantically relevant to current message) ===
{{#each memories}}
[{{category}}] {{content}}
{{/each}}

=== BEHAVIOURAL RULES ===
1. NEVER re-explain what the user already knows. They can see their goals in the app.
   Do NOT say "I see you want to become a senior engineer" — they know.

2. FLAG STALLS EARLY. If any goal has had no logged activity in 3+ days AND a deadline
   is within 8 weeks, surface it proactively even if the user didn't ask.

3. RECOMMEND SPECIFICALLY. Not "watch YouTube videos" but "watch Alex Xu's system
   design playlist on YouTube — 4 hours, covers exactly what FAANG interviewers test."

4. RESPECT NUDGE STYLE.
   - "gentle": soft language, frame as opportunity not obligation
   - "firm": direct language, name the risk of not acting
   - "morning-only": never suggest evening actions
   - "on-request": only give info the user explicitly asks for

5. ONE ACTION PER RESPONSE. Pick the single action most likely to move the needle.
   Do not give 5 suggestions. One, clearly stated.

6. UPDATE THE PLAN when user logs a win, miss, or mood shift. Recalibrate quietly.

7. NEVER GUILT-TRIP. A missed task is data, not a failure. Acknowledge → recalibrate → move forward.

8. MEMORY WRITE TRIGGER. At the end of any response where the user revealed something
   new about themselves (a preference, struggle, milestone, relationship context, or habit),
   append this exact JSON block on its own line. The backend strips it before showing to user:
   {"__memory__": {"category": "<category>", "content": "<content>"}}
   Categories: preference | habit | struggle | milestone | context | hobby | relationship

=== INTENT-SPECIFIC OUTPUT FORMAT ===

If intent is "chat": plain prose, 2–4 sentences, end with one clear next action if relevant.

If intent is "plan_generate": Return ONLY this JSON (no prose):
{
  "weekly_actions": [WeeklyAction],
  "resource_links": [ResourceLink],
  "plan_summary": "2–3 sentence narrative explaining the week's focus"
}

If intent is "report_generate": Return ONLY this JSON (no prose):
{
  "insights": [Insight],
  "recommendations": [Recommendation]
}

If intent is "onboarding_response": conversational, warm, max 2 sentences. 
No plan JSON yet — that is generated separately after onboarding completes.

=== CURRENT REQUEST ===
Intent: {{intent}}
Date: {{currentDate}} ({{dayOfWeek}})
Week: {{weekNumber}} of 52

User message: {{userMessage}}
```

### 5.2 Context assembly function

This function lives at `packages/ai/src/context.ts`. It assembles all runtime variables before every call:

```typescript
export async function buildContext(userId: string, userMessage: string) {
  const [user, goals, todayTasks, recentLogs, memories] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: userId } }),
    db.goal.findMany({
      where: { userId, status: { in: ["ACTIVE", "AT_RISK", "ON_TRACK"] } },
      orderBy: [{ priority: "asc" }, { targetDate: "asc" }],
      take: 5,
    }),
    getTodayTasks(userId),
    db.progressLog.findMany({
      where: { userId, loggedAt: { gte: subDays(new Date(), 7) } },
      orderBy: { loggedAt: "desc" },
    }),
    retrieveRelevantMemories(userId, userMessage), // vector search
  ]);

  const goalsWithMeta = goals.map(g => ({
    ...g,
    daysRemaining: g.targetDate ? differenceInDays(g.targetDate, new Date()) : null,
    lastActivityDate: getLastActivityDate(g.id, recentLogs),
  }));

  return { user, goals: goalsWithMeta, todayTasks, recentLogs, memories };
}

// Pinecone/pgvector semantic search
async function retrieveRelevantMemories(userId: string, query: string) {
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });
  const vector = embedding.data[0].embedding;
  
  // pgvector cosine similarity query
  return db.$queryRaw`
    SELECT id, category, content, created_at
    FROM "Memory"
    WHERE "userId" = ${userId}
    ORDER BY embedding <=> ${vector}::vector
    LIMIT 5
  `;
}
```

### 5.3 Memory write handler

After every LLM response, parse and strip the `__memory__` block:

```typescript
export async function processAIResponse(
  rawResponse: string,
  userId: string
): Promise<{ cleanResponse: string }> {
  const memoryMatch = rawResponse.match(/\{"__memory__":.*\}/);
  
  if (memoryMatch) {
    const { __memory__ } = JSON.parse(memoryMatch[0]);
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: __memory__.content,
    });
    await db.memory.create({
      data: {
        userId,
        category: __memory__.category,
        content: __memory__.content,
        embedding: embedding.data[0].embedding,
      },
    });
  }

  return {
    cleanResponse: rawResponse.replace(/\n?\{"__memory__":.*\}/, "").trim(),
  };
}
```

---

## 6. BACKGROUND JOBS (BullMQ)

All jobs run on a dedicated worker process at `apps/api/src/workers/index.ts`.

### 6.1 Job registry

```typescript
// Queue names
const QUEUES = {
  NUDGE:        "nudge-evaluation",
  PLAN_REGEN:   "plan-regeneration",
  REPORT_GEN:   "report-generation",
  EMBED:        "embedding-write",
} as const;

// Scheduled jobs (cron)
// Runs every morning at 7am in user's timezone
scheduleJob("morning-briefing", "0 7 * * *", async () => {
  const users = await db.user.findMany({
    where: { onboardingDone: true, nudgeStyle: { not: "on-request" } }
  });
  for (const user of users) {
    await nudgeQueue.add("morning-briefing", { userId: user.id, type: "MORNING_BRIEFING" });
  }
});

// Stall detection — runs every 6 hours
scheduleJob("stall-check", "0 */6 * * *", async () => {
  const stalledGoals = await detectStalledGoals(); // No activity in 3+ days, deadline < 8 weeks
  for (const { userId, goalId } of stalledGoals) {
    await nudgeQueue.add("stall-alert", { userId, goalId, type: "STALL_ALERT" });
  }
});

// Weekly plan regeneration — runs every Sunday at 10pm
scheduleJob("plan-regen", "0 22 * * 0", async () => {
  const users = await db.user.findMany({ where: { onboardingDone: true } });
  for (const user of users) {
    await planQueue.add("regen", { userId: user.id });
  }
});

// Weekly report generation — runs every Sunday at 11pm
scheduleJob("report-gen", "0 23 * * 0", async () => {
  const { weekNumber, year } = getCurrentWeek();
  const users = await db.user.findMany({ where: { onboardingDone: true } });
  for (const user of users) {
    await reportQueue.add("generate", { userId: user.id, weekNumber, year });
  }
});
```

### 6.2 Nudge generation worker

```typescript
nudgeQueue.process(async (job) => {
  const { userId, goalId, type } = job.data;
  const context = await buildContext(userId, `Generate a ${type} nudge`);
  
  const nudgePrompt = `
    Generate a single push notification for the user.
    Type: ${type}
    ${goalId ? `Related goal: ${context.goals.find(g => g.id === goalId)?.title}` : ""}
    
    Rules:
    - Max 100 characters
    - Conversational, not robotic
    - One specific action suggested
    - Match nudge style: ${context.user.nudgeStyle}
    - No emojis
    
    Return ONLY the notification text, nothing else.
  `;

  const message = await callLLM(nudgePrompt, context);
  
  await db.nudge.create({
    data: { userId, type, message, goalId, delivered: false }
  });
  
  await sendPushNotification(userId, message); // Expo Push API
});
```

---

## 7. RAG PIPELINE (Resource Curation)

The RAG pipeline finds tutorials and resources matched to a user's goal. It runs as part of plan generation.

### 7.1 Resource index

Maintain a `resources` table seeded from curated sources:

```sql
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  type VARCHAR(20),         -- 'video' | 'course' | 'book' | 'article'
  goal_types TEXT[],        -- which GoalTypes this serves
  skill_level VARCHAR(20),  -- 'beginner' | 'intermediate' | 'advanced'
  duration_hours FLOAT,
  embedding vector(1536),
  created_at TIMESTAMP DEFAULT now()
);
```

Seed with ~500 high-quality resources across all `GoalType` categories. Add a weekly job to pull new content from YouTube Data API, Udemy catalog API, and Hacker News.

### 7.2 Resource retrieval

```typescript
export async function findRelevantResources(
  goalTitle: string,
  goalType: GoalType,
  progressPct: number,
  limit = 3
): Promise<ResourceLink[]> {
  const skillLevel = progressPct < 30 ? "beginner" : progressPct < 70 ? "intermediate" : "advanced";
  const query = `${goalTitle} ${skillLevel} tutorial guide`;
  
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });

  const results = await db.$queryRaw`
    SELECT title, url, type, duration_hours
    FROM resources
    WHERE ${goalType} = ANY(goal_types)
    AND skill_level = ${skillLevel}
    ORDER BY embedding <=> ${embedding.data[0].embedding}::vector
    LIMIT ${limit}
  `;

  return results.map(r => ({
    title: r.title,
    url: r.url,
    type: r.type,
    estimatedHours: r.duration_hours,
    goalId: "", // filled in by caller
    reason: `Matched to your ${skillLevel}-level progress on "${goalTitle}"`,
  }));
}
```

---

## 8. ONBOARDING FLOW

The onboarding is a 7-step conversational flow. It runs fully in-app (no backend calls until step 7 submission).

### 8.1 Steps

```typescript
const ONBOARDING_STEPS = [
  { id: "welcome",        question: null,  type: "intro" },
  { id: "life_stage",     question: "Which best describes where you're at right now?",
    type: "single_select",
    options: ["Student", "Early career", "Mid-career", "Freelancer / founder", "Parent", "Career change"] },
  { id: "big_goal",       question: "What's the one thing you most want to achieve in the next 12 months?",
    type: "free_text" },
  { id: "lifetime_dream", question: "What does your ideal life look like in 10 years?",
    type: "free_text" },
  { id: "growth_areas",   question: "Which areas do you most want to grow in?",
    type: "multi_select",
    options: ["Career / skills", "Health & fitness", "Learning & reading", "Creativity",
              "Relationships", "Finance", "Mental wellness", "Side projects"] },
  { id: "active_time",    question: "When are you most likely to have 15–30 mins for yourself?",
    type: "single_select",
    options: ["Early morning", "Lunch break", "After work", "Late night", "Weekends only"] },
  { id: "nudge_style",    question: "How do you want me to check in with you?",
    type: "single_select",
    options: ["Gentle nudges", "Firm reminders", "Morning briefing only", "Only when I ask"] },
] as const;
```

### 8.2 Submission handler

On step 7 completion, call `ai.onboardingComplete`. The API endpoint must:

1. Save user profile fields
2. Parse `bigGoal` and `lifetimeDream` into 2–4 initial `Goal` records using an LLM call
3. Generate the first `Plan_` for the current week
4. Store `lifetimeDream` as a Memory with category `"context"`
5. Return `{ user, initialPlan, firstGoals }` to the app

---

## 9. MOBILE APP SCREENS

### 9.1 Screen inventory

```
(auth)/
  login.tsx          — Clerk social login (Google + Apple)
  
(onboarding)/
  _layout.tsx        — Progress bar header
  [step].tsx         — Dynamic step renderer

(app)/
  _layout.tsx        — Tab bar (Home, Goals, Plan, Progress, Profile)
  index.tsx          — Home screen
  goals/
    index.tsx        — Goals list
    [id].tsx         — Goal detail + tasks
    new.tsx          — Create goal
  plan/
    index.tsx        — Weekly plan view
  progress/
    index.tsx        — Progress dashboard + Growth Radar
    report/[week].tsx — Weekly report detail
  profile/
    index.tsx        — Settings, plan, nudge preferences
  chat.tsx           — Full-screen AI chat (accessible from home nudge card)
```

### 9.2 Home screen composition

The home screen (`(app)/index.tsx`) renders these sections in order:

1. Status bar + top bar (greeting + avatar + bell)
2. Stats row: 3 metric cards (streak / week done % / active goals count)
3. Pilot card: AI-generated contextual nudge (fetched on mount, cached 1hr)
4. Section: "Active goals" — top 3 goals with progress bars
5. Section: "Today's tasks" — all tasks due today, tappable to complete
6. Bottom tab bar

The Pilot card calls `ai.chat` with intent `"nudge_card"` and message `"Generate my morning nudge"` on mount. Stream the response into the card.

### 9.3 Key UX rules

- Tasks can be completed with a single tap (no confirmation)
- Completing a task triggers haptic feedback (`Haptics.impactAsync`)
- The Growth Radar on the Progress screen uses `react-native-chart-kit` with 6 axes: Career, Learning, Health, Creativity, Side project, Mindset
- All AI text streams in character by character (SSE) — never a loading spinner followed by a wall of text
- First launch after onboarding: show a skeleton loader for 2 seconds while the initial plan generates, then animate it in

---

## 10. MONETISATION

### 10.1 Plan tiers

| Feature | Free | Pro ($9.99/mo) | Premium ($19.99/mo) |
|---|---|---|---|
| Goals | Up to 3 | Unlimited | Unlimited |
| AI chat | 10 msgs/day | Unlimited | Unlimited |
| Smart nudges | Morning only | Full smart nudging | Full smart nudging |
| Weekly reports | Summary only | Full report + radar | Full report + radar |
| Resource curation | None | Top 3 per goal | Top 10 + personalised |
| Plan generation | Manual only | Auto weekly | Auto weekly + daily adjust |
| Accountability buddy | No | No | Yes |
| Human coach integration | No | No | Yes |

### 10.2 Stripe integration

- Create products and prices in Stripe dashboard
- Use Stripe Checkout for subscription start
- Listen to these webhook events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
- On subscription change, update `user.plan` in DB
- Gate Pro/Premium features behind `user.plan` check in tRPC middleware

---

## 11. BUILD ORDER

Build in this exact sequence. Each phase is independently deployable.

### Phase 1 — Foundation (Week 1–2)
1. Monorepo setup (Turborepo + workspaces)
2. Database schema + Prisma migrations
3. Clerk auth + user sync webhook
4. tRPC router scaffold (empty procedures)
5. React Native + Expo app skeleton with navigation
6. Login screen

### Phase 2 — Core Loop (Week 3–4)
7. Goal CRUD (create, list, update progress)
8. Task CRUD (create, complete, recurrence)
9. Home screen (static — no AI yet)
10. Goals screen
11. Basic onboarding (no AI goal parsing yet — manual input)

### Phase 3 — AI Integration (Week 5–6)
12. System prompt + context assembly
13. AI chat endpoint (streaming)
14. Chat screen in app
15. AI onboarding completion (LLM parses goals, generates first plan)
16. Plan generation job
17. Plan screen in app
18. Memory write + retrieval (pgvector)

### Phase 4 — Intelligence (Week 7–8)
19. BullMQ workers + cron jobs
20. Stall detection + nudge generation
21. Push notification delivery (Expo Push)
22. Weekly report generation
23. Progress screen + Growth Radar
24. Report detail screen
25. RAG pipeline (resource curation)

### Phase 5 — Monetisation + Polish (Week 9–10)
26. Stripe integration + plan gating
27. Onboarding UX polish (animations)
28. Haptics, micro-animations
29. Error boundaries + Sentry
30. App Store / Play Store submission

---

## 12. ENVIRONMENT VARIABLES

All secrets managed via Doppler. Required vars:

```env
# Database
DATABASE_URL=postgresql://...

# Auth
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...

# AI
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...        # Embeddings + Whisper + GPT-4o fallback

# Payments
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Push
EXPO_ACCESS_TOKEN=...

# Storage
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=lifepilot-assets

# Cache / Queue
REDIS_URL=redis://...

# Analytics
POSTHOG_API_KEY=phc_...

# App
NODE_ENV=development
API_URL=https://api.lifepilot.app
APP_URL=lifepilot://
```

---

## 13. TEST CHECKLIST

Before shipping each phase, verify:

**Phase 1:**
- [ ] `prisma migrate dev` runs without errors
- [ ] Clerk login creates a user record in DB
- [ ] tRPC health check returns 200

**Phase 2:**
- [ ] Can create a goal with all required fields
- [ ] Can complete a task; `completedAt` is set
- [ ] Recurring tasks regenerate correctly on completion

**Phase 3:**
- [ ] AI chat streams tokens correctly (no buffering)
- [ ] System prompt injects all context variables (log and verify)
- [ ] Memory write: after a chat message mentioning a preference, a `Memory` row exists
- [ ] Plan JSON matches `WeeklyAction[]` + `ResourceLink[]` types exactly

**Phase 4:**
- [ ] Stall detection fires for a goal with no logs in 3+ days
- [ ] Push notification arrives on device within 60s of nudge job running
- [ ] Weekly report `insights` array has at least 2 items
- [ ] pgvector search returns the 5 most relevant memories (not random 5)

**Phase 5:**
- [ ] Stripe webhook updates `user.plan` correctly on subscription creation
- [ ] Free user hitting Pro-gated endpoint gets `FORBIDDEN` error
- [ ] App passes Expo EAS build without errors

---

## 14. COMMON PITFALLS (read before building)

1. **pgvector embedding column**: Prisma doesn't support `vector` type natively. Use `Unsupported("vector(1536)")` in schema and raw queries for vector operations.

2. **Streaming AI responses in React Native**: React Native's `fetch` doesn't support `ReadableStream`. Use the `EventSource` polyfill (`react-native-sse`) for SSE, or poll a `/stream/{jobId}` endpoint.

3. **Clerk + tRPC**: Clerk's `getAuth()` only works in Express middleware context. Pass `req` through tRPC context explicitly.

4. **BullMQ timezone handling**: All cron jobs run in UTC. Convert user timezones before scheduling morning briefings.

5. **Plan_ naming**: `Plan` conflicts with Prisma's reserved `enum Plan`. The model is named `Plan_` in the schema. Alias it in all imports: `import { Plan_ as UserPlan } from "@lifepilot/db"`.

6. **Memory privacy**: Never expose another user's memories. Always scope all memory queries with `WHERE userId = $currentUserId`.

7. **LLM JSON output**: LLMs occasionally wrap JSON in markdown code fences. Always strip ` ```json ` and ` ``` ` before `JSON.parse()`.

8. **Nudge fatigue**: Cap nudges at 3 per day per user, regardless of how many stalled goals exist. Store a `nudgeCount` on each user refreshed daily.

---

*End of document. Total estimated build time with an AI agent: 6–8 weeks with daily iteration. Start with Phase 1 and do not skip the test checklist.*
