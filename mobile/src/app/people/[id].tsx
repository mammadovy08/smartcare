import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { IncidentCard } from '@/components/incidents/IncidentCard';
import { DeviceStatusCard } from '@/components/devices/DeviceStatusCard';

export default function PersonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const {
    people,
    incidents,
    devices,
    emergencyContacts,
    acknowledgeIncident,
    updateDeviceStatus,
  } = useAppStore();

  const person = people.find((p) => p.id === id);

  if (!person) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFoundText}>Care recipient not found.</Text>
        <Button
          title="Back to Dashboard"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/dashboard'))}
        />
      </View>
    );
  }

  const personIncidents = incidents.filter((i) => i.personId === person.id);
  const personDevices = devices.filter((d) => d.personId === person.id);
  const prefs = person.monitoringPreferences;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Profile Card */}
      <Card padding="lg" style={styles.card}>
        <View style={styles.profileHeader}>
          <Avatar name={person.name} url={person.avatar} size={64} status="online" />
          <View style={styles.profileMeta}>
            <Text style={styles.name}>{person.name}</Text>
            <Text style={styles.subtext}>Date of Birth: {person.dateOfBirth || '1945-03-15'}</Text>
            <View style={styles.badgeRow}>
              <Badge label="INDEPENDENT LIVING" color="#2563EB" variant="subtle" size="sm" />
            </View>
          </View>
        </View>
      </Card>

      {/* Safety & Monitoring Thresholds */}
      <Text style={styles.sectionHeading}>Clinical Monitoring Thresholds</Text>
      <Card padding="md" style={styles.card}>
        <View style={styles.thresholdRow}>
          <Text style={styles.thresholdLabel}>Inactivity Alert Window</Text>
          <Text style={styles.thresholdVal}>{prefs.inactivityThresholdMinutes} min</Text>
        </View>
        <View style={[styles.thresholdRow, styles.borderTop]}>
          <Text style={styles.thresholdLabel}>Target Heart Rate</Text>
          <Text style={styles.thresholdVal}>{prefs.heartRate.min} - {prefs.heartRate.max} BPM</Text>
        </View>
        <View style={[styles.thresholdRow, styles.borderTop]}>
          <Text style={styles.thresholdLabel}>Critical Low SpO₂</Text>
          <Text style={styles.thresholdVal}>&lt; {prefs.spo2.criticalMin}%</Text>
        </View>
        <View style={[styles.thresholdRow, styles.borderTop]}>
          <Text style={styles.thresholdLabel}>Body Temp Window</Text>
          <Text style={styles.thresholdVal}>{prefs.temperature.min} - {prefs.temperature.max} °C</Text>
        </View>
        <View style={[styles.thresholdRow, styles.borderTop]}>
          <Text style={styles.thresholdLabel}>Fall Radar Sensitivity</Text>
          <Text style={styles.thresholdVal}>{Math.round(prefs.fallConfidenceThreshold * 100)}%</Text>
        </View>
      </Card>

      {/* Assigned Hardware */}
      <Text style={styles.sectionHeading}>Assigned Sensor Nodes</Text>
      {personDevices.map((d) => (
        <DeviceStatusCard
          key={d.id}
          device={d}
          onToggleConnection={(dev) =>
            updateDeviceStatus(dev.id, dev.connectionStatus === 'online' ? 'offline' : 'online')
          }
        />
      ))}

      {/* Active Incidents for this Person */}
      <Text style={styles.sectionHeading}>Incident History ({personIncidents.length})</Text>
      {personIncidents.slice(0, 3).map((inc) => (
        <IncidentCard
          key={inc.id}
          incident={inc}
          onPress={() => router.push(`/incident/${inc.id}`)}
          onAcknowledge={() => acknowledgeIncident(inc.id, 'caregiver-demo-1')}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  notFoundText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  card: {
    marginBottom: 18,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileMeta: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  subtext: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  badgeRow: {
    marginTop: 6,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 6,
  },
  thresholdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  thresholdLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  thresholdVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },
});
