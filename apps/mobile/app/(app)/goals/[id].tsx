import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAppStore, Goal } from "../../../src/store";

const GOAL_TYPES = [
  { value: "CAREER", label: "Career", color: "#6366F1" },
  { value: "HEALTH", label: "Health", color: "#10B981" },
  { value: "LEARNING", label: "Learning", color: "#F59E0B" },
  { value: "CREATIVITY", label: "Creativity", color: "#EC4899" },
  { value: "FINANCE", label: "Finance", color: "#8B5CF6" },
  { value: "RELATIONSHIPS", label: "Relationships", color: "#F472B6" },
  { value: "SIDE_PROJECT", label: "Side Project", color: "#14B8A6" },
  { value: "MENTAL_WELLNESS", label: "Mental Wellness", color: "#A78BFA" },
];

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { goals, tasks, updateGoal, removeGoal } = useAppStore();

  const goal = goals.find(g => g.id === id);
  const goalTasks = tasks.filter(t => t.goalId === id);

  if (!goal) {
    return (
      <LinearGradient colors={["#0D0D0D", "#111111"]} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Goal not found</Text>
        </View>
      </LinearGradient>
    );
  }

  const getGoalTypeColor = (type: string) => {
    const typeConfig = GOAL_TYPES.find(t => t.value === type);
    return typeConfig?.color || "#6366F1";
  };

  const handleProgressChange = (delta: number) => {
    const newProgress = Math.max(0, Math.min(100, goal.progressPct + delta));
    let status: string = goal.status;
    if (newProgress >= 80) status = "ON_TRACK";
    else if (newProgress >= 40) status = "ACTIVE";
    else status = "AT_RISK";

    updateGoal(goal.id, { progressPct: newProgress, status });
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Goal",
      "Are you sure you want to delete this goal?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            removeGoal(goal.id);
            router.back();
          },
        },
      ]
    );
  };

  const color = getGoalTypeColor(goal.type);

  return (
    <LinearGradient colors={["#0D0D0D", "#111111"]} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}>
            <Text style={styles.deleteButton}>Delete</Text>
          </TouchableOpacity>
        </View>

        {/* Goal Type Badge */}
        <View style={styles.typeContainer}>
          <View style={[styles.typeBadge, { backgroundColor: color + "20" }]}>
            <Text style={[styles.typeText, { color }]}>
              {GOAL_TYPES.find(t => t.value === goal.type)?.label || goal.type}
            </Text>
          </View>
          <Text style={styles.horizon}>{goal.horizon}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{goal.title}</Text>
        {goal.description && (
          <Text style={styles.description}>{goal.description}</Text>
        )}

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <Text style={styles.sectionTitle}>Progress</Text>
          <View style={styles.progressContainer}>
            <TouchableOpacity style={styles.progressButton} onPress={() => handleProgressChange(-10)}>
              <Text style={styles.progressButtonText}>-</Text>
            </TouchableOpacity>
            <View style={styles.progressCircle}>
              <Text style={[styles.progressValue, { color }]}>{goal.progressPct}%</Text>
            </View>
            <TouchableOpacity style={styles.progressButton} onPress={() => handleProgressChange(10)}>
              <Text style={styles.progressButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${goal.progressPct}%`, backgroundColor: color }]} />
          </View>
          <View style={[styles.statusBadge, {
            backgroundColor: goal.status === "ON_TRACK" ? "#10B98120" : goal.status === "AT_RISK" ? "#F59E0B20" : "#6366F120",
          }]}>
            <Text style={[styles.statusText, {
              color: goal.status === "ON_TRACK" ? "#10B981" : goal.status === "AT_RISK" ? "#F59E0B" : "#6366F1"
            }]}>
              {goal.status.replace("_", " ")}
            </Text>
          </View>
        </View>

        {/* Tasks Section */}
        <View style={styles.tasksSection}>
          <Text style={styles.sectionTitle}>Tasks</Text>
          {goalTasks.length === 0 ? (
            <Text style={styles.emptyTasks}>No tasks yet</Text>
          ) : (
            goalTasks.map((task) => (
              <View key={task.id} style={styles.taskItem}>
                <View style={[styles.taskCheckbox, task.completed && { backgroundColor: color, borderColor: color }]}>
                  {task.completed && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.taskTitle, task.completed && styles.taskCompleted]}>
                  {task.title}
                </Text>
              </View>
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
  backButton: {
    fontSize: 28,
    color: "#FFFFFF",
  },
  deleteButton: {
    fontSize: 16,
    color: "#EF4444",
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundText: {
    fontSize: 18,
    color: "#9CA3AF",
  },
  typeContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 12,
  },
  typeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  horizon: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "#9CA3AF",
    paddingHorizontal: 20,
    marginBottom: 24,
    lineHeight: 24,
  },
  progressSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    gap: 20,
  },
  progressButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1F2937",
    alignItems: "center",
    justifyContent: "center",
  },
  progressButtonText: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "300",
  },
  progressCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#1F2937",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#374151",
  },
  progressValue: {
    fontSize: 28,
    fontWeight: "700",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#374151",
    borderRadius: 4,
    marginBottom: 12,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  statusBadge: {
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  tasksSection: {
    paddingHorizontal: 20,
  },
  emptyTasks: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    paddingVertical: 20,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#374151",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  taskTitle: {
    fontSize: 16,
    color: "#FFFFFF",
    flex: 1,
  },
  taskCompleted: {
    textDecorationLine: "line-through",
    color: "#6B7280",
  },
  bottomPadding: {
    height: 100,
  },
});