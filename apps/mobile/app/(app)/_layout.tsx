import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const color = focused ? "#7C3AED" : "#5A5A5A";
  return (
    <View style={styles.iconContainer}>
      <Text style={[styles.iconText, { color }]}>
        {name === 'pilot' ? '✦' : name === 'today' ? '✓' : name === 'myworld' ? '🌍' : '○'}
      </Text>
    </View>
  );
}

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: "#7C3AED",
        tabBarInactiveTintColor: "#5A5A5A",
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="pilot"
        options={{
          title: "Pilot",
          tabBarIcon: ({ focused }) => <TabIcon name="pilot" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="today"
        options={{
          title: "Today",
          tabBarIcon: ({ focused }) => <TabIcon name="today" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="myworld"
        options={{
          title: "My World",
          tabBarIcon: ({ focused }) => <TabIcon name="myworld" focused={focused} />,
        }}
      />
      {/* Hide these from tab bar - old routes */}
      <Tabs.Screen
        name="index"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="chat"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="goals"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="goals/index"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="goals/[id]"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="goals/new"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="goals/suggest"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="plan"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="progress"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="profile"
        options={{ href: null }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#0F0F0F",
    borderTopColor: "#2A2A2A",
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 20,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
  },
});