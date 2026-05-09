import { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAppStore } from "../../src/store";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DEMO_PLAN = {
  weeklyActions: [
    { day: "Mon", task: "Watch system design intro video", goalId: "1", estimatedMinutes: 30, scheduledFor: "evening" },
    { day: "Tue", task: "Morning run - 5k", goalId: "2", estimatedMinutes: 35, scheduledFor: "morning" },
    { day: "Wed", task: "Read for 30 minutes", goalId: "3", estimatedMinutes: 30, scheduledFor: "evening" },
    { day: "Thu", task: "Review system design chapter 2", goalId: "1", estimatedMinutes: 45, scheduledFor: "evening" },
    { day: "Fri", task: "Rest day - light stretching", goalId: "2", estimatedMinutes: 15, scheduledFor: "morning" },
    { day: "Sat", task: "Read for 1 hour", goalId: "3", estimatedMinutes: 60, scheduledFor: "afternoon" },
    { day: "Sun", task: "Weekly review + plan next week", goalId: "", estimatedMinutes: 45, scheduledFor: "morning" },
  ],
  resourceLinks: [
    { title: "Alex Xu System Design", url: "https://youtube.com", type: "video", estimatedHours: 4, goalId: "1", reason: "Perfect for interview prep" },
    { title: "Running for Beginners", url: "https://youtube.com", type: "video", estimatedHours: 2, goalId: "2", reason: "Build your cardio base" },
    { title: "Atomic Habits", url: "https://amazon.com", type: "book", estimatedHours: 5, goalId: "3", reason: "Build consistent habits" },
  ],
  planSummary: "This week focuses on building consistency in your career learning while maintaining your health routine. Start with smaller tasks and build momentum.",
};

export default function PlanScreen() {
  const { goals } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<typeof DEMO_PLAN | null>(null);

  useEffect(() => {
    // Load demo plan for now
    setPlan(DEMO_PLAN);
  }, []);

  const getGoalTitle = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    return goal?.title || "General";
  };

  const getTimeIcon = (scheduledFor: string) => {
    switch (scheduledFor) {
      case "morning": return "🌅";
      case "afternoon": return "☀️";
      case "evening": return "🌙";
      default: return "⏰";
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "video": return "🎬";
      case "course": return "📚";
      case "book": return "📖";
      case "article": return "📄";
      case "podcast": return "🎧";
      default: return "🔗";
    }
  };

  return (
    <LinearGradient colors={["#0D0D0D", "#111111"]} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Weekly Plan</Text>
          <Text style={styles.subtitle}>Week {new Date().toISO().split("-")[1]} of {new Date().getFullYear()}</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingText}>Generating your plan...</Text>
          </View>
        ) : plan ? (
          <>
            {/* Plan Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryText}>{plan.planSummary}</Text>
            </View>

            {/* Weekly Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>This Week's Actions</Text>
              {DAYS.map((day) => {
                const dayActions = plan.weeklyActions.filter(a => a.day === day);
                return (
                  <View key={day} style={styles.dayRow}>
                    <View style={styles.dayLabel}>
                      <Text style={styles.dayText}>{day}</Text>
                    </View>
                    <View style={styles.dayContent}>
                      {dayActions.length > 0 ? (
                        dayActions.map((action, idx) => (
                          <View key={idx} style={styles.actionItem}>
                            <Text style={styles.actionTime}>{getTimeIcon(action.scheduledFor)}</Text>
                            <View style={styles.actionDetails}>
                              <Text style={styles.actionTask}>{action.task}</Text>
                              <Text style={styles.actionMeta}>
                                {getGoalTitle(action.goalId)} · {action.estimatedMinutes} min
                              </Text>
                            </View>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.restDay}>Rest day</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Resources */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recommended Resources</Text>
              {plan.resourceLinks.map((resource, idx) => (
                <TouchableOpacity key={idx} style={styles.resourceCard}>
                  <View style={styles.resourceHeader}>
                    <Text style={styles.resourceIcon}>{getResourceIcon(resource.type)}</Text>
                    <View style={styles.resourceInfo}>
                      <Text style={styles.resourceTitle}>{resource.title}</Text>
                      <Text style={styles.resourceMeta}>
                        {resource.type} · {resource.estimatedHours} hours
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.resourceReason}>{resource.reason}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No plan yet</Text>
            <Text style={styles.emptyText}>
              Complete onboarding to get your personalized weekly plan
            </Text>
          </View>
        )}

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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 16,
    color: "#9CA3AF",
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: "#9CA3AF",
    marginTop: 12,
  },
  summaryCard: {
    marginHorizontal: 20,
    backgroundColor: "#6366F120",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#6366F130",
    marginBottom: 20,
  },
  summaryText: {
    fontSize: 16,
    color: "#E5E7EB",
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
  dayRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  dayLabel: {
    width: 50,
    paddingVertical: 8,
  },
  dayText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  dayContent: {
    flex: 1,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  actionTime: {
    fontSize: 16,
    marginRight: 10,
  },
  actionDetails: {
    flex: 1,
  },
  actionTask: {
    fontSize: 15,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  actionMeta: {
    fontSize: 12,
    color: "#6B7280",
  },
  restDay: {
    fontSize: 14,
    color: "#4B5563",
    fontStyle: "italic",
    paddingVertical: 8,
  },
  resourceCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  resourceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  resourceIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  resourceMeta: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  resourceReason: {
    fontSize: 14,
    color: "#9CA3AF",
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
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
  },
  bottomPadding: {
    height: 100,
  },
});