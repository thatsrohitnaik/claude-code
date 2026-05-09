import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { usePathname } from "expo-router";
import { AuthProvider, useAuth } from "../context/auth";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Wait for layout to mount and auth to load
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Show nothing while loading or not ready
  if (!isReady || loading) {
    return null;
  }

  // If no session and not on auth pages, redirect to login
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  if (!session && !isAuthPage) {
    // Use router.push instead of Redirect for better compatibility
    return null; // Let the login page handle the redirect
  }

  return <>{children}</>;
}

function AppLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  );
}