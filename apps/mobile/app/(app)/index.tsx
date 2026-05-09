import { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAppStore, DEMO_GOALS, DEMO_TASKS } from "../../src/store";
import { useAuth } from "../../context/auth";

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { goals, tasks, streakDays, weekCompletion, setGoals, setTasks, setStats, completeTask } = useAppStore();
  const [nudge, setNudge] = useState("You're making great progress! Keep up the momentum today.");
  const [completedTasksList, setCompletedTasksList] = useState<Set<string>>(new Set());

  const userInitial = user?.email?.charAt(0).toUpperCase() || "U";

  useEffect(() => {
    setGoals(DEMO_GOALS);
    setTasks(DEMO_TASKS);
    setStats(7, 65);
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setNudge("Good morning! Your system design goal is at 45%. Perfect time for a quick study session.");
    } else if (hour < 17) {
      setNudge("You're on a 7-day streak! Keep it up with your evening reading session.");
    } else {
      setNudge("Almost done for the day! Just one task left - you've got this.");
    }
  }, []);

  const activeGoalsCount = goals.filter(g => g.status !== "COMPLETED").length;
  const todayTasks = tasks.slice(0, 3);
  const completedTasks = tasks.filter(t => t.completed).length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getGoalTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      CAREER: "#6366F1",
      HEALTH: "#10B981",
      LEARNING: "#F59E0B",
      CREATIVITY: "#EC4899",
      FINANCE: "#8B5CF6",
      RELATIONSHIPS: "#F472B6",
      SIDE_PROJECT: "#14B8A6",
      MENTAL_WELLNESS: "#A78BFA",
    };
    return colors[type] || "#6366F1";
  };

  const handleCompleteTask = (taskId: string) => {
    const newCompleted = new Set(completedTasksList);
    if (newCompleted.has(taskId)) {
      newCompleted.delete(taskId);
    } else {
      newCompleted.add(taskId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setCompletedTasksList(newCompleted);
    completeTask(taskId);
  };

  const handleLetsDoIt = () => {
    router.push("/chat" as any);
  };

  const handleRemindLater = () => {
    // Just dismiss for now - could schedule a reminder
  };

  // Welcome state for new users with 0 goals
  if (goals.length === 0) {
    return (
      <LinearGradient colors={["#0D0D0D", "#111111"]} style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.emptyContent}>
          <Text style={styles.welcomeEmoji}>🚀</Text>
          <Text style={styles.welcomeTitle}>Let's build your roadmap</Text>
          <Text style={styles.welcomeSubtitle}>
            Tell Pilot your goals and get a personalised plan in minutes
          </Text>
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={() => router.push("/goals/new" as any)}
          >
            <Text style={styles.getStartedText}>Get started</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#0D0D0D", "#111111"]} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.subtitle}>Your AI life co-pilot</Text>
          </View>
          <TouchableOpacity style={styles.avatar}>
            <Text style={styles.avatarText}>{userInitial}</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{streakDays}</Text>
            <Text style={styles.statLabel}>day streak 🔥</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{weekCompletion}%</Text>
            <Text style={styles.statLabel}>this week</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{activeGoalsCount}</Text>
            <Text style={styles.statLabel}>goals active</Text>
          </View>
        </View>

        {/* Pilot Card */}
        <View style={styles.pilotCard}>
          <View style={styles.pilotHeader}>
            <View style={styles.pilotTitleRow}>
              <Text style={styles.pilotIcon}>✦</Text>
              <Text style={styles.pilotTitle}>Pilot</Text>
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>AI</Text>
              </View>
            </View>
          </View>
          <Text style={styles.pilotMessage}>
            {nudge}
          </Text>
          <View style={styles.pilotButtons}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleLetsDoIt}>
              <Text style={styles.primaryButtonText}>Let's do it</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleRemindLater}>
              <Text style={styles.secondaryButtonText}>Remind me later</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Goals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Goals</Text>
            <TouchableOpacity onPress={() => router.push("/goals" as any)}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {goals.slice(0, 3).map((goal) => (
            <TouchableOpacity
              key={goal.id}
              style={styles.goalCard}
              onPress={() => router.push(`/goals/${goal.id}` as any)}
            >
              <View style={styles.goalHeader}>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                <Text style={[styles.goalType, { backgroundColor: getGoalTypeColor(goal.type) + "20", color: getGoalTypeColor(goal.type) }]}>
                  {goal.type}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${goal.progressPct}%`, backgroundColor: getGoalTypeColor(goal.type) }]} />
              </View>
              <View style={styles.goalFooter}>
                <Text style={styles.progressText}>{goal.progressPct}% complete</Text>
                <Text style={[styles.statusBadge, {
                  backgroundColor: goal.status === "ON_TRACK" ? "#10B98120" : goal.status === "AT_RISK" ? "#F59E0B20" : "#6366F120",
                  color: goal.status === "ON_TRACK" ? "#10B981" : goal.status === "AT_RISK" ? "#F59E0B" : "#6366F1"
                }]}>
                  {goal.status.replace("_", " ")}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Today's Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Tasks</Text>
            <Text style={styles.taskCount}>{completedTasks}/{tasks.length}</Text>
          </View>
          {todayTasks.length === 0 ? (
            <Text style={styles.noTasksText}>No tasks for today — tap Plan to generate your week</Text>
          ) : (
            todayTasks.map((task) => (
              <TouchableOpacity key={task.id} style={styles.taskCard}>
                <TouchableOpacity
                  style={[styles.checkbox, completedTasksList.has(task.id) && styles.checkboxCompleted]}
                  onPress={() => handleCompleteTask(task.id)}
                >
                  {completedTasksList.has(task.id) && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
                <View style={styles.taskContent}>
                  <Text style={[styles.taskTitle, completedTasksList.has(task.id) && styles.taskCompleted]}>
                    {task.title}
                  </Text>
                  <View style={styles.taskMeta}>
                    <View style={[styles.goalDot, { backgroundColor: getGoalTypeColor(task.goalType || "CAREER") }]} />
                    <Text style={styles.taskSchedule}>
                      {task.scheduledFor?.charAt(0).toUpperCase() + task.scheduledFor?.slice(1) || "Today"}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 16,
    color: "#9CA3AF",
    marginTop: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  statLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  pilotCard: {
    marginHorizontal: 20,
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#7C3AED",
  },
  pilotHeader: {
    marginBottom: 12,
  },
  pilotTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  pilotIcon: {
    fontSize: 20,
    color: "#6366F1",
    marginRight: 8,
  },
  pilotTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginRight: 8,
  },
  aiBadge: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  pilotMessage: {
    fontSize: 15,
    color: "#D1D5DB",
    lineHeight: 24,
    marginBottom: 16,
  },
  pilotButtons: {
    flexDirection: "row",
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#7C3AED",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "transparent",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#374151",
  },
  secondaryButtonText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "500",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  seeAll: {
    fontSize: 14,
    color: "#6366F1",
  },
  taskCount: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  noTasksText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    paddingVertical: 24,
  },
  goalCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    flex: 1,
    marginRight: 8,
  },
  goalType: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: "500",
  },
  progressBar: {
    height: 6,
    backgroundColor: "#374151",
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  goalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  statusBadge: {
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    fontWeight: "500",
  },
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#374151",
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
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  taskCompleted: {
    textDecorationLine: "line-through",
    color: "#6B7280",
  },
  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  goalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  taskSchedule: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  bottomPadding: {
    height: 100,
  },
  // Welcome state styles
  emptyContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 120,
  },
  welcomeEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  getStartedButton: {
    backgroundColor: "#7C3AED",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  getStartedText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});