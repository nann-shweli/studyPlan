import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../../theme';
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
}) => (
  <View style={[styles.container, task.isCompleted && styles.containerDone]}>
    <TouchableOpacity
      onPress={onToggle}
      style={[styles.checkbox, task.isCompleted && styles.checkboxDone]}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      {task.isCompleted ? <Text style={styles.checkmark}>✓</Text> : null}
    </TouchableOpacity>

    <View style={styles.content}>
      <Text
        style={[styles.title, task.isCompleted && styles.titleDone]}
        numberOfLines={2}
      >
        {task.title}
      </Text>
      {showDate ? (
        <Text style={styles.date}>📅 {task.date}</Text>
      ) : null}
    </View>

    <View style={styles.actions}>
      {onEdit ? (
        <TouchableOpacity
          onPress={onEdit}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.actionBtn}
        >
          <Text style={styles.editIcon}>✏️</Text>
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity
        onPress={onDelete}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.actionBtn}
      >
        <Text style={styles.deleteIcon}>🗑️</Text>
      </TouchableOpacity>
    </View>
  </View>
);

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
  containerDone: { backgroundColor: Colors.successLight, borderColor: Colors.success + '40' },
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
  checkmark: { color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold },
  content: { flex: 1 },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  date: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  actions: { flexDirection: 'row', marginLeft: Spacing.sm },
  actionBtn: { marginLeft: Spacing.sm },
  editIcon: { fontSize: 15 },
  deleteIcon: { fontSize: 15 },
});
