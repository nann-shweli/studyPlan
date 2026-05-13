import { useEffect, useMemo } from 'react';
import {
  useSettingsStore,
  type UserSettings,
} from '../features/settings/settingsSlice';
import { getWeekStartsOn } from '../utils/dateUtils';
import { getLayoutSize } from '../theme/layout';

export const useAppSettings = () => {
  const { settings, isLoading, hasLoaded, loadSettings, updateSetting } =
    useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const isCompact = settings.compactView;
  const weekStartsOn = getWeekStartsOn(settings);

  const layout = useMemo(() => getLayoutSize(isCompact), [isCompact]);

  return {
    settings,
    isLoading,
    hasLoaded,
    isCompact,
    weekStartsOn,
    layout,
    updateSetting,
  };
};

export type { UserSettings };
