import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { haptics } from "../../lib/haptics";
import { useAuth } from "../../context/auth";
import {
  getTodayTodos,
  getUpcomingTodos,
  completeTodo,
  uncompleteTodo,
  snoozeTodo,
  getTodayStats,
  getWeekStats,
  getStreakPersonality,
  getRitualsCount,
  getJourneysCount,
  type Todo,
} from "../../lib/db";

interface TodoSection {
  title: string;
  data: Todo[];
  type: "urgent" | "today" | "upcoming";
}

export default function TodayScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // State
  const [todos, setTodos] = useState<Todo[]>([]);
  const [upcomingTodos, setUpcomingTodos] = useState<Todo[]>([]);
  const [streakDays, setStreakDays] = useState(0);
  const [todayStats, setTodayStats] = useState({ total: 0, completed: 0, completionPct: 0 });
  const [weekStats, setWeekStats] = useState({ total: 0, completed: 0, completionPct: 0 });
  const [oneThingMode, setOneThingMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pilotTip, setPilotTip] = useState("You're doing great! Keep up the momentum.");
  const [completedTodos, setCompletedTodos] = useState<Set<string>>(new Set());

  // Load data
  const loadData = async () => {
    if (!user) {
      // Demo mode - show empty state
      setTodos([]);
      setUpcomingTodos([]);
      return;
    }

    try {
      const [todayData, upcomingData, stats, week, ritualsCount] = await Promise.all([
        getTodayTodos(user.id),
        getUpcomingTodos(user.id, 3),
        getTodayStats(user.id),
        getWeekStats(user.id),
        getRitualsCount(user.id),
      ]);

      setTodos(todayData);
      setUpcomingTodos(upcomingData);
      setTodayStats(stats);
      setWeekStats(week);

      // Calculate streak from week stats
      const rollDays = week.completionPct > 0 ? Math.ceil(week.completed / 7) : 0;
      setStreakDays(rollDays);

      // Generate pilot tip
      if (stats.completed === stats.total && stats.total > 0) {
        setPilotTip("You've nailed everything today! Enjoy the moment ✨");
      } else if (stats.completed === 0) {
        setPilotTip(`You have ${stats.total} things waiting. Let's get started!`);
      } else {
        const remaining = stats.total - stats.completed;
        setPilotTip(`${remaining} more to go! You've got this 💪`);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Get today's date formatted
  const getFormattedDate = () => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "short" };
    return date.toLocaleDateString("en-US", options).replace(".", "");
  };

  // Group todos by time of day
  const groupTodosByTimeOfDay = (todoList: Todo[]) => {
    const groups: Record<string, Todo[]> = {
      morning: [],
      afternoon: [],
      evening: [],
      anytime: [],
    };

    todoList.forEach(todo => {
      const timeOfDay = todo.time_of_day || "anytime";
      if (groups[timeOfDay]) {
        groups[timeOfDay].push(todo);
      } else {
        groups.anytime.push(todo);
      }
    });

    return groups;
  };

  // Get urgent todos (due within 2 hours)
  const getUrgentTodos = () => {
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    return todos.filter(todo => {
      if (!todo.due_time || todo.completed) return false;
      const [hours, minutes] = todo.due_time.split(":").map(Number);
      const dueDate = new Date();
      dueDate.setHours(hours, minutes, 0, 0);
      return dueDate <= twoHoursLater;
    });
  };

  // Format date for upcoming
  const formatUpcomingDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateStr === today.toISOString().split("T")[0]) return "Today";
    if (dateStr === tomorrow.toISOString().split("T")[0]) return "Tomorrow";

    return date.toLocaleDateString("en-US", { weekday: "long" });
  };

  // Handle todo completion
  const handleToggleTodo = async (todo: Todo) => {
    haptics.medium();

    const newCompleted = new Set(completedTodos);
    if (newCompleted.has(todo.id)) {
      newCompleted.delete(todo);
      if (user) {
        try {
          await uncompleteTodo(todo.id);
        } catch (e) {
          console.error("Error uncompleting todo:", e);
        }
      }
    } else {
      newCompleted.add(todo.id);
      if (user) {
        try {
          await completeTodo(todo.id);
        } catch (e) {
          console.error("Error completing todo:", e);
        }
      }

      // Check if all todos are now completed
      const allTodos = [...todos, ...upcomingTodos];
      const remainingTodos = allTodos.filter(t => t.id !== todo.id && !newCompleted.has(t.id));
      if (remainingTodos.length === 0) {
        haptics.success();
      }
    }

    setCompletedTodos(newCompleted);
    await loadData();
  };

  // Handle long press
  const handleLongPress = (todo: Todo) => {
    Alert.alert(
      todo.title,
      "What would you like to do?",
      [
        {
          text: "Snooze to tomorrow",
          onPress: () => handleSnooze(todo),
        },
        {
          text: "Mark as nailed it",
          onPress: () => handleToggleTodo(todo),
        },
        {
          text: "Skip this one",
          onPress: () => {},
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const handleSnooze = async (todo: Todo) => {
    if (!user) return;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    try {
      await snoozeTodo(todo.id, tomorrow);
      await loadData();
    } catch (error) {
      console.error("Error snoozing todo:", error);
    }
  };

  // Render todo item
  const renderTodoItem = (todo: Todo, isUpcoming: boolean = false) => {
    const isCompleted = completedTodos.has(todo.id) || todo.completed;
    const isOverdue = !isCompleted && new Date(todo.due_date) < new Date() && !isUpcoming;

    return (
      <TouchableOpacity
        key={todo.id}
        style={[styles.todoItem, isCompleted && styles.todoItemCompleted]}
        onPress={() => handleToggleTodo(todo)}
        onLongPress={() => handleLongPress(todo)}
        delayLongPress={500}
      >
        <View style={[styles.checkbox, isCompleted && styles.checkboxCompleted]}>
          {isCompleted && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <View style={styles.todoContent}>
          <Text style={[styles.todoTitle, isCompleted && styles.todoTitleCompleted]}>
            {todo.title}
          </Text>
          <Text style={styles.todoMeta}>
            {todo.source_type === "ritual" && "Ritual"}
            {todo.source_type === "journey" && "Journey"}
            {todo.source_type === "ambition" && "Ambition"}
          </Text>
        </View>
        <View style={styles.todoRight}>
          {todo.due_time && !isCompleted && (
            <Text style={styles.todoTime}>{todo.due_time}</Text>
          )}
          {isOverdue && (
            <View style={styles.needsAttentionBadge}>
              <Text style={styles.needsAttentionText}>needs attention</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const urgentTodos = getUrgentTodos();
  const regularTodos = todos.filter(t => !urgentTodos.includes(t));
  const timeGroups = groupTodosByTimeOfDay(regularTodos);

  // Empty state
  if (todos.length === 0 && upcomingTodos.length === 0) {
    return (
      <LinearGradient colors={["#0A0A0A", "#111111"]} style={styles.container}>
        <ScrollView contentContainerStyle={styles.emptyContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.emptyEmoji}>✨</Text>
          <Text style={styles.emptyTitle}>You're all caught up!</Text>
          <Text style={styles.emptySubtitle}>
            Tell Pilot something new to stay on top of
          </Text>
          <TouchableOpacity
            style={styles.openPilotButton}
            onPress={() => router.push("/pilot")}
          >
            <Text style={styles.openPilotButtonText}>Open Pilot</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#0A0A0A", "#111111"]} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#7C3AED"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.date}>{getFormattedDate()}</Text>
          <Text style={styles.streakText}>{getStreakPersonality(streakDays)}</Text>
          <Text style={styles.completionText}>
            {todayStats.completed > 0
              ? `You've nailed ${todayStats.completed} of ${todayStats.total} things today`
              : todayStats.total > 0
                ? `${todayStats.total} things waiting for you today`
                : "You're all caught up — enjoy the moment ✨"
            }
          </Text>
        </View>

        {/* One thing mode toggle */}
        <TouchableOpacity
          style={styles.oneThingToggle}
          onPress={() => setOneThingMode(!oneThingMode)}
        >
          <Text style={styles.oneThingToggleText}>
            Feeling overwhelmed? → Just one thing
          </Text>
        </TouchableOpacity>

        {oneThingMode && (
          <View style={styles.oneThingBanner}>
            <Text style={styles.oneThingBannerText}>
              One thing mode — tap to see all
            </Text>
          </View>
        )}

        {/* Urgent Section */}
        {urgentTodos.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Right now</Text>
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentBadgeText}>URGENT</Text>
              </View>
            </View>
            {oneThingMode ? (
              urgentTodos.slice(0, 1).map(todo => renderTodoItem(todo))
            ) : (
              urgentTodos.map(todo => renderTodoItem(todo))
            )}
          </View>
        )}

        {/* Today Section */}
        {regularTodos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today</Text>

            {/* Morning */}
            {timeGroups.morning.length > 0 && (
              <View style={styles.timeGroup}>
                <Text style={styles.timeGroupTitle}>🌅 Morning</Text>
                {oneThingMode ? (
                  timeGroups.morning.slice(0, 1).map(todo => renderTodoItem(todo))
                ) : (
                  timeGroups.morning.map(todo => renderTodoItem(todo))
                )}
              </View>
            )}

            {/* Afternoon */}
            {timeGroups.afternoon.length > 0 && (
              <View style={styles.timeGroup}>
                <Text style={styles.timeGroupTitle}>☀️ Afternoon</Text>
                {oneThingMode ? (
                  timeGroups.afternoon.slice(0, 1).map(todo => renderTodoItem(todo))
                ) : (
                  timeGroups.afternoon.map(todo => renderTodoItem(todo))
                )}
              </View>
            )}

            {/* Evening */}
            {timeGroups.evening.length > 0 && (
              <View style={styles.timeGroup}>
                <Text style={styles.timeGroupTitle}>🌙 Evening</Text>
                {oneThingMode ? (
                  timeGroups.evening.slice(0, 1).map(todo => renderTodoItem(todo))
                ) : (
                  timeGroups.evening.map(todo => renderTodoItem(todo))
                )}
              </View>
            )}

            {/* Anytime */}
            {timeGroups.anytime.length > 0 && (
              <View style={styles.timeGroup}>
                <Text style={styles.timeGroupTitle}>📌 Anytime</Text>
                {oneThingMode ? (
                  timeGroups.anytime.slice(0, 1).map(todo => renderTodoItem(todo))
                ) : (
                  timeGroups.anytime.map(todo => renderTodoItem(todo))
                )}
              </View>
            )}
          </View>
        )}

        {/* Upcoming Section */}
        {upcomingTodos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Coming up</Text>

            {oneThingMode ? (
              upcomingTodos.slice(0, 1).map(todo => (
                <View key={todo.id} style={styles.upcomingItem}>
                  <Text style={styles.upcomingDate}>{formatUpcomingDate(todo.due_date)}</Text>
                  {renderTodoItem(todo, true)}
                </View>
              ))
            ) : (
              upcomingTodos.map(todo => (
                <View key={todo.id} style={styles.upcomingItem}>
                  <Text style={styles.upcomingDate}>{formatUpcomingDate(todo.due_date)}</Text>
                  {renderTodoItem(todo, true)}
                </View>
              ))
            )}
          </View>
        )}

        {/* Pilot Tip */}
        <View style={styles.pilotTipCard}>
          <View style={styles.pilotTipHeader}>
            <Text style={styles.pilotTipIcon}>✦</Text>
            <Text style={styles.pilotTipTitle}>Pilot's tip</Text>
          </View>
          <Text style={styles.pilotTipText}>{pilotTip}</Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  date: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  streakText: {
    fontSize: 16,
    color: "#9A9A9A",
    marginBottom: 8,
  },
  completionText: {
    fontSize: 15,
    color: "#FFFFFF",
  },
  oneThingToggle: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  oneThingToggleText: {
    fontSize: 14,
    color: "#7C3AED",
  },
  oneThingBanner: {
    backgroundColor: "#141414",
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  oneThingBannerText: {
    color: "#9A9A9A",
    fontSize: 14,
    textAlign: "center",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  urgentBadge: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  urgentBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  timeGroup: {
    marginBottom: 16,
  },
  timeGroupTitle: {
    fontSize: 14,
    color: "#9A9A9A",
    marginBottom: 8,
  },
  todoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141414",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  todoItemCompleted: {
    opacity: 0.6,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#5A5A5A",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxCompleted: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  todoContent: {
    flex: 1,
  },
  todoTitle: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  todoTitleCompleted: {
    textDecorationLine: "line-through",
    color: "#5A5A5A",
  },
  todoMeta: {
    fontSize: 12,
    color: "#9A9A9A",
    marginTop: 4,
  },
  todoRight: {
    alignItems: "flex-end",
  },
  todoTime: {
    fontSize: 14,
    color: "#9A9A9A",
  },
  needsAttentionBadge: {
    backgroundColor: "#EF444420",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  needsAttentionText: {
    fontSize: 10,
    color: "#EF4444",
    fontWeight: "500",
  },
  upcomingItem: {
    marginBottom: 8,
  },
  upcomingDate: {
    fontSize: 14,
    color: "#9A9A9A",
    marginBottom: 8,
  },
  pilotTipCard: {
    marginHorizontal: 20,
    backgroundColor: "#141414",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  pilotTipHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  pilotTipIcon: {
    fontSize: 16,
    color: "#7C3AED",
    marginRight: 8,
  },
  pilotTipTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  pilotTipText: {
    fontSize: 15,
    color: "#9A9A9A",
    lineHeight: 22,
  },
  bottomPadding: {
    height: 100,
  },
  // Empty state
  emptyContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 120,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#9A9A9A",
    textAlign: "center",
    marginBottom: 32,
  },
  openPilotButton: {
    backgroundColor: "#7C3AED",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  openPilotButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});