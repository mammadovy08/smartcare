// Risk Engine Types
// Input/output types for the pure risk assessment function

import type {
  HealthMeasurement,
  MovementEvent,
  Person,
  Severity,
  Incident,
} from '@/types';

// Re-export Severity for consumers
export type { Severity };

export interface RiskInput {
  person: Person;
  measurements: HealthMeasurement[];
  movementEvents: MovementEvent[];
  now: string; // ISO 8601 - injected for testability
}

export interface RiskOutput {
  severity: Severity;
  incidentType: string;
  title: string;
  explanation: string;
  evidence: {
    measurements: HealthMeasurement[];
    movementEvents: MovementEvent[];
  };
  confidence: number; // 0-1
  ruleTriggered: string;
  incidentId: string | undefined; // For deduplication
  isDuplicate: boolean;
}

export interface Rule {
  id: string;
  name: string;
  severity: Severity;
  condition: (input: RiskInput) => boolean;
  explanation: (input: RiskInput) => string;
  incidentType: string;
  confidence: number;
  deduplicationWindowMinutes: number;
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

export const DEFAULT_PERSON_SETTINGS: PersonSettings = {
  inactivityThresholdMinutes: 30,
  heartRate: { min: 50, max: 100, criticalMin: 40, criticalMax: 130 },
  spo2: { min: 92, criticalMin: 88 },
  temperature: { min: 36.0, max: 37.5, criticalMin: 35.0, criticalMax: 39.0 },
  systolicBP: { min: 90, max: 140, criticalMin: 80, criticalMax: 180 },
  diastolicBP: { min: 60, max: 90, criticalMin: 50, criticalMax: 110 },
  fallConfidenceThreshold: 0.7,
  measurementStaleMinutes: 10,
  movementStaleMinutes: 15,
};

export function getSettings(person: Person): PersonSettings {
  const prefs = person.monitoringPreferences;
  return {
    inactivityThresholdMinutes: prefs.inactivityThresholdMinutes,
    heartRate: prefs.heartRate,
    spo2: prefs.spo2,
    temperature: prefs.temperature,
    systolicBP: prefs.systolicBP,
    diastolicBP: prefs.diastolicBP,
    fallConfidenceThreshold: prefs.fallConfidenceThreshold,
    measurementStaleMinutes: prefs.measurementStaleMinutes,
    movementStaleMinutes: prefs.movementStaleMinutes,
  };
}