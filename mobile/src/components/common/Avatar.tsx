import React from 'react';
import { View, Text, Image, StyleSheet, StyleProp, ViewStyle } from 'react-native';

export interface AvatarProps {
  name: string;
  url?: string;
  size?: number;
  status?: 'online' | 'offline' | 'warning';
  style?: StyleProp<ViewStyle>;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  url,
  size = 44,
  status,
  style,
}) => {
  const getInitials = (n: string) => {
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
    }
    return (n[0] ?? '?').toUpperCase();
  };

  const statusColor =
    status === 'online' ? '#16A34A' : status === 'warning' ? '#F59E0B' : '#9CA3AF';

  return (
    <View style={[{ width: size, height: size }, styles.container, style]}>
      {url ? (
        <Image
          source={{ uri: url }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.fallback,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Text style={[styles.initials, { fontSize: size * 0.4 }]}>
            {getInitials(name)}
          </Text>
        </View>
      )}

      {status && (
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: statusColor,
              width: Math.max(10, size * 0.25),
              height: Math.max(10, size * 0.25),
              borderRadius: size * 0.125,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallback: {
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontWeight: '700',
    color: '#3730A3',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
