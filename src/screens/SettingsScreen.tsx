import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  type StyleProp,
  Switch,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../components/Card';
import { NotificationService } from '../services/NotificationService';
import { StorageService } from '../services/StorageService';
import { useStudyPlansStore } from '../features/study-plans/studyPlansSlice';
import { useTasksStore } from '../features/tasks/tasksSlice';
import { useAppSettings } from '../hooks/useAppSettings';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../theme';

const VERSION = '0.0.1';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { plans, loadPlans, clearPlans } = useStudyPlansStore();
  const { tasks, loadTasks, clearTasks } = useTasksStore();
  const { settings, isCompact, layout, updateSetting } = useAppSettings();
  const [isResetting, setIsResetting] = useState(false);
  const [isUpdatingReminder, setIsUpdatingReminder] = useState(false);

  useEffect(() => {
    loadPlans();
    loadTasks();
  }, [loadPlans, loadTasks]);

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

  const handleDailyReminderChange = async (value: boolean) => {
    setIsUpdatingReminder(true);
    try {
      if (value) {
        const scheduled = await NotificationService.scheduleDailyReminder(
          19,
          0,
        );
        if (!scheduled) {
          Alert.alert(
            'Reminder Not Enabled',
            'Allow notification and alarm permissions, then turn Daily reminder on again.',
          );
          return;
        }
      } else {
        await NotificationService.cancelDailyReminder();
      }

      await updateSetting('dailyReminder', value);
    } catch {
      Alert.alert(
        'Reminder Error',
        'Unable to update your daily reminder. Please try again.',
      );
    } finally {
      setIsUpdatingReminder(false);
    }
  };

  const rowStyle = {
    minHeight: layout.rowHeight,
    paddingVertical: isCompact ? Spacing.sm : Spacing.md,
  };
  const infoRowStyle = {
    minHeight: isCompact ? 48 : 56,
    paddingVertical: isCompact ? Spacing.sm : Spacing.md,
  };
  const statCardStyle = { minHeight: isCompact ? 96 : 112 };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.header, { paddingVertical: layout.headerVertical }]}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>
          Manage preferences, data, and app information
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { padding: layout.screenPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { marginTop: layout.sectionGap }]}>
          OVERVIEW
        </Text>
        <View style={styles.statsGrid}>
          <StatCard
            label="Plans"
            value={stats.plans}
            icon="library-outline"
            style={statCardStyle}
          />
          <StatCard
            label="Active"
            value={stats.activePlans}
            icon="flame-outline"
            style={statCardStyle}
          />
          <StatCard
            label="Tasks"
            value={stats.tasks}
            icon="list-outline"
            style={statCardStyle}
          />
          <StatCard
            label="Done"
            value={stats.completedTasks}
            icon="checkmark-done-outline"
            style={statCardStyle}
          />
        </View>

        <Text style={[styles.sectionLabel, { marginTop: layout.sectionGap }]}>
          PREFERENCES
        </Text>
        <Card style={[styles.card, { paddingHorizontal: layout.cardPadding }]}>
          <SettingsSwitchRow
            icon="notifications-outline"
            label="Daily reminder"
            description="Schedule a study reminder every day at 7:00 PM"
            value={settings.dailyReminder}
            disabled={isUpdatingReminder}
            rowStyle={rowStyle}
            onValueChange={handleDailyReminderChange}
          />
          <Divider />
          <SettingsSwitchRow
            icon="calendar-outline"
            label="Week starts Monday"
            description="Use a study-week layout that starts on Monday"
            value={settings.weekStartsMonday}
            rowStyle={rowStyle}
            onValueChange={value => updateSetting('weekStartsMonday', value)}
          />
          <Divider />
          <SettingsSwitchRow
            icon="albums-outline"
            label="Compact view"
            description="Prefer denser cards where supported"
            value={settings.compactView}
            rowStyle={rowStyle}
            onValueChange={value => updateSetting('compactView', value)}
          />
        </Card>

        <Text style={[styles.sectionLabel, { marginTop: layout.sectionGap }]}>
          DATA
        </Text>
        <Card style={[styles.card, { paddingHorizontal: layout.cardPadding }]}>
          <SettingsActionRow
            icon="share-outline"
            label="Share progress summary"
            description="Export a quick text summary of your current progress"
            rowStyle={rowStyle}
            onPress={handleExportSummary}
          />
          <Divider />
          <SettingsActionRow
            icon="trash-outline"
            label={isResetting ? 'Clearing data...' : 'Clear all data'}
            description="Remove all local plans and tasks from this device"
            danger
            disabled={isResetting}
            rowStyle={rowStyle}
            onPress={handleClearData}
          />
        </Card>

        <Text style={[styles.sectionLabel, { marginTop: layout.sectionGap }]}>
          ABOUT
        </Text>
        <Card style={[styles.card, { paddingHorizontal: layout.cardPadding }]}>
          <InfoRow label="App name" value="StudyPlan" rowStyle={infoRowStyle} />
          <Divider />
          <InfoRow label="Version" value={VERSION} rowStyle={infoRowStyle} />
          <Divider />
          <InfoRow
            label="Storage"
            value="Local, offline first"
            rowStyle={infoRowStyle}
          />
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
  style?: StyleProp<ViewStyle>;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, style }) => (
  <Card style={[styles.statCard, style]}>
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
  disabled?: boolean;
  rowStyle?: StyleProp<ViewStyle>;
}

const SettingsSwitchRow: React.FC<SettingsSwitchRowProps> = ({
  icon,
  label,
  description,
  value,
  onValueChange,
  disabled = false,
  rowStyle,
}) => (
  <View style={[styles.row, rowStyle, disabled && styles.disabledRow]}>
    <RowIcon icon={icon} />
    <View style={styles.rowContent}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowDescription}>{description}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
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
  rowStyle?: StyleProp<ViewStyle>;
}

const SettingsActionRow: React.FC<SettingsActionRowProps> = ({
  icon,
  label,
  description,
  onPress,
  danger = false,
  disabled = false,
  rowStyle,
}) => (
  <TouchableOpacity
    style={[styles.row, rowStyle, disabled && styles.disabledRow]}
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
    <Ionicons name="chevron-forward" size={18} color={Colors.textDisabled} />
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
  rowStyle?: StyleProp<ViewStyle>;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, rowStyle }) => (
  <View style={[styles.infoRow, rowStyle]}>
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
