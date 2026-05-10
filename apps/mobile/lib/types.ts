// Types for the new LifePilot data model

export type Frequency =
  | 'daily'
  | 'every_2_days'
  | 'every_3_days'
  | 'weekly'
  | 'every_2_weeks'
  | 'monthly'
  | 'every_3_months'
  | 'every_6_months'
  | 'yearly';

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'anytime';

export type JourneyStatus = 'in_motion' | 'paused' | 'nailed_it';

export type AmbitionStatus = 'in_motion' | 'paused' | 'nailed_it';

export type SourceType = 'ritual' | 'journey' | 'ambition' | 'oneoff';

export interface Ritual {
  id: string;
  user_id: string;
  title: string;
  category: string;
  frequency: Frequency;
  preferred_day: DayOfWeek | null;
  preferred_time: string | null;
  why: string | null;
  is_paused: boolean;
  pause_until: string | null;
  emoji: string | null;
  created_at: string;
  updated_at: string;
}

export interface Todo {
  id: string;
  user_id: string;
  title: string;
  source_type: SourceType;
  source_id: string | null;
  due_date: string;
  due_time: string | null;
  time_of_day: TimeOfDay | null;
  completed: boolean;
  completed_at: string | null;
  snoozed_until: string | null;
  created_at: string;
}

export interface Journey {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  total_chapters: number;
  current_chapter: number;
  duration_weeks: number;
  daily_minutes: number;
  preferred_time: TimeOfDay | null;
  progress_pct: number;
  status: JourneyStatus;
  chapters: JourneyChapter[] | null;
  why: string | null;
  emoji: string | null;
  start_date: string;
  created_at: string;
  updated_at: string;
}

export interface JourneyChapter {
  title: string;
  description: string;
  tasks: string[];
  completed: boolean;
}

export interface Ambition {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  target_date: string | null;
  current_chapter: number;
  total_chapters: number;
  progress_pct: number;
  status: AmbitionStatus;
  chapters: AmbitionChapter[] | null;
  why: string | null;
  emoji: string | null;
  created_at: string;
  updated_at: string;
}

export interface AmbitionChapter {
  title: string;
  description: string;
  milestones: string[];
  completed: boolean;
}

export interface UserSettings {
  id: string;
  user_id: string;
  evening_checkin_time: string;
  friday_windup_enabled: boolean;
  onboarding_complete: boolean;
  roll_days: number;
  roll_last_date: string | null;
  one_thing_mode: boolean;
  created_at: string;
  updated_at: string;
}

// Helper to format frequency for display
export function formatFrequency(frequency: Frequency): string {
  const labels: Record<Frequency, string> = {
    daily: 'every day',
    every_2_days: 'every 2 days',
    every_3_days: 'every 3 days',
    weekly: 'weekly',
    every_2_weeks: 'every 2 weeks',
    monthly: 'monthly',
    every_3_months: 'every 3 months',
    every_6_months: 'every 6 months',
    yearly: 'yearly',
  };
  return labels[frequency] || frequency;
}

// Helper to format day
export function formatDay(day: DayOfWeek | null): string {
  if (!day) return '';
  const labels: Record<DayOfWeek, string> = {
    mon: 'Monday',
    tue: 'Tuesday',
    wed: 'Wednesday',
    thu: 'Thursday',
    fri: 'Friday',
    sat: 'Saturday',
    sun: 'Sunday',
  };
  return labels[day] || day;
}

// Streak personality text
export function getStreakPersonality(days: number): string {
  if (days === 0) return "Let's get started 🌱";
  if (days <= 3) return "Just getting started 🌱";
  if (days <= 6) return "Finding your rhythm 🎵";
  if (days <= 13) return "On a roll 🔥";
  if (days <= 20) return "This is becoming real 💪";
  if (days <= 29) return "You've made this a part of you ✨";
  return "Pilot is genuinely impressed 🤝";
}