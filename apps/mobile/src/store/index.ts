import { create } from "zustand";

export interface Goal {
  id: string;
  title: string;
  description?: string;
  type: string;
  horizon: string;
  progressPct: number;
  targetDate?: string;
  status: string;
  priority: number;
}

export interface Task {
  id: string;
  title: string;
  goalId?: string;
  completed: boolean;
  dueDate?: string;
  scheduledFor?: string;
}

interface AppState {
  // User state
  userId: string | null;
  userName: string | null;
  isOnboarded: boolean;
  lifeStage: string | null;
  nudgeStyle: string | null;
  plan: string;

  // User profile
  setUser: (user: { lifeStage?: string; nudgeStyle?: string; isOnboarded?: boolean }) => void;

  // Goals
  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  removeGoal: (id: string) => void;

  // Tasks
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  completeTask: (id: string) => void;
  removeTask: (id: string) => void;

  // Stats
  streakDays: number;
  weekCompletion: number;
  setStats: (streak: number, weekCompletion: number) => void;

  // Loading states
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // User state
  userId: null,
  userName: null,
  isOnboarded: false,
  lifeStage: null,
  nudgeStyle: null,
  plan: "FREE",

  // User profile
  setUser: (user) => set((state) => ({
    ...state,
    ...user,
  })),

  // Goals
  goals: [],
  setGoals: (goals) => set({ goals }),
  addGoal: (goal) => set((state) => ({ goals: [...state.goals, goal] })),
  updateGoal: (id, updates) =>
    set((state) => ({
      goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    })),
  removeGoal: (id) =>
    set((state) => ({ goals: state.goals.filter((g) => g.id !== id) })),

  // Tasks
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  completeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, completed: true } : t)),
    })),
  removeTask: (id) =>
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),

  // Stats
  streakDays: 0,
  weekCompletion: 0,
  setStats: (streak, weekCompletion) =>
    set({ streakDays: streak, weekCompletion }),

  // Loading
  isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),
}));

// Demo data for initial UI
export const DEMO_GOALS: Goal[] = [
  { id: "1", title: "Learn system design", type: "CAREER", horizon: "YEARLY", progressPct: 45, status: "ACTIVE", priority: 1 },
  { id: "2", title: "Run 5k three times", type: "HEALTH", horizon: "MONTHLY", progressPct: 60, status: "ON_TRACK", priority: 2 },
  { id: "3", title: "Read 12 books this year", type: "LEARNING", horizon: "YEARLY", progressPct: 25, status: "AT_RISK", priority: 3 },
];

export const DEMO_TASKS: Task[] = [
  { id: "1", title: "Watch Alex Xu system design video", goalId: "1", completed: false, scheduledFor: "morning" },
  { id: "2", title: "Morning run", goalId: "2", completed: true, scheduledFor: "morning" },
  { id: "3", title: "Read 30 minutes", goalId: "3", completed: false, scheduledFor: "evening" },
];