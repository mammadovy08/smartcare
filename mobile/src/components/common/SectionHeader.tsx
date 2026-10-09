import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionTitle?: string;
  onAction?: () => void;
  badge?: string | number;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actionTitle,
  onAction,
  badge,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          {badge !== undefined && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {actionTitle && onAction && (
        <TouchableOpacity onPress={onAction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.actionText}>{actionTitle}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
    marginTop: 20,
  },
  left: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  badgeContainer: {
    marginLeft: 8,
    backgroundColor: '#EEF2F6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  actionText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
});
