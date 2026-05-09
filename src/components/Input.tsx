import React, { forwardRef, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TextInputProps,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, hint, rightIcon, onRightIconPress, style, ...rest }, ref) => {
    const [focused, setFocused] = useState(false);

    return (
      <View style={styles.wrapper}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <View
          style={[
            styles.inputContainer,
            focused && styles.inputContainerFocused,
            error ? styles.inputContainerError : null,
          ]}
        >
          <TextInput
            ref={ref}
            style={[styles.input, style]}
            placeholderTextColor={Colors.textDisabled}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            {...rest}
          />
          {rightIcon ? (
            <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
              {rightIcon}
            </TouchableOpacity>
          ) : null}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {hint && !error ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
    );
  },
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  wrapper: { marginBottom: Spacing.md },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  inputContainerFocused: { borderColor: Colors.borderFocus },
  inputContainerError: { borderColor: Colors.danger },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    paddingVertical: Spacing.sm + 2,
  },
  rightIcon: { paddingLeft: Spacing.sm },
  error: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    marginTop: Spacing.xs,
  },
  hint: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});
