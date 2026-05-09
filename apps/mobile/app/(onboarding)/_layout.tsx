import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0D0D0D" },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="life-stage" />
      <Stack.Screen name="big-goal" />
      <Stack.Screen name="lifetime-dream" />
      <Stack.Screen name="growth-areas" />
      <Stack.Screen name="active-time" />
      <Stack.Screen name="nudge-style" />
    </Stack>
  );
}