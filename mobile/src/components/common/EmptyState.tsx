import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';
import { Ionicons } from '@expo/vector-icons';

export interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: React.ReactNode;
  actionTitle?: string;
  onAction?: () => void;
  testID?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon,
  actionTitle,
  onAction,
  testID,
}) => {
  return (
    <View testID={testID} style={styles.container}>
      <View style={styles.iconContainer}>
        {icon || <Ionicons name="shield-checkmark-outline" size={48} color="#9CA3AF" />}
      </View>
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {actionTitle && onAction && (
        <View style={styles.actionContainer}>
          <Button title={actionTitle} onPress={onAction} variant="secondary" size="sm" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 16,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 6,
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  actionContainer: {
    marginTop: 18,
  },
});
