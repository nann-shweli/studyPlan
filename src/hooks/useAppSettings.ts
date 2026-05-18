import { useEffect, useMemo } from 'react';
import {
  useSettingsStore,
  type UserSettings,
} from '../features/settings/settingsSlice';
import { getWeekStartsOn } from '../utils/dateUtils';
import { getLayoutSize } from '../theme/layout';
import { useTheme } from '../theme';

export const useAppSettings = () => {
  const {
    settings,
    isLoading,
    hasLoaded,
    loadSettings,
    updateSetting,
    updateSettings,
  } = useSettingsStore();

  const { colors, colorScheme, isDark } = useTheme();

  useEffect(() => {
    if (!hasLoaded) {
      loadSettings();
    }
  }, [hasLoaded, loadSettings]);

  const isCompact = settings.compactView;

  const weekStartsOn = useMemo(() => {
    return getWeekStartsOn(settings);
  }, [settings]);

  const layout = useMemo(() => {
    return getLayoutSize(isCompact);
  }, [isCompact]);

  return {
    settings,
    isLoading,
    hasLoaded,
    isCompact,
    weekStartsOn,
    layout,

    colors,
    colorScheme,
    isDark,

    updateSetting,
    updateSettings,
  };
};

export type { UserSettings };