import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useStudyPlansStore } from '../features/study-plans/studyPlansSlice';
import { useTasksStore } from '../features/tasks/tasksSlice';
import { useProgress } from '../features/progress/hooks/useProgress';
import { ProgressCard } from '../features/progress/components/ProgressCard';
import { EmptyState, ErrorState, LoadingState } from '../components/feedback';
import { ScreenContainer, ScreenHeader } from '../components/layout';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../theme';
import { useAppSettings } from '../hooks/useAppSettings';

export const ProgressScreen: React.FC = () => {
  const {
    plans,
    isLoading: isPlansLoading,
    error: plansError,
    loadPlans,
  } = useStudyPlansStore();
  const {
    isLoading: isTasksLoading,
    error: tasksError,
    loadTasks,
  } = useTasksStore();
  const { progressList, overall } = useProgress();
  const { layout } = useAppSettings();
  const isLoading = isPlansLoading || isTasksLoading;
  const error = plansError ?? tasksError;

  useEffect(() => {
    loadPlans();
    loadTasks();
  }, [loadPlans, loadTasks]);

  const refresh = async () => {
    await Promise.all([loadPlans(), loadTasks()]);
  };

  const renderEmptyState = () => {
    if (isLoading) {
      return <LoadingState title="Loading progress..." />;
    }

    if (error) {
      return <ErrorState message={error} onRetry={refresh} />;
    }

    return (
      <EmptyState
        icon="bar-chart-outline"
        title="No progress yet"
        subtitle="Create study plans and complete tasks to see progress here."
      />
    );
  };

  return (
    <ScreenContainer>
      <ScreenHeader
        title="Progress"
        subtitle={`${overall.completedTasks} of ${overall.totalTasks} tasks done`}
      />

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
        contentContainerStyle={[
          styles.list,
          {
            padding: layout.screenPadding,
            paddingBottom: layout.screenPadding + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading && plans.length > 0}
        onRefresh={refresh}
        renderItem={({ item }) => {
          const progress = progressList.find(p => p.planId === item.id) ?? {
            planId: item.id,
            totalTasks: 0,
            completedTasks: 0,
          };
          return <ProgressCard plan={item} progress={progress} />;
        }}
        ListEmptyComponent={renderEmptyState}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  overallCard: {
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    borderRadius: Radius.lg,
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
