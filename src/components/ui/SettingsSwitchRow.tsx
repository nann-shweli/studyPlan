import React from 'react';
import {
  StyleSheet,
  type StyleProp,
  Switch,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { Colors, FontSize, FontWeight, Radius, Spacing, useTheme } from '../../theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface SettingsSwitchRowProps {
  icon: IoniconName;
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  rowStyle?: StyleProp<ViewStyle>;
}

export const SettingsSwitchRow: React.FC<SettingsSwitchRowProps> = ({
  icon,
  label,
  description,
  value,
  onValueChange,
  disabled = false,
  rowStyle,
}) => {
  const { colors } = useTheme();

  return (
  <View style={[styles.row, rowStyle, disabled && styles.disabledRow]}>
    <View
      style={[
        styles.rowIcon,
        { backgroundColor: colors.primaryLight + '18' },
      ]}
    >
      <Ionicons name={icon} size={18} color={colors.primary} />
    </View>
    <View style={styles.rowContent}>
      <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
        {label}
      </Text>
      <Text style={[styles.rowDescription, { color: colors.textSecondary }]}>
        {description}
      </Text>
    </View>
    <Switch
      accessible
      accessibilityLabel={label}
      accessibilityHint={description}
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: colors.surfaceAlt, true: colors.primaryLight }}
      thumbColor={value ? colors.primary : colors.white}
      ios_backgroundColor={colors.surfaceAlt}
    />
  </View>
  );
};

const styles = StyleSheet.create({
  row: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  disabledRow: {
    opacity: 0.6,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  rowContent: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  rowLabel: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semiBold,
  },
  rowDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 3,
    lineHeight: 18,
  },
});
