import { useEffect } from 'react';
import { useSettingsStore } from '../features/settings/settingsSlice';
import { NotificationService } from '../services/NotificationService';

export const useDailyReminderSync = () => {
  const { settings, hasLoaded, loadSettings } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (!hasLoaded) return;

    NotificationService.syncDailyReminder(
      settings.dailyReminder,
      settings.reminderHour,
      settings.reminderMinute,
    ).catch(() => undefined);
  }, [
    hasLoaded,
    settings.dailyReminder,
    settings.reminderHour,
    settings.reminderMinute,
  ]);
};
