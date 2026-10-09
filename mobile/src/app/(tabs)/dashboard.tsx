import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore, useSelectedPerson } from '@/store/useAppStore';
import { HealthMetricCard } from '@/components/metrics/HealthMetricCard';
import { MovementStatusCard } from '@/components/metrics/MovementStatusCard';
import { DeviceStatusCard } from '@/components/devices/DeviceStatusCard';
import { IncidentCard } from '@/components/incidents/IncidentCard';
import { SectionHeader } from '@/components/common/SectionHeader';
import { Avatar } from '@/components/common/Avatar';
import { DevTools } from '@/simulator/DevTools';
import { Incident, Device } from '@/types';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const router = useRouter();
  const person = useSelectedPerson();
  const {
    people,
    selectPerson,
    incidents,
    devices,
    measurements,
    movementEvents,
    acknowledgeIncident,
    updateDeviceStatus,
  } = useAppStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);
  const [showPersonPicker, setShowPersonPicker] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

  const handleIncidentPress = (incident: Incident) => {
    router.push(`/incident/${incident.id}`);
  };

  const handleAcknowledge = (incident: Incident) => {
    acknowledgeIncident(incident.id, 'caregiver-primary');
  };

  const handleToggleDevice = (device: Device) => {
    const nextStatus = device.connectionStatus === 'online' ? 'offline' : 'online';
    updateDeviceStatus(device.id, nextStatus);
  };

  if (!person) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No care recipient selected.</Text>
      </View>
    );
  }

  // Multi-patient scoping: filter telemetry by selected person
  const personIncidents = incidents.filter((i) => i.personId === person.id);
  const personMeasurements = measurements.filter((m) => m.personId === person.id);
  const personMovementEvents = movementEvents.filter((e) => e.personId === person.id);
  const personDevices = devices.filter((d) => d.personId === person.id);

  // Evaluate patient overall status
  const activeIncidents = personIncidents.filter(
    (i) => i.status === 'new' || i.status === 'acknowledged'
  );
  const hasHighRisk = activeIncidents.some((i) => i.severity === 'high');
  const hasMediumRisk = activeIncidents.some((i) => i.severity === 'medium');
  const hasDeviceWarning = activeIncidents.some((i) => i.severity === 'device-warning');
  const hasLowRisk = activeIncidents.some((i) => i.severity === 'low');

  let statusConfig = {
    title: 'All Systems Normal',
    subtitle: 'Vitals stable • Regular activity observed',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    textColor: '#065F46',
    icon: <Ionicons name="shield-checkmark" size={24} color="#059669" />,
  };

  if (hasHighRisk) {
    statusConfig = {
      title: 'High Risk Alert Active',
      subtitle: 'Critical vitals or fall incident requires immediate response',
      bgColor: '#FEF2F2',
      borderColor: '#FECACA',
      textColor: '#991B1B',
      icon: <Ionicons name="alert-circle" size={24} color="#DC2626" />,
    };
  } else if (hasMediumRisk) {
    statusConfig = {
      title: 'Elevated Risk Observed',
      subtitle: 'Anomalous vital sign or movement pattern detected',
      bgColor: '#FFFBEB',
      borderColor: '#FDE68A',
      textColor: '#92400E',
      icon: <Ionicons name="warning" size={24} color="#D97706" />,
    };
  } else if (hasDeviceWarning) {
    statusConfig = {
      title: 'Hardware Connection Notice',
      subtitle: 'One or more sensors are currently disconnected',
      bgColor: '#F3F4F6',
      borderColor: '#E5E7EB',
      textColor: '#374151',
      icon: <MaterialCommunityIcons name="chip" size={24} color="#4B5563" />,
    };
  } else if (hasLowRisk) {
    statusConfig = {
      title: 'Minor Vitals Variance',
      subtitle: 'Mild vital anomaly observed under routine monitoring',
      bgColor: '#EFF6FF',
      borderColor: '#BFDBFE',
      textColor: '#1E40AF',
      icon: <Ionicons name="information-circle" size={24} color="#3B82F6" />,
    };
  }

  const recentIncidents = personIncidents.slice(0, 3);

  // Dynamic Age calculation
  const calculateAge = (dobString?: string) => {
    if (!dobString) return 'Living Independently';
    const birthYear = new Date(dobString).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    return `Age ${age} • Living Independently`;
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
        {/* Care Recipient Selector Bar */}
        <View style={styles.personHeader}>
          <TouchableOpacity
            style={styles.personDetails}
            onPress={() => router.push(`/people/${person.id}`)}
          >
            <Avatar name={person.name} url={person.avatar} size={46} status="online" />
            <View style={styles.personText}>
              <View style={styles.personNameRow}>
                <Text style={styles.personName}>{person.name}</Text>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </View>
              <Text style={styles.personSubtext}>{calculateAge(person.dateOfBirth)}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.actionButtons}>
            {people.length > 1 && (
              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => setShowPersonPicker(true)}
              >
                <Ionicons name="people-outline" size={18} color="#4B5563" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.devSimButton}
              onPress={() => setShowDevTools(true)}
            >
              <Ionicons name="flash-outline" size={18} color="#2563EB" />
              <Text style={styles.devSimText}>Simulate</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Indicator Banner */}
        <View
          style={[
            styles.statusBanner,
            {
              backgroundColor: statusConfig.bgColor,
              borderColor: statusConfig.borderColor,
            },
          ]}
        >
          <View style={styles.statusIconWrap}>{statusConfig.icon}</View>
          <View style={styles.statusContent}>
            <Text style={[styles.statusTitle, { color: statusConfig.textColor }]}>
              {statusConfig.title}
            </Text>
            <Text style={[styles.statusSubtitle, { color: statusConfig.textColor }]}>
              {statusConfig.subtitle}
            </Text>
          </View>
        </View>

        {/* Section: Physiological Vitals */}
        <SectionHeader
          title="Physiological Vitals"
          subtitle="Real-time optical bracelet telemetry"
          actionTitle="Trends →"
          onAction={() => router.push('/(tabs)/history')}
        />
        <HealthMetricCard
          person={person}
          measurements={personMeasurements}
          onSelectMetric={(metric) => router.push('/(tabs)/history')}
        />

        {/* Section: Spatial Activity & Radar */}
        <View style={styles.sectionSpacing}>
          <SectionHeader
            title="Movement & Spatial Activity"
            subtitle="ESP32 ambient radar & fall detection"
          />
        </View>
        <MovementStatusCard
          events={personMovementEvents}
          inactivityThresholdMinutes={person.monitoringPreferences.inactivityThresholdMinutes}
        />

        {/* Section: Active Alerts & Incidents */}
        {recentIncidents.length > 0 && (
          <View style={styles.sectionSpacing}>
            <SectionHeader
              title="Recent Clinical Incidents"
              subtitle={`Active & recent events (${activeIncidents.length} pending)`}
              actionTitle={`All Alerts (${personIncidents.length}) →`}
              onAction={() => router.push('/(tabs)/incidents')}
            />
            <View style={styles.incidentsList}>
              {recentIncidents.map((inc) => (
                <IncidentCard
                  key={inc.id}
                  incident={inc}
                  onPress={handleIncidentPress}
                  onAcknowledge={inc.status === 'new' ? handleAcknowledge : undefined}
                />
              ))}
            </View>
          </View>
        )}

        {/* Section: Connected Hardware Status */}
        <View style={styles.sectionSpacing}>
          <SectionHeader
            title="Monitored Sensor Hardware"
            subtitle="Paired BLE & Wi-Fi telemetry nodes"
            actionTitle={`Manage (${personDevices.length}) →`}
            onAction={() => router.push('/(tabs)/devices')}
          />
        </View>
        <View style={styles.deviceRow}>
          {personDevices.map((d) => (
            <DeviceStatusCard
              key={d.id}
              device={d}
              onToggleConnection={handleToggleDevice}
            />
          ))}
          {personDevices.length === 0 && (
            <Text style={styles.noDevicesText}>No devices paired for this recipient.</Text>
          )}
        </View>
      </ScrollView>

      {/* Simulator DevTools Modal */}
      <Modal
        visible={showDevTools}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDevTools(false)}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Scenario Simulator</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowDevTools(false)}
          >
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
        </View>
        <DevTools />
      </Modal>

      {/* Patient Picker Modal */}
      <Modal
        visible={showPersonPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPersonPicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerBox}>
            <Text style={styles.pickerTitle}>Select Care Recipient</Text>
            {people.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.pickerItem,
                  p.id === person.id && styles.pickerItemActive,
                ]}
                onPress={() => {
                  selectPerson(p.id);
                  setShowPersonPicker(false);
                }}
              >
                <Avatar name={p.name} url={p.avatar} size={36} status="online" />
                <Text style={styles.pickerItemText}>{p.name}</Text>
                {p.id === person.id && (
                  <Ionicons name="checkmark-circle" size={20} color="#2563EB" />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.pickerCancel}
              onPress={() => setShowPersonPicker(false)}
            >
              <Text style={styles.pickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  personHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  personDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  personText: {
    marginLeft: 12,
  },
  personNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  personName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  personSubtext: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  switchButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  devSimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  devSimText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  statusIconWrap: {
    marginRight: 12,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  statusSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  sectionSpacing: {
    marginTop: 24,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  incidentsList: {
    marginTop: 8,
  },
  deviceRow: {
    marginTop: 8,
  },
  noDevicesText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pickerBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 360,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  pickerItemActive: {
    backgroundColor: '#EFF6FF',
  },
  pickerItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  pickerCancel: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  pickerCancelText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
});
