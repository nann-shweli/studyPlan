import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../components/ui';
import { PlanForm } from '../features/study-plans/components/PlanForm';
import { useStudyPlansStore } from '../features/study-plans/studyPlansSlice';
import { Colors } from '../theme';

export const CreatePlanScreen: React.FC = () => {
  const navigation = useNavigation();
  const { addPlan } = useStudyPlansStore();

  const handleSubmit = async (values: {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    examDate?: string;
  }) => {
    await addPlan({
      ...values,
      examDate: values.examDate || undefined,
      status: 'active',
    });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Header
        title="New Study Plan"
        showBack
        onBack={() => navigation.goBack()}
      />
      <PlanForm
        onSubmit={handleSubmit}
        onCancel={() => navigation.goBack()}
        submitLabel="Create Plan"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
});
