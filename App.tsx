import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/app/navigation/AppNavigator';
import { queryClient } from './src/app/queryClient';
import { useDailyReminderSync } from './src/hooks/useDailyReminderSync';
import { SplashScreen } from './src/screens/SplashScreen';

function App(): React.JSX.Element {
  const [splashDone, setSplashDone] = useState(false);
  useDailyReminderSync();

  if (!splashDone) {
    return (
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar barStyle="light-content" />
          <SplashScreen onFinish={() => setSplashDone(true)} />
        </SafeAreaProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" />
        <AppNavigator />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

export default App;
