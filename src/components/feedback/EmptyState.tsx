import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

import { Colors, Spacing, FontSize, FontWeight, Radius } from '../../theme';
import { Button } from '../ui';

interface EmptyStateProps {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string;
  iconColor?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'book-outline',
  title,
  subtitle,
  iconColor = Colors.primary,
  actionLabel,
  onAction,
  style,
}) => (
  <View style={[styles.container, style]}>
    <View style={styles.iconWrap}>
      <Ionicons name={icon} size={34} color={iconColor} />
    </View>

    <Text style={styles.title}>{title}</Text>

    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

    {actionLabel && onAction ? (
      <Button
        label={actionLabel}
        onPress={onAction}
        size="sm"
        style={styles.action}
      />
    ) : null}
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

  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },

  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },

  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  action: {
    marginTop: Spacing.lg,
  },
});
