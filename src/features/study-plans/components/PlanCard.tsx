import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Card, ProgressBar } from '../../../components/ui';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../../theme';
import { formatShortDate, calcProgressPercent } from '../../../utils/dateUtils';
import type { StudyPlan, Progress } from '../../../types';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useAppSettings } from '../../../hooks/useAppSettings';

interface PlanCardProps {
  plan: StudyPlan;
  progress?: Progress;
  onPress: () => void;
  onDelete: () => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  progress,
  onPress,
  onDelete,
}) => {
  const { isCompact, layout } = useAppSettings();
  const percent = progress
    ? calcProgressPercent(progress.completedTasks, progress.totalTasks)
    : 0;
  const total = progress?.totalTasks ?? 0;
  const completed = progress?.completedTasks ?? 0;
  const statusLabel =
    total === 0 ? 'No tasks' : percent === 100 ? 'Complete' : 'In progress';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Card style={[styles.card, { marginBottom: layout.cardGap }]}>
        <View style={styles.header}>
          <View style={styles.iconTile}>
            <Ionicons name="book-outline" size={20} color={Colors.primary} />
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.title} numberOfLines={1}>
              {plan.title}
            </Text>
            <Text style={styles.dateLabel} numberOfLines={1}>
              {formatShortDate(plan.startDate)} - {formatShortDate(plan.endDate)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onDelete}
            style={styles.deleteBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={18} color={Colors.danger} />
          </TouchableOpacity>
        </View>

        {plan.description ? (
          <Text style={styles.description} numberOfLines={isCompact ? 1 : 2}>
            {plan.description}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons
              name="checkmark-done-outline"
              size={14}
              color={Colors.textSecondary}
            />
            <Text style={styles.metaText}>
              {completed}/{total} tasks
            </Text>
          </View>
          <View
            style={[
              styles.statusPill,
              percent === 100 ? styles.statusPillDone : null,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                percent === 100 ? styles.statusTextDone : null,
              ]}
            >
              {statusLabel}
            </Text>
          </View>
        </View>

        <ProgressBar completed={completed} total={total} height={8} />
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  iconTile: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dangerLight,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  dateLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  statusPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceAlt,
  },
  statusPillDone: {
    backgroundColor: Colors.successLight,
  },
  statusText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semiBold,
  },
  statusTextDone: {
    color: Colors.success,
  },
});
