import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

import { useCoachStore } from "../stores/coachStore";
import supabaseService from "./SupabaseService";

const REMINDER_STORAGE_KEY = "mofitness.notification.ids";
const isExpoGo = Constants.appOwnership === "expo";

type ReminderMap = {
  workout?: string;
  meal?: string;
  wellness?: string;
};

type NotificationsModule = typeof import("expo-notifications");

class NotificationService {
  private notificationsPromise: Promise<NotificationsModule | null> | null = null;

  private async getNotificationsModule() {
    if (isExpoGo) {
      return null;
    }

    if (!this.notificationsPromise) {
      this.notificationsPromise = import("expo-notifications")
        .then((module) => {
          module.setNotificationHandler({
            handleNotification: async () => ({
              shouldPlaySound: true,
              shouldSetBadge: false,
              shouldShowBanner: true,
              shouldShowList: true,
            }),
          });
          return module;
        })
        .catch(() => null);
    }

    return this.notificationsPromise;
  }

  private async getStoredReminderIds() {
    const raw = await AsyncStorage.getItem(REMINDER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ReminderMap) : {};
  }

  private async setStoredReminderIds(ids: ReminderMap) {
    await AsyncStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(ids));
  }

  private async replaceReminder(key: keyof ReminderMap, nextId: string, notifications: NotificationsModule) {
    const ids = await this.getStoredReminderIds();
    const previousId = ids[key];

    if (previousId) {
      await notifications.cancelScheduledNotificationAsync(previousId).catch(() => undefined);
    }

    ids[key] = nextId;
    await this.setStoredReminderIds(ids);
  }

  private getCoachName() {
    return useCoachStore.getState().coachName;
  }

  async registerForPushNotifications(userId: string) {
    const notifications = await this.getNotificationsModule();
    if (!notifications) {
      return null;
    }

    const existingPermissions = await notifications.getPermissionsAsync();
    let finalStatus = existingPermissions.status;

    if (finalStatus !== "granted") {
      const requested = await notifications.requestPermissionsAsync();
      finalStatus = requested.status;
    }

    if (finalStatus !== "granted") {
      return null;
    }

    try {
      const tokenResponse = await notifications.getExpoPushTokenAsync();
      const pushToken = tokenResponse.data;
      await supabaseService.updatePushToken(userId, pushToken);
      return pushToken;
    } catch {
      return null;
    }
  }

  async scheduleWorkoutReminder(hour = 6, minute = 0) {
    const notifications = await this.getNotificationsModule();
    if (!notifications) {
      return null;
    }

    const coachName = this.getCoachName();
    const identifier = await notifications.scheduleNotificationAsync({
      content: {
        title: `${coachName}: workout block ready`,
        body: `${coachName}: Your next training session is lined up. Open Mofitness and get moving.`,
      },
      trigger: {
        type: notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    await this.replaceReminder("workout", identifier, notifications);
    return identifier;
  }

  async scheduleMealReminder(hour = 12, minute = 30) {
    const notifications = await this.getNotificationsModule();
    if (!notifications) {
      return null;
    }

    const coachName = this.getCoachName();
    const identifier = await notifications.scheduleNotificationAsync({
      content: {
        title: `${coachName}: nutrition check-in`,
        body: `${coachName}: Log your next meal and keep your daily targets tight.`,
      },
      trigger: {
        type: notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    await this.replaceReminder("meal", identifier, notifications);
    return identifier;
  }

  async scheduleWellnessReminder(hour = 20, minute = 0) {
    const notifications = await this.getNotificationsModule();
    if (!notifications) {
      return null;
    }

    const coachName = this.getCoachName();
    const identifier = await notifications.scheduleNotificationAsync({
      content: {
        title: `${coachName}: wellness reminder`,
        body: `${coachName}: Log sleep, hydration, stress, and mood before the day ends.`,
      },
      trigger: {
        type: notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    await this.replaceReminder("wellness", identifier, notifications);
    return identifier;
  }

  async cancelAllScheduledReminders() {
    const notifications = await this.getNotificationsModule();
    const ids = await this.getStoredReminderIds();

    if (notifications) {
      await Promise.all(
        Object.values(ids)
          .filter((value): value is string => Boolean(value))
          .map((value) => notifications.cancelScheduledNotificationAsync(value).catch(() => undefined)),
      );
    }

    await this.setStoredReminderIds({});
  }

  async syncDefaultReminders(enabled: boolean) {
    if (!enabled) {
      await this.cancelAllScheduledReminders();
      return;
    }

    const notifications = await this.getNotificationsModule();
    if (!notifications) {
      return;
    }

    await Promise.all([
      this.scheduleWorkoutReminder(),
      this.scheduleMealReminder(),
      this.scheduleWellnessReminder(),
    ]);
  }

  async updateNotificationPreference(userId: string, enabled: boolean) {
    const profile = await supabaseService.updateNotificationSettings(userId, enabled);

    if (!enabled) {
      await this.cancelAllScheduledReminders();
      return profile;
    }

    await this.syncDefaultReminders(true);
    return profile;
  }
}

const notificationService = new NotificationService();

export default notificationService;
