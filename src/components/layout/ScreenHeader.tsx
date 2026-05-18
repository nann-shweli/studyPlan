import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing, useTheme } from '../../theme';
import { useAppSettings } from '../../hooks/useAppSettings';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  rightAction,
}) => {
  const { layout } = useAppSettings();
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.header,
        {
          paddingHorizontal: layout.screenPadding,
          paddingVertical: layout.headerVertical,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.titleBlock}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightAction ? <View style={styles.action}>{rightAction}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    // backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extraBold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  action: {
    flexShrink: 0,
  },
});
