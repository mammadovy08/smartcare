// Risk Assessment Rules
// Deterministic, configurable rules for Phase 1
// Each rule represents a clinical scenario

import type { Rule, RiskInput, PersonSettings, Severity } from './types';
import { getSettings } from './types';
import type { HealthMeasurement, MovementEvent } from '@/types';

// Utility functions
function minutesSince(isoString: string, now: string): number {
  return (new Date(now).getTime() - new Date(isoString).getTime()) / 60000;
}

function isMeasurementValid(m: HealthMeasurement, settings: PersonSettings, now: string): boolean {
  if (m.validityStatus !== 'valid') return false;
  if (m.signalQuality === 'poor') return false;
  return minutesSince(m.measuredAt, now) <= settings.measurementStaleMinutes;
}

function isMovementValid(e: MovementEvent, settings: PersonSettings, now: string): boolean {
  if (e.dataQuality === 'poor') return false;
  return minutesSince(e.occurredAt, now) <= settings.movementStaleMinutes;
}

function getLatestMeasurement(
  measurements: HealthMeasurement[],
  type: HealthMeasurement['metricType'],
  settings: PersonSettings,
  now: string
): HealthMeasurement | null {
  const valid = measurements
    .filter(m => m.metricType === type && isMeasurementValid(m, settings, now))
    .sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime());
  return valid[0] || null;
}

function isAbnormalVital(m: HealthMeasurement, settings: PersonSettings): boolean {
  switch (m.metricType) {
    case 'heartRate':
      return m.value < settings.heartRate.min || m.value > settings.heartRate.max;
    case 'spo2':
      return m.value < settings.spo2.min;
    case 'temperature':
      return m.value < settings.temperature.min || m.value > settings.temperature.max;
    case 'systolicBloodPressure':
      return m.value < settings.systolicBP.min || m.value > settings.systolicBP.max;
    case 'diastolicBloodPressure':
      return m.value < settings.diastolicBP.min || m.value > settings.diastolicBP.max;
    default:
      return false;
  }
}

function isCriticalVital(m: HealthMeasurement, settings: PersonSettings): boolean {
  switch (m.metricType) {
    case 'heartRate':
      return m.value < settings.heartRate.criticalMin || m.value > settings.heartRate.criticalMax;
    case 'spo2':
      return m.value < settings.spo2.criticalMin;
    case 'temperature':
      return m.value < settings.temperature.criticalMin || m.value > settings.temperature.criticalMax;
    case 'systolicBloodPressure':
      return m.value < settings.systolicBP.criticalMin || m.value > settings.systolicBP.criticalMax;
    case 'diastolicBloodPressure':
      return m.value < settings.diastolicBP.criticalMin || m.value > settings.diastolicBP.criticalMax;
    default:
      return false;
  }
}

function hasAbnormalVitals(measurements: HealthMeasurement[], settings: PersonSettings, now: string): boolean {
  return measurements.some(m => isMeasurementValid(m, settings, now) && isAbnormalVital(m, settings));
}

function hasCriticalVitals(measurements: HealthMeasurement[], settings: PersonSettings, now: string): boolean {
  return measurements.some(m => isMeasurementValid(m, settings, now) && isCriticalVital(m, settings));
}

function getFallEvent(events: MovementEvent[], settings: PersonSettings, now: string): MovementEvent | null {
  const falls = events.filter(
    e => e.eventType === 'suspectedFall' &&
         isMovementValid(e, settings, now) &&
         (e.fallConfidence ?? 0) >= settings.fallConfidenceThreshold
  );
  return falls.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())[0] || null;
}

function getInactivityEvent(events: MovementEvent[], settings: PersonSettings, now: string): MovementEvent | null {
  const inactivities = events.filter(
    e => e.eventType === 'prolongedInactivity' && isMovementValid(e, settings, now)
  );
  return inactivities.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())[0] || null;
}

function getPostFallInactivity(events: MovementEvent[], settings: PersonSettings, now: string): MovementEvent | null {
  const postFalls = events.filter(
    e => e.eventType === 'postFallInactivity' && isMovementValid(e, settings, now)
  );
  return postFalls.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())[0] || null;
}

