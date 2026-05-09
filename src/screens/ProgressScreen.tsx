import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStudyPlansStore } from '../features/study-plans/studyPlansSlice';
import { useTasksStore } from '../features/tasks/tasksSlice';
import { useProgress } from '../features/progress/hooks/useProgress';
import { ProgressCard } from '../features/progress/components/ProgressCard';
import { EmptyState } from '../components/EmptyState';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../theme';

export const ProgressScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { plans, loadPlans } = useStudyPlansStore();
  const { loadTasks } = useTasksStore();
  const { progressList, overall } = useProgress();

  useEffect(() => {
    loadPlans();
    loadTasks();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Progress</Text>
      </View>

      {/* Overall summary card */}
      {plans.length > 0 ? (
        <View style={styles.overallCard}>
          <View style={styles.overallRow}>
            <View style={styles.overallStat}>
              <Text style={styles.overallValue}>{plans.length}</Text>
              <Text style={styles.overallLabel}>Plans</Text>
            </View>
            <View style={styles.overallDivider} />
            <View style={styles.overallStat}>
              <Text style={[styles.overallValue, { color: Colors.success }]}>
                {overall.completedTasks}
              </Text>
              <Text style={styles.overallLabel}>Done</Text>
            </View>
            <View style={styles.overallDivider} />
            <View style={styles.overallStat}>
              <Text style={[styles.overallValue, { color: Colors.primary }]}>
                {overall.percent}%
              </Text>
              <Text style={styles.overallLabel}>Overall</Text>
            </View>
          </View>
        </View>
      ) : null}

      {/* Per-plan progress */}
      <FlatList
        data={plans}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const progress = progressList.find(p => p.planId === item.id) ?? {
            planId: item.id,
            totalTasks: 0,
            completedTasks: 0,
          };
          return <ProgressCard plan={item} progress={progress} />;
        }}
        ListEmptyComponent={
          <EmptyState
            emoji="📊"
            title="No progress yet"
            subtitle="Create study plans and add tasks to track your progress"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.surface,
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
  overallCard: {
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    borderRadius: 16,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
  },
  overallRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overallStat: { flex: 1, alignItems: 'center' },
  overallValue: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extraBold,
    color: Colors.white,
  },
  overallLabel: {
    fontSize: FontSize.xs,
    color: Colors.white + 'BB',
    marginTop: 4,
    fontWeight: FontWeight.medium,
  },
  overallDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.white + '40',
  },
  list: { padding: Spacing.base, flexGrow: 1 },
});
