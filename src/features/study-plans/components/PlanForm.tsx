import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, DatePickerInput, Input } from '../../../components/ui';
import { Spacing } from '../../../theme';
import { todayISO } from '../../../utils/dateUtils';
import { useAppSettings } from '../../../hooks/useAppSettings';

interface PlanFormValues {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  examDate: string;
}

interface PlanFormProps {
  initialValues?: Partial<PlanFormValues>;
  onSubmit: (values: PlanFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

const INITIAL: PlanFormValues = {
  title: '',
  description: '',
  startDate: todayISO(),
  endDate: '',
  examDate: '',
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.';

export const PlanForm: React.FC<PlanFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = 'Create Plan',
}) => {
  const { layout } = useAppSettings();
  const [values, setValues] = useState<PlanFormValues>({
    ...INITIAL,
    ...initialValues,
  });
  const [errors, setErrors] = useState<Partial<PlanFormValues>>({});
  const [loading, setLoading] = useState(false);

  const set = (key: keyof PlanFormValues) => (text: string) =>
    setValues(prev => ({ ...prev, [key]: text }));

  const validate = (): boolean => {
    const e: Partial<PlanFormValues> = {};
    if (!values.title.trim()) e.title = 'Title is required';
    if (!values.startDate.trim())
      e.startDate = 'Start date is required (YYYY-MM-DD)';
    if (!values.endDate.trim()) e.endDate = 'End date is required (YYYY-MM-DD)';
    else if (values.endDate <= values.startDate)
      e.endDate = 'End date must be after start date';
    if (values.examDate && values.examDate < values.startDate) {
      e.examDate = 'Exam date must be after the start date';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      await onSubmit({
        ...values,
        examDate: values.examDate.trim(),
      });
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.container,
        { padding: layout.screenPadding },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <Input
        label="Plan Title *"
        placeholder="e.g. Learn React Native"
        value={values.title}
        onChangeText={set('title')}
        error={errors.title}
        autoFocus
      />
      <Input
        label="Description"
        placeholder="What will you learn?"
        value={values.description}
        onChangeText={set('description')}
        multiline
        numberOfLines={3}
        style={styles.multiline}
      />
      <DatePickerInput
        label="Start Date *"
        placeholder="Pick start date"
        value={values.startDate}
        onChange={set('startDate')}
        error={errors.startDate}
      />
      <DatePickerInput
        label="End Date *"
        placeholder="Pick end date"
        value={values.endDate}
        onChange={set('endDate')}
        error={errors.endDate}
        minimumDate={values.startDate}
      />
      <DatePickerInput
        label="Exam Date"
        placeholder="Pick exam date"
        value={values.examDate}
        onChange={set('examDate')}
        error={errors.examDate}
        minimumDate={values.startDate}
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: Spacing.base },
  multiline: { height: 80, textAlignVertical: 'top' },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  cancelBtn: { flex: 1 },
  submitBtn: { flex: 2 },
});
