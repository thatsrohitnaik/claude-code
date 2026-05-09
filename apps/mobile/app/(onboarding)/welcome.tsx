import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <LinearGradient colors={["#0D0D0D", "#111111"]} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>✦</Text>
        </View>

        <Text style={styles.title}>Welcome to LifePilot</Text>
        <Text style={styles.subtitle}>
          Your AI-powered life co-pilot that helps you achieve your goals
        </Text>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🎯</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Set Goals</Text>
              <Text style={styles.featureDesc}>Define what matters to you</Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📋</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Get a Plan</Text>
              <Text style={styles.featureDesc}>Weekly action plans tailored to you</Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>💬</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Chat with Pilot</Text>
              <Text style={styles.featureDesc}>AI that understands your journey</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.startButton} onPress={() => router.push("/onboarding/life-stage" as any)}>
          <Text style={styles.startButtonText}>Get Started</Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#6366F120",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    alignSelf: "center",
  },
  icon: {
    fontSize: 40,
    color: "#6366F1",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
  },
  features: {
    gap: 20,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 16,
  },
  featureIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  startButton: {
    backgroundColor: "#6366F1",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});