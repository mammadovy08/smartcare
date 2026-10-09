import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { Card } from '../common/Card';
import { SeverityBadge } from './SeverityBadge';
import { Button } from '../common/Button';
import { Incident, Person, EmergencyContact } from '@/types';
import { formatDateTime, formatTimeAgo } from '@/utils/date';
import { formatMetricValue, getMetricLabel } from '@/utils/format';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export interface IncidentDetailProps {
  incident: Incident;
  person?: Person;
  emergencyContacts?: EmergencyContact[];
  onAcknowledge?: () => void;
  onResolve?: (note: string) => void;
  onCallContact?: (contact: EmergencyContact) => void;
}

export const IncidentDetail: React.FC<IncidentDetailProps> = ({
  incident,
  person,
  emergencyContacts = [],
  onAcknowledge,
  onResolve,
  onCallContact,
}) => {
  const [resolutionNote, setResolutionNote] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  const handleResolve = () => {
    if (!resolutionNote.trim()) {
      Alert.alert('Resolution Note Required', 'Please provide a brief note explaining the resolution.');
      return;
    }
    onResolve?.(resolutionNote.trim());
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Severity Card */}
      <Card padding="lg" style={styles.bannerCard}>
        <View style={styles.bannerHeader}>
          <SeverityBadge severity={incident.severity} size="md" />
          <Text style={styles.confidenceText}>
            Confidence: {Math.round(incident.confidence * 100)}%
          </Text>
        </View>

        <Text style={styles.title}>{incident.title}</Text>
        <Text style={styles.explanation}>{incident.explanation}</Text>

        <View style={styles.ruleBadge}>
          <Text style={styles.ruleText}>Triggered Rule: {incident.ruleTriggered}</Text>
        </View>
      </Card>

      {/* Person Summary */}
      {person && (
        <Card padding="md" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Monitored Individual</Text>
          <View style={styles.personRow}>
            <View style={styles.personAvatar}>
              <Text style={styles.personInitials}>{person.name[0]}</Text>
            </View>
            <View style={styles.personInfo}>
              <Text style={styles.personName}>{person.name}</Text>
              <Text style={styles.personMeta}>DOB: {person.dateOfBirth || '1945-03-15'}</Text>
            </View>
          </View>
        </Card>
      )}

      {/* Timeline Section */}
      <Card padding="md" style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Incident Timeline</Text>
        
        <View style={styles.timelineItem}>
          <View style={[styles.timelineDot, styles.dotRed]} />
          <View style={styles.timelineContent}>
            <Text style={styles.timelineEvent}>Detected</Text>
            <Text style={styles.timelineTime}>{formatDateTime(incident.detectedAt)}</Text>
          </View>
        </View>

        {incident.acknowledgedAt && (
          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, styles.dotAmber]} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineEvent}>Acknowledged</Text>
              <Text style={styles.timelineTime}>{formatDateTime(incident.acknowledgedAt)}</Text>
            </View>
          </View>
        )}

        {incident.resolvedAt && (
          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, styles.dotGreen]} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineEvent}>Resolved</Text>
              <Text style={styles.timelineTime}>{formatDateTime(incident.resolvedAt)}</Text>
              {incident.resolutionNote && (
                <Text style={styles.noteDisplay}>Note: "{incident.resolutionNote}"</Text>
              )}
            </View>
          </View>
        )}
      </Card>

      {/* Clinical Evidence Snapshot */}
      <Card padding="md" style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Clinical Sensor Evidence</Text>

        <Text style={styles.subSectionTitle}>Vitals at Detection</Text>
        {incident.evidence.measurements.length === 0 ? (
          <Text style={styles.emptyEvidence}>No anomalous vitals attached to this trigger.</Text>
        ) : (
          <View style={styles.vitalsList}>
            {incident.evidence.measurements.map((m, idx) => (
              <View key={idx} style={styles.evidenceRow}>
                <View style={styles.metricNameRow}>
                  <Ionicons name="pulse" size={14} color="#2563EB" />
                  <Text style={styles.metricName}>{getMetricLabel(m.metricType)}</Text>
                </View>
                <Text style={styles.metricValue}>{formatMetricValue(m.metricType, m.value)}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={[styles.subSectionTitle, styles.marginTop]}>Motion / Radar Events</Text>
        {incident.evidence.movementEvents.length === 0 ? (
          <Text style={styles.emptyEvidence}>No anomalous movement events.</Text>
        ) : (
          <View style={styles.movementList}>
            {incident.evidence.movementEvents.map((evt, idx) => (
              <View key={idx} style={styles.movementItem}>
                <View style={styles.movementHeader}>
                  <Text style={styles.movementType}>{evt.eventType}</Text>
                  <Text style={styles.movementTime}>{formatTimeAgo(evt.occurredAt)}</Text>
                </View>
                {evt.fallConfidence !== undefined && (
                  <Text style={styles.movementDetail}>
                    Fall Confidence: {Math.round(evt.fallConfidence * 100)}%
                  </Text>
                )}
                {evt.inactivityDurationSeconds !== undefined && (
                  <Text style={styles.movementDetail}>
                    Inactivity: {Math.round(evt.inactivityDurationSeconds / 60)} minutes
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </Card>

      {/* Emergency Escalation Contacts */}
      {emergencyContacts.length > 0 && (
        <Card padding="md" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Emergency Escalation Contacts</Text>
          {emergencyContacts.map((contact) => (
            <View key={contact.id} style={styles.contactRow}>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name} ({contact.relationship})</Text>
                <Text style={styles.contactPhone}>{contact.phoneNumber}</Text>
              </View>
              {onCallContact && (
                <Button
                  title="Call"
                  size="sm"
                  variant="outline"
                  icon={<Ionicons name="call" size={14} color="#2563EB" />}
                  onPress={() => onCallContact(contact)}
                />
              )}
            </View>
          ))}
        </Card>
      )}

      {/* Action Section */}
      {incident.status === 'new' && onAcknowledge && (
        <View style={styles.actionContainer}>
          <Button
            title="Acknowledge Alert"
            onPress={onAcknowledge}
            variant="primary"
            size="lg"
            fullWidth
            icon={<Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />}
          />
        </View>
      )}

      {incident.status !== 'resolved' && onResolve && (
        <Card padding="md" style={[styles.sectionCard, styles.resolveCard]}>
          <Text style={styles.sectionTitle}>Mark Alert as Resolved</Text>
          <Text style={styles.resolvePrompt}>
            Enter resolution notes (e.g. "Spoke with Margaret, false alarm"):
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder="Document action taken and outcome..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            value={resolutionNote}
            onChangeText={setResolutionNote}
          />
          <Button
            title="Confirm Resolution"
            onPress={handleResolve}
            variant="secondary"
            size="md"
            fullWidth
            style={styles.marginTop}
          />
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  bannerCard: {
    marginBottom: 16,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  explanation: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 14,
  },
  ruleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ruleText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  sectionCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  personInitials: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E40AF',
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  personMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    marginRight: 12,
  },
  dotRed: {
    backgroundColor: '#DC2626',
  },
  dotAmber: {
    backgroundColor: '#F59E0B',
  },
  dotGreen: {
    backgroundColor: '#16A34A',
  },
  timelineContent: {
    flex: 1,
  },
  timelineEvent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  timelineTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  noteDisplay: {
    fontSize: 13,
    color: '#059669',
    marginTop: 4,
    fontStyle: 'italic',
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  vitalsList: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
  },
  evidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  metricNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricName: {
    fontSize: 13,
    color: '#374151',
    marginLeft: 6,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  emptyEvidence: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  movementList: {
    gap: 8,
  },
  movementItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
  },
  movementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  movementType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  movementTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  movementDetail: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 2,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  contactPhone: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  actionContainer: {
    marginVertical: 12,
  },
  resolveCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resolvePrompt: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    textAlignVertical: 'top',
    minHeight: 70,
  },
  marginTop: {
    marginTop: 12,
  },
});
