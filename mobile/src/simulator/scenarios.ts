// Simulator Scenarios
// 10 Deterministic scenarios for testing and demo

import type { RiskInput } from '@/engine/types';
import type { Person, Severity } from '@/types';
import { SCENARIO_DATA } from '@/mock/factories';

export type ScenarioId = keyof typeof SCENARIO_DATA;

export interface Scenario {
  id: ScenarioId;
  name: string;
  description: string;
  severity: Severity;
  ruleTriggered: string;
  buildInput: (person: Person, now: string) => RiskInput;
}

function createScenarioInput(
  person: Person,
  now: string,
  measurements: typeof SCENARIO_DATA.normal.measurements,
  movementEvents: typeof SCENARIO_DATA.normal.movementEvents
): RiskInput {
  return {
    person,
    measurements,
    movementEvents,
    now,
  };
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'normal',
    name: 'Normal Monitoring',
    description: 'All vitals normal, normal movement activity',
    severity: 'low',
    ruleTriggered: 'normal-monitoring',
    buildInput: (person, now) => createScenarioInput(person, now, SCENARIO_DATA.normal.measurements, SCENARIO_DATA.normal.movementEvents),
  },
  {
    id: 'minorAnomaly',
    name: 'Minor Vital Anomaly',
    description: 'Slightly elevated heart rate, otherwise normal',
    severity: 'low',
    ruleTriggered: 'minor-vital-anomaly',
    buildInput: (person, now) => createScenarioInput(person, now, SCENARIO_DATA.minorAnomaly.measurements, SCENARIO_DATA.minorAnomaly.movementEvents),
  },
  {
    id: 'fallRecovered',
    name: 'Fall - Movement Resumed',
    description: 'Suspected fall detected, but person moved afterward',
    severity: 'medium',
    ruleTriggered: 'fall-recovered',
    buildInput: (person, now) => createScenarioInput(person, now, SCENARIO_DATA.fallRecovered.measurements, SCENARIO_DATA.fallRecovered.movementEvents),
  },
  {
    id: 'fallThenInactivity',
    name: 'Fall + Prolonged Inactivity',
    description: 'Fall detected followed by 30+ minutes of no movement',
    severity: 'high',
    ruleTriggered: 'fall-inactivity',
    buildInput: (person, now) => createScenarioInput(person, now, SCENARIO_DATA.fallThenInactivity.measurements, SCENARIO_DATA.fallThenInactivity.movementEvents),
  },
  {
    id: 'abnormalVitals',
    name: 'Abnormal Vital Signs',
    description: 'Low SpO2 and elevated temperature, normal movement',
    severity: 'medium',
    ruleTriggered: 'critical-vitals',
    buildInput: (person, now) => createScenarioInput(person, now, SCENARIO_DATA.abnormalVitals.measurements, SCENARIO_DATA.abnormalVitals.movementEvents),
  },
  {
    id: 'braceletDisconnected',
    name: 'Bracelet Disconnected',
    description: 'Health bracelet offline - invalid measurements',
    severity: 'device-warning',
    ruleTriggered: 'device-bracelet-offline',
    buildInput: (person, now) => createScenarioInput(person, now, SCENARIO_DATA.braceletDisconnected.measurements, SCENARIO_DATA.braceletDisconnected.movementEvents),
  },
  {
    id: 'esp32Offline',
    name: 'Movement Sensor Offline',
    description: 'ESP32 sensor disconnected - no fall detection',
    severity: 'device-warning',
    ruleTriggered: 'device-esp32-offline',
    buildInput: (person, now) => createScenarioInput(person, now, SCENARIO_DATA.esp32Offline.measurements, SCENARIO_DATA.esp32Offline.movementEvents),
  },
  {
    id: 'staleMeasurements',
    name: 'Stale Measurements',
    description: 'Bracelet data older than 10 minutes',
    severity: 'device-warning',
    ruleTriggered: 'device-stale-measurements',
    buildInput: (person, now) => createScenarioInput(person, now, SCENARIO_DATA.staleMeasurements.measurements, SCENARIO_DATA.staleMeasurements.movementEvents),
  },
  {
    id: 'notificationFailure',
    name: 'Notification Delivery Failure',
    description: 'Escalation triggered but notification failed',
    severity: 'medium',
    ruleTriggered: 'fall-recovered',
    buildInput: (person, now) => createScenarioInput(person, now, SCENARIO_DATA.notificationFailure.measurements, SCENARIO_DATA.notificationFailure.movementEvents),
  },
  {
    id: 'fallInactivityAbnormalVitals',
    name: 'Fall + Inactivity + Abnormal Vitals',
    description: 'Fall, prolonged inactivity, AND critical vital signs',
    severity: 'high',
    ruleTriggered: 'fall-inactivity-abnormal-vitals',
    buildInput: (person, now) => createScenarioInput(person, now, SCENARIO_DATA.fallInactivityAbnormalVitals.measurements, SCENARIO_DATA.fallInactivityAbnormalVitals.movementEvents),
  },
];

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find(s => s.id === id);
}

export function getAllScenarios(): Scenario[] {
  return SCENARIOS;
}