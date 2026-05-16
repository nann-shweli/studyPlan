import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Colors, Radius, Shadow } from '../../theme';
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

  return (
    <View
      style={[styles.card, padded && { padding: layout.cardPadding }, style]}
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
