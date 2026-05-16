import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing } from '../../theme';

interface LoadingStateProps {
  title?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  title = 'Loading...',
}) => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color={Colors.primary} />
    <Text style={styles.title}>{title}</Text>
  </View>
);

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
