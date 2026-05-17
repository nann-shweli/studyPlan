import React, { useState } from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity } from 'react-native';
import { Button, DatePickerInput, Input } from '../../../components/ui';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '../../../theme';
import { todayISO } from '../../../utils/dateUtils';
import { useAppSettings } from '../../../hooks/useAppSettings';
import type { StudyTaskPriority } from '../../../types';

interface TaskFormValues {
  title: string;
  subject: string;
  date: string;
  durationMinutes: string;
  priority: StudyTaskPriority;
  reminderTime: string;
}

interface TaskFormSubmitValues {
  title: string;
  subject?: string;
  date: string;
  scheduledDate: string;
  durationMinutes: number;
  priority: StudyTaskPriority;
  reminderTime?: string;
}

interface TaskFormProps {
  planId: string;
  initialValues?: Partial<TaskFormValues>;
  onSubmit: (values: TaskFormSubmitValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

const PRIORITIES: StudyTaskPriority[] = ['low', 'medium', 'high'];

const getErrorMessage = (error: unknown): string =>
  error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.';

export const TaskForm: React.FC<TaskFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = 'Add Task',
}) => {
  const { layout } = useAppSettings();
  const [values, setValues] = useState<TaskFormValues>({
    title: '',
    subject: '',
    date: todayISO(),
    durationMinutes: '',
    priority: 'medium',
    reminderTime: '',
    ...initialValues,
  });
  const [errors, setErrors] = useState<Partial<TaskFormValues>>({});
  const [loading, setLoading] = useState(false);

  const set = (key: keyof TaskFormValues) => (text: string) =>
    setValues(prev => ({ ...prev, [key]: text }));

  const validate = (): boolean => {
    const e: Partial<TaskFormValues> = {};
    if (!values.title.trim()) e.title = 'Task title is required';
    if (!values.date.trim()) e.date = 'Date is required (YYYY-MM-DD)';
    if (
      values.durationMinutes.trim() &&
      (!Number.isInteger(Number(values.durationMinutes)) ||
        Number(values.durationMinutes) < 0)
    ) {
      e.durationMinutes = 'Use whole minutes, e.g. 45';
    }
    if (
      values.reminderTime.trim() &&
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(values.reminderTime.trim())
    ) {
      e.reminderTime = 'Use 24-hour time, e.g. 19:30';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      await onSubmit({
        title: values.title.trim(),
        subject: values.subject.trim() || undefined,
        date: values.date,
        scheduledDate: values.date,
        durationMinutes: values.durationMinutes.trim()
          ? Number(values.durationMinutes)
          : 0,
        priority: values.priority,
        reminderTime: values.reminderTime.trim() || undefined,
      });
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { padding: layout.screenPadding }]}>
      <Input
        label="Task Title *"
        placeholder="e.g. Read Chapter 3"
        value={values.title}
        onChangeText={set('title')}
        error={errors.title}
        autoFocus
      />
      <Input
        label="Subject"
        placeholder="e.g. Biology"
        value={values.subject}
        onChangeText={set('subject')}
        error={errors.subject}
      />
      <DatePickerInput
        label="Date *"
        placeholder="Pick task date"
        value={values.date}
        onChange={set('date')}
        error={errors.date}
      />
      <Input
        label="Duration"
        placeholder="Minutes, e.g. 45"
        value={values.durationMinutes}
        onChangeText={set('durationMinutes')}
        error={errors.durationMinutes}
        keyboardType="numeric"
      />
      <View style={styles.field}>
        <Text style={styles.label}>Priority</Text>
        <View style={styles.priorityRow}>
          {PRIORITIES.map(priority => {
            const selected = values.priority === priority;
            return (
              <TouchableOpacity
                key={priority}
                activeOpacity={0.75}
                style={[
                  styles.priorityButton,
                  selected && styles.priorityButtonSelected,
                ]}
                onPress={() =>
                  setValues(prev => ({
                    ...prev,
                    priority,
                  }))
                }
              >
                <Text
                  style={[
                    styles.priorityText,
                    selected && styles.priorityTextSelected,
                  ]}
                >
                  {priority}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <Input
        label="Reminder Time"
        placeholder="Optional, e.g. 19:30"
        value={values.reminderTime}
        onChangeText={set('reminderTime')}
        error={errors.reminderTime}
      />
      <View style={[styles.actions, { marginTop: layout.sectionGap }]}>
        <Button
          label="Cancel"
          variant="secondary"
          onPress={onCancel}
          style={styles.cancelBtn}
        />
        <Button
          label={submitLabel}
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: Spacing.base },
  field: { marginBottom: Spacing.md },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  priorityButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  priorityText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  priorityTextSelected: {
    color: Colors.white,
  },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  cancelBtn: { flex: 1 },
  submitBtn: { flex: 2 },
});
