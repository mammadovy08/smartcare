// Mock Data Factories
// All mock data MUST have isDemo: true

import type {
  HealthMeasurement,
  MovementEvent,
  Incident,
  Person,
  Device,
  EmergencyContact,
  MonitoringPreferences,
  AlertPreferences,
  Severity,
  IncidentStatus,
  DeviceStatus,
  MetricType,
  MovementEventType,
} from '@/types';
import { uuid } from '@/types';

// Helper to remove undefined values from object
function cleanObject<T extends object>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result as T;
}

const DEMO_PERSON_ID = 'person-demo-1';
const DEMO_CAREGIVER_ID = 'caregiver-demo-1';
const DEMO_BRACELET_ID = 'bracelet-demo-1';
const DEMO_ESP32_ID = 'esp32-demo-1';

const now = new Date();
const isoNow = now.toISOString();
const minutesAgo = (min: number) => new Date(now.getTime() - min * 60000).toISOString();
const hoursAgo = (hr: number) => new Date(now.getTime() - hr * 3600000).toISOString();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

export function createMockMeasurement(overrides: Partial<HealthMeasurement> = {}): HealthMeasurement {
  return cleanObject({
    id: uuid(),
    personId: DEMO_PERSON_ID,
    sourceDeviceId: DEMO_BRACELET_ID,
    metricType: overrides.metricType ?? ('heartRate' as const),
    value: 72,
    unit: 'BPM',
    measuredAt: isoNow,
    receivedAt: isoNow,
    signalQuality: overrides.signalQuality ?? ('good' as const),
    validityStatus: overrides.validityStatus ?? ('valid' as const),
    isDemo: true,
    ...overrides,
  });
}

export function createMockMeasurements(overrides: {
  heartRate?: number;
  spo2?: number;
  temperature?: number;
  systolicBP?: number;
  diastolicBP?: number;
  validityStatus?: HealthMeasurement['validityStatus'];
  minutesAgo?: number;
} = {}): HealthMeasurement[] {
  const baseTime = overrides.minutesAgo ? minutesAgo(overrides.minutesAgo) : isoNow;
  const measurements: HealthMeasurement[] = [];

  if (overrides.heartRate !== undefined) {
    measurements.push(createMockMeasurement({
      metricType: 'heartRate',
      value: overrides.heartRate,
      unit: 'BPM',
      measuredAt: baseTime,
      receivedAt: baseTime,
      validityStatus: overrides.validityStatus ?? 'valid',
    }));
  }

  if (overrides.spo2 !== undefined) {
    measurements.push(createMockMeasurement({
      metricType: 'spo2',
      value: overrides.spo2,
      unit: '%',
      measuredAt: baseTime,
      receivedAt: baseTime,
      validityStatus: overrides.validityStatus ?? 'valid',
    }));
  }

  if (overrides.temperature !== undefined) {
    measurements.push(createMockMeasurement({
      metricType: 'temperature',
      value: overrides.temperature,
      unit: '°C',
      measuredAt: baseTime,
      receivedAt: baseTime,
      validityStatus: overrides.validityStatus ?? 'valid',
    }));
  }

  if (overrides.systolicBP !== undefined) {
    measurements.push(createMockMeasurement({
      metricType: 'systolicBloodPressure',
      value: overrides.systolicBP,
      unit: 'mmHg',
      measuredAt: baseTime,
      receivedAt: baseTime,
      validityStatus: overrides.validityStatus ?? 'valid',
    }));
  }

  if (overrides.diastolicBP !== undefined) {
    measurements.push(createMockMeasurement({
      metricType: 'diastolicBloodPressure',
      value: overrides.diastolicBP,
      unit: 'mmHg',
      measuredAt: baseTime,
      receivedAt: baseTime,
      validityStatus: overrides.validityStatus ?? 'valid',
    }));
  }

  return measurements;
}

