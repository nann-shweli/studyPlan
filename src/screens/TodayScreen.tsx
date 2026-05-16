import React, { useEffect } from 'react';
import { Alert, View, Text, FlatList, StyleSheet } from 'react-native';
import { useTasksStore } from '../features/tasks/tasksSlice';
import { TaskItem } from '../features/tasks/components/TaskItem';
import { EmptyState, ErrorState, LoadingState } from '../components/feedback';
import { ScreenContainer, ScreenHeader } from '../components/layout';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../theme';
import { todayISO, formatDate, calcProgressPercent } from '../utils/dateUtils';
import { useAppSettings } from '../hooks/useAppSettings';

export const TodayScreen: React.FC = () => {
  const { tasks, isLoading, error, loadTasks, toggleTask, deleteTask } =
    useTasksStore();
  const { layout } = useAppSettings();

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const today = todayISO();
  const todayTasks = tasks.filter(t => t.date === today);
  const completed = todayTasks.filter(t => t.isCompleted).length;
  const percent = calcProgressPercent(completed, todayTasks.length);

  const handleToggleTask = (id: string) => {
    toggleTask(id).catch(() => {
      Alert.alert('Update Failed', 'Unable to update this task.');
    });
  };

  const handleDeleteTask = (id: string) => {
    deleteTask(id).catch(() => {
      Alert.alert('Delete Failed', 'Unable to delete this task.');
    });
  };

  const renderEmptyState = () => {
    if (isLoading) {
      return <LoadingState title="Loading today's tasks..." />;
    }

    if (error) {
      return <ErrorState message={error} onRetry={loadTasks} />;
    }

    return (
      <EmptyState
        icon="calendar-outline"
        title="No tasks for today"
        subtitle="Tasks scheduled for this date will appear here."
      />
    );
  };

  return (
    <ScreenContainer>
      <ScreenHeader
        title="Today's Tasks"
        subtitle={formatDate(today, 'EEEE, MMMM d')}
      />

      {todayTasks.length > 0 ? (
        <View
          style={[
            styles.summaryRow,
            {
              paddingHorizontal: layout.screenPadding,
              paddingVertical: layout.sectionGap,
            },
          ]}
        >
          <View style={styles.summaryChip}>
            <Text style={styles.summaryText}>
              {completed}/{todayTasks.length} done
            </Text>
          </View>
          <View
            style={[
              styles.summaryChip,
              percent === 100 && styles.summaryChipDone,
            ]}
          >
            <Text
              style={[
                styles.summaryText,
                percent === 100 && styles.summaryTextDone,
              ]}
            >
              {percent}% complete
            </Text>
          </View>
        </View>
      ) : null}

      <FlatList
        data={todayTasks}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.list,
          {
            padding: layout.screenPadding,
            paddingBottom: layout.screenPadding + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading && todayTasks.length > 0}
        onRefresh={loadTasks}
        renderItem={({ item }) => (
          <TaskItem
            task={item}
            onToggle={() => handleToggleTask(item.id)}
            onDelete={() => handleDeleteTask(item.id)}
          />
        )}
        ListEmptyComponent={renderEmptyState}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  summaryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryChipDone: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success,
  },
  summaryText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.textSecondary,
  },
  summaryTextDone: { color: Colors.success },
  list: { padding: Spacing.base, flexGrow: 1 },
});
