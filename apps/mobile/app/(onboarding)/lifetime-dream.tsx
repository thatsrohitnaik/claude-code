import { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

export default function LifetimeDreamScreen() {
  const router = useRouter();
  const [dream, setDream] = useState("");

  const handleContinue = () => {
    router.push("/onboarding/growth-areas" as any);
  };

  return (
    <LinearGradient colors={["#0D0D0D", "#111111"]} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.step}>Step 3 of 6</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: "50%" }]} />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>What's your vision?</Text>
        <Text style={styles.subtitle}>What does your ideal life look like in 10 years?</Text>

        <TextInput
          style={styles.input}
          placeholder="Imagine your best self..."
          placeholderTextColor="#6B7280"
          value={dream}
          onChangeText={setDream}
          multiline
          maxLength={500}
        />
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
  input: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 20,
    fontSize: 18,
    color: "#FFFFFF",
    minHeight: 150,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#374151",
  },
  footer: { paddingHorizontal: 24, paddingBottom: 40 },
  continueButton: { backgroundColor: "#6366F1", paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  continueButtonText: { fontSize: 18, fontWeight: "600", color: "#FFFFFF" },
});