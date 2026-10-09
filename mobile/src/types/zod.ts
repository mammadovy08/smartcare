// Zod Schemas for Runtime Validation
// Single source of truth for validation

import { z } from 'zod';

// Branded UUID
const UUIDSchema = z.string().uuid();

// Base schemas
const ISODateTimeSchema = z.string().datetime({ offset: true });

// HealthMeasurement
export const HealthMeasurementSchema = z.object({
  id: UUIDSchema,
  personId: UUIDSchema,
  sourceDeviceId: UUIDSchema,
  metricType: z.enum(['heartRate', 'spo2', 'temperature', 'systolicBloodPressure', 'diastolicBloodPressure']),
  value: z.number().finite(),
  unit: z.string(),
  measuredAt: ISODateTimeSchema,
  receivedAt: ISODateTimeSchema,
  signalQuality: z.enum(['good', 'fair', 'poor']),
  validityStatus: z.enum(['valid', 'stale', 'invalid']),
  isDemo: z.boolean(),
});

export type HealthMeasurement = z.infer<typeof HealthMeasurementSchema>;

// MovementEvent
export const MovementEventSchema = z.object({
  id: UUIDSchema,
  personId: UUIDSchema,
  sourceDeviceId: UUIDSchema,
  eventType: z.enum([
    'normalActivity',
    'suspectedFall',
    'prolongedInactivity',
    'postFallInactivity',
    'unusualMovement',
    'deviceDisconnected',
    'sensorError',
  ]),
  occurredAt: ISODateTimeSchema,
  receivedAt: ISODateTimeSchema,
  acceleration: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
  orientation: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
  fallConfidence: z.number().min(0).max(1).optional(),
  inactivityDurationSeconds: z.number().int().positive().optional(),
  dataQuality: z.enum(['good', 'fair', 'poor']),
  isDemo: z.boolean(),
});

export type MovementEvent = z.infer<typeof MovementEventSchema>;

// Incident Evidence
export const IncidentEvidenceSchema = z.object({
  measurements: z.array(HealthMeasurementSchema),
  movementEvents: z.array(MovementEventSchema),
});

// Escalation Record
export const EscalationRecordSchema = z.object({
  contactId: UUIDSchema,
  contactName: z.string(),
  channel: z.enum(['push', 'sms', 'call', 'in-app']),
  attemptedAt: ISODateTimeSchema,
  deliveryStatus: z.enum(['pending', 'delivered', 'failed', 'acknowledged']),
  acknowledgedAt: ISODateTimeSchema.optional(),
  errorMessage: z.string().optional(),
});

// Incident
export const IncidentSchema = z.object({
  id: UUIDSchema,
  personId: UUIDSchema,
  severity: z.enum(['low', 'medium', 'high', 'device-warning']),
  incidentType: z.string(),
  title: z.string(),
  explanation: z.string(),
  detectedAt: ISODateTimeSchema,
  updatedAt: ISODateTimeSchema,
  status: z.enum(['new', 'acknowledged', 'resolved', 'escalated']),
  evidence: IncidentEvidenceSchema,
  confidence: z.number().min(0).max(1),
  ruleTriggered: z.string(),
  acknowledgedAt: ISODateTimeSchema.optional(),
  acknowledgedBy: UUIDSchema.optional(),
  resolvedAt: ISODateTimeSchema.optional(),
  resolvedBy: UUIDSchema.optional(),
  resolutionNote: z.string().optional(),
  escalationHistory: z.array(EscalationRecordSchema).optional(),
});

export type Incident = z.infer<typeof IncidentSchema>;

// Monitoring Preferences
export const VitalThresholdSchema = z.object({
  min: z.number(),
  max: z.number(),
  criticalMin: z.number(),
  criticalMax: z.number(),
});

export const Spo2ThresholdSchema = z.object({
  min: z.number(),
  criticalMin: z.number(),
});

export const AlertPreferencesSchema = z.object({
  lowRisk: z.object({
    notify: z.boolean(),
    channels: z.array(z.enum(['push', 'in-app'])),
  }),
  mediumRisk: z.object({
    notify: z.boolean(),
    channels: z.array(z.enum(['push', 'sms', 'call', 'in-app'])),
    responseDeadlineMinutes: z.number().int().positive(),
  }),
  highRisk: z.object({
    notify: z.boolean(),
    channels: z.array(z.enum(['push', 'sms', 'call', 'in-app'])),
    immediateEscalation: z.boolean(),
  }),
  deviceWarning: z.object({
    notify: z.boolean(),
    channels: z.array(z.enum(['push', 'in-app'])),
  }),
});

