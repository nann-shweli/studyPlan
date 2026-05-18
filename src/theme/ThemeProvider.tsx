import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../features/settings/settingsSlice';
import {
  getThemeColors,
  type AppColors,
  type AppColorScheme,
} from './colors';

interface ThemeContextValue {
  colors: AppColors;
  colorScheme: AppColorScheme;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: getThemeColors('light'),
  colorScheme: 'light',
  isDark: false,
});

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemScheme = useColorScheme();
  const { settings, hasLoaded, loadSettings } = useSettingsStore();

  useEffect(() => {
    if (!hasLoaded) {
      loadSettings();
    }
  }, [hasLoaded, loadSettings]);

  const colorScheme: AppColorScheme = useMemo(() => {
    if (settings.themeMode === 'system') {
      return systemScheme === 'dark' ? 'dark' : 'light';
    }

    return settings.themeMode;
  }, [settings.themeMode, systemScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: getThemeColors(colorScheme),
      colorScheme,
      isDark: colorScheme === 'dark',
    }),
    [colorScheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => useContext(ThemeContext);