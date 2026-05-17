export type ThemeMode = 'system' | 'light' | 'dark';

export interface UserSettings {
  themeMode: ThemeMode;
  dailyReminder: boolean;
  reminderHour: number;
  reminderMinute: number;
  weekStartsMonday: boolean;
  compactView: boolean;
  onboardingCompleted: boolean;
}

export type SettingKey = keyof UserSettings;

export const DEFAULT_SETTINGS: UserSettings = {
  themeMode: 'system',
  dailyReminder: false,
  reminderHour: 19,
  reminderMinute: 0,
  weekStartsMonday: true,
  compactView: false,
  onboardingCompleted: false,
};

export const isValidHour = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= 0 &&
  value <= 23;

export const isValidMinute = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= 0 &&
  value <= 59;

export const isValidThemeMode = (value: unknown): value is ThemeMode =>
  value === 'system' || value === 'light' || value === 'dark';

export const sanitizeSettings = (
  data: Partial<UserSettings>,
): UserSettings => ({
  ...DEFAULT_SETTINGS,
  ...data,
  themeMode: isValidThemeMode(data.themeMode)
    ? data.themeMode
    : DEFAULT_SETTINGS.themeMode,
  reminderHour: isValidHour(data.reminderHour)
    ? data.reminderHour
    : DEFAULT_SETTINGS.reminderHour,
  reminderMinute: isValidMinute(data.reminderMinute)
    ? data.reminderMinute
    : DEFAULT_SETTINGS.reminderMinute,
  dailyReminder:
    typeof data.dailyReminder === 'boolean'
      ? data.dailyReminder
      : DEFAULT_SETTINGS.dailyReminder,
  weekStartsMonday:
    typeof data.weekStartsMonday === 'boolean'
      ? data.weekStartsMonday
      : DEFAULT_SETTINGS.weekStartsMonday,
  compactView:
    typeof data.compactView === 'boolean'
      ? data.compactView
      : DEFAULT_SETTINGS.compactView,
  onboardingCompleted:
    typeof data.onboardingCompleted === 'boolean'
      ? data.onboardingCompleted
      : DEFAULT_SETTINGS.onboardingCompleted,
});
