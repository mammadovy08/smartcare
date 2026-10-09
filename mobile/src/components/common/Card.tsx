import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'elevated' | 'outlined' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  variant = 'elevated',
  padding = 'md',
  style,
  testID,
}) => {
  const cardStyles = [
    styles.base,
    styles[variant],
    styles[`padding_${padding}`],
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        testID={testID}
        onPress={onPress}
        activeOpacity={0.7}
        style={cardStyles}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View testID={testID} style={cardStyles}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  // Variants
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  outlined: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  flat: {
    backgroundColor: '#F9FAFB',
  },
  // Paddings
  padding_none: {
    padding: 0,
  },
  padding_sm: {
    padding: 10,
  },
  padding_md: {
    padding: 16,
  },
  padding_lg: {
    padding: 22,
  },
});
