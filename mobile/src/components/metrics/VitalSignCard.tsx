import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../common/Card';
import { MetricType } from '@/types';
import { formatMetricValue, getMetricLabel } from '@/utils/format';
import { formatTimeAgo } from '@/utils/date';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export interface VitalSignCardProps {
  metricType: MetricType;
  value: number;
  measuredAt: string;
  isStale?: boolean;
  status?: 'normal' | 'warning' | 'critical';
  normalRangeText?: string;
  onPress?: () => void;
  testID?: string;
}

export const VitalSignCard: React.FC<VitalSignCardProps> = ({
  metricType,
  value,
  measuredAt,
  isStale = false,
  status = 'normal',
  normalRangeText,
  onPress,
  testID,
}) => {
  const getIcon = () => {
    switch (metricType) {
      case 'heartRate':
        return <Ionicons name="heart" size={22} color="#EF4444" />;
      case 'spo2':
        return <MaterialCommunityIcons name="water-percent" size={22} color="#2563EB" />;
      case 'temperature':
        return <MaterialCommunityIcons name="thermometer" size={22} color="#F59E0B" />;
      case 'systolicBloodPressure':
      case 'diastolicBloodPressure':
        return <Ionicons name="pulse" size={22} color="#8B5CF6" />;
      default:
        return <Ionicons name="analytics" size={22} color="#6B7280" />;
    }
  };

  const getStatusColor = () => {
    if (isStale) return '#9CA3AF';
    switch (status) {
      case 'critical':
        return '#DC2626';
      case 'warning':
        return '#F59E0B';
      default:
        return '#16A34A';
    }
  };

  const getStatusBg = () => {
    if (isStale) return '#F3F4F6';
    switch (status) {
      case 'critical':
        return '#FEF2F2';
      case 'warning':
        return '#FFFBEB';
      default:
        return '#F0FDF4';
    }
  };

  const statusColor = getStatusColor();
  const statusBg = getStatusBg();

  return (
    <Card testID={testID} onPress={onPress} padding="md" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconTitleRow}>
          <View style={[styles.iconBox, { backgroundColor: statusBg }]}>
            {getIcon()}
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {getMetricLabel(metricType)}
          </Text>
        </View>

        <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {isStale ? 'Stale' : status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.valueRow}>
        <Text style={styles.valueText}>{formatMetricValue(metricType, value)}</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.timeAgo}>Updated {formatTimeAgo(measuredAt)}</Text>
        {normalRangeText && (
          <Text style={styles.rangeText}>{normalRangeText}</Text>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 155,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    flexShrink: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  valueRow: {
    marginVertical: 4,
  },
  valueText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  footer: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeAgo: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  rangeText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
});
