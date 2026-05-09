import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../../../components/Card';
import { ProgressBar } from './ProgressBar';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../../theme';
import { calcProgressPercent } from '../../../utils/dateUtils';
import type { StudyPlan, Progress } from '../../../types';

interface ProgressCardProps {
  plan: StudyPlan;
  progress: Progress;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({ plan, progress }) => {
  const percent = calcProgressPercent(
    progress.completedTasks,
    progress.totalTasks,
  );
  const isDone = percent === 100;

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.badge, isDone ? styles.badgeDone : styles.badgeDefault]}>
          <Text style={styles.badgeText}>{isDone ? '🎉 Done' : '📖 Active'}</Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {plan.title}
      </Text>

      {/* Stats row */}
      <View style={styles.statsRow}>
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

      {/* Progress bar */}
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
  header: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: Spacing.xs },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
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
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: Colors.border },
});
