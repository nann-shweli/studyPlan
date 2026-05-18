import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing, useTheme } from '../../theme';

interface LoadingStateProps {
  title?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  title = 'Loading...',
}) => {
  const { colors } = useTheme();

  return (
  <View style={styles.container}>
    <ActivityIndicator size="large" color={colors.primary} />
    <Text style={[styles.title, { color: colors.textSecondary }]}>
      {title}
    </Text>
  </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xxl,
  },
  title: {
    marginTop: Spacing.md,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