export function createMockMovementEvent(overrides: Partial<MovementEvent> = {}): MovementEvent {
  return cleanObject({
    id: uuid(),
    personId: DEMO_PERSON_ID,
    sourceDeviceId: DEMO_ESP32_ID,
    eventType: overrides.eventType ?? ('normalActivity' as const),
    occurredAt: isoNow,
    receivedAt: isoNow,
    acceleration: { x: 0.1, y: 0.2, z: 0.9 },
    orientation: { x: 0, y: 0, z: 0 },
    dataQuality: overrides.dataQuality ?? ('good' as const),
    isDemo: true,
    ...overrides,
  });
}

export function createMockMovementEvents(overrides: {
  type?: MovementEventType;
  fallConfidence?: number;
  inactivityDurationSeconds?: number;
  minutesAgo?: number;
  dataQuality?: MovementEvent['dataQuality'];
} = {}): MovementEvent[] {
  const baseTime = overrides.minutesAgo ? minutesAgo(overrides.minutesAgo) : isoNow;
  const events: MovementEvent[] = [];

  const eventType = overrides.type ?? 'normalActivity';
  const event = createMockMovementEvent({
    eventType,
    occurredAt: baseTime,
    receivedAt: baseTime,
    fallConfidence: overrides.fallConfidence,
    inactivityDurationSeconds: overrides.inactivityDurationSeconds,
    dataQuality: overrides.dataQuality ?? 'good',
  });
  events.push(event);

  return events;
}

export function createMockIncident(overrides: Partial<Incident> = {}): Incident {
  const severity = (overrides.severity ?? 'medium') as Severity;
  const status = (overrides.status ?? 'new') as IncidentStatus;

  return cleanObject({
    id: uuid(),
    personId: DEMO_PERSON_ID,
    severity,
    incidentType: 'suspectedFall',
    title: 'Suspected Fall Detected',
    explanation: 'Fall detected followed by period of inactivity',
    detectedAt: minutesAgo(5),
    updatedAt: minutesAgo(5),
    status,
    evidence: {
      measurements: createMockMeasurements({ heartRate: 85, spo2: 95 }),
      movementEvents: createMockMovementEvents({ type: 'suspectedFall', fallConfidence: 0.85 }),
    },
    confidence: 0.85,
    ruleTriggered: 'fall-inactivity',
    acknowledgedAt: status !== 'new' ? minutesAgo(3) : undefined,
    acknowledgedBy: status !== 'new' ? DEMO_CAREGIVER_ID : undefined,
    resolvedAt: status === 'resolved' ? minutesAgo(1) : undefined,
    resolvedBy: status === 'resolved' ? DEMO_CAREGIVER_ID : undefined,
    resolutionNote: status === 'resolved' ? 'Patient confirmed OK, false alarm' : undefined,
    escalationHistory: [],
    ...overrides,
  });
}

export function createMockPerson(overrides: Partial<Person> = {}): Person {
  const defaultPrefs: MonitoringPreferences = {
    inactivityThresholdMinutes: 30,
    heartRate: { min: 50, max: 100, criticalMin: 40, criticalMax: 130 },
    spo2: { min: 92, criticalMin: 88 },
    temperature: { min: 36.0, max: 37.5, criticalMin: 35.0, criticalMax: 39.0 },
    systolicBP: { min: 90, max: 140, criticalMin: 80, criticalMax: 180 },
    diastolicBP: { min: 60, max: 90, criticalMin: 50, criticalMax: 110 },
    fallConfidenceThreshold: 0.7,
    measurementStaleMinutes: 10,
    movementStaleMinutes: 15,
    alertPreferences: {
      lowRisk: { notify: false, channels: ['in-app'] },
      mediumRisk: { notify: true, channels: ['push', 'in-app'], responseDeadlineMinutes: 15 },
      highRisk: { notify: true, channels: ['push', 'sms', 'call', 'in-app'], immediateEscalation: true },
      deviceWarning: { notify: true, channels: ['push', 'in-app'] },
    },
  };

  return cleanObject({
    id: DEMO_PERSON_ID,
    name: 'Margaret Johnson',
    dateOfBirth: '1945-03-15',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Margaret',
    assignedCaregiverIds: [DEMO_CAREGIVER_ID],
    monitoringPreferences: defaultPrefs,
    createdAt: daysAgo(30),
    ...overrides,
  });
}

