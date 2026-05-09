import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

const ACTIVE_TIMES = [
  { value: "morning", label: "Early Morning", icon: "🌅", time: "5am - 9am" },
  { value: "lunch", label: "Lunch Break", icon: "☀️", time: "12pm - 2pm" },
  { value: "evening", label: "After Work", icon: "🌆", time: "5pm - 8pm" },
  { value: "night", label: "Late Night", icon: "🌙", time: "8pm - 12am" },
  { value: "weekends", label: "Weekends Only", icon: "📅", time: "Sat - Sun" },
];

export default function ActiveTimeScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinue = () => {
    router.push("/onboarding/nudge-style" as any);
  };

  return (
    <LinearGradient colors={["#0D0D0D", "#111111"]} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.step}>Step 5 of 6</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: "80%" }]} />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>When do you have time?</Text>
        <Text style={styles.subtitle}>When are you most likely to have 15-30 mins for yourself?</Text>

        <View style={styles.options}>
          {ACTIVE_TIMES.map((time) => (
            <TouchableOpacity
              key={time.value}
              style={[styles.option, selected === time.value && styles.optionSelected]}
              onPress={() => setSelected(time.value)}
            >
              <Text style={styles.optionIcon}>{time.icon}</Text>
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, selected === time.value && styles.optionLabelSelected]}>
                  {time.label}
                </Text>
                <Text style={styles.optionTime}>{time.time}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
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
  optionTime: { fontSize: 14, color: "#9CA3AF" },
  footer: { paddingHorizontal: 24, paddingBottom: 40 },
  continueButton: { backgroundColor: "#6366F1", paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  continueButtonText: { fontSize: 18, fontWeight: "600", color: "#FFFFFF" },
});