import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Switch,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/auth";
import {
  getJourneys,
  getAmbitions,
  getRituals,
  getWeekStats,
  getRitualsCount,
  getJourneysCount,
  getAmbitionsCount,
  updateUserSettings,
  pauseRitual,
  deleteRitual,
  type Journey,
  type Ambition,
  type Ritual,
} from "../../lib/db";

export default function MyWorldScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // State
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [ambitions, setAmbitions] = useState<Ambition[]>([]);
  const [rituals, setRituals] = useState<Ritual[]>([]);
  const [weekStats, setWeekStats] = useState({ total: 0, completed: 0, completionPct: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [fridayWindup, setFridayWindup] = useState(true);
  const [eveningTime, setEveningTime] = useState("21:00");

  // Load data
  const loadData = async () => {
    if (!user) {
      // Demo mode - show empty state
      setJourneys([]);
      setAmbitions([]);
      setRituals([]);
      return;
    }

    try {
      const [journeysData, ambitionsData, ritualsData, week, settings] = await Promise.all([
        getJourneys(user.id),
        getAmbitions(user.id),
        getRituals(user.id),
        getWeekStats(user.id),
        user ? import("../../lib/db").then(db => db.getUserSettings(user.id)) : Promise.resolve(null),
      ]);

      setJourneys(journeysData);
      setAmbitions(ambitionsData);
      setRituals(ritualsData);
      setWeekStats(week);

      if (settings) {
        setFridayWindup(settings.friday_windup_enabled);
        setEveningTime(settings.evening_checkin_time);
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

  // Handle ritual long press
  const handleRitualLongPress = (ritual: Ritual) => {
    Alert.alert(
      ritual.title,
      "What would you like to do?",
      [
        {
          text: "Pause for a week",
          onPress: () => handlePauseRitual(ritual, 7),
        },
        {
          text: "Pause for a month",
          onPress: () => handlePauseRitual(ritual, 30),
        },
        {
          text: "Edit via Pilot",
          onPress: () => router.push(`/pilot?message=I want to change my ${ritual.title} ritual`),
        },
        {
          text: "Remove this ritual",
          style: "destructive",
          onPress: () => handleDeleteRitual(ritual),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const handlePauseRitual = async (ritual: Ritual, days: number) => {
    if (!user) return;
    const until = new Date();
    until.setDate(until.getDate() + days);

    try {
      await pauseRitual(ritual.id, until);
      await loadData();
    } catch (error) {
      console.error("Error pausing ritual:", error);
    }
  };

  const handleDeleteRitual = async (ritual: Ritual) => {
    if (!user) return;

    try {
      await deleteRitual(ritual.id);
      await loadData();
    } catch (error) {
      console.error("Error deleting ritual:", error);
    }
  };

  // Handle settings changes
  const handleFridayWindupToggle = async (value: boolean) => {
    if (!user) return;
    setFridayWindup(value);
    try {
      await updateUserSettings(user.id, { friday_windup_enabled: value });
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  // Format frequency for display
  const formatFrequency = (frequency: string): string => {
    const labels: Record<string, string> = {
      daily: "every day",
      every_2_days: "every 2 days",
      every_3_days: "every 3 days",
      weekly: "weekly",
      every_2_weeks: "every 2 weeks",
      monthly: "monthly",
      every_3_months: "every 3 months",
      every_6_months: "every 6 months",
      yearly: "yearly",
    };
    return labels[frequency] || frequency;
  };

  // Format day for display
  const formatDay = (day: string | null): string => {
    if (!day) return "";
    const labels: Record<string, string> = {
      mon: "Monday",
      tue: "Tuesday",
      wed: "Wednesday",
      thu: "Thursday",
      fri: "Friday",
      sat: "Saturday",
      sun: "Sunday",
    };
    return ` · ${labels[day] || day}`;
  };

  // Calculate needs attention count
  const needsAttention = weekStats.total - weekStats.completed;

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
          <Text style={styles.title}>My World</Text>
        </View>

        {/* This Week Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>The big picture</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${weekStats.completionPct}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {weekStats.completionPct}% of your week — nailed it
            </Text>
            <View style={styles.statsRow}>
              <Text style={styles.statText}>
                {weekStats.completed} things done
              </Text>
              <Text style={styles.statDivider}>·</Text>
              <Text style={[styles.statText, needsAttention > 0 && styles.statTextWarning]}>
                {needsAttention} needs attention
              </Text>
            </View>
          </View>
        </View>

        {/* Your Journeys */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your journeys</Text>

          {journeys.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateText}>No journeys yet</Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => router.push("/pilot?message=I want to learn ")}
              >
                <Text style={styles.emptyStateButtonText}>
                  Tell Pilot you want to learn something
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            journeys.map(journey => (
              <View key={journey.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardEmoji}>{journey.emoji || "📚"}</Text>
                  <Text style={styles.cardTitle}>{journey.title}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      journey.status === "in_motion" && styles.statusBadgeActive,
                      journey.status === "paused" && styles.statusBadgePaused,
                      journey.status === "nailed_it" && styles.statusBadgeDone,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        journey.status === "in_motion" && styles.statusBadgeTextActive,
                        journey.status === "paused" && styles.statusBadgeTextPaused,
                        journey.status === "nailed_it" && styles.statusBadgeTextDone,
                      ]}
                    >
                      {journey.status === "in_motion" ? "in motion" : journey.status === "paused" ? "paused" : "nailed it"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardMeta}>
                  Chapter {journey.current_chapter} of {journey.total_chapters}
                </Text>
                <View style={styles.progressBarSmall}>
                  <View
                    style={[
                      styles.progressFillSmall,
                      { width: `${journey.progress_pct}%` },
                    ]}
                  />
                </View>
                <Text style={styles.cardProgress}>{journey.progress_pct}% done</Text>
              </View>
            ))
          )}
        </View>

        {/* Your Rituals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your rituals</Text>

          {rituals.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateText}>No rituals yet</Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => router.push("/pilot")}
              >
                <Text style={styles.emptyStateButtonText}>+ Add more rituals</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {rituals.map(ritual => (
                <TouchableOpacity
                  key={ritual.id}
                  style={styles.ritualRow}
                  onLongPress={() => handleRitualLongPress(ritual)}
                  delayLongPress={500}
                >
                  <Text style={styles.ritualEmoji}>{ritual.emoji || "✨"}</Text>
                  <View style={styles.ritualContent}>
                    <Text style={styles.ritualTitle}>{ritual.title}</Text>
                    <Text style={styles.ritualMeta}>
                      {formatFrequency(ritual.frequency)}
                      {formatDay(ritual.preferred_day)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.smallStatusBadge,
                      ritual.is_paused && styles.smallStatusBadgePaused,
                    ]}
                  >
                    <Text
                      style={[
                        styles.smallStatusText,
                        ritual.is_paused && styles.smallStatusTextPaused,
                      ]}
                    >
                      {ritual.is_paused ? "paused" : "in motion"}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.addMoreButton}
                onPress={() => router.push("/pilot")}
              >
                <Text style={styles.addMoreButtonText}>+ Add more rituals</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Your Ambitions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your big ambitions</Text>

          {ambitions.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateText}>No big ambitions set yet</Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => router.push("/pilot?message=I want to ")}
              >
                <Text style={styles.emptyStateButtonText}>
                  Tell Pilot about a big goal
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            ambitions.map(ambition => (
              <View key={ambition.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardEmoji}>{ambition.emoji || "🎯"}</Text>
                  <Text style={styles.cardTitle}>{ambition.title}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      ambition.status === "in_motion" && styles.statusBadgeActive,
                      ambition.status === "paused" && styles.statusBadgePaused,
                      ambition.status === "nailed_it" && styles.statusBadgeDone,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        ambition.status === "in_motion" && styles.statusBadgeTextActive,
                        ambition.status === "paused" && styles.statusBadgeTextPaused,
                        ambition.status === "nailed_it" && styles.statusBadgeTextDone,
                      ]}
                    >
                      {ambition.status === "in_motion" ? "in motion" : ambition.status === "paused" ? "paused" : "nailed it"}
                    </Text>
                  </View>
                </View>
                {ambition.description && (
                  <Text style={styles.cardDescription}>{ambition.description}</Text>
                )}
                <View style={styles.progressBarSmall}>
                  <View
                    style={[
                      styles.progressFillSmall,
                      { width: `${ambition.progress_pct}%` },
                    ]}
                  />
                </View>
                <Text style={styles.cardProgress}>
                  {ambition.progress_pct}% complete
                </Text>
              </View>
            ))
          )}
        </View>

        {/* How Far You've Come */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How far you've come</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statCardValue}>{weekStats.completed}</Text>
              <Text style={styles.statCardLabel}>things done this month</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statCardValue}>{Math.max(...journeys.map(j => j.progress_pct), 0)}%</Text>
              <Text style={styles.statCardLabel}>best journey progress</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statCardValue}>{rituals.filter(r => !r.is_paused).length}</Text>
              <Text style={styles.statCardLabel}>rituals in motion</Text>
            </View>
          </View>

          <Text style={styles.historyTitle}>Your roll history</Text>
          <View style={styles.historyChart}>
            {[65, 80, 45, 90, 70, 55, 85].map((value, index) => (
              <View key={index} style={styles.historyBar}>
                <View
                  style={[
                    styles.historyBarFill,
                    { height: `${value}%` },
                    value > 70 && styles.historyBarFillGood,
                    value >= 40 && value <= 70 && styles.historyBarFillMedium,
                    value < 40 && styles.historyBarFillLow,
                  ]}
                />
                <Text style={styles.historyBarLabel}>
                  {["M", "T", "W", "T", "F", "S", "S"][index]}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Your Space (Settings) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your space</Text>

          <View style={styles.settingsCard}>
            <View style={styles.settingsRow}>
              <Text style={styles.settingsLabel}>Evening check-in time</Text>
              <TextInput
                style={styles.settingsValue}
                value={eveningTime}
                onChangeText={setEveningTime}
                placeholder="21:00"
                placeholderTextColor="#5A5A5A"
              />
            </View>

            <View style={styles.settingsRow}>
              <Text style={styles.settingsLabel}>Friday wind-down</Text>
              <Switch
                value={fridayWindup}
                onValueChange={handleFridayWindupToggle}
                trackColor={{ false: "#2A2A2A", true: "#7C3AED" }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingsRow}>
              <Text style={styles.settingsLabel}>Notifications</Text>
              <Switch
                value={true}
                onValueChange={() => {}}
                trackColor={{ false: "#2A2A2A", true: "#7C3AED" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* App Version */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Version 1.0.0</Text>
          <Text style={styles.footerText}>Made with ✦ by Pilot</Text>
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
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  // Progress card
  progressCard: {
    backgroundColor: "#141414",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#2A2A2A",
    borderRadius: 4,
    marginBottom: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#7C3AED",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 15,
    color: "#FFFFFF",
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    fontSize: 14,
    color: "#9A9A9A",
  },
  statDivider: {
    marginHorizontal: 8,
    color: "#5A5A5A",
  },
  statTextWarning: {
    color: "#F59E0B",
  },
  // Card styles
  card: {
    backgroundColor: "#141414",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeActive: {
    backgroundColor: "#7C3AED20",
  },
  statusBadgePaused: {
    backgroundColor: "#F59E0B20",
  },
  statusBadgeDone: {
    backgroundColor: "#10B98120",
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  statusBadgeTextActive: {
    color: "#7C3AED",
  },
  statusBadgeTextPaused: {
    color: "#F59E0B",
  },
  statusBadgeTextDone: {
    color: "#10B981",
  },
  cardMeta: {
    fontSize: 14,
    color: "#9A9A9A",
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: "#9A9A9A",
    marginBottom: 12,
  },
  progressBarSmall: {
    height: 4,
    backgroundColor: "#2A2A2A",
    borderRadius: 2,
    marginBottom: 8,
    overflow: "hidden",
  },
  progressFillSmall: {
    height: "100%",
    backgroundColor: "#7C3AED",
    borderRadius: 2,
  },
  cardProgress: {
    fontSize: 12,
    color: "#9A9A9A",
  },
  // Empty state
  emptyStateCard: {
    backgroundColor: "#141414",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 15,
    color: "#9A9A9A",
    marginBottom: 16,
  },
  emptyStateButton: {
    backgroundColor: "#7C3AED20",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    fontSize: 14,
    color: "#7C3AED",
    fontWeight: "500",
  },
  // Ritual row
  ritualRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141414",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  ritualEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  ritualContent: {
    flex: 1,
  },
  ritualTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  ritualMeta: {
    fontSize: 12,
    color: "#9A9A9A",
    marginTop: 4,
  },
  smallStatusBadge: {
    backgroundColor: "#7C3AED20",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  smallStatusBadgePaused: {
    backgroundColor: "#F59E0B20",
  },
  smallStatusText: {
    fontSize: 11,
    color: "#7C3AED",
    fontWeight: "500",
  },
  smallStatusTextPaused: {
    color: "#F59E0B",
  },
  addMoreButton: {
    alignItems: "center",
    paddingVertical: 16,
  },
  addMoreButtonText: {
    fontSize: 14,
    color: "#7C3AED",
    fontWeight: "500",
  },
  // Stats grid
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#141414",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  statCardLabel: {
    fontSize: 11,
    color: "#9A9A9A",
    textAlign: "center",
  },
  // History chart
  historyTitle: {
    fontSize: 14,
    color: "#9A9A9A",
    marginBottom: 12,
  },
  historyChart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 80,
    backgroundColor: "#141414",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  historyBar: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
  },
  historyBarFill: {
    width: "60%",
    borderRadius: 4,
    backgroundColor: "#7C3AED",
  },
  historyBarFillGood: {
    backgroundColor: "#7C3AED",
  },
  historyBarFillMedium: {
    backgroundColor: "#F59E0B",
  },
  historyBarFillLow: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#EF4444",
  },
  historyBarLabel: {
    fontSize: 12,
    color: "#5A5A5A",
    marginTop: 8,
  },
  // Settings
  settingsCard: {
    backgroundColor: "#141414",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  settingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  settingsLabel: {
    fontSize: 15,
    color: "#FFFFFF",
  },
  settingsValue: {
    fontSize: 15,
    color: "#9A9A9A",
    textAlign: "right",
  },
  // Footer
  footer: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    color: "#5A5A5A",
    marginBottom: 4,
  },
  bottomPadding: {
    height: 100,
  },
});