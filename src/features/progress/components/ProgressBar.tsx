import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../../theme';
import { calcProgressPercent } from '../../../utils/dateUtils';

interface ProgressBarProps {
  completed: number;
  total: number;
  showLabel?: boolean;
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  completed,
  total,
  showLabel = true,
  height = 8,
}) => {
  const percent = calcProgressPercent(completed, total);

  return (
    <View>
      <View style={[styles.track, { height }]}>
        <View
          style={[
            styles.fill,
            { width: `${percent}%`, height },
            percent === 100 && styles.fillDone,
          ]}
        />
      </View>
      {showLabel ? (
        <View style={styles.labels}>
          <Text style={styles.labelText}>
            {completed} of {total} completed
          </Text>
          <Text style={[styles.labelPercent, percent === 100 && styles.labelDone]}>
            {percent}%
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    backgroundColor: Colors.progressTrack,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  fillDone: { backgroundColor: Colors.success },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  labelText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  labelPercent: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semiBold,
    color: Colors.primary,
  },
  labelDone: { color: Colors.success },
});
