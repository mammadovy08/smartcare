// SmartCare Domain Types
// Single source of truth for all domain entities

// Auth types
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResult {
  user: User;
  session: { accessToken: string };
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
}

export interface CreatePersonData {
  name: string;
  dateOfBirth?: string;
  avatar?: string;
  caregiverId: string;
  monitoringPreferences: MonitoringPreferences;
}

export type Severity = 'low' | 'medium' | 'high' | 'device-warning';
export type IncidentStatus = 'new' | 'acknowledged' | 'resolved' | 'escalated';
export type DeviceStatus = 'online' | 'stale' | 'offline' | 'error';
export type MetricType = 'heartRate' | 'spo2' | 'temperature' | 'systolicBloodPressure' | 'diastolicBloodPressure';
export type MovementEventType =
  | 'normalActivity'
  | 'suspectedFall'
  | 'prolongedInactivity'
  | 'postFallInactivity'
  | 'unusualMovement'
  | 'deviceDisconnected'
  | 'sensorError';
export type SignalQuality = 'good' | 'fair' | 'poor';
export type ValidityStatus = 'valid' | 'stale' | 'invalid';
export type DataQuality = 'good' | 'fair' | 'poor';

export interface HealthMeasurement {
  id: string;
  personId: string;
  sourceDeviceId: string;
  metricType: MetricType;
  value: number;
  unit: string;
  measuredAt: string; // ISO 8601
  receivedAt: string; // ISO 8601
  signalQuality: SignalQuality;
  validityStatus: ValidityStatus;
  isDemo: boolean; // ALWAYS required for mock data
}

export interface MovementEvent {
  id: string;
  personId: string;
  sourceDeviceId: string;
  eventType: MovementEventType;
  occurredAt: string; // ISO 8601
  receivedAt: string; // ISO 8601
  acceleration?: { x: number; y: number; z: number };
  orientation?: { x: number; y: number; z: number };
  fallConfidence?: number; // 0-1
  inactivityDurationSeconds?: number;
  dataQuality: DataQuality;
  isDemo: boolean;
}

export interface Incident {
  id: string;
  personId: string;
  severity: Severity;
  incidentType: string;
  title: string;
  explanation: string;
  detectedAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  status: IncidentStatus;
  evidence: {
    measurements: HealthMeasurement[];
    movementEvents: MovementEvent[];
  };
  confidence: number; // 0-1
  ruleTriggered: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
  escalationHistory?: EscalationRecord[];
}

export interface EscalationRecord {
  contactId: string;
  contactName: string;
  channel: 'push' | 'sms' | 'call' | 'in-app';
  attemptedAt: string;
  deliveryStatus: 'pending' | 'delivered' | 'failed' | 'acknowledged';
  acknowledgedAt?: string;
  errorMessage?: string;
}

export interface Person {
  id: string;
  name: string;
  dateOfBirth?: string; // ISO 8601 date
  avatar?: string;
  assignedCaregiverIds: string[];
  monitoringPreferences: MonitoringPreferences;
  createdAt: string; // ISO 8601
}

export interface MonitoringPreferences {
  inactivityThresholdMinutes: number;
  heartRate: { min: number; max: number; criticalMin: number; criticalMax: number };
  spo2: { min: number; criticalMin: number };
  temperature: { min: number; max: number; criticalMin: number; criticalMax: number };
  systolicBP: { min: number; max: number; criticalMin: number; criticalMax: number };
  diastolicBP: { min: number; max: number; criticalMin: number; criticalMax: number };
  fallConfidenceThreshold: number;
  measurementStaleMinutes: number;
  movementStaleMinutes: number;
  alertPreferences: AlertPreferences;
}

export interface AlertPreferences {
  lowRisk: { notify: boolean; channels: ('push' | 'in-app')[] };
  mediumRisk: { notify: boolean; channels: ('push' | 'sms' | 'call' | 'in-app')[]; responseDeadlineMinutes: number };
  highRisk: { notify: boolean; channels: ('push' | 'sms' | 'call' | 'in-app')[]; immediateEscalation: boolean };
  deviceWarning: { notify: boolean; channels: ('push' | 'in-app')[] };
}

export interface Device {
  id: string;
  personId: string;
  deviceType: 'bracelet' | 'esp32';
  name: string;
  connectionStatus: DeviceStatus;
  batteryLevel?: number; // 0-100
  lastSeenAt: string; // ISO 8601
  supportedSensors: string[];
  firmwareVersion?: string;
  isDemo: boolean;
}

export interface EmergencyContact {
  id: string;
  personId: string;
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
  priority: number; // 1 = primary, 2 = secondary, etc.
  preferredMethod: 'push' | 'sms' | 'call';
  isEscalationContact: boolean;
  isDemo: boolean;
}

export interface NotificationRecord {
  id: string;
  incidentId: string;
  recipientId: string;
  channel: 'push' | 'sms' | 'call' | 'in-app';
  attemptedAt: string;
  deliveryStatus: 'pending' | 'delivered' | 'failed' | 'acknowledged';
  acknowledgedAt?: string;
  errorMessage?: string;
}

export interface TimeRange {
  start: string; // ISO 8601
  end: string; // ISO 8601
}

export interface IncidentFilters {
  personId?: string;
  severity?: Severity[];
  status?: IncidentStatus[];
  dateRange?: TimeRange;
  incidentType?: string[];
}

export type UUID = string & { readonly __brand: unique symbol };
export function uuid(): UUID {
  const g = typeof globalThis !== 'undefined' ? (globalThis as unknown as { crypto?: { randomUUID?: () => string } }) : undefined;
  if (g?.crypto?.randomUUID) {
    return g.crypto.randomUUID() as UUID;
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  }) as UUID;
}