function isBraceletOnline(measurements: HealthMeasurement[], settings: PersonSettings, now: string): boolean {
  const braceletMeasurements = measurements.filter(m => m.sourceDeviceId.includes('bracelet'));
  return braceletMeasurements.some(m => isMeasurementValid(m, settings, now));
}

function isESP32Online(events: MovementEvent[], settings: PersonSettings, now: string): boolean {
  const esp32Events = events.filter(e => e.sourceDeviceId.includes('esp32'));
  return esp32Events.some(e => isMovementValid(e, settings, now));
}

// Rule 1: Normal monitoring - all clear
export const normalMonitoringRule: Rule = {
  id: 'normal-monitoring',
  name: 'Normal Monitoring',
  severity: 'low',
  condition: (input: RiskInput) => {
    const settings = getSettings(input.person);
    const hasValidMeasurements = input.measurements.some(m => isMeasurementValid(m, settings, input.now));
    const hasValidMovement = input.movementEvents.some(e => isMovementValid(e, settings, input.now));
    const noAbnormalVitals = !hasAbnormalVitals(input.measurements, settings, input.now);
    const noFalls = !getFallEvent(input.movementEvents, settings, input.now);
    const noInactivity = !getInactivityEvent(input.movementEvents, settings, input.now);
    return hasValidMeasurements && hasValidMovement && noAbnormalVitals && noFalls && noInactivity;
  },
  explanation: () => 'All measurements within normal ranges. No concerning movement patterns detected.',
  incidentType: 'normal-monitoring',
  confidence: 1.0,
  deduplicationWindowMinutes: 60,
};

// Rule 2: Minor isolated vital anomaly
export const minorVitalAnomalyRule: Rule = {
  id: 'minor-vital-anomaly',
  name: 'Minor Vital Sign Anomaly',
  severity: 'low',
  condition: (input: RiskInput) => {
    const settings = getSettings(input.person);
    const hasAbnormal = hasAbnormalVitals(input.measurements, settings, input.now);
    const hasCritical = hasCriticalVitals(input.measurements, settings, input.now);
    const noFalls = !getFallEvent(input.movementEvents, settings, input.now);
    const noInactivity = !getInactivityEvent(input.movementEvents, settings, input.now);
    return hasAbnormal && !hasCritical && noFalls && noInactivity;
  },
  explanation: (input) => {
    const settings = getSettings(input.person);
    const abnormal = input.measurements.filter(m => isMeasurementValid(m, settings, input.now) && isAbnormalVital(m, settings));
    return `Minor vital sign anomaly detected: ${abnormal.map(m => `${m.metricType}=${m.value}${m.unit}`).join(', ')}. No falls or inactivity detected.`;
  },
  incidentType: 'minor-vital-anomaly',
  confidence: 0.6,
  deduplicationWindowMinutes: 30,
};

// Rule 3: Abnormal vitals without movement concern
export const abnormalVitalsRule: Rule = {
  id: 'critical-vitals',
  name: 'Abnormal Vital Signs',
  severity: 'medium',
  condition: (input: RiskInput) => {
    const settings = getSettings(input.person);
    const hasCritical = hasCriticalVitals(input.measurements, settings, input.now);
    const noFalls = !getFallEvent(input.movementEvents, settings, input.now);
    const noInactivity = !getInactivityEvent(input.movementEvents, settings, input.now);
    return hasCritical && noFalls && noInactivity;
  },
  explanation: (input) => {
    const settings = getSettings(input.person);
    const critical = input.measurements.filter(m => isMeasurementValid(m, settings, input.now) && isCriticalVital(m, settings));
    return `Critical vital sign threshold exceeded: ${critical.map(m => `${m.metricType}=${m.value}${m.unit}`).join(', ')}. No falls or inactivity detected.`;
  },
  incidentType: 'critical-vitals',
  confidence: 0.85,
  deduplicationWindowMinutes: 15,
};

