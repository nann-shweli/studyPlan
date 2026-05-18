import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Colors, Radius, Shadow, useTheme } from '../../theme';
import { useAppSettings } from '../../hooks/useAppSettings';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padded = true,
}) => {
  const { layout } = useAppSettings();
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface },
        padded && { padding: layout.cardPadding },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    ...Shadow.card,
  },
});
