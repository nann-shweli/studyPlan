import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import Ionicons from '@react-native-vector-icons/ionicons';

import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../../theme';
import { useAppSettings } from '../../../hooks/useAppSettings';

import type { StudyTask, StudyTaskPriority } from '../../../types';

interface TaskItemProps {
  task: StudyTask;
  onToggle: () => void;
  onDelete: () => void;
  onEdit?: () => void;
  showDate?: boolean;
}

const PRIORITY_COLORS: Record<
  StudyTaskPriority,
  { background: string; text: string }
> = {
  low: { background: Colors.surfaceAlt, text: Colors.textSecondary },
  medium: { background: Colors.warningLight, text: Colors.warning },
  high: { background: Colors.dangerLight, text: Colors.danger },
};

const formatDuration = (minutes?: number): string | null => {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
};

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggle,
  onDelete,
  onEdit,
  showDate = false,
}) => {
  const { isCompact, layout } = useAppSettings();
  const priority = task.priority ?? 'medium';
  const priorityColors = PRIORITY_COLORS[priority];
  const duration = formatDuration(task.durationMinutes);

  return (
    <View
      style={[
        styles.container,
        {
          minHeight: isCompact ? layout.rowHeight : undefined,
          paddingHorizontal: isCompact ? Spacing.sm : Spacing.md,
          paddingVertical: isCompact ? Spacing.xs : Spacing.sm + 2,
          marginBottom: layout.listGap,
        },
        task.isCompleted && styles.containerDone,
      ]}
    >
      <TouchableOpacity
        onPress={onToggle}
        style={[
          styles.checkbox,
          { marginRight: isCompact ? Spacing.sm : Spacing.md },
          task.isCompleted && styles.checkboxDone,
        ]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {task.isCompleted ? (
          <Ionicons name="checkmark" size={14} color={Colors.white} />
        ) : null}
      </TouchableOpacity>

      <View style={styles.content}>
        <Text
          style={[styles.title, task.isCompleted && styles.titleDone]}
          numberOfLines={isCompact ? 1 : 2}
        >
          {task.title}
        </Text>

        {showDate ? (
          <View style={styles.metaLine}>
            <Ionicons
              name="calendar-outline"
              size={12}
              color={Colors.textSecondary}
            />

            <Text style={styles.metaText}>{task.date}</Text>
          </View>
        ) : null}

        <View style={styles.chipRow}>
          {task.subject ? (
            <View style={styles.chip}>
              <Ionicons
                name="library-outline"
                size={12}
                color={Colors.textSecondary}
              />
              <Text style={styles.chipText} numberOfLines={1}>
                {task.subject}
              </Text>
            </View>
          ) : null}
          <View
            style={[
              styles.priorityChip,
              { backgroundColor: priorityColors.background },
            ]}
          >
            <Text style={[styles.priorityText, { color: priorityColors.text }]}>
              {priority}
            </Text>
          </View>
          {duration ? (
            <View style={styles.chip}>
              <Ionicons
                name="time-outline"
                size={12}
                color={Colors.textSecondary}
              />
              <Text style={styles.chipText}>{duration}</Text>
            </View>
          ) : null}
          {task.reminderTime ? (
            <View style={styles.chip}>
              <Ionicons
                name="notifications-outline"
                size={12}
                color={Colors.textSecondary}
              />
              <Text style={styles.chipText}>{task.reminderTime}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.actions}>
        {onEdit ? (
          <TouchableOpacity
            onPress={onEdit}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.actionBtn}
          >
            <Ionicons
              name="create-outline"
              size={18}
              color={Colors.primaryDark}
            />
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          onPress={onDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.actionBtn}
        >
          <Ionicons name="trash-outline" size={18} color={Colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  containerDone: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success + '40',
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    backgroundColor: Colors.surface,
  },

  checkboxDone: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },

  content: {
    flex: 1,
  },

  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },

  titleDone: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },

  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  metaText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginLeft: 4,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },

  chip: {
    maxWidth: '100%',
    minHeight: 24,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  chipText: {
    flexShrink: 1,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },

  priorityChip: {
    minHeight: 24,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },

  priorityText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semiBold,
    textTransform: 'capitalize',
  },

  actions: {
    flexDirection: 'row',
    marginLeft: Spacing.sm,
  },

  actionBtn: {
    marginLeft: Spacing.sm,
  },
});