// Rule 4: Suspected fall with movement recovery
export const fallWithRecoveryRule: Rule = {
  id: 'fall-recovered',
  name: 'Suspected Fall - Movement Resumed',
  severity: 'medium',
  condition: (input: RiskInput) => {
    const settings = getSettings(input.person);
    const fall = getFallEvent(input.movementEvents, settings, input.now);
    const inactivity = getInactivityEvent(input.movementEvents, settings, input.now);
    const postFall = getPostFallInactivity(input.movementEvents, settings, input.now);
    const noAbnormalVitals = !hasAbnormalVitals(input.measurements, settings, input.now);
    return !!fall && !inactivity && !postFall && noAbnormalVitals;
  },
  explanation: (input) => {
    const settings = getSettings(input.person);
    const fall = getFallEvent(input.movementEvents, settings, input.now);
    return `Suspected fall detected (confidence: ${fall?.fallConfidence?.toFixed(2) ?? 'N/A'}). Subsequent movement detected - person appears to have recovered.`;
  },
  incidentType: 'fall-recovered',
  confidence: 0.75,
  deduplicationWindowMinutes: 30,
};

// Rule 5: Fall followed by prolonged inactivity
export const fallWithInactivityRule: Rule = {
  id: 'fall-inactivity',
  name: 'Fall Followed by Prolonged Inactivity',
  severity: 'high',
  condition: (input: RiskInput) => {
    const settings = getSettings(input.person);
    const fall = getFallEvent(input.movementEvents, settings, input.now);
    const inactivity = getInactivityEvent(input.movementEvents, settings, input.now);
    const postFall = getPostFallInactivity(input.movementEvents, settings, input.now);
    const noAbnormalVitals = !hasAbnormalVitals(input.measurements, settings, input.now);
    return !!fall && (!!inactivity || !!postFall) && noAbnormalVitals;
  },
  explanation: (input) => {
    const settings = getSettings(input.person);
    const fall = getFallEvent(input.movementEvents, settings, input.now);
    const inactivity = getInactivityEvent(input.movementEvents, settings, input.now) || getPostFallInactivity(input.movementEvents, settings, input.now);
    return `Suspected fall detected (confidence: ${fall?.fallConfidence?.toFixed(2) ?? 'N/A'}) followed by ${inactivity?.inactivityDurationSeconds ? `${Math.round(inactivity.inactivityDurationSeconds / 60)}min` : 'prolonged'} inactivity. Person may be unresponsive.`;
  },
  incidentType: 'fall-with-inactivity',
  confidence: 0.9,
  deduplicationWindowMinutes: 15,
};

// Rule 6: Fall + inactivity + abnormal vitals (highest priority)
export const fallInactivityAbnormalVitalsRule: Rule = {
  id: 'fall-inactivity-abnormal-vitals',
  name: 'Fall + Inactivity + Abnormal Vitals',
  severity: 'high',
  condition: (input: RiskInput) => {
    const settings = getSettings(input.person);
    const fall = getFallEvent(input.movementEvents, settings, input.now);
    const inactivity = getInactivityEvent(input.movementEvents, settings, input.now);
    const postFall = getPostFallInactivity(input.movementEvents, settings, input.now);
    const hasAbnormal = hasAbnormalVitals(input.measurements, settings, input.now);
    return !!fall && (!!inactivity || !!postFall) && hasAbnormal;
  },
  explanation: (input) => {
    const settings = getSettings(input.person);
    const fall = getFallEvent(input.movementEvents, settings, input.now);
    const inactivity = getInactivityEvent(input.movementEvents, settings, input.now) || getPostFallInactivity(input.movementEvents, settings, input.now);
    const abnormal = input.measurements.filter(m => isMeasurementValid(m, settings, input.now) && isAbnormalVital(m, settings));
    return `Suspected fall (confidence: ${fall?.fallConfidence?.toFixed(2) ?? 'N/A'}) followed by ${inactivity?.inactivityDurationSeconds ? `${Math.round(inactivity.inactivityDurationSeconds / 60)}min` : 'prolonged'} inactivity. Abnormal vitals: ${abnormal.map(m => `${m.metricType}=${m.value}${m.unit}`).join(', ')}.`;
  },
  incidentType: 'fall-inactivity-abnormal-vitals',
  confidence: 0.95,
  deduplicationWindowMinutes: 10,
};