export function createMockDevice(overrides: Partial<Device> = {}): Device {
  return cleanObject({
    id: uuid(),
    personId: DEMO_PERSON_ID,
    deviceType: overrides.deviceType ?? ('bracelet' as const),
    name: 'Health Band Pro',
    connectionStatus: overrides.connectionStatus ?? ('online' as const),
    batteryLevel: 85,
    lastSeenAt: isoNow,
    supportedSensors: ['heartRate', 'spo2', 'temperature'],
    firmwareVersion: '2.1.4',
    isDemo: true,
    ...overrides,
  });
}

export function createMockEmergencyContact(overrides: Partial<EmergencyContact> = {}): EmergencyContact {
  return cleanObject({
    id: uuid(),
    personId: DEMO_PERSON_ID,
    name: 'Sarah Johnson',
    relationship: 'Daughter',
    phoneNumber: '+15551234567',
    email: 'sarah.johnson@email.com',
    priority: 1,
    preferredMethod: overrides.preferredMethod ?? ('push' as const),
    isEscalationContact: true,
    isDemo: true,
    ...overrides,
  });
}

// Pre-built scenario data for the 10 deterministic scenarios
export const SCENARIO_DATA = {
  // 1. Normal vitals + normal movement
  normal: {
    measurements: createMockMeasurements({ heartRate: 72, spo2: 98, temperature: 36.8 }),
    movementEvents: createMockMovementEvents({ type: 'normalActivity' }),
    expectedSeverity: 'low' as Severity,
  },

  // 2. Minor HR anomaly + normal movement
  minorAnomaly: {
    measurements: createMockMeasurements({ heartRate: 105, spo2: 97, temperature: 36.9 }),
    movementEvents: createMockMovementEvents({ type: 'normalActivity' }),
    expectedSeverity: 'low' as Severity,
  },

  // 3. Suspected fall -> movement resumes
  fallRecovered: {
    measurements: createMockMeasurements({ heartRate: 78, spo2: 97, temperature: 36.9 }),
    movementEvents: [
      ...createMockMovementEvents({ type: 'suspectedFall', fallConfidence: 0.85, minutesAgo: 10 }),
      ...createMockMovementEvents({ type: 'normalActivity', minutesAgo: 5 }),
    ],
    expectedSeverity: 'medium' as Severity,
  },

  // 4. Suspected fall -> prolonged inactivity
  fallThenInactivity: {
    measurements: createMockMeasurements({ heartRate: 75, spo2: 96, temperature: 36.8 }),
    movementEvents: [
      ...createMockMovementEvents({ type: 'suspectedFall', fallConfidence: 0.9, minutesAgo: 8 }),
      ...createMockMovementEvents({ type: 'prolongedInactivity', inactivityDurationSeconds: 1800, minutesAgo: 2 }),
    ],
    expectedSeverity: 'high' as Severity,
  },

  // 5. Abnormal vitals (low SpO2) + normal movement
  abnormalVitals: {
    measurements: createMockMeasurements({ heartRate: 88, spo2: 87, temperature: 37.2 }),
    movementEvents: createMockMovementEvents({ type: 'normalActivity' }),
    expectedSeverity: 'medium' as Severity,
  },

  // 6. Bracelet disconnected
  braceletDisconnected: {
    measurements: createMockMeasurements({ heartRate: 72, spo2: 98, validityStatus: 'invalid' }),
    movementEvents: createMockMovementEvents({ type: 'normalActivity' }),
    expectedSeverity: 'device-warning' as Severity,
  },

  // 7. ESP32 offline
  esp32Offline: {
    measurements: createMockMeasurements({ heartRate: 72, spo2: 98, temperature: 36.8 }),
    movementEvents: createMockMovementEvents({ type: 'deviceDisconnected', dataQuality: 'poor', minutesAgo: 20 }),
    expectedSeverity: 'device-warning' as Severity,
  },

  // 8. Stale measurements (>10min)
  staleMeasurements: {
    measurements: createMockMeasurements({ heartRate: 72, spo2: 98, temperature: 36.8, minutesAgo: 20 }),
    movementEvents: createMockMovementEvents({ type: 'normalActivity' }),
    expectedSeverity: 'device-warning' as Severity,
  },

  // 9. Notification delivery failure (simulated via escalation history)
  notificationFailure: {
    measurements: createMockMeasurements({ heartRate: 78, spo2: 97, temperature: 36.9 }),
    movementEvents: [
      ...createMockMovementEvents({ type: 'suspectedFall', fallConfidence: 0.85, minutesAgo: 8 }),
      ...createMockMovementEvents({ type: 'normalActivity', minutesAgo: 2 }),
    ],
    expectedSeverity: 'medium' as Severity,
  },

  // 10. Fall + inactivity + abnormal vitals
  fallInactivityAbnormalVitals: {
    measurements: createMockMeasurements({ heartRate: 135, spo2: 86, temperature: 38.2 }),
    movementEvents: [
      ...createMockMovementEvents({ type: 'suspectedFall', fallConfidence: 0.92, minutesAgo: 8 }),
      ...createMockMovementEvents({ type: 'prolongedInactivity', inactivityDurationSeconds: 2400, minutesAgo: 2 }),
    ],
    expectedSeverity: 'high' as Severity,
  },
};

