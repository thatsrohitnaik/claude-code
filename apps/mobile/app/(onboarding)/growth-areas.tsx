import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

const GROWTH_AREAS = [
  { value: "CAREER", label: "Career / Skills", icon: "💼" },
  { value: "HEALTH", label: "Health & Fitness", icon: "💪" },
  { value: "LEARNING", label: "Learning & Reading", icon: "📚" },
  { value: "CREATIVITY", label: "Creativity", icon: "🎨" },
  { value: "RELATIONSHIPS", label: "Relationships", icon: "❤️" },
  { value: "FINANCE", label: "Finance", icon: "💰" },
  { value: "MENTAL_WELLNESS", label: "Mental Wellness", icon: "🧘" },
  { value: "SIDE_PROJECT", label: "Side Projects", icon: "🚀" },
];

export default function GrowthAreasScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (value: string) => {
    setSelected(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const handleContinue = () => {
    router.push("/onboarding/active-time" as any);
  };

  return (
    <LinearGradient colors={["#0D0D0D", "#111111"]} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.step}>Step 4 of 6</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: "66%" }]} />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Where do you want to grow?</Text>
        <Text style={styles.subtitle}>Select all that apply</Text>

        <View style={styles.options}>
          {GROWTH_AREAS.map((area) => (
            <TouchableOpacity
              key={area.value}
              style={[styles.option, selected.includes(area.value) && styles.optionSelected]}
              onPress={() => toggle(area.value)}
            >
              <Text style={styles.optionIcon}>{area.icon}</Text>
              <Text style={[styles.optionLabel, selected.includes(area.value) && styles.optionLabelSelected]}>
                {area.label}
              </Text>
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
  subtitle: { fontSize: 16, color: "#9CA3AF", marginBottom: 24 },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionSelected: { borderColor: "#6366F1", backgroundColor: "#6366F120" },
  optionIcon: { fontSize: 20, marginRight: 8 },
  optionLabel: { fontSize: 14, color: "#FFFFFF" },
  optionLabelSelected: { color: "#6366F1", fontWeight: "600" },
  footer: { paddingHorizontal: 24, paddingBottom: 40 },
  continueButton: { backgroundColor: "#6366F1", paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  continueButtonText: { fontSize: 18, fontWeight: "600", color: "#FFFFFF" },
});