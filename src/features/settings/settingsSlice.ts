import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export interface UserSettings {
  dailyReminder: boolean;
  weekStartsMonday: boolean;
  compactView: boolean;
}

export type SettingKey = keyof UserSettings;

export const SETTINGS_KEY = '@studyplan:settings';

export const DEFAULT_SETTINGS: UserSettings = {
  dailyReminder: false,
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
}

const parseSettings = (raw: string | null): UserSettings => {
  if (!raw) return DEFAULT_SETTINGS;

  try {
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
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
}));
