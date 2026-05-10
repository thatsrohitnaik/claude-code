import { Platform } from 'react-native';

const isNative = Platform.OS !== 'web';

export const haptics = {
  light: async () => {
    if (!isNative) return;
    const Haptics = await import('expo-haptics');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  medium: async () => {
    if (!isNative) return;
    const Haptics = await import('expo-haptics');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  heavy: async () => {
    if (!isNative) return;
    const Haptics = await import('expo-haptics');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },
  success: async () => {
    if (!isNative) return;
    const Haptics = await import('expo-haptics');
    await Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    );
  },
  error: async () => {
    if (!isNative) return;
    const Haptics = await import('expo-haptics');
    await Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Error
    );
  },
};