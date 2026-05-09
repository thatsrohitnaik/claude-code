import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAppStore } from "../../src/store";

const LIFE_STAGES = [
  { value: "student", label: "Student", icon: "🎓" },
  { value: "early-career", label: "Early career", icon: "💼" },
  { value: "mid-career", label: "Mid-career", icon: "📈" },
  { value: "freelancer", label: "Freelancer / Founder", icon: "🚀" },
  { value: "parent", label: "Parent", icon: "👨‍👩‍👧" },
  { value: "career-change", label: "Career change", icon: "🔄" },
];

export default function LifeStageScreen() {
  const router = useRouter();
  const { userName, setUser } = useAppStore();
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinue = () => {
    if (selected) {
      setUser({ lifeStage: selected });
      router.push("/onboarding/big-goal" as any);
    }
  };

  return (
    <LinearGradient colors={["#0D0D0D", "#111111"]} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.step}>Step 1 of 6</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: "16%" }]} />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Where are you in your journey?</Text>
        <Text style={styles.subtitle}>This helps us personalize your experience</Text>

        <View style={styles.options}>
          {LIFE_STAGES.map((stage) => (
            <TouchableOpacity
              key={stage.value}
              style={[styles.option, selected === stage.value && styles.optionSelected]}
              onPress={() => setSelected(stage.value)}
            >
              <Text style={styles.optionIcon}>{stage.icon}</Text>
              <Text style={[styles.optionLabel, selected === stage.value && styles.optionLabelSelected]}>
                {stage.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, !selected && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!selected}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  step: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#374151",
    borderRadius: 2,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#6366F1",
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#9CA3AF",
    marginBottom: 32,
  },
  options: {
    gap: 12,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionSelected: {
    borderColor: "#6366F1",
    backgroundColor: "#6366F120",
  },
  optionIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  optionLabel: {
    fontSize: 18,
    color: "#FFFFFF",
  },
  optionLabelSelected: {
    fontWeight: "600",
    color: "#6366F1",
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  continueButton: {
    backgroundColor: "#6366F1",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  continueButtonDisabled: {
    backgroundColor: "#374151",
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});