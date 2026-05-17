import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  type StyleProp,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { ScreenContainer, ScreenHeader } from '../components/layout';
import { Card, SettingsSwitchRow } from '../components/ui';
import { CalendarService } from '../services/CalendarService';
import { NotificationService } from '../services/NotificationService';
import { StorageService } from '../services/StorageService';
import { WidgetDataService } from '../services/WidgetDataService';
import { useStudyPlansStore } from '../features/study-plans/studyPlansSlice';
import { useTasksStore } from '../features/tasks/tasksSlice';
import { useAppSettings } from '../hooks/useAppSettings';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../theme';

const VERSION = '0.0.1';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
type Period = 'AM' | 'PM';

const toClockParts = (hour: number, minute: number) => {
  const period: Period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return {
    hour12,
    minute,
    period,
  };
};

const to24Hour = (hour12: number, period: Period): number => {
  if (period === 'AM') return hour12 === 12 ? 0 : hour12;
  return hour12 === 12 ? 12 : hour12 + 12;
};

const formatReminderTime = (hour: number, minute: number): string => {
  const parts = toClockParts(hour, minute);
  return `${parts.hour12}:${String(parts.minute).padStart(2, '0')} ${
    parts.period
  }`;
};

const wrapValue = (value: number, min: number, max: number): number => {
  if (value < min) return max;
  if (value > max) return min;
  return value;
};

