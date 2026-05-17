import AsyncStorage from '@react-native-async-storage/async-storage';
import { createMMKV, type MMKV } from 'react-native-mmkv';
import {
  DEFAULT_SETTINGS,
  sanitizeSettings,
  type UserSettings,
} from '../features/settings/settingsTypes';

const LEGACY_SETTINGS_KEY = '@studyplan:settings';
const MIGRATION_KEY = 'settings:migrated-from-async-storage';

type StoredValue = boolean | number | string;

const SETTINGS_KEYS: Record<keyof UserSettings, string> = {
  themeMode: 'themeMode',
  dailyReminder: 'dailyReminder',
  reminderHour: 'reminderHour',
  reminderMinute: 'reminderMinute',
  weekStartsMonday: 'weekStartsMonday',
  compactView: 'compactView',
  onboardingCompleted: 'onboardingCompleted',
};

let storage: MMKV | null | undefined;

const getStorage = (): MMKV | null => {
  if (storage !== undefined) return storage;

  try {
    storage = createMMKV({ id: 'studyplan-settings' });
  } catch {
    storage = null;
  }

  return storage;
};

const parseStoredSettings = (raw: string | null): UserSettings => {
  if (!raw) return DEFAULT_SETTINGS;

  try {
    return sanitizeSettings(JSON.parse(raw) as Partial<UserSettings>);
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const writeSettingsToMMKV = (
  mmkvStorage: MMKV,
  settings: UserSettings,
): void => {
  (Object.keys(SETTINGS_KEYS) as Array<keyof UserSettings>).forEach(key => {
    mmkvStorage.set(SETTINGS_KEYS[key], settings[key] as StoredValue);
  });
};

const readSettingsFromMMKV = (mmkvStorage: MMKV): UserSettings =>
  sanitizeSettings({
    themeMode: mmkvStorage.getString(SETTINGS_KEYS.themeMode) as
      | UserSettings['themeMode']
      | undefined,
    dailyReminder: mmkvStorage.getBoolean(SETTINGS_KEYS.dailyReminder),
    reminderHour: mmkvStorage.getNumber(SETTINGS_KEYS.reminderHour),
    reminderMinute: mmkvStorage.getNumber(SETTINGS_KEYS.reminderMinute),
    weekStartsMonday: mmkvStorage.getBoolean(SETTINGS_KEYS.weekStartsMonday),
    compactView: mmkvStorage.getBoolean(SETTINGS_KEYS.compactView),
    onboardingCompleted: mmkvStorage.getBoolean(
      SETTINGS_KEYS.onboardingCompleted,
    ),
  });

const readSettings = async (): Promise<UserSettings> => {
  const mmkvStorage = getStorage();
  if (mmkvStorage) return readSettingsFromMMKV(mmkvStorage);

  const raw = await AsyncStorage.getItem(LEGACY_SETTINGS_KEY);
  return parseStoredSettings(raw);
};

const writeSettings = async (settings: UserSettings): Promise<void> => {
  const mmkvStorage = getStorage();
  if (mmkvStorage) {
    writeSettingsToMMKV(mmkvStorage, settings);
    return;
  }

  await AsyncStorage.setItem(LEGACY_SETTINGS_KEY, JSON.stringify(settings));
};

export const SettingsStorage = {
  async getSettings(): Promise<UserSettings> {
    await this.migrateLegacySettings();
    return readSettings();
  },

  async saveSettings(data: UserSettings): Promise<UserSettings> {
    const settings = sanitizeSettings(data);
    await writeSettings(settings);
    return settings;
  },

  async updateSettings(data: Partial<UserSettings>): Promise<UserSettings> {
    const nextSettings = sanitizeSettings({ ...(await readSettings()), ...data });
    await writeSettings(nextSettings);
    return nextSettings;
  },

  async migrateLegacySettings(): Promise<void> {
    const mmkvStorage = getStorage();
    if (!mmkvStorage || mmkvStorage.getBoolean(MIGRATION_KEY)) return;

    try {
      const raw = await AsyncStorage.getItem(LEGACY_SETTINGS_KEY);
      const parsed = raw
        ? (JSON.parse(raw) as Partial<UserSettings>)
        : DEFAULT_SETTINGS;
      writeSettingsToMMKV(mmkvStorage, sanitizeSettings(parsed));
    } catch {
      writeSettingsToMMKV(mmkvStorage, DEFAULT_SETTINGS);
    } finally {
      mmkvStorage.set(MIGRATION_KEY, true);
    }
  },
};