// Rule 7: Stale measurements (checked before complete offline)
export const staleMeasurementsRule: Rule = {
  id: 'device-stale-measurements',
  name: 'Stale Health Measurements',
  severity: 'device-warning',
  condition: (input: RiskInput) => {
    const settings = getSettings(input.person);
    const braceletMeasurements = input.measurements.filter(m => m.sourceDeviceId.includes('bracelet'));
    if (braceletMeasurements.length === 0) return false;
    const hasValidStatus = braceletMeasurements.some(m => m.validityStatus === 'valid' && m.signalQuality !== 'poor');
    if (!hasValidStatus) return false;
    const hasFresh = braceletMeasurements.some(m => isMeasurementValid(m, settings, input.now));
    return !hasFresh;
  },
  explanation: () => 'Health bracelet data is stale. Recent measurements are older than the configured threshold.',
  incidentType: 'device-stale-measurements',
  confidence: 0.9,
  deduplicationWindowMinutes: 10,
};

// Rule 8: Bracelet offline
export const braceletOfflineRule: Rule = {
  id: 'device-bracelet-offline',
  name: 'Health Bracelet Offline',
  severity: 'device-warning',
  condition: (input: RiskInput) => {
    const settings = getSettings(input.person);
    return !isBraceletOnline(input.measurements, settings, input.now);
  },
  explanation: () => 'Health bracelet has not reported valid measurements in the configured time window. Health status cannot be verified.',
  incidentType: 'device-bracelet-offline',
  confidence: 1.0,
  deduplicationWindowMinutes: 5,
};

// Rule 9: ESP32 offline
export const esp32OfflineRule: Rule = {
  id: 'device-esp32-offline',
  name: 'Movement Sensor Offline',
  severity: 'device-warning',
  condition: (input: RiskInput) => {
    const settings = getSettings(input.person);
    return !isESP32Online(input.movementEvents, settings, input.now);
  },
  explanation: () => 'Movement sensor (ESP32) has not reported valid data in the configured time window. Fall detection unavailable.',
  incidentType: 'device-esp32-offline',
  confidence: 1.0,
  deduplicationWindowMinutes: 5,
};

// Rule 10: Unusual movement pattern
export const unusualMovementRule: Rule = {
  id: 'unusual-movement',
  name: 'Unusual Movement Pattern',
  severity: 'medium',
  condition: (input: RiskInput) => {
    const settings = getSettings(input.person);
    const unusual = input.movementEvents.find(
      e => e.eventType === 'unusualMovement' && isMovementValid(e, settings, input.now)
    );
    const noFalls = !getFallEvent(input.movementEvents, settings, input.now);
    const noInactivity = !getInactivityEvent(input.movementEvents, settings, input.now);
    return !!unusual && noFalls && noInactivity;
  },
  explanation: () => 'Unusual movement pattern detected that differs from normal activity. No fall or prolonged inactivity detected.',
  incidentType: 'unusual-movement',
  confidence: 0.7,
  deduplicationWindowMinutes: 30,
};

// All rules ordered by severity priority (high → medium → low → device-warning)
export const RULES: Rule[] = [
  fallInactivityAbnormalVitalsRule,  // high
  fallWithInactivityRule,             // high
  abnormalVitalsRule,                 // medium
  fallWithRecoveryRule,               // medium
  unusualMovementRule,                // medium
  minorVitalAnomalyRule,              // low
  normalMonitoringRule,               // low
  staleMeasurementsRule,              // device-warning (stale data from existing device)
  braceletOfflineRule,                // device-warning (device disconnected/absent)
  esp32OfflineRule,                   // device-warning (sensor hub disconnected)
];

export function severityPriority(severity: Severity): number {
  return { high: 4, medium: 3, low: 2, 'device-warning': 1 }[severity];
}