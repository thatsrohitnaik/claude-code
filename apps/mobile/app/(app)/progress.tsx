import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAppStore } from "../../src/store";

const RADAR_AXES = [
  { label: "Career", key: "CAREER", color: "#6366F1" },
  { label: "Learning", key: "LEARNING", color: "#F59E0B" },
  { label: "Health", key: "HEALTH", color: "#10B981" },
  { label: "Creativity", key: "CREATIVITY", color: "#EC4899" },
  { label: "Side Project", key: "SIDE_PROJECT", color: "#14B8A6" },
  { label: "Mindset", key: "MENTAL_WELLNESS", color: "#A78BFA" },
];

const DEMO_WEEKLY_REPORT = {
  weekNumber: 19,
  year: 2025,
  tasksCompleted: 12,
  streakDays: 7,
  weekScore: 78,
  focusHours: 18.5,
  goalProgress: [
    { goalId: "1", title: "Learn system design", progressPct: 45, progressDelta: 15, status: "on_track" },
    { goalId: "2", title: "Run 5k three times", progressPct: 60, progressDelta: 20, status: "on_track" },
    { goalId: "3", title: "Read 12 books this year", progressPct: 25, progressDelta: 5, status: "at_risk" },
  ],
  insights: [
    { type: "win", text: "You completed 12 tasks this week - your best streak yet!", goalId: "1" },
    { type: "observation", text: "Health goals are tracking well with 20% progress increase", goalId: "2" },
    { type: "risk", text: "Reading goal needs attention - consider adjusting the target", goalId: "3" },
  ],
  recommendations: [
    { title: "Read 30 mins daily", description: "Small consistent actions build momentum", resourceType: "habit", goalId: "3", estimatedTime: "30 mins" },
  ],
};

