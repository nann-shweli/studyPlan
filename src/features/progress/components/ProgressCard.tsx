import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { Card, ProgressBar } from '../../../components/ui';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../../theme';
import { calcProgressPercent } from '../../../utils/dateUtils';
import type { StudyPlan, Progress } from '../../../types';
import { useAppSettings } from '../../../hooks/useAppSettings';

interface ProgressCardProps {
  plan: StudyPlan;
  progress: Progress;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  plan,
  progress,
}) => {
  const { isCompact, layout } = useAppSettings();
  const percent = calcProgressPercent(
    progress.completedTasks,
    progress.totalTasks,
  );
  const isDone = percent === 100;

  return (
    <Card style={[styles.card, { marginBottom: layout.cardGap }]}>
      <View style={styles.header}>
        <View style={styles.iconTile}>
          <Ionicons
            name={isDone ? 'checkmark-done-outline' : 'bar-chart-outline'}
            size={18}
            color={isDone ? Colors.success : Colors.primary}
          />
        </View>
        <View
          style={[
            styles.badge,
            isDone ? styles.badgeDone : styles.badgeDefault,
          ]}
        >
          <Text style={styles.badgeText}>
            {isDone ? 'Complete' : 'Active'}
          </Text>
        </View>
      </View>

      <Text
        style={[
          styles.title,
          { marginBottom: isCompact ? Spacing.sm : Spacing.md },
        ]}
        numberOfLines={1}
      >
        {plan.title}
      </Text>

      <View
        style={[
          styles.statsRow,
          { marginBottom: isCompact ? Spacing.sm : Spacing.md },
        ]}
      >
        <View style={styles.stat}>
          <Text style={styles.statValue}>{progress.totalTasks}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: Colors.success }]}>
            {progress.completedTasks}
          </Text>
          <Text style={styles.statLabel}>Done</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: Colors.accent }]}>
            {progress.totalTasks - progress.completedTasks}
          </Text>
          <Text style={styles.statLabel}>Left</Text>
        </View>
      </View>

      <ProgressBar
        completed={progress.completedTasks}
        total={progress.totalTasks}
        height={10}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  iconTile: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeDefault: { backgroundColor: Colors.primaryLight + '20' },
  badgeDone: { backgroundColor: Colors.successLight },
  badgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.semiBold },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statDivider: { width: 1, height: 36, backgroundColor: Colors.border },
});
