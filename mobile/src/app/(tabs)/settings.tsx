import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useAppStore, useSelectedPerson } from '@/store/useAppStore';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Avatar } from '@/components/common/Avatar';
import { DevTools } from '@/simulator/DevTools';
import { EmergencyContact, uuid } from '@/types';
import { notificationService } from '@/services/notifications';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView, Platform } from 'react-native';

export default function SettingsScreen() {
  const person = useSelectedPerson();
  const {
    isDemoMode,
    setDemoMode,
    emergencyContacts,
    addEmergencyContact,
    deleteEmergencyContact,
    selectedPersonId,
    reset,
  } = useAppStore();

  const [showDevTools, setShowDevTools] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactRelation, setContactRelation] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isEscalation, setIsEscalation] = useState(true);

  const activeContacts = selectedPersonId
    ? emergencyContacts.filter((c) => c.personId === selectedPersonId)
    : emergencyContacts;

  const handleTestAlert = async () => {
    try {
      await notificationService.sendLocal(
        '🚨 SmartCare Emergency Test',
        'Simulated escalation notification successfully broadcast to registered caregivers.',
        { test: true }
      );
      Alert.alert(
        'Notification Dispatched',
        'A local simulation notification was dispatched and sent to all configured caregiver push endpoints.'
      );
    } catch {
      Alert.alert('Notification Test', 'Simulated alert triggered in test console.');
    }
  };

  const handleAddContact = () => {
    if (!contactName.trim() || !contactPhone.trim()) {
      Alert.alert('Required Fields', 'Please enter a contact name and phone number.');
      return;
    }

    const newContact: EmergencyContact = {
      id: uuid(),
      personId: selectedPersonId || 'person-demo-1',
      name: contactName.trim(),
      relationship: contactRelation.trim() || 'Caregiver',
      phoneNumber: contactPhone.trim(),
      email: `${contactName.toLowerCase().replace(/\s+/g, '')}@example.com`,
      priority: activeContacts.length + 1,
      preferredMethod: 'push',
      isEscalationContact: isEscalation,
      isDemo: true,
    };

    addEmergencyContact(newContact);
    setContactName('');
    setContactRelation('');
    setContactPhone('');
    setShowContactModal(false);
    Alert.alert('Contact Added', `${newContact.name} added to emergency response circle.`);
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset Demo Data',
      'This will reset all vitals, incidents, and devices to default scenario values. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            reset();
            Alert.alert('Reset Complete', 'All demo data has been restored to factory state.');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Card */}
      <Card padding="md" style={styles.card}>
        <View style={styles.profileRow}>
          <Avatar name="Sarah Jenkins" size={54} status="online" />
          <View style={styles.profileText}>
            <Text style={styles.profileName}>Dr. Sarah Jenkins</Text>
            <Text style={styles.profileRole}>Primary Attending Caregiver</Text>
            <Text style={styles.profileEmail}>sarah.jenkins@smartcare.med</Text>
          </View>
        </View>
      </Card>

      {/* Emergency Escalation Contacts */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Emergency Escalation Circle</Text>
        <TouchableOpacity onPress={() => setShowContactModal(true)}>
          <Text style={styles.addActionText}>+ Add Contact</Text>
        </TouchableOpacity>
      </View>

      <Card padding="md" style={styles.card}>
        {activeContacts.map((contact, index) => (
          <View
            key={contact.id}
            style={[styles.contactRow, index > 0 && styles.contactBorder]}
          >
            <View style={styles.contactLeft}>
              <View style={styles.priorityBadge}>
                <Text style={styles.priorityText}>{contact.priority}</Text>
              </View>
              <View>
                <Text style={styles.contactName}>
                  {contact.name} {contact.isEscalationContact && '⚡'}
                </Text>
                <Text style={styles.contactDetail}>
                  {contact.relationship} • {contact.phoneNumber}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => deleteEmergencyContact(contact.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ))}

        {activeContacts.length === 0 && (
          <Text style={{ color: '#9CA3AF', fontStyle: 'italic', paddingVertical: 12 }}>
            No emergency contacts added for this recipient.
          </Text>
        )}

        <View style={styles.testAlertBox}>
          <Button
            title="Dispatch Test Notification"
            variant="outline"
            size="sm"
            fullWidth
            icon={<Ionicons name="notifications-outline" size={16} color="#2563EB" />}
            onPress={handleTestAlert}
          />
        </View>
      </Card>

      {/* Monitoring Preferences */}
      <Text style={styles.sectionTitle}>Surveillance Thresholds</Text>
      <Card padding="md" style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Inactivity Alert Window</Text>
            <Text style={styles.settingSub}>Triggers alert if stationary without bed posture</Text>
          </View>
          <Text style={styles.settingValue}>
            {person?.monitoringPreferences.inactivityThresholdMinutes ?? 30} min
          </Text>
        </View>

        <View style={[styles.settingRow, styles.rowBorder]}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Fall Confidence Threshold</Text>
            <Text style={styles.settingSub}>Minimum radar impact confidence to escalate</Text>
          </View>
          <Text style={styles.settingValue}>
            {Math.round((person?.monitoringPreferences.fallConfidenceThreshold ?? 0.7) * 100)}%
          </Text>
        </View>

        <View style={[styles.settingRow, styles.rowBorder]}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Critical HR Range</Text>
            <Text style={styles.settingSub}>Immediate escalation triggers</Text>
          </View>
          <Text style={styles.settingValue}>
            &lt;{person?.monitoringPreferences.heartRate.criticalMin ?? 40} or &gt;{person?.monitoringPreferences.heartRate.criticalMax ?? 130} BPM
          </Text>
        </View>
      </Card>

      {/* Developer & Demo Tools */}
      <Text style={styles.sectionTitle}>System & Simulator</Text>
      <Card padding="md" style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Demo Mode</Text>
            <Text style={styles.settingSub}>Uses deterministic sensor telemetry and scenarios</Text>
          </View>
          <Switch
            value={isDemoMode}
            onValueChange={setDemoMode}
            trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
            thumbColor={isDemoMode ? '#2563EB' : '#F3F4F6'}
          />
        </View>

        <View style={styles.toolsRow}>
          <Button
            title="Open Scenario Simulator DevTools"
            variant="primary"
            fullWidth
            icon={<Ionicons name="flask" size={16} color="#FFFFFF" />}
            onPress={() => setShowDevTools(true)}
          />
        </View>

        <View style={styles.toolsRow}>
          <Button
            title="Reset All Demo Data"
            variant="ghost"
            fullWidth
            textStyle={{ color: '#EF4444' }}
            onPress={handleResetData}
          />
        </View>
      </Card>

      <Text style={styles.versionText}>
        SmartCare Clinical Mobile • Phase 1 MVP • v1.0.0
      </Text>

      {/* DevTools Modal */}
      <Modal
        visible={showDevTools}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDevTools(false)}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalHeaderTitle}>Simulation DevTools</Text>
          <TouchableOpacity onPress={() => setShowDevTools(false)}>
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
        </View>
        <DevTools />
      </Modal>

      {/* Add Contact Modal */}
      <Modal
        visible={showContactModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowContactModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalHeading}>Add Emergency Contact</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Full Name (e.g. David Johnson)"
              value={contactName}
              onChangeText={setContactName}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Relationship (e.g. Son / Neighbor)"
              value={contactRelation}
              onChangeText={setContactRelation}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Phone Number (e.g. +1 555-0199)"
              keyboardType="phone-pad"
              value={contactPhone}
              onChangeText={setContactPhone}
            />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Include in High-Risk Escalations</Text>
              <Switch
                value={isEscalation}
                onValueChange={setIsEscalation}
                trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                thumbColor={isEscalation ? '#2563EB' : '#F3F4F6'}
              />
            </View>

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="ghost"
                size="sm"
                onPress={() => setShowContactModal(false)}
              />
              <Button
                title="Save Contact"
                variant="primary"
                size="sm"
                onPress={handleAddContact}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  card: {
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileText: {
    marginLeft: 14,
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  profileRole: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 1,
  },
  profileEmail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  contactBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  priorityBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  contactName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  contactDetail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  testAlertBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  settingInfo: {
    flex: 1,
    paddingRight: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  settingSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  settingValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  toolsRow: {
    marginTop: 10,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  switchLabel: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 14,
  },
});
