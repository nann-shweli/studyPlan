import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@react-native-vector-icons/ionicons';

import { HomeScreen } from '../../screens/HomeScreen';
import { TodayScreen } from '../../screens/TodayScreen';
import { ProgressScreen } from '../../screens/ProgressScreen';
import { SettingsScreen } from '../../screens/SettingsScreen';
import { CreatePlanScreen } from '../../screens/CreatePlanScreen';
import { PlanDetailScreen } from '../../screens/PlanDetailScreen';

import { Colors, FontSize } from '../../theme';
import type { RootStackParamList, TabParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
type TabRouteName = keyof TabParamList;

interface TabBarIconProps {
  focused: boolean;
  color: string;
  size: number;
}

const TAB_ICONS: Record<
  TabRouteName,
  { active: IoniconName; inactive: IoniconName }
> = {
  Home: { active: 'book', inactive: 'book-outline' },
  Today: { active: 'checkmark-circle', inactive: 'checkmark-circle-outline' },
  Progress: { active: 'bar-chart', inactive: 'bar-chart-outline' },
  Settings: { active: 'settings', inactive: 'settings-outline' },
};

const createTabBarIcon =
  (routeName: TabRouteName) =>
  ({ focused, color, size }: TabBarIconProps) => {
    const icons = TAB_ICONS[routeName];
    const iconName = focused ? icons.active : icons.inactive;
    return <Ionicons name={iconName} size={size ?? 24} color={color} />;
  };

const TAB_SCREEN_OPTIONS: Record<
  TabRouteName,
  { tabBarIcon: (props: TabBarIconProps) => React.ReactNode }
> = {
  Home: { tabBarIcon: createTabBarIcon('Home') },
  Today: { tabBarIcon: createTabBarIcon('Today') },
  Progress: { tabBarIcon: createTabBarIcon('Progress') },
  Settings: { tabBarIcon: createTabBarIcon('Settings') },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textDisabled,
        tabBarLabelStyle: {
          fontSize: FontSize.xs,
          marginVertical: 4,
        },
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={TAB_SCREEN_OPTIONS.Home}
      />
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={TAB_SCREEN_OPTIONS.Today}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={TAB_SCREEN_OPTIONS.Progress}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={TAB_SCREEN_OPTIONS.Settings}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen
          name="CreatePlan"
          component={CreatePlanScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="PlanDetail"
          component={PlanDetailScreen}
          options={{ animation: 'slide_from_right' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
