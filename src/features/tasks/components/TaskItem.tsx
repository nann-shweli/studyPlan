import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import Ionicons from '@react-native-vector-icons/ionicons';

import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../../theme';
import { useAppSettings } from '../../../hooks/useAppSettings';

import type { StudyTask } from '../../../types';

interface TaskItemProps {
  task: StudyTask;
  onToggle: () => void;
  onDelete: () => void;
  onEdit?: () => void;
  showDate?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggle,
  onDelete,
  onEdit,
  showDate = false,
}) => {
  const { isCompact, layout } = useAppSettings();

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
          <View style={styles.dateRow}>
            <Ionicons
              name="calendar-outline"
              size={12}
              color={Colors.textSecondary}
            />

            <Text style={styles.date}>{task.date}</Text>
          </View>
        ) : null}
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

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  date: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginLeft: 4,
  },

  actions: {
    flexDirection: 'row',
    marginLeft: Spacing.sm,
  },

  actionBtn: {
    marginLeft: Spacing.sm,
  },
});
