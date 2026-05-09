import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth, useSignIn } from "@clerk/clerk-expo";
import { LinearGradient } from "expo-linear-gradient";

export default function LoginScreen() {
  const { signIn, isLoaded } = useSignIn();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (!isLoaded) return;

    setLoading(true);
    try {
      await signIn?.create({
        strategy: "oauth_google",
        redirectUrl: "lifepilot://oauth-callback",
      });
    } catch (err) {
      console.error("Google sign in error:", err);
    }
    setLoading(false);
  };

  const handleAppleSignIn = async () => {
    if (!isLoaded) return;

    setLoading(true);
    try {
      await signIn?.create({
        strategy: "oauth_apple",
        redirectUrl: "lifepilot://oauth-callback",
      });
    } catch (err) {
      console.error("Apple sign in error:", err);
    }
    setLoading(false);
  };

  // Redirect if already signed in
  if (isSignedIn) {
    router.replace("/(app)");
    return null;
  }

  return (
    <LinearGradient
      colors={["#0D0D0D", "#1A1A1A", "#0D0D0D"]}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>✦</Text>
          <Text style={styles.title}>LifePilot</Text>
        </View>

        <Text style={styles.subtitle}>Your AI-powered life co-pilot</Text>

        <View style={styles.features}>
          <Text style={styles.featureText}>• Goal tracking that actually works</Text>
          <Text style={styles.featureText}>• Smart nudges when you need them</Text>
          <Text style={styles.featureText}>• Weekly insights that help you grow</Text>
        </View>

        <View style={styles.authButtons}>
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Continue with Google</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.appleButton}
            onPress={handleAppleSignIn}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Continue with Apple</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.terms}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
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
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  logo: {
    fontSize: 64,
    color: "#6366F1",
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 48,
  },
  features: {
    marginBottom: 48,
  },
  featureText: {
    fontSize: 16,
    color: "#D1D5DB",
    marginBottom: 12,
    textAlign: "center",
  },
  authButtons: {
    gap: 16,
  },
  googleButton: {
    backgroundColor: "#6366F1",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  appleButton: {
    backgroundColor: "#1F2937",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#374151",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  terms: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 32,
  },
});