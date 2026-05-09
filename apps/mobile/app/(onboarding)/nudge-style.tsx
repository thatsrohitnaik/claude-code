import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

const NUDGE_STYLES = [
  { value: "gentle", label: "Gentle nudges", icon: "🌱", desc: "Soft language, frame as opportunity" },
  { value: "firm", label: "Firm reminders", icon: "🔥", desc: "Direct language, name the risks" },
  { value: "morning-only", label: "Morning only", icon: "🌅", desc: "Check in once at the start of day" },
  { value: "on-request", label: "On request", icon: "🤝", desc: "Only when I ask" },
];

export default function NudgeStyleScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const handleComplete = () => {
    // In production, call onboardingComplete API here
    router.replace("/(app)" as any);
  };

  return (
    <LinearGradient colors={["#0D0D0D", "#111111"]} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.step}>Step 6 of 6</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: "100%" }]} />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>How should Pilot check in?</Text>
        <Text style={styles.subtitle}>Choose how you want to be motivated</Text>

        <View style={styles.options}>
          {NUDGE_STYLES.map((style) => (
            <TouchableOpacity
              key={style.value}
              style={[styles.option, selected === style.value && styles.optionSelected]}
              onPress={() => setSelected(style.value)}
            >
              <Text style={styles.optionIcon}>{style.icon}</Text>
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, selected === style.value && styles.optionLabelSelected]}>
                  {style.label}
                </Text>
                <Text style={styles.optionDesc}>{style.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
          <Text style={styles.completeButtonText}>Complete Setup</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },
  header: { paddingHorizontal: 24, paddingTop: 60 },
  step: { fontSize: 14, color: "#9CA3AF", marginBottom: 12 },
  progressBar: { height: 4, backgroundColor: "#374151", borderRadius: 2 },
  progressFill: { height: "100%", backgroundColor: "#6366F1", borderRadius: 2 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 40 },
  title: { fontSize: 28, fontWeight: "700", color: "#FFFFFF", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#9CA3AF", marginBottom: 32 },
  options: { gap: 12 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionSelected: { borderColor: "#6366F1", backgroundColor: "#6366F120" },
  optionIcon: { fontSize: 32, marginRight: 16 },
  optionText: { flex: 1 },
  optionLabel: { fontSize: 18, color: "#FFFFFF", marginBottom: 4 },
  optionLabelSelected: { fontWeight: "600", color: "#6366F1" },
  optionDesc: { fontSize: 14, color: "#9CA3AF" },
  footer: { paddingHorizontal: 24, paddingBottom: 40 },
  completeButton: { backgroundColor: "#6366F1", paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  completeButtonText: { fontSize: 18, fontWeight: "600", color: "#FFFFFF" },
});