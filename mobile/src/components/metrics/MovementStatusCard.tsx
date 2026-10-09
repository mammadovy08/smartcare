import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { MovementEvent } from '@/types';
import { formatTimeAgo } from '@/utils/date';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

export interface MovementStatusCardProps {
  events: MovementEvent[];
  inactivityThresholdMinutes?: number;
}

export const MovementStatusCard: React.FC<MovementStatusCardProps> = ({
  events,
  inactivityThresholdMinutes = 30,
}) => {
  const latestEvent = events.length > 0
    ? [...events].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())[0]
    : undefined;

  const eventType = latestEvent?.eventType ?? 'normalActivity';
  const hasFall = eventType === 'suspectedFall' || eventType === 'postFallInactivity';
  const isInactive = eventType === 'prolongedInactivity' || eventType === 'postFallInactivity';

  const getStatusBadge = () => {
    if (hasFall) {
      return <Badge label="FALL ALERT" color="#DC2626" variant="solid" size="sm" />;
    }
    if (isInactive) {
      return <Badge label="INACTIVE" color="#F59E0B" variant="solid" size="sm" />;
    }
    return <Badge label="ACTIVE" color="#16A34A" variant="subtle" size="sm" />;
  };

  const getActivityLabel = () => {
    switch (eventType) {
      case 'suspectedFall':
        return 'Suspected Fall Detected';
      case 'postFallInactivity':
        return 'Fall Followed by Inactivity';
      case 'prolongedInactivity':
        return 'Prolonged Stillness';
      case 'unusualMovement':
        return 'Unusual Movement Pattern';
      case 'deviceDisconnected':
        return 'ESP32 Disconnected';
      default:
        return 'Normal Ambient Activity';
    }
  };

  const getActivityIcon = () => {
    if (hasFall) {
      return <MaterialCommunityIcons name="alert-decagram" size={28} color="#DC2626" />;
    }
    if (isInactive) {
      return <MaterialCommunityIcons name="timer-sand" size={28} color="#F59E0B" />;
    }
    return <MaterialCommunityIcons name="walk" size={28} color="#16A34A" />;
  };

  return (
    <Card padding="md" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="radar" size={20} color="#2563EB" />
          <Text style={styles.title}>ESP32 Movement & Posture Radar</Text>
        </View>
        {getStatusBadge()}
      </View>

      <View style={styles.body}>
        <View style={styles.iconContainer}>{getActivityIcon()}</View>
        <View style={styles.textContainer}>
          <Text style={styles.activityTitle}>{getActivityLabel()}</Text>
          <Text style={styles.activitySubtitle}>
            {latestEvent
              ? `Last motion signal ${formatTimeAgo(latestEvent.occurredAt)}`
              : 'Sensors active & calibrating'}
          </Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Fall Risk</Text>
          <Text
            style={[
              styles.metricValue,
              { color: hasFall ? '#DC2626' : '#16A34A' },
            ]}
          >
            {hasFall
              ? `${Math.round((latestEvent?.fallConfidence ?? 0.8) * 100)}% Conf.`
              : 'Minimal'}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Inactivity Alert</Text>
          <Text style={styles.metricValue}>
            {latestEvent?.inactivityDurationSeconds
              ? `${Math.round(latestEvent.inactivityDurationSeconds / 60)} min`
              : `< ${inactivityThresholdMinutes} min`}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Hub Signal</Text>
          <View style={styles.signalRow}>
            <Ionicons name="wifi" size={14} color="#16A34A" />
            <Text style={[styles.metricValue, styles.signalText]}>Good</Text>
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginLeft: 6,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  activitySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
  metricLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 2,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signalText: {
    marginLeft: 4,
    color: '#16A34A',
  },
});
