import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { IncidentCard } from './IncidentCard';
import { EmptyState } from '../common/EmptyState';
import { Incident, Severity, IncidentStatus } from '@/types';

export interface IncidentListProps {
  incidents: Incident[];
  onSelectIncident?: (incident: Incident) => void;
  onAcknowledgeIncident?: (incident: Incident) => void;
  selectedSeverity?: Severity | 'all';
  onFilterSeverity?: (severity: Severity | 'all') => void;
}

export const IncidentList: React.FC<IncidentListProps> = ({
  incidents,
  onSelectIncident,
  onAcknowledgeIncident,
  selectedSeverity = 'all',
  onFilterSeverity,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'resolved'>('all');
  const [internalSeverity, setInternalSeverity] = useState<Severity | 'all'>(selectedSeverity);

  const currentSeverity = onFilterSeverity ? selectedSeverity : internalSeverity;
  const setSeverity = (s: Severity | 'all') => {
    if (onFilterSeverity) onFilterSeverity(s);
    setInternalSeverity(s);
  };

  const filteredIncidents = incidents.filter((incident) => {
    // Severity filter
    if (currentSeverity !== 'all' && incident.severity !== currentSeverity) {
      return false;
    }
    // Status tab filter
    if (activeTab === 'active' && incident.status === 'resolved') {
      return false;
    }
    if (activeTab === 'resolved' && incident.status !== 'resolved') {
      return false;
    }
    return true;
  });

  const severityFilters: { key: Severity | 'all'; label: string }[] = [
    { key: 'all', label: 'All Alerts' },
    { key: 'high', label: 'High' },
    { key: 'medium', label: 'Medium' },
    { key: 'low', label: 'Low' },
    { key: 'device-warning', label: 'Devices' },
  ];

  return (
    <View style={styles.container}>
      {/* Status tabs */}
      <View style={styles.statusTabs}>
        <TouchableOpacity
          style={[styles.statusTab, activeTab === 'all' && styles.statusTabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.statusTabText, activeTab === 'all' && styles.statusTabTextActive]}>
            All ({incidents.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statusTab, activeTab === 'active' && styles.statusTabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.statusTabText, activeTab === 'active' && styles.statusTabTextActive]}>
            Active ({incidents.filter((i) => i.status !== 'resolved').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statusTab, activeTab === 'resolved' && styles.statusTabActive]}
          onPress={() => setActiveTab('resolved')}
        >
          <Text style={[styles.statusTabText, activeTab === 'resolved' && styles.statusTabTextActive]}>
            Resolved ({incidents.filter((i) => i.status === 'resolved').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Severity filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {severityFilters.map((f) => {
          const isSelected = currentSeverity === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, isSelected && styles.chipActive]}
              onPress={() => setSeverity(f.key)}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Incidents feed */}
      {filteredIncidents.length === 0 ? (
        <EmptyState
          title="No Incidents Found"
          message={
            currentSeverity !== 'all' || activeTab !== 'all'
              ? 'No incidents match the selected filter criteria.'
              : 'Everything is normal. No incidents have been reported.'
          }
        />
      ) : (
        <View>
          {filteredIncidents.map((item) => (
            <IncidentCard
              key={item.id}
              incident={item}
              onPress={onSelectIncident}
              onAcknowledge={onAcknowledgeIncident}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  statusTabs: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
  },
  statusTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  statusTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statusTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  statusTabTextActive: {
    color: '#111827',
  },
  filterRow: {
    flexDirection: 'row',
    paddingBottom: 14,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
});