export default function ProgressScreen() {
  const { goals, streakDays, weekCompletion, tasks } = useAppStore();
  const completedTasks = tasks.filter(t => t.completed).length;

  // Calculate radar scores based on goal types
  const getRadarScore = (type: string) => {
    const typeGoals = goals.filter(g => g.type === type);
    if (typeGoals.length === 0) return Math.random() * 40 + 20; // Demo value
    const avgProgress = typeGoals.reduce((sum, g) => sum + g.progressPct, 0) / typeGoals.length;
    return avgProgress || Math.random() * 40 + 20;
  };

  const radarScores = RADAR_AXES.map(axis => ({
    ...axis,
    score: getRadarScore(axis.key),
  }));

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "win": return "🏆";
      case "risk": return "⚠️";
      case "observation": return "💡";
      case "pattern": return "📊";
      default: return "📝";
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case "win": return "#10B981";
      case "risk": return "#F59E0B";
      case "observation": return "#6366F1";
      case "pattern": return "#EC4899";
      default: return "#9CA3AF";
    }
  };

  const report = DEMO_WEEKLY_REPORT;

  return (
    <LinearGradient colors={["#0D0D0D", "#111111"]} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Progress</Text>
          <Text style={styles.subtitle}>Week {report.weekNumber}, {report.year}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{streakDays}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{weekCompletion}%</Text>
            <Text style={styles.statLabel}>Week Score</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{completedTasks}</Text>
            <Text style={styles.statLabel}>Tasks Done</Text>
          </View>
        </View>

        {/* Growth Radar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Growth Radar</Text>
          <View style={styles.radarContainer}>
            <View style={styles.radarChart}>
              {radarScores.map((item, index) => {
                const angle = (index * 60 - 90) * (Math.PI / 180);
                const radius = (item.score / 100) * 80;
                const x = 100 + radius * Math.cos(angle);
                const y = 100 + radius * Math.sin(angle);

                return (
                  <View key={item.label}>
                    {/* Axis label */}
                    <View style={[styles.radarLabel, getRadarLabelPosition(index)]}>
                      <Text style={styles.radarLabelText}>{item.label}</Text>
                      <Text style={[styles.radarScore, { color: item.color }]}>{Math.round(item.score)}%</Text>
                    </View>
                    {/* Axis line */}
                    <View style={[styles.radarAxis, { transform: [{ rotate: `${index * 60}deg` }`] }]} />
                    {/* Data point */}
                    <View style={[styles.radarPoint, { left: x - 6, top: y - 6, backgroundColor: item.color }]} />
                  </View>
                );
              })}
              {/* Center circle */}
              <View style={styles.radarCenter} />
              {/* Grid circles */}
              <View style={[styles.radarGrid, styles.radarGrid33]} />
              <View style={[styles.radarGrid, styles.radarGrid66]} />
              <View style={styles.radarGrid} />
            </View>
          </View>
        </View>

        {/* Goal Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goal Progress</Text>
          {report.goalProgress.map((goal, idx) => (
            <View key={idx} style={styles.goalItem}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                <Text style={styles.goalDelta}>
                  {goal.progressDelta > 0 ? `+${goal.progressDelta}%` : `${goal.progressDelta}%`}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${goal.progressPct}%`,
                      backgroundColor: goal.status === "on_track" ? "#10B981" : goal.status === "at_risk" ? "#F59E0B" : "#6366F1"
                    }
                  ]}
                />
              </View>
              <View style={styles.goalMeta}>
                <Text style={styles.goalProgressText}>{goal.progressPct}%</Text>
                <View style={[styles.statusBadge, { backgroundColor: goal.status === "on_track" ? "#10B98120" : "#F59E0B20" }]}>
                  <Text style={[styles.statusText, { color: goal.status === "on_track" ? "#10B981" : "#F59E0B" }]}>
                    {goal.status.replace("_", " ")}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week's Insights</Text>
          {report.insights.map((insight, idx) => (
            <View key={idx} style={[styles.insightCard, { borderLeftColor: getInsightColor(insight.type) }]}>
              <Text style={styles.insightIcon}>{getInsightIcon(insight.type)}</Text>
              <Text style={styles.insightText}>{insight.text}</Text>
            </View>
          ))}
        </View>

        {/* Recommendations */}
        {report.recommendations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            {report.recommendations.map((rec, idx) => (
              <View key={idx} style={styles.recCard}>
                <Text style={styles.recTitle}>{rec.title}</Text>
                <Text style={styles.recDescription}>{rec.description}</Text>
                <Text style={styles.recMeta}>
                  {rec.resourceType} · {rec.estimatedTime}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </LinearGradient>
  );
}

function getRadarLabelPosition(index: number) {
  const positions = [
    { top: -30, left: 80 },
    { top: 20, left: 160 },
    { top: 140, left: 140 },
    { top: 140, left: 40 },
    { top: 20, left: -20 },
    { top: -30, left: 20 },
  ];
  return positions[index];
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
  radarContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  radarChart: {
    width: 200,
    height: 200,
    position: "relative",
  },
  radarGrid: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: "#374151",
    top: 20,
    left: 20,
  },
  radarGrid33: {
    width: 106,
    height: 106,
    borderRadius: 53,
    top: 47,
    left: 47,
  },
  radarGrid66: {
    width: 133,
    height: 133,
    borderRadius: 66,
    top: 33,
    left: 33,
  },
  radarCenter: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6366F1",
    top: 96,
    left: 96,
  },
  radarAxis: {
    position: "absolute",
    width: 1,
    height: 80,
    backgroundColor: "#374151",
    top: 100,
    left: 100,
    transformOrigin: "top",
  },
  radarPoint: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  radarLabel: {
    position: "absolute",
    alignItems: "center",
  },
  radarLabelText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 2,
  },
  radarScore: {
    fontSize: 14,
    fontWeight: "600",
  },
  goalItem: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    flex: 1,
  },
  goalDelta: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10B981",
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
  goalMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalProgressText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "500",
  },
  insightCard: {
    flexDirection: "row",
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    alignItems: "flex-start",
  },
  insightIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 15,
    color: "#E5E7EB",
    lineHeight: 22,
  },
  recCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  recTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  recDescription: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 8,
  },
  recMeta: {
    fontSize: 12,
    color: "#6B7280",
  },
  bottomPadding: {
    height: 100,
  },
});