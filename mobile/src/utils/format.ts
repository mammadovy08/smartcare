// Format Utilities
// Consistent formatting for vitals, numbers, status labels

import type { MetricType, Severity, DeviceStatus, IncidentStatus } from '@/types';

export function formatHeartRate(value: number): string {
  return `${Math.round(value)} BPM`;
}

export function formatSpO2(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatTemperature(value: number, unit: 'celsius' | 'fahrenheit' = 'celsius'): string {
  if (unit === 'fahrenheit') {
    return `${(value * 9/5 + 32).toFixed(1)}°F`;
  }
  return `${value.toFixed(1)}°C`;
}

export function formatBloodPressure(systolic: number, diastolic: number): string {
  return `${Math.round(systolic)}/${Math.round(diastolic)} mmHg`;
}

export function formatMetricValue(type: MetricType, value: number): string {
  switch (type) {
    case 'heartRate':
      return formatHeartRate(value);
    case 'spo2':
      return formatSpO2(value);
    case 'temperature':
      return formatTemperature(value);
    case 'systolicBloodPressure':
      return `${Math.round(value)} mmHg`;
    case 'diastolicBloodPressure':
      return `${Math.round(value)} mmHg`;
    default:
      return `${value}`;
  }
}

export function getMetricUnit(type: MetricType): string {
  switch (type) {
    case 'heartRate':
      return 'BPM';
    case 'spo2':
      return '%';
    case 'temperature':
      return '°C';
    case 'systolicBloodPressure':
    case 'diastolicBloodPressure':
      return 'mmHg';
    default:
      return '';
  }
}

export function getMetricLabel(type: MetricType): string {
  switch (type) {
    case 'heartRate':
      return 'Heart Rate';
    case 'spo2':
      return 'Blood Oxygen';
    case 'temperature':
      return 'Temperature';
    case 'systolicBloodPressure':
      return 'Systolic BP';
    case 'diastolicBloodPressure':
      return 'Diastolic BP';
    default:
      return type;
  }
}

export function getSeverityColor(severity: Severity): string {
  switch (severity) {
    case 'high':
      return '#DC2626'; // red-600
    case 'medium':
      return '#F59E0B'; // amber-500
    case 'low':
      return '#2563EB'; // blue-600
    case 'device-warning':
      return '#6B7280'; // gray-500
    default:
      return '#6B7280';
  }
}

export function getSeverityBgColor(severity: Severity): string {
  switch (severity) {
    case 'high':
      return '#FEF2F2'; // red-50
    case 'medium':
      return '#FFFBEB'; // amber-50
    case 'low':
      return '#EFF6FF'; // blue-50
    case 'device-warning':
      return '#F9FAFB'; // gray-50
    default:
      return '#F9FAFB';
  }
}

export function getSeverityLabel(severity: Severity): string {
  switch (severity) {
    case 'high':
      return 'High Risk';
    case 'medium':
      return 'Medium Risk';
    case 'low':
      return 'Low Risk';
    case 'device-warning':
      return 'Device Warning';
    default:
      return 'Unknown';
  }
}

export function getDeviceStatusColor(status: DeviceStatus): string {
  switch (status) {
    case 'online':
      return '#16A34A'; // green-600
    case 'stale':
      return '#F59E0B'; // amber-500
    case 'offline':
      return '#DC2626'; // red-600
    case 'error':
      return '#EF4444'; // red-500
    default:
      return '#6B7280';
  }
}

export function getDeviceStatusLabel(status: DeviceStatus): string {
  switch (status) {
    case 'online':
      return 'Connected';
    case 'stale':
      return 'Stale Data';
    case 'offline':
      return 'Disconnected';
    case 'error':
      return 'Error';
    default:
      return 'Unknown';
  }
}

export function getIncidentStatusColor(status: IncidentStatus): string {
  switch (status) {
    case 'new':
      return '#DC2626';
    case 'acknowledged':
      return '#F59E0B';
    case 'resolved':
      return '#16A34A';
    case 'escalated':
      return '#7C3AED';
    default:
      return '#6B7280';
  }
}

export function getIncidentStatusLabel(status: IncidentStatus): string {
  switch (status) {
    case 'new':
      return 'New';
    case 'acknowledged':
      return 'Acknowledged';
    case 'resolved':
      return 'Resolved';
    case 'escalated':
      return 'Escalated';
    default:
      return 'Unknown';
  }
}

export function formatBatteryLevel(level: number | undefined): string {
  if (level === undefined) return 'Unknown';
  return `${Math.round(level)}%`;
}

export function getBatteryColor(level: number | undefined): string {
  if (level === undefined) return '#6B7280';
  if (level <= 15) return '#DC2626';
  if (level <= 30) return '#F59E0B';
  return '#16A34A';
}

export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatPhoneNumber(phone: string): string {
  // Simple US formatting
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}