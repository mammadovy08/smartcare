import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { IncidentList } from '@/components/incidents/IncidentList';
import { Incident, Severity } from '@/types';

export default function IncidentsScreen() {
  const router = useRouter();
  const { incidents, acknowledgeIncident, selectedPersonId } = useAppStore();
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  const activeIncidents = selectedPersonId
    ? incidents.filter((i) => i.personId === selectedPersonId)
    : incidents;

  const handleSelectIncident = (incident: Incident) => {
    router.push(`/incident/${incident.id}`);
  };

  const handleAcknowledge = (incident: Incident) => {
    acknowledgeIncident(incident.id, 'caregiver-primary');
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
        }
      >
        <IncidentList
          incidents={activeIncidents}
          selectedSeverity={selectedSeverity}
          onFilterSeverity={setSelectedSeverity}
          onSelectIncident={handleSelectIncident}
          onAcknowledgeIncident={handleAcknowledge}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
});
