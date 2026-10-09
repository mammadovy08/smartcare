export type Severity = 'low' | 'medium' | 'high' | 'device-warning';
export type IncidentStatus = 'new' | 'acknowledged' | 'resolved' | 'escalated';
export type DeviceStatus = 'online' | 'stale' | 'offline' | 'error';

export interface HealthMeasurement {
  id: string;
  personId: string;
  sourceDeviceId: string;
  metricType: 'heartRate' | 'spo2' | 'temperature' | 'systolicBloodPressure' | 'diastolicBloodPressure';
  value: number;
  unit: string;
  measuredAt: string;
  receivedAt: string;
  validityStatus: 'valid' | 'invalid' | 'questionable';
  signalQuality: 'good' | 'fair' | 'poor';
  isDemo: boolean;
}

export interface MovementEvent {
  id: string;
  personId: string;
  sourceDeviceId: string;
  eventType: 'normalActivity' | 'suspectedFall' | 'fallRecovered' | 'prolongedInactivity' | 'postFallInactivity' | 'unusualMovement' | 'deviceDisconnected';
  occurredAt: string;
  receivedAt: string;
  fallConfidence?: number;
  inactivityDurationSeconds?: number;
  dataQuality: 'good' | 'fair' | 'poor';
  isDemo: boolean;
}

export interface Incident {
  id: string;
  personId: string;
  severity: Severity;
  status: IncidentStatus;
  title: string;
  explanation: string;
  detectedAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
  evidence: {
    measurements: HealthMeasurement[];
    movementEvents: MovementEvent[];
  };
  ruleTriggered: string;
  isDemo: boolean;
}

export interface Device {
  id: string;
  personId: string;
  deviceType: 'bracelet' | 'esp32' | 'sensor_hub';
  name: string;
  status: DeviceStatus;
  batteryPercentage?: number;
  lastSeenAt: string;
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
  priority: number;
  isEscalationContact: boolean;
  preferredMethod: 'call' | 'sms' | 'push';
}

export interface PersonSettings {
  inactivityThresholdMinutes: number;
  heartRate: { min: number; max: number; criticalMin: number; criticalMax: number };
  spo2: { min: number; criticalMin: number };
  temperature: { min: number; max: number; criticalMin: number; criticalMax: number };
  systolicBP: { min: number; max: number; criticalMin: number; criticalMax: number };
  diastolicBP: { min: number; max: number; criticalMin: number; criticalMax: number };
  fallConfidenceThreshold: number;
  measurementStaleMinutes: number;
  movementStaleMinutes: number;
}

export interface Person {
  id: string;
  fullName: string;
  preferredName?: string;
  birthDate: string;
  gender: string;
  roomOrUnit?: string;
  notes?: string;
  primaryCaregiverId?: string;
  assignedCaregiverIds: string[];
  monitoringPreferences: PersonSettings;
  isActive: boolean;
  isDemo: boolean;
}
