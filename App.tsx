import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/app/navigation/AppNavigator';
import { queryClient } from './src/app/queryClient';
import { useDailyReminderSync } from './src/hooks/useDailyReminderSync';
import { SplashScreen } from './src/screens/SplashScreen';
import { ThemeProvider, useTheme } from './src/theme';

function AppContent(): React.JSX.Element {
  const [splashDone, setSplashDone] = useState(false);
  const { colors, isDark } = useTheme();
  useDailyReminderSync();

  if (!splashDone) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <SplashScreen onFinish={() => setSplashDone(true)} />
      </>
    );
  }

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <AppNavigator />
    </>
  );
}

function App(): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

export default App;
