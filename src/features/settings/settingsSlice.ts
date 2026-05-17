import { create } from 'zustand';
import { SettingsStorage } from '../../services/SettingsStorage';
import {
  DEFAULT_SETTINGS,
  type SettingKey,
  type UserSettings,
} from './settingsTypes';

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

let loadSettingsPromise: Promise<void> | null = null;

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: false,
  hasLoaded: false,

  loadSettings: async () => {
    if (get().hasLoaded) return;
    if (loadSettingsPromise) return loadSettingsPromise;

    set({ isLoading: true });
    loadSettingsPromise = SettingsStorage.getSettings()
      .then(settings => {
        set({
          settings,
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
    const nextSettings = await SettingsStorage.updateSettings({
      ...get().settings,
      [key]: value,
    });
    set({ settings: nextSettings, hasLoaded: true });
  },

  updateSettings: async data => {
    const nextSettings = await SettingsStorage.updateSettings({
      ...get().settings,
      ...data,
    });
    set({ settings: nextSettings, hasLoaded: true });
  },
}));

export { DEFAULT_SETTINGS };
export type { SettingKey, UserSettings };
