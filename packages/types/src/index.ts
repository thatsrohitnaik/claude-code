// Weekly plan types
export type WeeklyAction = {
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  task: string;
  goalId: string;
  estimatedMinutes: number;
  scheduledFor: "morning" | "afternoon" | "evening";
};

export type ResourceLink = {
  title: string;
  url: string;
  type: "video" | "course" | "book" | "article" | "podcast";
  estimatedHours: number;
  goalId: string;
  reason: string;
};

// Weekly report types
export type GoalProgressSnapshot = {
  goalId: string;
  title: string;
  progressPct: number;
  progressDelta: number;
  status: "on_track" | "at_risk" | "stalled";
};

export type Insight = {
  type: "win" | "risk" | "observation" | "pattern";
  text: string;
  goalId?: string;
};

export type Recommendation = {
  title: string;
  description: string;
  resourceType: "video" | "course" | "book" | "habit" | "action";
  url?: string;
  estimatedTime: string;
  goalId: string;
};

// Goal types (mirroring Prisma enums)
export type GoalType =
  | "CAREER"
  | "HEALTH"
  | "LEARNING"
  | "CREATIVITY"
  | "FINANCE"
  | "RELATIONSHIPS"
  | "SIDE_PROJECT"
  | "MENTAL_WELLNESS"
  | "OTHER";

export type Horizon = "DAILY" | "MONTHLY" | "YEARLY" | "LIFETIME";

export type GoalStatus = "ACTIVE" | "ON_TRACK" | "AT_RISK" | "STALLED" | "COMPLETED" | "PAUSED";

export type PlanTier = "FREE" | "PRO" | "PREMIUM";

export type NudgeType =
  | "STALL_ALERT"
  | "MILESTONE"
  | "MORNING_BRIEFING"
  | "EVENING_CHECKIN"
  | "RESOURCE_SUGGEST"
  | "STREAK_PROTECT";

export type Mood = "energised" | "neutral" | "tired" | "stressed";

export type NudgeStyle = "gentle" | "firm" | "morning-only" | "on-request";

export type LifeStage =
  | "student"
  | "early-career"
  | "mid-career"
  | "freelancer"
  | "parent"
  | "career-change";

// API input/output types
export interface CreateGoalInput {
  title: string;
  type: GoalType;
  horizon: Horizon;
  targetDate?: Date;
  description?: string;
}

export interface UpdateGoalProgressInput {
  goalId: string;
  progressPct: number;
}

export interface CompleteTaskInput {
  taskId: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatInput {
  message: string;
  conversationHistory: ChatMessage[];
}

export interface GeneratePlanInput {
  weekNumber: number;
  year: number;
}

export interface OnboardingInput {
  lifeStage: string;
  goals: { title: string; horizon: Horizon; type: GoalType }[];
  growthAreas: GoalType[];
  nudgeStyle: string;
  activeTime: string;
  lifetimeDream: string;
}

export interface GetWeeklyReportInput {
  weekNumber: number;
  year: number;
}

// tRPC context types
export interface Context {
  user: {
    id: string;
    clerkId: string;
    email: string;
    name: string;
    plan: PlanTier;
  };
}