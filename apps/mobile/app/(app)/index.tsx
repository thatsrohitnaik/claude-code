import { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAppStore, DEMO_GOALS, DEMO_TASKS } from "../../src/store";

export default function HomeScreen() {
  const router = useRouter();
  const { goals, tasks, streakDays, weekCompletion, setGoals, setTasks, setStats, completeTask } = useAppStore();
  const [nudge, setNudge] = useState("You're making great progress! Keep up the momentum today.");
  const [isLoadingNudge, setIsLoadingNudge] = useState(false);

  // Load demo data for now
  useEffect(() => {
    // In Phase 3, this will fetch from API
    setGoals(DEMO_GOALS);
    setTasks(DEMO_TASKS);
    setStats(7, 65);
  }, []);

  // Fetch AI nudge on mount
  useEffect(() => {
    // In Phase 3, this will call: await trpc.ai.nudge.query()
    // For now, use a contextual nudge based on time of day
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

  return (
    <LinearGradient colors={["#0D0D0D", "#111111"]} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.subtitle}>Here's your day</Text>
          </View>
          <TouchableOpacity style={styles.avatar}>
            <Text style={styles.avatarText}>U</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{streakDays}</Text>
            <Text style={styles.statLabel}>day streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{weekCompletion}%</Text>
            <Text style={styles.statLabel}>week done</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{activeGoalsCount}</Text>
            <Text style={styles.statLabel}>active goals</Text>
          </View>
        </View>

        {/* Pilot Card */}
        <TouchableOpacity style={styles.pilotCard} onPress={() => router.push("/chat" as any)}>
          <View style={styles.pilotHeader}>
            <Text style={styles.pilotIcon}>✦</Text>
            <Text style={styles.pilotTitle}>Pilot</Text>
          </View>
          <Text style={styles.pilotMessage}>
            {nudge}
          </Text>
        </TouchableOpacity>

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
          {todayTasks.map((task) => (
            <TouchableOpacity key={task.id} style={styles.taskCard}>
              <TouchableOpacity
                style={[styles.checkbox, task.completed && styles.checkboxCompleted]}
                onPress={() => {
                  if (!task.completed) {
                    completeTask(task.id);
                  }
                }}
              >
                {task.completed && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
              <View style={styles.taskContent}>
                <Text style={[styles.taskTitle, task.completed && styles.taskCompleted]}>
                  {task.title}
                </Text>
                {task.scheduledFor && (
                  <Text style={styles.taskSchedule}>
                    {task.scheduledFor.charAt(0).toUpperCase() + task.scheduledFor.slice(1)}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
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
  },
  pilotHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
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
  },
  pilotMessage: {
    fontSize: 16,
    color: "#D1D5DB",
    lineHeight: 24,
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
    fontSize: 20,
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
    backgroundColor: "#6366F1",
    borderColor: "#6366F1",
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
  taskSchedule: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  bottomPadding: {
    height: 100,
  },
});