import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Device } from '@/types';
import { formatTimeAgo } from '@/utils/date';
import { getDeviceStatusColor, getDeviceStatusLabel } from '@/utils/format';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

export interface DeviceStatusCardProps {
  device: Device;
  onToggleConnection?: (device: Device) => void;
  testID?: string;
}

export const DeviceStatusCard: React.FC<DeviceStatusCardProps> = ({
  device,
  onToggleConnection,
  testID,
}) => {
  const isOnline = device.connectionStatus === 'online';
  const statusColor = getDeviceStatusColor(device.connectionStatus);
  const statusLabel = getDeviceStatusLabel(device.connectionStatus);

  const getDeviceIcon = () => {
    if (device.deviceType === 'bracelet') {
      return <MaterialCommunityIcons name="watch" size={24} color="#2563EB" />;
    }
    return <MaterialCommunityIcons name="radar" size={24} color="#7C3AED" />;
  };

  const getBatteryIcon = () => {
    if (device.batteryLevel === undefined) return 'battery-unknown';
    if (device.batteryLevel > 80) return 'battery';
    if (device.batteryLevel > 50) return 'battery-medium';
    if (device.batteryLevel > 20) return 'battery-low';
    return 'battery-alert';
  };

  const getBatteryColor = () => {
    if (device.batteryLevel === undefined) return '#9CA3AF';
    if (device.batteryLevel > 50) return '#16A34A';
    if (device.batteryLevel > 20) return '#F59E0B';
    return '#DC2626';
  };

  return (
    <Card testID={testID} padding="md" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconContainer}>{getDeviceIcon()}</View>
          <View style={styles.titleInfo}>
            <Text style={styles.deviceName}>{device.name}</Text>
            <Text style={styles.deviceMeta}>
              {device.deviceType === 'bracelet' ? 'BLE Wearable' : 'ESP32 Room Hub'} • v{device.firmwareVersion}
            </Text>
          </View>
        </View>

        <Badge
          label={statusLabel}
          color={statusColor}
          variant="subtle"
          size="sm"
        />
      </View>

      <View style={styles.body}>
        {/* Battery Level */}
        {device.batteryLevel !== undefined && (
          <View style={styles.rowItem}>
            <Text style={styles.rowLabel}>Battery Level</Text>
            <View style={styles.batteryRow}>
              <View style={styles.batteryBarBg}>
                <View
                  style={[
                    styles.batteryBarFill,
                    {
                      width: `${Math.min(100, Math.max(0, device.batteryLevel))}%`,
                      backgroundColor: getBatteryColor(),
                    },
                  ]}
                />
              </View>
              <Text style={[styles.batteryPercent, { color: getBatteryColor() }]}>
                {device.batteryLevel}%
              </Text>
            </View>
          </View>
        )}

        {/* Last Seen */}
        <View style={styles.rowItem}>
          <Text style={styles.rowLabel}>Last Communication</Text>
          <Text style={styles.rowValue}>
            {formatTimeAgo(device.lastSeenAt)}
          </Text>
        </View>

        {/* Supported Sensors */}
        <View style={styles.sensorRow}>
          <Text style={styles.rowLabel}>Sensors:</Text>
          <View style={styles.tagWrap}>
            {device.supportedSensors.map((sensor, idx) => (
              <View key={idx} style={styles.sensorTag}>
                <Text style={styles.sensorTagText}>{sensor}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Demo Action Button */}
      {onToggleConnection && (
        <View style={styles.footer}>
          <Button
            title={isOnline ? 'Simulate Disconnect' : 'Simulate Reconnect'}
            variant={isOnline ? 'outline' : 'primary'}
            size="sm"
            onPress={() => onToggleConnection(device)}
            icon={
              <Ionicons
                name={isOnline ? 'cloud-offline-outline' : 'cloud-done-outline'}
                size={14}
                color={isOnline ? '#2563EB' : '#FFFFFF'}
              />
            }
          />
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
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
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  titleInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  deviceMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  body: {
    paddingVertical: 4,
    gap: 8,
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  rowValue: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '600',
  },
  batteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryBarBg: {
    width: 60,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
    marginRight: 6,
  },
  batteryBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  batteryPercent: {
    fontSize: 12,
    fontWeight: '700',
  },
  sensorRow: {
    marginTop: 4,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  sensorTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sensorTagText: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
  },
  footer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    alignItems: 'flex-end',
  },
});
