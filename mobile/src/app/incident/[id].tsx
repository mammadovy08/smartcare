import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { IncidentDetail } from '@/components/incidents/IncidentDetail';
import { EmergencyContact } from '@/types';
import { Button } from '@/components/common/Button';

export default function IncidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const {
    incidents,
    people,
    emergencyContacts,
    acknowledgeIncident,
    resolveIncident,
  } = useAppStore();

  const incident = incidents.find((i) => i.id === id);
  const person = people.find((p) => p.id === incident?.personId);

  if (!incident) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFoundTitle}>Incident Not Found</Text>
        <Text style={styles.notFoundSub}>The requested incident record does not exist or has been cleared.</Text>
        <Button
          title="Back to Alerts"
          variant="primary"
          style={styles.backBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/incidents'))}
        />
      </View>
    );
  }

  const patientContacts = emergencyContacts.filter((c) => c.personId === incident.personId);

  const handleAcknowledge = () => {
    acknowledgeIncident(incident.id, 'caregiver-primary');
    Alert.alert('Acknowledged', 'Alert acknowledged. Escalation timer suspended.');
  };

  const handleResolve = (note: string) => {
    resolveIncident(incident.id, 'caregiver-primary', note);
    Alert.alert('Incident Resolved', 'Status updated to resolved and archived in history.', [
      { text: 'OK', onPress: () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/incidents')) },
    ]);
  };

  const handleCallContact = (contact: EmergencyContact) => {
    Alert.alert(
      'Simulate Emergency Call',
      `Calling ${contact.name} (${contact.relationship}) at ${contact.phoneNumber}...`,
      [{ text: 'End Call', style: 'cancel' }]
    );
  };

  return (
    <IncidentDetail
      incident={incident}
      person={person}
      emergencyContacts={patientContacts}
      onAcknowledge={incident.status === 'new' ? handleAcknowledge : undefined}
      onResolve={incident.status !== 'resolved' ? handleResolve : undefined}
      onCallContact={handleCallContact}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  notFoundSub: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  backBtn: {
    minWidth: 150,
  },
});
