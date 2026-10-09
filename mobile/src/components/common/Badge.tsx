import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';

export interface BadgeProps {
  label: string;
  color?: string;
  bgColor?: string;
  size?: 'sm' | 'md';
  variant?: 'solid' | 'subtle' | 'outline';
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  color = '#2563EB',
  bgColor,
  size = 'md',
  variant = 'subtle',
  icon,
  style,
  textStyle,
  testID,
}) => {
  let computedBg = bgColor;
  let computedText = color;
  let computedBorder: string | undefined = undefined;

  if (variant === 'solid') {
    computedBg = color;
    computedText = '#FFFFFF';
  } else if (variant === 'subtle') {
    computedBg = bgColor || `${color}15`;
    computedText = color;
  } else if (variant === 'outline') {
    computedBg = 'transparent';
    computedBorder = color;
    computedText = color;
  }

  return (
    <View
      testID={testID}
      style={[
        styles.badge,
        styles[`size_${size}`],
        { backgroundColor: computedBg },
        computedBorder ? { borderWidth: 1, borderColor: computedBorder } : null,
        style,
      ]}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text
        style={[
          styles.text,
          styles[`textSize_${size}`],
          { color: computedText },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: '600',
  },
  size_sm: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  size_md: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  textSize_sm: {
    fontSize: 11,
  },
  textSize_md: {
    fontSize: 12,
  },
});
