import * as Expo from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

// Configure notification handling
Expo.Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log("Push notifications only work on physical devices");
    return null;
  }

  const { status: existingStatus } = await Expo.Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Expo.Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Failed to get push token for push notification!");
    return null;
  }

  if (Platform.OS === "android") {
    await Expo.Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Expo.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#6366F1",
    });

    await Expo.Notifications.setNotificationChannelAsync("nudges", {
      name: "Nudges",
      importance: Expo.AndroidImportance.HIGH,
      sound: "default",
    });
  }

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
    trigger: null, // null means send immediately
  });
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