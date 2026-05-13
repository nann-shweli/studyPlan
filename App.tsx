import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/app/navigation/AppNavigator';
import { useDailyReminderSync } from './src/hooks/useDailyReminderSync';
import { SplashScreen } from './src/screens/SplashScreen';

function App(): React.JSX.Element {
  const [splashDone, setSplashDone] = useState(false);
  useDailyReminderSync();

  if (!splashDone) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" />
        <SplashScreen onFinish={() => setSplashDone(true)} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default App;