export const SettingsScreen: React.FC = () => {
  const {
    plans,
    error: plansError,
    loadPlans,
    clearPlans,
  } = useStudyPlansStore();
  const { tasks, error: tasksError, loadTasks, clearTasks } = useTasksStore();
  const { settings, isCompact, layout, updateSetting, updateSettings } =
    useAppSettings();
  const [isResetting, setIsResetting] = useState(false);
  const [isUpdatingReminder, setIsUpdatingReminder] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [draftHour, setDraftHour] = useState(settings.reminderHour);
  const [draftMinute, setDraftMinute] = useState(settings.reminderMinute);

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

  const reminderTimeLabel = formatReminderTime(
    settings.reminderHour,
    settings.reminderMinute,
  );
  const draftClock = toClockParts(draftHour, draftMinute);
  const loadError = plansError ?? tasksError;

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
          settings.reminderHour,
          settings.reminderMinute,
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

  const openReminderTimePicker = () => {
    setDraftHour(settings.reminderHour);
    setDraftMinute(settings.reminderMinute);
    setTimePickerVisible(true);
  };

  const changeDraftHour = (offset: number) => {
    const current = toClockParts(draftHour, draftMinute);
    const nextHour12 = wrapValue(current.hour12 + offset, 1, 12);
    setDraftHour(to24Hour(nextHour12, current.period));
  };

  const changeDraftMinute = (offset: number) => {
    setDraftMinute(current => wrapValue(current + offset, 0, 59));
  };

  const changeDraftPeriod = (period: Period) => {
    const current = toClockParts(draftHour, draftMinute);
    setDraftHour(to24Hour(current.hour12, period));
  };

  const handleSaveReminderTime = async () => {
    setIsUpdatingReminder(true);
    try {
      if (settings.dailyReminder) {
        const scheduled = await NotificationService.scheduleDailyReminder(
          draftHour,
          draftMinute,
        );
        if (!scheduled) {
          Alert.alert(
            'Reminder Not Enabled',
            'Allow notification and alarm permissions, then save the reminder time again.',
          );
          return;
        }
      }

      await updateSettings({
        reminderHour: draftHour,
        reminderMinute: draftMinute,
      });
      setTimePickerVisible(false);
    } catch {
      Alert.alert(
        'Reminder Error',
        'Unable to update your reminder time. Please try again.',
      );
    } finally {
      setIsUpdatingReminder(false);
    }
  };

  const handleCalendarSyncInfo = () => {
    Alert.alert(
      'Calendar Sync',
      CalendarService.isAvailable()
        ? 'Calendar sync is available. Open a plan and use the calendar button on a task.'
        : 'Calendar sync is prepared in the app, but the RNCalendarEvents native module is not installed yet.',
    );
  };

  const handleRefreshWidgetData = async () => {
    try {
      await WidgetDataService.refreshFromStorage();
      Alert.alert('Widgets Updated', 'Today task and streak data refreshed.');
    } catch {
      Alert.alert(
        'Widget Update Failed',
        'Unable to refresh widget data right now.',
      );
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
    <ScreenContainer>
      <ScreenHeader
        title="Settings"
        subtitle="Manage preferences, data, and app information"
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { padding: layout.screenPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {loadError ? (
          <View style={styles.inlineError}>
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color={Colors.danger}
            />
            <Text style={styles.inlineErrorText}>{loadError}</Text>
          </View>
        ) : null}

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
            description={`Daily at ${reminderTimeLabel}`}
            value={settings.dailyReminder}
            disabled={isUpdatingReminder}
            rowStyle={rowStyle}
            onValueChange={handleDailyReminderChange}
          />
          <Divider />
          <SettingsActionRow
            icon="time-outline"
            label="Reminder time"
            description={reminderTimeLabel}
            disabled={isUpdatingReminder}
            rowStyle={rowStyle}
            onPress={openReminderTimePicker}
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
          INTEGRATIONS
        </Text>
        <Card style={[styles.card, { paddingHorizontal: layout.cardPadding }]}>
          <SettingsActionRow
            icon="calendar-outline"
            label="Calendar sync"
            description="Link individual tasks to the phone calendar"
            rowStyle={rowStyle}
            onPress={handleCalendarSyncInfo}
          />
          <Divider />
          <SettingsActionRow
            icon="phone-portrait-outline"
            label="Refresh widget data"
            description="Update today task, streak, and exam countdown payload"
            rowStyle={rowStyle}
            onPress={handleRefreshWidgetData}
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
      </ScrollView>

      <TimePickerModal
        visible={timePickerVisible}
        hour12={draftClock.hour12}
        minute={draftClock.minute}
        period={draftClock.period}
        saving={isUpdatingReminder}
        onChangeHour={changeDraftHour}
        onChangeMinute={changeDraftMinute}
        onChangePeriod={changeDraftPeriod}
        onCancel={() => setTimePickerVisible(false)}
        onSave={handleSaveReminderTime}
      />
    </ScreenContainer>
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

interface TimePickerModalProps {
  visible: boolean;
  hour12: number;
  minute: number;
  period: Period;
  saving: boolean;
  onChangeHour: (offset: number) => void;
  onChangeMinute: (offset: number) => void;
  onChangePeriod: (period: Period) => void;
  onCancel: () => void;
  onSave: () => void;
}

const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  hour12,
  minute,
  period,
  saving,
  onChangeHour,
  onChangeMinute,
  onChangePeriod,
  onCancel,
  onSave,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onCancel}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.timePickerCard}>
        <Text style={styles.timePickerTitle}>Reminder Time</Text>

        <View style={styles.timePickerControls}>
          <TimeStepper
            label="Hour"
            value={String(hour12)}
            onIncrement={() => onChangeHour(1)}
            onDecrement={() => onChangeHour(-1)}
          />
          <Text style={styles.timeSeparator}>:</Text>
          <TimeStepper
            label="Minute"
            value={String(minute).padStart(2, '0')}
            onIncrement={() => onChangeMinute(1)}
            onDecrement={() => onChangeMinute(-1)}
          />
          <View style={styles.periodColumn}>
            {(['AM', 'PM'] as Period[]).map(item => {
              const active = item === period;
              return (
                <TouchableOpacity
                  key={item}
                  activeOpacity={0.75}
                  style={[
                    styles.periodButton,
                    active && styles.periodButtonActive,
                  ]}
                  onPress={() => onChangePeriod(item)}
                >
                  <Text
                    style={[
                      styles.periodText,
                      active && styles.periodTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.modalActions}>
          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.modalSecondaryButton}
            onPress={onCancel}
            disabled={saving}
          >
            <Text style={styles.modalSecondaryText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.75}
            style={[styles.modalPrimaryButton, saving && styles.disabledRow]}
            onPress={onSave}
            disabled={saving}
          >
            <Text style={styles.modalPrimaryText}>
              {saving ? 'Saving...' : 'Save Time'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

interface TimeStepperProps {
  label: string;
  value: string;
  onIncrement: () => void;
  onDecrement: () => void;
}

const TimeStepper: React.FC<TimeStepperProps> = ({
  label,
  value,
  onIncrement,
  onDecrement,
}) => (
  <View style={styles.timeStepper}>
    <Text style={styles.timeStepperLabel}>{label}</Text>
    <TouchableOpacity
      activeOpacity={0.75}
      style={styles.timeStepButton}
      onPress={onIncrement}
    >
      <Ionicons name="chevron-up" size={22} color={Colors.primary} />
    </TouchableOpacity>
    <Text style={styles.timeStepValue}>{value}</Text>
    <TouchableOpacity
      activeOpacity={0.75}
      style={styles.timeStepButton}
      onPress={onDecrement}
    >
      <Ionicons name="chevron-down" size={22} color={Colors.primary} />
    </TouchableOpacity>
  </View>
);

const Divider = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
  scroll: {
    padding: Spacing.base,
    paddingBottom: Spacing.xxl,
  },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.dangerLight,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  inlineErrorText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.danger,
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(13, 13, 13, 0.35)',
    padding: Spacing.base,
  },
  timePickerCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
  },
  timePickerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  timePickerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  timeStepper: {
    width: 86,
    alignItems: 'center',
  },
  timeStepperLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semiBold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  timeStepButton: {
    width: 44,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight + '18',
  },
  timeStepValue: {
    minWidth: 58,
    textAlign: 'center',
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extraBold,
    color: Colors.textPrimary,
    marginVertical: Spacing.xs,
  },
  timeSeparator: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
  },
  periodColumn: {
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  periodButton: {
    minWidth: 58,
    minHeight: 42,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  periodButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  periodText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
  },
  periodTextActive: {
    color: Colors.white,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  modalSecondaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalPrimaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  modalSecondaryText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
  },
  modalPrimaryText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
    color: Colors.white,
  },
});
