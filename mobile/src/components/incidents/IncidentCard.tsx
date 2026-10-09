import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../common/Card';
import { SeverityBadge } from './SeverityBadge';
import { Button } from '../common/Button';
import { Incident } from '@/types';
import { formatTimeAgo } from '@/utils/date';
import { getIncidentStatusLabel, getIncidentStatusColor } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';

export interface IncidentCardProps {
  incident: Incident;
  onPress?: (incident: Incident) => void;
  onAcknowledge?: (incident: Incident) => void;
  testID?: string;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({
  incident,
  onPress,
  onAcknowledge,
  testID,
}) => {
  const isNew = incident.status === 'new';
  const statusColor = getIncidentStatusColor(incident.status);
  const statusLabel = getIncidentStatusLabel(incident.status);

  return (
    <Card
      testID={testID}
      onPress={onPress ? () => onPress(incident) : undefined}
      padding="md"
      style={[
        styles.card,
        isNew && incident.severity === 'high' && styles.highRiskHighlight,
      ]}
    >
      <View style={styles.topRow}>
        <SeverityBadge severity={incident.severity} size="sm" />
        <View style={styles.statusAndDate}>
          <View style={[styles.statusTag, { backgroundColor: `${statusColor}18` }]}>
            <Text style={[styles.statusTagText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
          <Text style={styles.timeAgo}>{formatTimeAgo(incident.detectedAt)}</Text>
        </View>
      </View>

      <Text style={styles.title}>{incident.title}</Text>
      <Text style={styles.explanation} numberOfLines={2}>
        {incident.explanation}
      </Text>

      <View style={styles.bottomRow}>
        <View style={styles.evidenceIndicator}>
          <Ionicons name="finger-print-outline" size={14} color="#6B7280" />
          <Text style={styles.evidenceText}>
            {incident.evidence.measurements.length} vitals • {incident.evidence.movementEvents.length} motion events
          </Text>
        </View>

        {isNew && onAcknowledge && (
          <Button
            title="Acknowledge"
            size="sm"
            variant="outline"
            onPress={() => onAcknowledge(incident)}
          />
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  highRiskHighlight: {
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusAndDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  timeAgo: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  explanation: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  evidenceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  evidenceText: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
});
