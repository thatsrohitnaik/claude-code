import { supabase } from './supabase';
import type {
  Ritual,
  Todo,
  Journey,
  Ambition,
  UserSettings,
  Frequency,
  DayOfWeek,
  SourceType,
} from './types';

// ============ RITUALS ============

export async function getRituals(userId: string): Promise<Ritual[]> {
  const { data, error } = await supabase
    .from('rituals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getRitualById(id: string): Promise<Ritual | null> {
  const { data, error } = await supabase
    .from('rituals')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function createRitual(ritual: Omit<Ritual, 'id' | 'created_at' | 'updated_at'>): Promise<Ritual> {
  const { data, error } = await supabase
    .from('rituals')
    .insert(ritual)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createRituals(rituals: Omit<Ritual, 'id' | 'created_at' | 'updated_at'>[]): Promise<Ritual[]> {
  const { data, error } = await supabase
    .from('rituals')
    .insert(rituals)
    .select();

  if (error) throw error;
  return data || [];
}

export async function updateRitual(id: string, updates: Partial<Ritual>): Promise<Ritual> {
  const { data, error } = await supabase
    .from('rituals')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRitual(id: string): Promise<void> {
  const { error } = await supabase
    .from('rituals')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function pauseRitual(id: string, until: Date): Promise<void> {
  await updateRitual(id, {
    is_paused: true,
    pause_until: until.toISOString(),
  });
}

export async function unpauseRitual(id: string): Promise<void> {
  await updateRitual(id, {
    is_paused: false,
    pause_until: null,
  });
}

// ============ TODOS ============

export async function getTodos(userId: string, date?: string): Promise<Todo[]> {
  let query = supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .order('due_date', { ascending: true })
    .order('due_time', { ascending: true });

  if (date) {
    query = query.eq('due_date', date);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getTodayTodos(userId: string): Promise<Todo[]> {
  const today = new Date().toISOString().split('T')[0];
  return getTodos(userId, today);
}

export async function getUpcomingTodos(userId: string, days: number = 3): Promise<Todo[]> {
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + days);

  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .gte('due_date', today.toISOString().split('T')[0])
    .lt('due_date', futureDate.toISOString().split('T')[0])
    .order('due_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createTodo(todo: Omit<Todo, 'id' | 'created_at'>): Promise<Todo> {
  const { data, error } = await supabase
    .from('todos')
    .insert(todo)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createTodos(todos: Omit<Todo, 'id' | 'created_at'>[]): Promise<Todo[]> {
  const { data, error } = await supabase
    .from('todos')
    .insert(todos)
    .select();

  if (error) throw error;
  return data || [];
}

export async function completeTodo(id: string): Promise<Todo> {
  const { data, error } = await supabase
    .from('todos')
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function uncompleteTodo(id: string): Promise<Todo> {
  const { data, error } = await supabase
    .from('todos')
    .update({
      completed: false,
      completed_at: null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function snoozeTodo(id: string, until: Date): Promise<Todo> {
  const { data, error } = await supabase
    .from('todos')
    .update({
      snoozed_until: until.toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTodo(id: string): Promise<void> {
  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============ JOURNEYS ============

export async function getJourneys(userId: string): Promise<Journey[]> {
  const { data, error } = await supabase
    .from('journeys')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getActiveJourneys(userId: string): Promise<Journey[]> {
  const { data, error } = await supabase
    .from('journeys')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'in_motion')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getJourneyById(id: string): Promise<Journey | null> {
  const { data, error } = await supabase
    .from('journeys')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function createJourney(journey: Omit<Journey, 'id' | 'created_at' | 'updated_at'>): Promise<Journey> {
  const { data, error } = await supabase
    .from('journeys')
    .insert(journey)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateJourney(id: string, updates: Partial<Journey>): Promise<Journey> {
  const { data, error } = await supabase
    .from('journeys')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function completeJourney(id: string): Promise<Journey> {
  return updateJourney(id, { status: 'nailed_it', progress_pct: 100 });
}

export async function pauseJourney(id: string): Promise<Journey> {
  return updateJourney(id, { status: 'paused' });
}

export async function resumeJourney(id: string): Promise<Journey> {
  return updateJourney(id, { status: 'in_motion' });
}

export async function deleteJourney(id: string): Promise<void> {
  const { error } = await supabase
    .from('journeys')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============ AMBITIONS ============

export async function getAmbitions(userId: string): Promise<Ambition[]> {
  const { data, error } = await supabase
    .from('ambitions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getActiveAmbitions(userId: string): Promise<Ambition[]> {
  const { data, error } = await supabase
    .from('ambitions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'in_motion')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getAmbitionById(id: string): Promise<Ambition | null> {
  const { data, error } = await supabase
    .from('ambitions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function createAmbition(ambition: Omit<Ambition, 'id' | 'created_at' | 'updated_at'>): Promise<Ambition> {
  const { data, error } = await supabase
    .from('ambitions')
    .insert(ambition)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAmbition(id: string, updates: Partial<Ambition>): Promise<Ambition> {
  const { data, error } = await supabase
    .from('ambitions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function completeAmbition(id: string): Promise<Ambition> {
  return updateAmbition(id, { status: 'nailed_it', progress_pct: 100 });
}

export async function deleteAmbition(id: string): Promise<void> {
  const { error } = await supabase
    .from('ambitions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============ USER SETTINGS ============

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) return null;
  return data;
}

export async function createUserSettings(userId: string): Promise<UserSettings> {
  const { data, error } = await supabase
    .from('user_settings')
    .insert({
      user_id: userId,
      evening_checkin_time: '21:00',
      friday_windup_enabled: true,
      onboarding_complete: false,
      roll_days: 0,
      roll_last_date: null,
      one_thing_mode: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserSettings(userId: string, updates: Partial<UserSettings>): Promise<UserSettings> {
  const { data, error } = await supabase
    .from('user_settings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function ensureUserSettings(userId: string): Promise<UserSettings> {
  const existing = await getUserSettings(userId);
  if (existing) return existing;
  return createUserSettings(userId);
}

// ============ STREAK CALCULATIONS ============

export async function updateStreak(userId: string): Promise<number> {
  const settings = await getUserSettings(userId);
  if (!settings) {
    await createUserSettings(userId);
    return 0;
  }

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Check if we already updated today
  if (settings.roll_last_date === today) {
    return settings.roll_days;
  }

  // Check if user completed any todos yesterday
  const { data: yesterdayTodos } = await supabase
    .from('todos')
    .select('completed')
    .eq('user_id', userId)
    .eq('due_date', yesterday);

  const completedYesterday = yesterdayTodos?.some(t => t.completed) || false;

  let newRollDays: number;
  if (completedYesterday) {
    newRollDays = settings.roll_days + 1;
  } else {
    newRollDays = 0;
  }

  await updateUserSettings(userId, {
    roll_days: newRollDays,
    roll_last_date: today,
  });

  return newRollDays;
}

// ============ TODO GENERATION ============

function getTimeOfDay(time: string | null): 'morning' | 'afternoon' | 'evening' | 'anytime' {
  if (!time) return 'anytime';
  const hour = parseInt(time.split(':')[0], 10);
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function shouldCreateTodoOnDate(ritual: Ritual, date: Date): boolean {
  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const dayName = dayNames[date.getDay()] as DayOfWeek;
  const startDate = new Date(ritual.created_at);
  const daysSinceStart = Math.floor((date.getTime() - startDate.getTime()) / 86400000);

  switch (ritual.frequency) {
    case 'daily':
      return true;
    case 'every_2_days':
      return daysSinceStart % 2 === 0;
    case 'every_3_days':
      return daysSinceStart % 3 === 0;
    case 'weekly':
      return dayName === ritual.preferred_day;
    case 'every_2_weeks':
      const weekNum = Math.floor(daysSinceStart / 14);
      return dayName === ritual.preferred_day && weekNum % 2 === 0;
    case 'monthly':
      return date.getDate() === 1;
    case 'every_3_months':
      return date.getDate() === 1 && date.getMonth() % 3 === 0;
    case 'every_6_months':
      return date.getDate() === 1 && date.getMonth() % 6 === 0;
    case 'yearly':
      return date.getDate() === 1 && date.getMonth() === 0;
    default:
      return false;
  }
}

export async function generateTodosForRitual(ritual: Ritual, daysAhead: number = 30): Promise<Todo[]> {
  const todos: Omit<Todo, 'id' | 'created_at'>[] = [];
  const today = new Date();

  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);

    if (shouldCreateTodoOnDate(ritual, date)) {
      todos.push({
        user_id: ritual.user_id,
        title: ritual.title,
        source_type: 'ritual',
        source_id: ritual.id,
        due_date: date.toISOString().split('T')[0],
        due_time: ritual.preferred_time,
        time_of_day: getTimeOfDay(ritual.preferred_time),
        completed: false,
        completed_at: null,
        snoozed_until: null,
      });
    }
  }

  if (todos.length > 0) {
    return createTodos(todos);
  }
  return [];
}

// ============ AGGREGATE QUERIES ============

export async function getTodayStats(userId: string): Promise<{
  total: number;
  completed: number;
  completionPct: number;
}> {
  const today = new Date().toISOString().split('T')[0];

  const { data: todos } = await supabase
    .from('todos')
    .select('completed')
    .eq('user_id', userId)
    .eq('due_date', today);

  const total = todos?.length || 0;
  const completed = todos?.filter(t => t.completed).length || 0;
  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, completionPct };
}

export async function getWeekStats(userId: string): Promise<{
  total: number;
  completed: number;
  completionPct: number;
}> {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const { data: todos } = await supabase
    .from('todos')
    .select('completed, due_date')
    .eq('user_id', userId)
    .gte('due_date', weekStart.toISOString().split('T')[0])
    .lte('due_date', today.toISOString().split('T')[0]);

  const total = todos?.length || 0;
  const completed = todos?.filter(t => t.completed).length || 0;
  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, completionPct };
}

export async function getRitualsCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('rituals')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_paused', false);

  return count || 0;
}

export async function getJourneysCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('journeys')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'in_motion');

  return count || 0;
}

export async function getAmbitionsCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('ambitions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'in_motion');

  return count || 0;
}