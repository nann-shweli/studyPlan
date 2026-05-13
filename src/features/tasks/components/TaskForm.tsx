import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Input } from '../../../components/Input';
import { DatePickerInput } from '../../../components/DatePickerInput';
import { Button } from '../../../components/Button';
import { Spacing } from '../../../theme';
import { todayISO } from '../../../utils/dateUtils';
import { useAppSettings } from '../../../hooks/useAppSettings';

interface TaskFormValues {
  title: string;
  date: string;
}

interface TaskFormProps {
  planId: string;
  initialValues?: Partial<TaskFormValues>;
  onSubmit: (values: TaskFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = 'Add Task',
}) => {
  const { layout } = useAppSettings();
  const [values, setValues] = useState<TaskFormValues>({
    title: '',
    date: todayISO(),
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
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      await onSubmit(values);
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
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
      <DatePickerInput
        label="Date *"
        placeholder="Pick task date"
        value={values.date}
        onChange={set('date')}
        error={errors.date}
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
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  cancelBtn: { flex: 1 },
  submitBtn: { flex: 2 },
});
