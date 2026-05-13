import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export interface UserSettings {
  dailyReminder: boolean;
  reminderHour: number;
  reminderMinute: number;
  weekStartsMonday: boolean;
  compactView: boolean;
}

export type SettingKey = keyof UserSettings;

export const SETTINGS_KEY = '@studyplan:settings';

export const DEFAULT_SETTINGS: UserSettings = {
  dailyReminder: false,
  reminderHour: 19,
  reminderMinute: 0,
  weekStartsMonday: true,
  compactView: false,
};

interface SettingsState {
  settings: UserSettings;
  isLoading: boolean;
  hasLoaded: boolean;
  loadSettings: () => Promise<void>;
  updateSetting: <K extends SettingKey>(
    key: K,
    value: UserSettings[K],
  ) => Promise<void>;
  updateSettings: (data: Partial<UserSettings>) => Promise<void>;
}

const isValidHour = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= 0 &&
  value <= 23;

const isValidMinute = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= 0 &&
  value <= 59;

const parseSettings = (raw: string | null): UserSettings => {
  if (!raw) return DEFAULT_SETTINGS;

  try {
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      reminderHour: isValidHour(parsed.reminderHour)
        ? parsed.reminderHour
        : DEFAULT_SETTINGS.reminderHour,
      reminderMinute: isValidMinute(parsed.reminderMinute)
        ? parsed.reminderMinute
        : DEFAULT_SETTINGS.reminderMinute,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

let loadSettingsPromise: Promise<void> | null = null;

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: false,
  hasLoaded: false,

  loadSettings: async () => {
    if (get().hasLoaded) return;
    if (loadSettingsPromise) return loadSettingsPromise;

    set({ isLoading: true });
    loadSettingsPromise = AsyncStorage.getItem(SETTINGS_KEY)
      .then(raw => {
        set({
          settings: parseSettings(raw),
          isLoading: false,
          hasLoaded: true,
        });
      })
      .catch(() => {
        set({
          settings: DEFAULT_SETTINGS,
          isLoading: false,
          hasLoaded: true,
        });
      })
      .finally(() => {
        loadSettingsPromise = null;
      });

    return loadSettingsPromise;
  },

  updateSetting: async (key, value) => {
    const nextSettings = { ...get().settings, [key]: value };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(nextSettings));
    set({ settings: nextSettings, hasLoaded: true });
  },

  updateSettings: async data => {
    const nextSettings = { ...get().settings, ...data };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(nextSettings));
    set({ settings: nextSettings, hasLoaded: true });
  },
}));
