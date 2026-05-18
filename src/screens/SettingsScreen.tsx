import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
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
import type { ThemeMode } from '../features/settings/settingsTypes';
import { Colors, Spacing, FontSize, FontWeight, Radius, useTheme } from '../theme';

const VERSION = '0.0.1';
const FEEDBACK_SUBJECT = 'StudyPlan feedback';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
type Period = 'AM' | 'PM';
type StatusType = 'success' | 'error' | 'info';

interface StatusMessage {
  type: StatusType;
  text: string;
}

const THEME_OPTIONS: Array<{
  label: string;
  value: ThemeMode;
  icon: IoniconName;
}> = [
  { label: 'System', value: 'system', icon: 'phone-portrait-outline' },
  { label: 'Light', value: 'light', icon: 'sunny-outline' },
  { label: 'Dark', value: 'dark', icon: 'moon-outline' },
];

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

const formatDateTime = (iso?: string | null): string => {
  if (!iso) return 'Not synced yet';

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Not synced yet';

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const SettingsScreen: React.FC = () => {
  const scrollRef = useRef<ScrollView>(null);
  const {
    plans,
    error: plansError,
    loadPlans,
    clearPlans,
  } = useStudyPlansStore();
  const { tasks, error: tasksError, loadTasks, clearTasks } = useTasksStore();
  const { settings, isCompact, layout, updateSetting, updateSettings, colors } =
    useAppSettings();
  const [isResetting, setIsResetting] = useState(false);
  const [isUpdatingReminder, setIsUpdatingReminder] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [draftHour, setDraftHour] = useState(settings.reminderHour);
  const [draftMinute, setDraftMinute] = useState(settings.reminderMinute);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(
    null,
  );
  const [widgetUpdatedAt, setWidgetUpdatedAt] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    loadPlans();
    loadTasks();
  }, [loadPlans, loadTasks]);

  useEffect(() => {
    WidgetDataService.getPayload()
      .then(payload => setWidgetUpdatedAt(payload?.generatedAt ?? null))
      .catch(() => setWidgetUpdatedAt(null));
  }, []);

  useEffect(() => {
    if (!statusMessage) return undefined;

    const timeout = setTimeout(() => setStatusMessage(null), 3200);
    return () => clearTimeout(timeout);
  }, [statusMessage]);

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
  const widgetSyncLabel = formatDateTime(widgetUpdatedAt);
  const completionRate =
    stats.tasks > 0
      ? Math.round((stats.completedTasks / stats.tasks) * 100)
      : 0;

  const showStatus = (type: StatusType, text: string) => {
    setStatusMessage({ type, text });
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const shouldShow = event.nativeEvent.contentOffset.y > 360;
    setShowScrollTop(current =>
      current === shouldShow ? current : shouldShow,
    );
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
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
    showStatus('success', 'Progress summary is ready to share.');
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
              await WidgetDataService.clear();
              setWidgetUpdatedAt(null);
              clearPlans();
              clearTasks();
              showStatus('success', 'All local study data was cleared.');
            } catch {
              showStatus('error', 'Unable to clear all local data.');
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
          showStatus('error', 'Reminder permissions are not enabled.');
          return;
        }
      } else {
        await NotificationService.cancelDailyReminder();
      }

      await updateSetting('dailyReminder', value);
      showStatus(
        'success',
        value ? 'Daily reminder enabled.' : 'Daily reminder disabled.',
      );
    } catch {
      showStatus('error', 'Unable to update your daily reminder.');
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
          showStatus('error', 'Reminder permissions are not enabled.');
          return;
        }
      }

      await updateSettings({
        reminderHour: draftHour,
        reminderMinute: draftMinute,
      });
      setTimePickerVisible(false);
      showStatus('success', 'Reminder time updated.');
    } catch {
      showStatus('error', 'Unable to update reminder time.');
    } finally {
      setIsUpdatingReminder(false);
    }
  };

  const handleThemeChange = async (themeMode: ThemeMode) => {
    try {
      await updateSetting('themeMode', themeMode);
      showStatus('success', 'Theme preference saved.');
    } catch {
      showStatus('error', 'Unable to save theme preference.');
    }
  };

  const handleCalendarSyncInfo = () => {
    showStatus(
      CalendarService.isAvailable() ? 'success' : 'info',
      CalendarService.isAvailable()
        ? 'Calendar sync is available. Open a plan and use the calendar button on a task.'
        : 'Calendar sync is prepared in the app, but the RNCalendarEvents native module is not installed yet.',
    );
  };

  const handleRefreshWidgetData = async () => {
    try {
      const payload = await WidgetDataService.refreshFromStorage();
      setWidgetUpdatedAt(payload.generatedAt);
      showStatus('success', 'Today task and streak widget data refreshed.');
    } catch {
      showStatus('error', 'Unable to refresh widget data right now.');
    }
  };

  const handleFeedback = async () => {
    const subject = encodeURIComponent(FEEDBACK_SUBJECT);
    const body = encodeURIComponent(
      [
        'Hi StudyPlan team,',
        '',
        'I have feedback about:',
        '',
        `App version: ${VERSION}`,
      ].join('\n'),
    );
    const url = `mailto:?subject=${subject}&body=${body}`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return;
      }

      await Share.share({
        message: `${FEEDBACK_SUBJECT}\n\nApp version: ${VERSION}`,
      });
    } catch {
      showStatus('error', 'Unable to open feedback right now.');
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
        ref={scrollRef}
        contentContainerStyle={[
          styles.scroll,
          { padding: layout.screenPadding },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
      >
        {loadError ? (
          <View
            style={[
              styles.inlineError,
              { backgroundColor: colors.dangerLight },
            ]}
          >
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color={colors.danger}
            />
            <Text style={[styles.inlineErrorText, { color: colors.danger }]}>
              {loadError}
            </Text>
          </View>
        ) : null}

        <SettingsSection title="Overview" sectionGap={layout.sectionGap}>
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
        </SettingsSection>

        <SettingsSection title="Preferences" sectionGap={layout.sectionGap}>
          <Card
            style={[styles.card, { paddingHorizontal: layout.cardPadding }]}
          >
            <ThemeModePicker
              value={settings.themeMode}
              onChange={handleThemeChange}
            />
            <Divider />
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
        </SettingsSection>

        <SettingsSection title="Data" sectionGap={layout.sectionGap}>
          <Card
            style={[styles.card, { paddingHorizontal: layout.cardPadding }]}
          >
            <InfoRow
              label="Completion rate"
              value={`${completionRate}%`}
              rowStyle={infoRowStyle}
            />
            <Divider />
            <InfoRow
              label="Last widget sync"
              value={widgetSyncLabel}
              rowStyle={infoRowStyle}
            />
            <Divider />
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
        </SettingsSection>

        <SettingsSection title="Integrations" sectionGap={layout.sectionGap}>
          <Card
            style={[styles.card, { paddingHorizontal: layout.cardPadding }]}
          >
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
        </SettingsSection>

        <SettingsSection title="Support" sectionGap={layout.sectionGap}>
          <Card
            style={[styles.card, { paddingHorizontal: layout.cardPadding }]}
          >
            <SettingsActionRow
              icon="chatbubble-ellipses-outline"
              label="Send feedback"
              description="Share issues, ideas, or study workflow suggestions"
              rowStyle={rowStyle}
              onPress={handleFeedback}
            />
          </Card>
        </SettingsSection>

        <SettingsSection title="About" sectionGap={layout.sectionGap}>
          <Card
            style={[styles.card, { paddingHorizontal: layout.cardPadding }]}
          >
            <InfoRow
              label="App name"
              value="StudyPlan"
              rowStyle={infoRowStyle}
            />
            <Divider />
            <InfoRow label="Version" value={VERSION} rowStyle={infoRowStyle} />
            <Divider />
            <InfoRow
              label="Storage"
              value="Local, offline first"
              rowStyle={infoRowStyle}
            />
          </Card>
        </SettingsSection>

      </ScrollView>

      {showScrollTop && !statusMessage ? (
        <TouchableOpacity
          accessible
          accessibilityRole="button"
          accessibilityLabel="Scroll to top"
          activeOpacity={0.75}
          style={styles.scrollTopButton}
          onPress={scrollToTop}
        >
          <Ionicons name="chevron-up" size={22} color={colors.white} />
        </TouchableOpacity>
      ) : null}

      {statusMessage ? <StatusBanner message={statusMessage} /> : null}

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

interface SettingsSectionProps {
  title: string;
  sectionGap: number;
  children: React.ReactNode;
}

const SettingsSection = React.memo<SettingsSectionProps>(
  ({ title, sectionGap, children }) => {
    const { colors } = useTheme();

    return (
      <View>
        <Text
          style={[
            styles.sectionLabel,
            { marginTop: sectionGap, color: colors.textSecondary },
          ]}
        >
          {title.toUpperCase()}
        </Text>
        {children}
      </View>
    );
  },
);

interface ThemeModePickerProps {
  value: ThemeMode;
  onChange: (value: ThemeMode) => void;
}

const ThemeModePicker = React.memo<ThemeModePickerProps>(
  ({ value, onChange }) => {
    const { colors } = useTheme();

    return (
    <View style={styles.themeRow}>
      <View
        style={[
          styles.rowIcon,
          { backgroundColor: colors.primaryLight + '18' },
        ]}
      >
        <Ionicons
          name="color-palette-outline"
          size={18}
          color={colors.primary}
        />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
          App theme
        </Text>
        <Text style={[styles.rowDescription, { color: colors.textSecondary }]}>
          Choose the preferred appearance for study sessions
        </Text>
        <View style={styles.themeOptions}>
          {THEME_OPTIONS.map(option => {
            const selected = option.value === value;
            return (
              <TouchableOpacity
                key={option.value}
                accessible
                accessibilityRole="button"
                accessibilityLabel={`${option.label} theme`}
                accessibilityState={{ selected }}
                activeOpacity={0.75}
                style={[
                  styles.themeOption,
                  {
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected
                      ? colors.primaryLight + '20'
                      : colors.surfaceAlt,
                  },
                ]}
                onPress={() => onChange(option.value)}
              >
                <Ionicons
                  name={option.icon}
                  size={15}
                  color={selected ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.themeOptionText,
                    {
                      color: selected
                        ? colors.primaryDark
                        : colors.textSecondary,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
    );
  },
);

interface StatCardProps {
  label: string;
  value: number;
  icon: IoniconName;
  style?: StyleProp<ViewStyle>;
}

const StatCard = React.memo<StatCardProps>(({ label, value, icon, style }) => {
  const { colors } = useTheme();

  return (
  <Card style={[styles.statCard, style]}>
    <View
      style={[
        styles.statIcon,
        { backgroundColor: colors.primaryLight + '20' },
      ]}
    >
      <Ionicons name={icon} size={18} color={colors.primary} />
    </View>
    <Text style={[styles.statValue, { color: colors.textPrimary }]}>
      {value}
    </Text>
    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
      {label}
    </Text>
  </Card>
  );
});

interface SettingsActionRowProps {
  icon: IoniconName;
  label: string;
  description: string;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
  rowStyle?: StyleProp<ViewStyle>;
}

const SettingsActionRow = React.memo<SettingsActionRowProps>(
  ({
    icon,
    label,
    description,
    onPress,
    danger = false,
    disabled = false,
    rowStyle,
  }) => {
    const { colors } = useTheme();

    return (
    <TouchableOpacity
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={description}
      accessibilityState={{ disabled }}
      style={[styles.row, rowStyle, disabled && styles.disabledRow]}
      activeOpacity={0.75}
      onPress={onPress}
      disabled={disabled}
    >
      <RowIcon icon={icon} danger={danger} />
      <View style={styles.rowContent}>
        <Text
          style={[
            styles.rowLabel,
            { color: danger ? colors.danger : colors.textPrimary },
          ]}
        >
          {label}
        </Text>
        <Text style={[styles.rowDescription, { color: colors.textSecondary }]}>
          {description}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={colors.textDisabled}
      />
    </TouchableOpacity>
    );
  },
);

interface RowIconProps {
  icon: IoniconName;
  danger?: boolean;
}

const RowIcon = React.memo<RowIconProps>(({ icon, danger = false }) => {
  const { colors } = useTheme();

  return (
  <View
    style={[
      styles.rowIcon,
      {
        backgroundColor: danger
          ? colors.dangerLight
          : colors.primaryLight + '18',
      },
    ]}
  >
    <Ionicons
      name={icon}
      size={18}
      color={danger ? colors.danger : colors.primary}
    />
  </View>
  );
});

interface InfoRowProps {
  label: string;
  value: string;
  rowStyle?: StyleProp<ViewStyle>;
}

const InfoRow = React.memo<InfoRowProps>(({ label, value, rowStyle }) => {
  const { colors } = useTheme();

  return (
  <View style={[styles.infoRow, rowStyle]}>
    <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
      {label}
    </Text>
    <Text style={[styles.rowValue, { color: colors.textSecondary }]}>
      {value}
    </Text>
  </View>
  );
});

interface StatusBannerProps {
  message: StatusMessage;
}

const StatusBanner = React.memo<StatusBannerProps>(({ message }) => {
  const isError = message.type === 'error';
  const isSuccess = message.type === 'success';
  const { colors } = useTheme();
  const iconColor = isError
    ? colors.danger
    : isSuccess
    ? colors.success
    : colors.primary;

  return (
    <View
      accessible
      accessibilityRole="alert"
      style={[
        styles.statusBanner,
        {
          borderColor: isError
            ? colors.danger
            : isSuccess
            ? colors.success
            : colors.primaryLight,
          backgroundColor: isError
            ? colors.dangerLight
            : isSuccess
            ? colors.successLight
            : colors.surface,
        },
      ]}
    >
      <Ionicons
        name={
          isError
            ? 'alert-circle-outline'
            : isSuccess
            ? 'checkmark-circle-outline'
            : 'information-circle-outline'
        }
        size={18}
        color={iconColor}
      />
      <Text
        style={[
          styles.statusText,
          {
            color: isError
              ? colors.danger
              : isSuccess
              ? colors.success
              : colors.primaryDark,
          },
        ]}
      >
        {message.text}
      </Text>
    </View>
  );
});

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
}) => {
  const { colors } = useTheme();

  return (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onCancel}
  >
    <View style={styles.modalOverlay}>
      <View
        style={[styles.timePickerCard, { backgroundColor: colors.surface }]}
      >
        <Text style={[styles.timePickerTitle, { color: colors.textPrimary }]}>
          Reminder Time
        </Text>

        <View style={styles.timePickerControls}>
          <TimeStepper
            label="Hour"
            value={String(hour12)}
            onIncrement={() => onChangeHour(1)}
            onDecrement={() => onChangeHour(-1)}
          />
          <Text style={[styles.timeSeparator, { color: colors.textSecondary }]}>
            :
          </Text>
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
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel={`${item} reminder period`}
                  accessibilityState={{ selected: active }}
                  activeOpacity={0.75}
                  style={[
                    styles.periodButton,
                    {
                      borderColor: active ? colors.primary : colors.border,
                      backgroundColor: active ? colors.primary : colors.surface,
                    },
                  ]}
                  onPress={() => onChangePeriod(item)}
                >
                  <Text
                    style={[
                      styles.periodText,
                      { color: active ? colors.white : colors.textSecondary },
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
            accessible
            accessibilityRole="button"
            accessibilityLabel="Cancel reminder time"
            activeOpacity={0.75}
            style={[
              styles.modalSecondaryButton,
              {
                backgroundColor: colors.surfaceAlt,
                borderColor: colors.border,
              },
            ]}
            onPress={onCancel}
            disabled={saving}
          >
            <Text
              style={[styles.modalSecondaryText, { color: colors.textPrimary }]}
            >
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessible
            accessibilityRole="button"
            accessibilityLabel="Save reminder time"
            activeOpacity={0.75}
            style={[
              styles.modalPrimaryButton,
              { backgroundColor: colors.primary },
              saving && styles.disabledRow,
            ]}
            onPress={onSave}
            disabled={saving}
          >
            <Text style={[styles.modalPrimaryText, { color: colors.white }]}>
              {saving ? 'Saving...' : 'Save Time'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
  );
};

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
      accessible
      accessibilityRole="button"
      accessibilityLabel={`Increase ${label.toLowerCase()}`}
      activeOpacity={0.75}
      style={styles.timeStepButton}
      onPress={onIncrement}
    >
      <Ionicons name="chevron-up" size={22} color={Colors.primary} />
    </TouchableOpacity>
    <Text style={styles.timeStepValue}>{value}</Text>
    <TouchableOpacity
      accessible
      accessibilityRole="button"
      accessibilityLabel={`Decrease ${label.toLowerCase()}`}
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
  themeRow: {
    minHeight: 112,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
  },
  themeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  themeOption: {
    minHeight: 34,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  themeOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '20',
  },
  themeOptionText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semiBold,
    color: Colors.textSecondary,
  },
  themeOptionTextSelected: {
    color: Colors.primaryDark,
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
  scrollTopButton: {
    position: 'absolute',
    right: Spacing.base,
    bottom: Spacing.lg,
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBanner: {
    position: 'absolute',
    left: Spacing.base,
    right: Spacing.base,
    bottom: Spacing.lg,
    minHeight: 46,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusBannerError: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
  },
  statusBannerSuccess: {
    borderColor: Colors.success,
    backgroundColor: Colors.successLight,
  },
  statusText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.primaryDark,
  },
  statusTextError: {
    color: Colors.danger,
  },
  statusTextSuccess: {
    color: Colors.success,
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