// Demo data arrays
export const mockPeople: Person[] = [createMockPerson()];

export const mockDevices: Device[] = [
  createMockDevice({ id: DEMO_BRACELET_ID, deviceType: 'bracelet', name: 'Health Band Pro' }),
  createMockDevice({ id: DEMO_ESP32_ID, deviceType: 'esp32', name: 'Fall Detection Sensor' }),
];

export const mockEmergencyContacts: EmergencyContact[] = [
  createMockEmergencyContact({ priority: 1, name: 'Sarah Johnson', relationship: 'Daughter' }),
  createMockEmergencyContact({ priority: 2, name: 'Dr. Michael Chen', relationship: 'Primary Care Physician', isEscalationContact: false }),
  createMockEmergencyContact({ priority: 3, name: 'Emergency Services', relationship: '911', phoneNumber: '911', preferredMethod: 'call', isEscalationContact: true }),
];

export const mockIncidents: Incident[] = [
  createMockIncident({ severity: 'high', status: 'acknowledged', title: 'Fall + Inactivity + Abnormal Vitals', ruleTriggered: 'fall-inactivity-abnormal-vitals', detectedAt: minutesAgo(45) }),
  createMockIncident({ severity: 'medium', status: 'new', title: 'Suspected Fall - Movement Resumed', ruleTriggered: 'fall-recovered', detectedAt: minutesAgo(120) }),
  createMockIncident({ severity: 'low', status: 'resolved', title: 'Minor Heart Rate Anomaly', ruleTriggered: 'minor-vital-anomaly', detectedAt: hoursAgo(3) }),
  createMockIncident({ severity: 'device-warning', status: 'new', title: 'Bracelet Connection Lost', ruleTriggered: 'bracelet-offline', detectedAt: minutesAgo(8) }),
];

// Historical measurements for charts
export function generateHistoricalMeasurements(hours: number = 24): HealthMeasurement[] {
  const measurements: HealthMeasurement[] = [];
  const baseHR = 70;
  const baseSpO2 = 98;
  const baseTemp = 36.8;

  for (let i = hours * 2; i >= 0; i--) {
    const time = minutesAgo(i * 30);
    const hrVariation = (Math.random() - 0.5) * 10;
    const spo2Variation = (Math.random() - 0.5) * 2;
    const tempVariation = (Math.random() - 0.5) * 0.5;

    measurements.push(
      createMockMeasurement({
        metricType: 'heartRate',
        value: Math.round(baseHR + hrVariation),
        measuredAt: time,
        receivedAt: time,
      }),
      createMockMeasurement({
        metricType: 'spo2',
        value: Math.max(90, Math.min(100, Math.round(baseSpO2 + spo2Variation))),
        measuredAt: time,
        receivedAt: time,
      }),
      createMockMeasurement({
        metricType: 'temperature',
        value: Math.round((baseTemp + tempVariation) * 10) / 10,
        measuredAt: time,
        receivedAt: time,
      })
    );
  }

  return measurements;
}