import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAppStore, Goal } from "../../src/store";

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

const HORIZONS = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
];

export default function GoalsScreen() {
  const router = useRouter();
  const { goals, addGoal } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    type: "CAREER",
    horizon: "MONTHLY",
  });

  const handleCreateGoal = () => {
    if (!newGoal.title.trim()) {
      Alert.alert("Error", "Please enter a goal title");
      return;
    }

    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.title.trim(),
      description: newGoal.description.trim(),
      type: newGoal.type,
      horizon: newGoal.horizon,
      progressPct: 0,
      status: "ACTIVE",
      priority: goals.length + 1,
    };

    addGoal(goal);
    setShowModal(false);
    setNewGoal({ title: "", description: "", type: "CAREER", horizon: "MONTHLY" });
  };

  const getGoalTypeColor = (type: string) => {
    const typeConfig = GOAL_TYPES.find(t => t.value === type);
    return typeConfig?.color || "#6366F1";
  };

  const activeGoals = goals.filter(g => g.status !== "COMPLETED");

  return (
    <LinearGradient colors={["#0D0D0D", "#111111"]} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Goals</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeGoals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>◎</Text>
            <Text style={styles.emptyTitle}>No goals yet</Text>
            <Text style={styles.emptyText}>
              Add your first goal to start tracking your progress
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => setShowModal(true)}>
              <Text style={styles.emptyButtonText}>Create Goal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.goalsList}>
            {activeGoals.map((goal) => (
              <TouchableOpacity
                key={goal.id}
                style={styles.goalCard}
                onPress={() => router.push(`/goals/${goal.id}` as any)}
              >
                <View style={styles.goalHeader}>
                  <View style={[styles.goalTypeBadge, { backgroundColor: getGoalTypeColor(goal.type) + "20" }]}>
                    <Text style={[styles.goalTypeText, { color: getGoalTypeColor(goal.type) }]}>
                      {GOAL_TYPES.find(t => t.value === goal.type)?.label || goal.type}
                    </Text>
                  </View>
                  <Text style={styles.goalHorizon}>{goal.horizon}</Text>
                </View>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                {goal.description && (
                  <Text style={styles.goalDescription} numberOfLines={2}>
                    {goal.description}
                  </Text>
                )}
                <View style={styles.goalProgress}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${goal.progressPct}%`, backgroundColor: getGoalTypeColor(goal.type) }
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>{goal.progressPct}%</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Create Goal Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Goal</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Goal title"
              placeholderTextColor="#6B7280"
              value={newGoal.title}
              onChangeText={(text) => setNewGoal({ ...newGoal, title: text })}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              placeholderTextColor="#6B7280"
              value={newGoal.description}
              onChangeText={(text) => setNewGoal({ ...newGoal, description: text })}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.fieldLabel}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
              {GOAL_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeChip,
                    newGoal.type === type.value && { backgroundColor: type.color + "30", borderColor: type.color }
                  ]}
                  onPress={() => setNewGoal({ ...newGoal, type: type.value })}
                >
                  <Text style={[
                    styles.typeChipText,
                    newGoal.type === type.value && { color: type.color }
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Time Horizon</Text>
            <View style={styles.horizonRow}>
              {HORIZONS.map((horizon) => (
                <TouchableOpacity
                  key={horizon.value}
                  style={[
                    styles.horizonChip,
                    newGoal.horizon === horizon.value && styles.horizonChipSelected
                  ]}
                  onPress={() => setNewGoal({ ...newGoal, horizon: horizon.value })}
                >
                  <Text style={[
                    styles.horizonChipText,
                    newGoal.horizon === horizon.value && styles.horizonChipTextSelected
                  ]}>
                    {horizon.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.createButton} onPress={handleCreateGoal}>
              <Text style={styles.createButtonText}>Create Goal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "300",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    color: "#374151",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  goalsList: {
    gap: 12,
  },
  goalCard: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 16,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  goalTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  goalTypeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  goalHorizon: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  goalDescription: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 12,
  },
  goalProgress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#374151",
    borderRadius: 3,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: "#9CA3AF",
    width: 40,
    textAlign: "right",
  },
  bottomPadding: {
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1F2937",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  modalClose: {
    fontSize: 20,
    color: "#9CA3AF",
  },
  input: {
    backgroundColor: "#111111",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#374151",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9CA3AF",
    marginBottom: 8,
  },
  typeScroll: {
    marginBottom: 16,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#111111",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#374151",
  },
  typeChipText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  horizonRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  horizonChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#111111",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#374151",
  },
  horizonChipSelected: {
    backgroundColor: "#6366F130",
    borderColor: "#6366F1",
  },
  horizonChipText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  horizonChipTextSelected: {
    color: "#6366F1",
    fontWeight: "600",
  },
  createButton: {
    backgroundColor: "#6366F1",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});