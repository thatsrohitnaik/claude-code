import * as Expo from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

// Configure notification handling
Expo.Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log("Push notifications only work on physical devices");
    return false;
  }

  const { status: existingStatus } = await Expo.Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Expo.Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Failed to get push token for push notification!");
    return false;
  }

  if (Platform.OS === "android") {
    await Expo.Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Expo.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#7C3AED",
    });

    await Expo.Notifications.setNotificationChannelAsync("nudges", {
      name: "Nudges",
      importance: Expo.AndroidImportance.HIGH,
      sound: "default",
    });

    await Expo.Notifications.setNotificationChannelAsync("friday-windup", {
      name: "Friday Wind-up",
      importance: Expo.AndroidImportance.HIGH,
      description: "Weekly check-in notifications",
    });
  }

  return true;
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return null;

  const { data } = await Expo.Notifications.getDevicePushTokenAsync();
  return data;
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, string>
) {
  await Expo.Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: true,
    },
    trigger: null,
  });
}

// Friday wind-up notification
export async function scheduleFridayWindupNotification(): Promise<void> {
  await Expo.Notifications.cancelAllScheduledNotificationsAsync();

  await Expo.Notifications.scheduleNotificationAsync({
    content: {
      title: "✦ Pilot",
      body: "Your week in 10 seconds — want to see how it went?",
      data: { screen: "myworld" },
    },
    trigger: {
      type: Expo.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 5,
      hour: 20,
      minute: 0,
    },
  });
}

export async function cancelFridayWindupNotification(): Promise<void> {
  await Expo.Notifications.cancelAllScheduledNotificationsAsync();
}

// Notification response handler
export function addNotificationResponseListener(
  callback: (response: Expo.NotificationResponse) => void
) {
  return Expo.Notifications.addNotificationResponseReceivedListener(callback);
}

// Notification received listener
export function addNotificationReceivedListener(
  callback: (notification: Expo.Notification) => void
) {
  return Expo.Notifications.addNotificationReceivedListener(callback);
}