import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../theme';
import { useAppSettings } from '../../hooks/useAppSettings';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}) => {
  const isDisabled = disabled || loading;
  const { isCompact } = useAppSettings();
  const compactPadding =
    isCompact && size !== 'sm'
      ? { paddingVertical: size === 'lg' ? Spacing.sm : Spacing.xs + 2 }
      : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        styles[variant],
        styles[size],
        compactPadding,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? Colors.white : Colors.primary}
        />
      ) : (
        <Text
          style={[
            styles.label,
            styles[`label_${variant}`],
            styles[`label_${size}`],
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },

  // Variants
  primary: { backgroundColor: Colors.primary },
  secondary: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: Colors.danger },

  // Sizes
  sm: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  md: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2 },
  lg: { paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md },

  // Labels
  label: { fontWeight: FontWeight.semiBold },
  label_primary: { color: Colors.white, fontSize: FontSize.md },
  label_secondary: { color: Colors.textPrimary, fontSize: FontSize.md },
  label_ghost: { color: Colors.primary, fontSize: FontSize.md },
  label_danger: { color: Colors.white, fontSize: FontSize.md },
  label_sm: { fontSize: FontSize.sm },
  label_md: { fontSize: FontSize.md },
  label_lg: { fontSize: FontSize.lg },
});
