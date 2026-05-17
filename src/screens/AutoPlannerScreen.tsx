import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Card, DatePickerInput, Header, Input } from '../components/ui';
import type { RootStackParamList } from '../app/navigation/types';
import {
  AutoPlannerService,
  type GeneratedStudyPlan,
  type PlannerDifficulty,
} from '../services/AutoPlannerService';
import { WidgetDataService } from '../services/WidgetDataService';
import { useStudyPlansStore } from '../features/study-plans/studyPlansSlice';
import { useTasksStore } from '../features/tasks/tasksSlice';
import { useAppSettings } from '../hooks/useAppSettings';
import { formatDate, getDaysUntil, todayISO } from '../utils/dateUtils';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type PlannerErrors = Partial<{
  subject: string;
  examDate: string;
  topics: string;
  availableMinutesPerDay: string;
  preferredStudyDays: string;
  reminderTime: string;
}>;

const DIFFICULTIES: PlannerDifficulty[] = ['easy', 'medium', 'hard'];
const DAY_OPTIONS = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

const getErrorMessage = (error: unknown): string =>
  error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.';

export const AutoPlannerScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { layout, isCompact } = useAppSettings();
  const { addPlan } = useStudyPlansStore();
  const { addTask } = useTasksStore();

  const [subject, setSubject] = useState('');
  const [examDate, setExamDate] = useState('');
  const [topics, setTopics] = useState('');
  const [difficulty, setDifficulty] = useState<PlannerDifficulty>('medium');
  const [availableMinutesPerDay, setAvailableMinutesPerDay] = useState('45');
  const [preferredStudyDays, setPreferredStudyDays] = useState<number[]>([
    1, 2, 3, 4, 5,
  ]);
  const [reminderTime, setReminderTime] = useState('');
  const [errors, setErrors] = useState<PlannerErrors>({});
  const [generated, setGenerated] = useState<GeneratedStudyPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const topicsCount = useMemo(
    () => AutoPlannerService.parseTopics(topics).length,
    [topics],
  );

  const togglePreferredDay = (day: number) => {
    setPreferredStudyDays(current =>
      current.includes(day)
        ? current.filter(item => item !== day)
        : [...current, day].sort((a, b) => a - b),
    );
  };

  const validate = (): boolean => {
    const nextErrors: PlannerErrors = {};
    const minutes = Number(availableMinutesPerDay);
    const daysUntilExam = getDaysUntil(examDate);

    if (!subject.trim()) {
      nextErrors.subject = 'Subject is required.';
    }

    if (!examDate.trim()) {
      nextErrors.examDate = 'Exam date is required.';
    } else if (daysUntilExam === null) {
      nextErrors.examDate = 'Pick a valid exam date.';
    } else if (daysUntilExam < 0) {
      nextErrors.examDate = 'Exam date cannot be in the past.';
    }

    if (topicsCount === 0) {
      nextErrors.topics = 'Add at least one topic.';
    }

    if (!Number.isInteger(minutes) || minutes <= 0) {
      nextErrors.availableMinutesPerDay = 'Use whole minutes, e.g. 45.';
    }

    if (preferredStudyDays.length === 0) {
      nextErrors.preferredStudyDays = 'Choose at least one study day.';
    }

    if (
      reminderTime.trim() &&
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(reminderTime.trim())
    ) {
      nextErrors.reminderTime = 'Use 24-hour time, e.g. 19:30.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleGenerate = () => {
    if (!validate()) return;

    setIsGenerating(true);
    try {
      setGenerated(
        AutoPlannerService.generatePlan({
          subject,
          examDate,
          topics,
          difficulty,
          availableMinutesPerDay: Number(availableMinutesPerDay),
          preferredStudyDays,
          reminderTime: reminderTime.trim() || undefined,
        }),
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generated) return;

    setIsSaving(true);
    try {
      const savedPlan = await addPlan(generated.plan);
      for (const task of generated.tasks) {
        await addTask({ ...task, planId: savedPlan.id });
      }

      await WidgetDataService.refreshFromStorage();
      navigation.replace('PlanDetail', {
        planId: savedPlan.id,
        planTitle: savedPlan.title,
      });
    } catch (error) {
      Alert.alert('Save Failed', getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Auto Generate Plan"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { padding: layout.screenPadding },
        ]}
      >
        <Card style={styles.formCard}>
          <Input
            label="Subject *"
            placeholder="e.g. Mathematics"
            value={subject}
            onChangeText={text => {
              setSubject(text);
              setGenerated(null);
            }}
            error={errors.subject}
            autoFocus
          />
          <DatePickerInput
            label="Exam Date *"
            placeholder="Pick exam date"
            value={examDate}
            onChange={value => {
              setExamDate(value);
              setGenerated(null);
            }}
            error={errors.examDate}
            minimumDate={todayISO()}
          />
          <Input
            label="Topics *"
            placeholder="One topic per line, or separate with commas"
            value={topics}
            onChangeText={text => {
              setTopics(text);
              setGenerated(null);
            }}
            error={errors.topics}
            multiline
            textAlignVertical="top"
            style={[
              styles.topicsInput,
              isCompact
                ? styles.topicsInputCompact
                : styles.topicsInputComfortable,
            ]}
            hint={
              topicsCount > 0 ? `${topicsCount} topics detected` : undefined
            }
          />
          <Input
            label="Available Minutes Per Day *"
            placeholder="e.g. 45"
            value={availableMinutesPerDay}
            onChangeText={text => {
              setAvailableMinutesPerDay(text);
              setGenerated(null);
            }}
            error={errors.availableMinutesPerDay}
            keyboardType="numeric"
          />
          <Input
            label="Reminder Time"
            placeholder="Optional, e.g. 19:30"
            value={reminderTime}
            onChangeText={text => {
              setReminderTime(text);
              setGenerated(null);
            }}
            error={errors.reminderTime}
          />

          <View style={styles.field}>
            <Text style={styles.label}>Difficulty</Text>
            <View style={styles.segmentRow}>
              {DIFFICULTIES.map(item => {
                const selected = item === difficulty;
                return (
                  <TouchableOpacity
                    key={item}
                    activeOpacity={0.75}
                    style={[
                      styles.segmentButton,
                      selected && styles.segmentButtonSelected,
                    ]}
                    onPress={() => {
                      setDifficulty(item);
                      setGenerated(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        selected && styles.segmentTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Preferred Study Days *</Text>
            <View style={styles.dayGrid}>
              {DAY_OPTIONS.map(day => {
                const selected = preferredStudyDays.includes(day.value);
                return (
                  <TouchableOpacity
                    key={day.value}
                    activeOpacity={0.75}
                    style={[
                      styles.dayButton,
                      selected && styles.dayButtonSelected,
                    ]}
                    onPress={() => {
                      togglePreferredDay(day.value);
                      setGenerated(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        selected && styles.dayTextSelected,
                      ]}
                    >
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.preferredStudyDays ? (
              <Text style={styles.errorText}>{errors.preferredStudyDays}</Text>
            ) : null}
          </View>

          <Button
            label="Generate Schedule"
            onPress={handleGenerate}
            loading={isGenerating}
            fullWidth
            style={styles.generateButton}
          />
        </Card>

        {generated ? (
          <View style={styles.preview}>
            <View style={styles.previewHeader}>
              <View>
                <Text style={styles.previewTitle}>Preview</Text>
                <Text style={styles.previewSubtitle}>
                  {generated.tasks.length} tasks until{' '}
                  {formatDate(
                    generated.plan.examDate ?? generated.plan.endDate,
                  )}
                </Text>
              </View>
              <View style={styles.previewIcon}>
                <Ionicons
                  name="sparkles-outline"
                  size={20}
                  color={Colors.primary}
                />
              </View>
            </View>

            <View style={styles.summaryGrid}>
              <SummaryPill
                label="Study days"
                value={generated.summary.studyDays}
              />
              <SummaryPill label="Topics" value={generated.summary.topics} />
              <SummaryPill
                label="Minutes"
                value={generated.summary.totalMinutes}
              />
            </View>

            {generated.tasks.map((task, index) => (
              <Card
                key={`${task.scheduledDate}-${index}`}
                style={styles.taskCard}
              >
                <View style={styles.taskHeader}>
                  <Text style={styles.taskDate}>
                    {formatDate(task.scheduledDate, 'MMM d')}
                  </Text>
                  <Text style={styles.taskPriority}>{task.priority}</Text>
                </View>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskMeta}>
                  {task.durationMinutes}m
                  {task.reminderTime ? ` at ${task.reminderTime}` : ''}
                </Text>
              </Card>
            ))}

            <View style={styles.saveActions}>
              <Button
                label="Regenerate"
                variant="secondary"
                onPress={handleGenerate}
                disabled={isSaving}
                style={styles.actionButton}
              />
              <Button
                label="Save Plan"
                onPress={handleSave}
                loading={isSaving}
                style={styles.actionButton}
              />
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};

interface SummaryPillProps {
  label: string;
  value: number;
}

const SummaryPill: React.FC<SummaryPillProps> = ({ label, value }) => (
  <View style={styles.summaryPill}>
    <Text style={styles.summaryValue}>{value}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    padding: Spacing.base,
    paddingBottom: Spacing.xxl,
  },
  formCard: {
    borderRadius: Radius.md,
  },
  topicsInput: {
    lineHeight: 22,
  },
  topicsInputCompact: {
    minHeight: 88,
  },
  topicsInputComfortable: {
    minHeight: 118,
  },
  field: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  segmentButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  segmentText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  segmentTextSelected: {
    color: Colors.white,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  dayButton: {
    minWidth: 44,
    minHeight: 36,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  dayButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '22',
  },
  dayText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
  },
  dayTextSelected: {
    color: Colors.primaryDark,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    marginTop: Spacing.xs,
  },
  generateButton: {
    marginTop: Spacing.xs,
  },
  preview: {
    marginTop: Spacing.lg,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  previewTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  previewSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  previewIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  summaryPill: {
    flex: 1,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extraBold,
    color: Colors.textPrimary,
  },
  summaryLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  taskCard: {
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  taskDate: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  taskPriority: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semiBold,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  taskTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
  },
  taskMeta: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  saveActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
