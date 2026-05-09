import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Card } from '../../../components/Card';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../../theme';
import { formatShortDate, calcProgressPercent } from '../../../utils/dateUtils';
import type { StudyPlan, Progress } from '../../../types';

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
  const percent = progress
    ? calcProgressPercent(progress.completedTasks, progress.totalTasks)
    : 0;
  const total = progress?.totalTasks ?? 0;
  const completed = progress?.completedTasks ?? 0;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Card style={styles.card}>
        {/* Title row */}
        <View style={styles.row}>
          <Text style={styles.title} numberOfLines={1}>
            {plan.title}
          </Text>
          <TouchableOpacity
            onPress={onDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>

        {/* Description */}
        {plan.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {plan.description}
          </Text>
        ) : null}

        {/* Dates */}
        <View style={styles.datesRow}>
          <Text style={styles.dateLabel}>
            📅 {formatShortDate(plan.startDate)} – {formatShortDate(plan.endDate)}
          </Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${percent}%` }]} />
          </View>
          <View style={styles.progressMeta}>
            <Text style={styles.progressText}>
              {completed}/{total} tasks
            </Text>
            <Text style={[styles.progressPercent, percent === 100 && styles.progressDone]}>
              {percent}%
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  title: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  deleteIcon: { fontSize: 16 },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  datesRow: { marginBottom: Spacing.md },
  dateLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  progressSection: {},
  progressTrack: {
    height: 6,
    backgroundColor: Colors.progressTrack,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  progressPercent: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semiBold,
    color: Colors.primary,
  },
  progressDone: { color: Colors.success },
});