export type AlertPreferences = z.infer<typeof AlertPreferencesSchema>;

export const MonitoringPreferencesSchema = z.object({
  inactivityThresholdMinutes: z.number().int().positive(),
  heartRate: VitalThresholdSchema,
  spo2: Spo2ThresholdSchema,
  temperature: VitalThresholdSchema,
  systolicBP: VitalThresholdSchema,
  diastolicBP: VitalThresholdSchema,
  fallConfidenceThreshold: z.number().min(0).max(1),
  measurementStaleMinutes: z.number().int().positive(),
  movementStaleMinutes: z.number().int().positive(),
  alertPreferences: AlertPreferencesSchema,
});

export type MonitoringPreferences = z.infer<typeof MonitoringPreferencesSchema>;

// Person
export const PersonSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1),
  dateOfBirth: ISODateTimeSchema.optional(),
  avatar: z.string().url().optional(),
  assignedCaregiverIds: z.array(UUIDSchema),
  monitoringPreferences: MonitoringPreferencesSchema,
  createdAt: ISODateTimeSchema,
});

export type Person = z.infer<typeof PersonSchema>;

// Device
export const DeviceSchema = z.object({
  id: UUIDSchema,
  personId: UUIDSchema,
  deviceType: z.enum(['bracelet', 'esp32']),
  name: z.string(),
  connectionStatus: z.enum(['online', 'stale', 'offline', 'error']),
  batteryLevel: z.number().min(0).max(100).optional(),
  lastSeenAt: ISODateTimeSchema,
  supportedSensors: z.array(z.string()),
  firmwareVersion: z.string().optional(),
  isDemo: z.boolean(),
});

export type Device = z.infer<typeof DeviceSchema>;

// Emergency Contact
export const EmergencyContactSchema = z.object({
  id: UUIDSchema,
  personId: UUIDSchema,
  name: z.string().min(1),
  relationship: z.string(),
  phoneNumber: z.string().min(10),
  email: z.string().email().optional(),
  priority: z.number().int().positive(),
  preferredMethod: z.enum(['push', 'sms', 'call']),
  isEscalationContact: z.boolean(),
  isDemo: z.boolean(),
});

export type EmergencyContact = z.infer<typeof EmergencyContactSchema>;

// Time Range
export const TimeRangeSchema = z.object({
  start: ISODateTimeSchema,
  end: ISODateTimeSchema,
});

export type TimeRange = z.infer<typeof TimeRangeSchema>;

// Incident Filters
export const IncidentFiltersSchema = z.object({
  personId: UUIDSchema.optional(),
  severity: z.array(z.enum(['low', 'medium', 'high', 'device-warning'])).optional(),
  status: z.array(z.enum(['new', 'acknowledged', 'resolved', 'escalated'])).optional(),
  dateRange: TimeRangeSchema.optional(),
  incidentType: z.array(z.string()).optional(),
});

export type IncidentFilters = z.infer<typeof IncidentFiltersSchema>;

// Validation helpers
export function validateHealthMeasurement(data: unknown): HealthMeasurement {
  return HealthMeasurementSchema.parse(data);
}

export function validateMovementEvent(data: unknown): MovementEvent {
  return MovementEventSchema.parse(data);
}

export function validateIncident(data: unknown): Incident {
  return IncidentSchema.parse(data);
}

export function validatePerson(data: unknown): Person {
  return PersonSchema.parse(data);
}

export function validateDevice(data: unknown): Device {
  return DeviceSchema.parse(data);
}

export function validateEmergencyContact(data: unknown): EmergencyContact {
  return EmergencyContactSchema.parse(data);
}

export function validateTimeRange(data: unknown): TimeRange {
  return TimeRangeSchema.parse(data);
}

export function validateIncidentFilters(data: unknown): IncidentFilters {
  return IncidentFiltersSchema.parse(data);
}

// Safe parsers (return result instead of throwing)
export function safeParseHealthMeasurement(data: unknown) {
  return HealthMeasurementSchema.safeParse(data);
}

export function safeParseMovementEvent(data: unknown) {
  return MovementEventSchema.safeParse(data);
}

export function safeParseIncident(data: unknown) {
  return IncidentSchema.safeParse(data);
}