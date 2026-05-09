import { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

interface Stats {
  streak: number;
  weekCompletion: number;
  activeGoals: number;
}

interface Goal {
  id: string;
  title: string;
  progressPct: number;
  type: string;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  goalTitle?: string;
}

export default function HomeScreen() {
  const { userId } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ streak: 0, weekCompletion: 0, activeGoals: 0 });
  const [nudge, setNudge] = useState<string>("");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Fetch data on mount
  useEffect(() => {
    // In Phase 2/3, these would call the tRPC API
    // For now, show placeholder data
    setStats({
      streak: 7,
      weekCompletion: 65,
      activeGoals: 3,
    });

    setGoals([
      { id: "1", title: "Learn system design", progressPct: 45, type: "CAREER" },
      { id: "2", title: "Run 5k three times", progressPct: 60, type: "HEALTH" },
      { id: "3", title: "Read 12 books this year", progressPct: 25, type: "LEARNING" },
    ]);

    setTasks([
      { id: "1", title: "Watch Alex Xu video", completed: false, goalTitle: "Learn system design" },
      { id: "2", title: "Morning run", completed: true, goalTitle: "Run 5k" },
      { id: "3", title: "Read 30 minutes", completed: false, goalTitle: "Read 12 books" },
    ]);

    setNudge("You're making great progress on your system design goal! Keep it up.");
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
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
            <Text style={styles.statValue}>{stats.streak}</Text>
            <Text style={styles.statLabel}>day streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.weekCompletion}%</Text>
            <Text style={styles.statLabel}>week done</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.activeGoals}</Text>
            <Text style={styles.statLabel}>active goals</Text>
          </View>
        </View>

        {/* Pilot Card */}
        <View style={styles.pilotCard}>
          <View style={styles.pilotHeader}>
            <Text style={styles.pilotIcon}>✦</Text>
            <Text style={styles.pilotTitle}>Pilot</Text>
          </View>
          <Text style={styles.pilotMessage}>{nudge || "Loading your personalized nudge..."}</Text>
        </View>

        {/* Active Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Goals</Text>
          {goals.map((goal) => (
            <TouchableOpacity
              key={goal.id}
              style={styles.goalCard}
              onPress={() => router.push(`/goals/${goal.id}`)}
            >
              <View style={styles.goalHeader}>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                <Text style={styles.goalType}>{goal.type}</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${goal.progressPct}%` }]} />
              </View>
              <Text style={styles.progressText}>{goal.progressPct}% complete</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Today's Tasks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Tasks</Text>
          {tasks.map((task) => (
            <TouchableOpacity key={task.id} style={styles.taskCard}>
              <View style={[styles.checkbox, task.completed && styles.checkboxCompleted]}>
                {task.completed && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.taskContent}>
                <Text style={[styles.taskTitle, task.completed && styles.taskCompleted]}>
                  {task.title}
                </Text>
                <Text style={styles.taskGoal}>{task.goalTitle}</Text>
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 16,
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
  },
  goalType: {
    fontSize: 12,
    color: "#6366F1",
    backgroundColor: "#6366F120",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#374151",
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#6366F1",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: "#9CA3AF",
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
  taskGoal: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  bottomPadding: {
    height: 100,
  },
});