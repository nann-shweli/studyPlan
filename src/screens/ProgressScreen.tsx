import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStudyPlansStore } from '../features/study-plans/studyPlansSlice';
import { useTasksStore } from '../features/tasks/tasksSlice';
import { useProgress } from '../features/progress/hooks/useProgress';
import { ProgressCard } from '../features/progress/components/ProgressCard';
import { EmptyState } from '../components/EmptyState';
import { Colors, Spacing, FontSize, FontWeight } from '../theme';
import { useAppSettings } from '../hooks/useAppSettings';

export const ProgressScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { plans, loadPlans } = useStudyPlansStore();
  const { loadTasks } = useTasksStore();
  const { progressList, overall } = useProgress();
  const { layout } = useAppSettings();

  useEffect(() => {
    loadPlans();
    loadTasks();
  }, [loadPlans, loadTasks]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.header, { paddingVertical: layout.headerVertical }]}>
        <Text style={styles.headerTitle}>Progress</Text>
      </View>

      {plans.length > 0 ? (
        <View
          style={[
            styles.overallCard,
            {
              marginHorizontal: layout.screenPadding,
              marginTop: layout.sectionGap,
              padding: layout.cardPadding,
              marginBottom: layout.cardGap,
            },
          ]}
        >
          <View style={styles.overallHeader}>
            <View>
              <Text style={styles.overallTitle}>Overall Progress</Text>
              <Text style={styles.overallSubtitle}>
                {overall.completedTasks} of {overall.totalTasks} tasks done
              </Text>
            </View>
            <Text style={styles.overallPercent}>{overall.percent}%</Text>
          </View>

          <View style={styles.overallProgressTrack}>
            <View
              style={[
                styles.overallProgressFill,
                { width: `${overall.percent}%` },
              ]}
            />
          </View>

          <View style={styles.overallMetaRow}>
            <View style={styles.overallChip}>
              <Text style={styles.overallChipValue}>{plans.length}</Text>
              <Text style={styles.overallChipLabel}>Plans</Text>
            </View>
            <View style={styles.overallChip}>
              <Text style={styles.overallChipValue}>{overall.totalTasks}</Text>
              <Text style={styles.overallChipLabel}>Tasks</Text>
            </View>
            <View style={styles.overallChip}>
              <Text style={styles.overallChipValue}>
                {overall.completedTasks}
              </Text>
              <Text style={styles.overallChipLabel}>Done</Text>
            </View>
          </View>
        </View>
      ) : null}

      <FlatList
        data={plans}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.list, { padding: layout.screenPadding }]}
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
            icon={'barbell-outline'}
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
  overallHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  overallTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  overallSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.white + 'CC',
    marginTop: 2,
    fontWeight: FontWeight.medium,
  },
  overallPercent: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extraBold,
    color: Colors.white,
  },
  overallProgressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: Colors.white + '30',
    overflow: 'hidden',
    marginTop: Spacing.md,
  },
  overallProgressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: Colors.white,
  },
  overallMetaRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  overallChip: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: Colors.white + '18',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  overallChipValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extraBold,
    color: Colors.white,
  },
  overallChipLabel: {
    fontSize: FontSize.xs,
    color: Colors.white + 'BB',
    marginTop: 2,
    fontWeight: FontWeight.medium,
  },
  list: { padding: Spacing.base, flexGrow: 1 },
});
