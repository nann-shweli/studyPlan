import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../components/Card';
import { StorageService } from '../services/StorageService';
import { useStudyPlansStore } from '../features/study-plans/studyPlansSlice';
import { useTasksStore } from '../features/tasks/tasksSlice';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../theme';

const VERSION = '0.0.1';
const SETTINGS_KEY = '@studyplan:settings';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface UserSettings {
  dailyReminder: boolean;
  weekStartsMonday: boolean;
  compactView: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  dailyReminder: true,
  weekStartsMonday: true,
  compactView: false,
};

export const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { plans, loadPlans, clearPlans } = useStudyPlansStore();
  const { tasks, loadTasks, clearTasks } = useTasksStore();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isResetting, setIsResetting] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (!raw) return;
      setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
    } catch {
      setSettings(DEFAULT_SETTINGS);
    }
  }, []);

  useEffect(() => {
    loadPlans();
    loadTasks();
    loadSettings();
  }, [loadPlans, loadTasks, loadSettings]);

  const stats = useMemo(() => {
    const completedTasks = tasks.filter(task => task.isCompleted).length;
    const activePlans = plans.filter(plan => {
      const today = new Date();
      const endDate = new Date(plan.endDate);
      return endDate >= today;
    }).length;

    return {
      plans: plans.length,
      activePlans,
      tasks: tasks.length,
      completedTasks,
    };
  }, [plans, tasks]);

  const updateSetting = async <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) => {
    const nextSettings = { ...settings, [key]: value };
    setSettings(nextSettings);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(nextSettings));
  };

  const handleExportSummary = async () => {
    const message = [
      'StudyPlan Summary',
      `Plans: ${stats.plans}`,
      `Active plans: ${stats.activePlans}`,
      `Tasks: ${stats.tasks}`,
      `Completed tasks: ${stats.completedTasks}`,
    ].join('\n');

    await Share.share({ message });
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear all data?',
      'This deletes every study plan and task stored on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: async () => {
            setIsResetting(true);
            try {
              await StorageService.clearAllData();
              clearPlans();
              clearTasks();
            } finally {
              setIsResetting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>
          Manage preferences, data, and app information
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>OVERVIEW</Text>
        <View style={styles.statsGrid}>
          <StatCard label="Plans" value={stats.plans} icon="library-outline" />
          <StatCard
            label="Active"
            value={stats.activePlans}
            icon="flame-outline"
          />
          <StatCard label="Tasks" value={stats.tasks} icon="list-outline" />
          <StatCard
            label="Done"
            value={stats.completedTasks}
            icon="checkmark-done-outline"
          />
        </View>

        <Text style={styles.sectionLabel}>PREFERENCES</Text>
        <Card style={styles.card}>
          <SettingsSwitchRow
            icon="notifications-outline"
            label="Daily reminder"
            description="Keep reminder preference enabled for study sessions"
            value={settings.dailyReminder}
            onValueChange={value => updateSetting('dailyReminder', value)}
          />
          <Divider />
          <SettingsSwitchRow
            icon="calendar-outline"
            label="Week starts Monday"
            description="Use a study-week layout that starts on Monday"
            value={settings.weekStartsMonday}
            onValueChange={value => updateSetting('weekStartsMonday', value)}
          />
          <Divider />
          <SettingsSwitchRow
            icon="albums-outline"
            label="Compact view"
            description="Prefer denser cards where supported"
            value={settings.compactView}
            onValueChange={value => updateSetting('compactView', value)}
          />
        </Card>

        <Text style={styles.sectionLabel}>DATA</Text>
        <Card style={styles.card}>
          <SettingsActionRow
            icon="share-outline"
            label="Share progress summary"
            description="Export a quick text summary of your current progress"
            onPress={handleExportSummary}
          />
          <Divider />
          <SettingsActionRow
            icon="trash-outline"
            label={isResetting ? 'Clearing data...' : 'Clear all data'}
            description="Remove all local plans and tasks from this device"
            danger
            disabled={isResetting}
            onPress={handleClearData}
          />
        </Card>

        <Text style={styles.sectionLabel}>ABOUT</Text>
        <Card style={styles.card}>
          <InfoRow label="App name" value="StudyPlan" />
          <Divider />
          <InfoRow label="Version" value={VERSION} />
          <Divider />
          <InfoRow label="Storage" value="Local, offline first" />
        </Card>

        <Text style={styles.footer}>
          Your study data stays on this device unless you choose to share it.
        </Text>
      </ScrollView>
    </View>
  );
};

interface StatCardProps {
  label: string;
  value: number;
  icon: IoniconName;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon }) => (
  <Card style={styles.statCard}>
    <View style={styles.statIcon}>
      <Ionicons name={icon} size={18} color={Colors.primary} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </Card>
);

interface SettingsSwitchRowProps {
  icon: IoniconName;
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const SettingsSwitchRow: React.FC<SettingsSwitchRowProps> = ({
  icon,
  label,
  description,
  value,
  onValueChange,
}) => (
  <View style={styles.row}>
    <RowIcon icon={icon} />
    <View style={styles.rowContent}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowDescription}>{description}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: Colors.surfaceAlt, true: Colors.primaryLight }}
      thumbColor={value ? Colors.primary : Colors.white}
      ios_backgroundColor={Colors.surfaceAlt}
    />
  </View>
);

interface SettingsActionRowProps {
  icon: IoniconName;
  label: string;
  description: string;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
}

const SettingsActionRow: React.FC<SettingsActionRowProps> = ({
  icon,
  label,
  description,
  onPress,
  danger = false,
  disabled = false,
}) => (
  <TouchableOpacity
    style={[styles.row, disabled && styles.disabledRow]}
    activeOpacity={0.75}
    onPress={onPress}
    disabled={disabled}
  >
    <RowIcon icon={icon} danger={danger} />
    <View style={styles.rowContent}>
      <Text style={[styles.rowLabel, danger && styles.dangerText]}>
        {label}
      </Text>
      <Text style={styles.rowDescription}>{description}</Text>
    </View>
    <Ionicons
      name="chevron-forward"
      size={18}
      color={Colors.textDisabled}
    />
  </TouchableOpacity>
);

interface RowIconProps {
  icon: IoniconName;
  danger?: boolean;
}

const RowIcon: React.FC<RowIconProps> = ({ icon, danger = false }) => (
  <View style={[styles.rowIcon, danger && styles.dangerIcon]}>
    <Ionicons
      name={icon}
      size={18}
      color={danger ? Colors.danger : Colors.primary}
    />
  </View>
);

interface InfoRowProps {
  label: string;
  value: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

const Divider = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extraBold,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scroll: {
    padding: Spacing.base,
    paddingBottom: Spacing.xxl,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    letterSpacing: 0,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statCard: {
    width: '48%',
    minHeight: 112,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extraBold,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  card: {
    paddingHorizontal: Spacing.base,
    paddingVertical: 0,
  },
  row: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  disabledRow: {
    opacity: 0.6,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  dangerIcon: {
    backgroundColor: Colors.dangerLight,
  },
  rowContent: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  rowLabel: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semiBold,
  },
  rowDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 3,
    lineHeight: 18,
  },
  rowValue: {
    flexShrink: 1,
    textAlign: 'right',
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.md,
  },
  dangerText: {
    color: Colors.danger,
  },
  infoRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  footer: {
    textAlign: 'center',
    fontSize: FontSize.sm,
    color: Colors.textDisabled,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
});
