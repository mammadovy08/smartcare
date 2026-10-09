import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAppStore, useSelectedPerson } from '@/store/useAppStore';
import { DeviceStatusCard } from '@/components/devices/DeviceStatusCard';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Device, uuid } from '@/types';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function DevicesScreen() {
  const { devices, addDevice, updateDeviceStatus, selectedPersonId } = useAppStore();
  const person = useSelectedPerson();
  const [pairingModalVisible, setPairingModalVisible] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceType, setNewDeviceType] = useState<'bracelet' | 'esp32'>('esp32');
  const [pairingLoading, setPairingLoading] = useState(false);

  const handleToggleDevice = (device: Device) => {
    const nextStatus = device.connectionStatus === 'online' ? 'offline' : 'online';
    updateDeviceStatus(device.id, nextStatus);
  };

  const handleSimulatePair = () => {
    if (!newDeviceName.trim()) {
      Alert.alert('Device Name Required', 'Please enter a label for the sensor node.');
      return;
    }
    setPairingLoading(true);
    setTimeout(() => {
      const createdDevice: Device = {
        id: uuid(),
        personId: selectedPersonId || 'person-demo-1',
        deviceType: newDeviceType,
        name: newDeviceName.trim(),
        connectionStatus: 'online',
        batteryLevel: 100,
        lastSeenAt: new Date().toISOString(),
        supportedSensors:
          newDeviceType === 'bracelet'
            ? ['PPG Heart Rate', 'SpO2 Sensor', 'Skin Temperature']
            : ['60GHz mmWave Radar', 'IMU Tri-axial Accelerometer'],
        firmwareVersion: 'v2.1.0-ota',
        isDemo: true,
      };

      addDevice(createdDevice);
      setPairingLoading(false);
      setPairingModalVisible(false);
      setNewDeviceName('');
      Alert.alert(
        'Pairing Successful',
        `Device "${createdDevice.name}" has connected over BLE and is synchronized for ${person?.name || 'patient'}.`
      );
    }, 900);
  };

  // Scope to current recipient
  const activePersonDevices = selectedPersonId
    ? devices.filter((d) => d.personId === selectedPersonId)
    : devices;

  const bracelets = activePersonDevices.filter((d) => d.deviceType === 'bracelet');
  const esp32s = activePersonDevices.filter((d) => d.deviceType === 'esp32');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hardware Architecture Summary */}
      <Card padding="md" style={styles.bannerCard}>
        <View style={styles.bannerHeader}>
          <MaterialCommunityIcons name="access-point-network" size={24} color="#2563EB" />
          <Text style={styles.bannerTitle}>Dual-Sensor Fusion Architecture</Text>
        </View>
        <Text style={styles.bannerText}>
          SmartCare correlates wrist PPG vital sign trends with ESP32 ambient spatial radar. A suspected fall is verified alongside post-fall inactivity and heart rate response.
        </Text>
      </Card>

      {/* Bracelet Section */}
      <Text style={styles.sectionHeading}>Wearable Sensor Nodes ({bracelets.length})</Text>
      {bracelets.map((b) => (
        <DeviceStatusCard key={b.id} device={b} onToggleConnection={handleToggleDevice} />
      ))}
      {bracelets.length === 0 && (
        <Text style={styles.emptyNotice}>No wearable bands assigned.</Text>
      )}

      {/* ESP32 Hub Section */}
      <Text style={styles.sectionHeading}>Ambient Fall Radar & Spatial Hubs ({esp32s.length})</Text>
      {esp32s.map((e) => (
        <DeviceStatusCard key={e.id} device={e} onToggleConnection={handleToggleDevice} />
      ))}
      {esp32s.length === 0 && (
        <Text style={styles.emptyNotice}>No spatial radar sensors assigned.</Text>
      )}

      {/* Pair New Node */}
      <View style={styles.pairContainer}>
        <Button
          title="Pair New Sensor Node"
          variant="outline"
          fullWidth
          icon={<Ionicons name="add-circle-outline" size={18} color="#2563EB" />}
          onPress={() => setPairingModalVisible(true)}
        />
      </View>

      {/* Pairing Modal */}
      <Modal
        visible={pairingModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPairingModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Pair Sensor Node</Text>
            <Text style={styles.modalSub}>
              Select hardware node type and assign a room label:
            </Text>

            {/* Type selector */}
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  newDeviceType === 'bracelet' && styles.typeOptionActive,
                ]}
                onPress={() => setNewDeviceType('bracelet')}
              >
                <Ionicons
                  name="watch-outline"
                  size={20}
                  color={newDeviceType === 'bracelet' ? '#2563EB' : '#4B5563'}
                />
                <Text
                  style={[
                    styles.typeOptionText,
                    newDeviceType === 'bracelet' && styles.typeOptionTextActive,
                  ]}
                >
                  Health Band (BLE)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeOption,
                  newDeviceType === 'esp32' && styles.typeOptionActive,
                ]}
                onPress={() => setNewDeviceType('esp32')}
              >
                <MaterialCommunityIcons
                  name="chip"
                  size={20}
                  color={newDeviceType === 'esp32' ? '#2563EB' : '#4B5563'}
                />
                <Text
                  style={[
                    styles.typeOptionText,
                    newDeviceType === 'esp32' && styles.typeOptionTextActive,
                  ]}
                >
                  ESP32 Radar (Wi-Fi)
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder={
                newDeviceType === 'bracelet'
                  ? 'e.g. Wrist Pulse Band #2'
                  : 'e.g. Living Room ESP32 Radar'
              }
              value={newDeviceName}
              onChangeText={setNewDeviceName}
            />

            <View style={styles.modalButtonRow}>
              <Button
                title="Cancel"
                variant="ghost"
                size="sm"
                onPress={() => setPairingModalVisible(false)}
              />
              <Button
                title="Pair Device"
                variant="primary"
                size="sm"
                loading={pairingLoading}
                onPress={handleSimulatePair}
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
  bannerCard: {
    marginBottom: 20,
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E40AF',
  },
  bannerText: {
    fontSize: 13,
    color: '#3B82F6',
    lineHeight: 19,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
    marginBottom: 10,
  },
  emptyNotice: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginBottom: 14,
  },
  pairContainer: {
    marginTop: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalSub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 14,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  typeOptionActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  typeOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  typeOptionTextActive: {
    color: '#2563EB',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    marginBottom: 16,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
});
