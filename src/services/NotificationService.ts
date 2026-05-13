import { Platform } from 'react-native';
import notifee, {
  AndroidImportance,
  AndroidNotificationSetting,
  AuthorizationStatus,
  RepeatFrequency,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';

const DAILY_REMINDER_ID = 'studyplan-daily-reminder';
const REMINDER_CHANNEL_ID = 'study-reminders';

const nextReminderTimestamp = (hour: number, minute: number): number => {
  const reminderDate = new Date();
  reminderDate.setHours(hour, minute, 0, 0);

  if (reminderDate.getTime() <= Date.now()) {
    reminderDate.setDate(reminderDate.getDate() + 1);
  }

  return reminderDate.getTime();
};

const hasNotificationPermission = (status: AuthorizationStatus): boolean =>
  status >= AuthorizationStatus.AUTHORIZED;

const createReminderNotification = async (
  hour: number,
  minute: number,
  channelId: string,
): Promise<void> => {
  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: nextReminderTimestamp(hour, minute),
    repeatFrequency: RepeatFrequency.DAILY,
  };

  await notifee.createTriggerNotification(
    {
      id: DAILY_REMINDER_ID,
      title: 'Study Reminder',
      body: 'Time to continue your study plan 📚',
      android: {
        channelId,
        pressAction: {
          id: 'default',
        },
      },
    },
    trigger,
  );
};

export const NotificationService = {
  async requestPermission(): Promise<boolean> {
    const settings = await notifee.requestPermission();
    return hasNotificationPermission(settings.authorizationStatus);
  },

  async createChannel(): Promise<string> {
    return notifee.createChannel({
      id: REMINDER_CHANNEL_ID,
      name: 'Study reminders',
      importance: AndroidImportance.DEFAULT,
    });
  },

  async scheduleDailyReminder(hour: number, minute: number): Promise<boolean> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) return false;

    if (Platform.OS === 'android') {
      const settings = await notifee.getNotificationSettings();
      if (settings.android.alarm === AndroidNotificationSetting.DISABLED) {
        await notifee.openAlarmPermissionSettings();
        return false;
      }
    }

    const channelId = await this.createChannel();

    await this.cancelDailyReminder();
    await createReminderNotification(hour, minute, channelId);

    return true;
  },

  async syncDailyReminder(
    enabled: boolean,
    hour: number,
    minute: number,
  ): Promise<boolean> {
    if (!enabled) {
      await this.cancelDailyReminder();
      return true;
    }

    const settings = await notifee.getNotificationSettings();
    if (!hasNotificationPermission(settings.authorizationStatus)) {
      return false;
    }

    if (
      Platform.OS === 'android' &&
      settings.android.alarm === AndroidNotificationSetting.DISABLED
    ) {
      return false;
    }

    const channelId = await this.createChannel();
    await this.cancelDailyReminder();
    await createReminderNotification(hour, minute, channelId);

    return true;
  },

  async cancelDailyReminder(): Promise<void> {
    await Promise.all([
      notifee.cancelTriggerNotification(DAILY_REMINDER_ID),
      notifee.cancelNotification(DAILY_REMINDER_ID),
    ]);
  },
};
