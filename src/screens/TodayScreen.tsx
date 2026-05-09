import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTasksStore } from '../features/tasks/tasksSlice';
import { TaskItem } from '../features/tasks/components/TaskItem';
import { EmptyState } from '../components/EmptyState';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../theme';
import { todayISO, formatDate, calcProgressPercent } from '../utils/dateUtils';

export const TodayScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { tasks, loadTasks, toggleTask, deleteTask } = useTasksStore();

  useEffect(() => { loadTasks(); }, []);

  const today = todayISO();
  const todayTasks = tasks.filter(t => t.date === today);
  const completed = todayTasks.filter(t => t.isCompleted).length;
  const percent = calcProgressPercent(completed, todayTasks.length);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.dateLabel}>{formatDate(today, 'EEEE, MMMM d')}</Text>
        <Text style={styles.headerTitle}>Today's Tasks</Text>
      </View>

      {/* Progress summary */}
      {todayTasks.length > 0 ? (
        <View style={styles.summaryRow}>
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

      {/* Task list */}
      <FlatList
        data={todayTasks}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TaskItem
            task={item}
            onToggle={() => toggleTask(item.id)}
            onDelete={() => deleteTask(item.id)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            emoji="🌅"
            title="No tasks for today"
            subtitle="Add tasks to your study plans with today's date"
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
  dateLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extraBold,
    color: Colors.textPrimary,
  },
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
