import type {
  HealthMeasurement,
  MovementEvent,
  Person,
  PersonSettings,
  Severity,
  Incident,
} from './types.js';

export interface RiskInput {
  person: Person;
  measurements: HealthMeasurement[];
  movementEvents: MovementEvent[];
  now: string;
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
  confidence: number;
  ruleTriggered: string;
  isDuplicate: boolean;
}

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

function isCriticalVital(m: HealthMeasurement, settings: PersonSettings): boolean {
  switch (m.metricType) {
    case 'heartRate':
      return m.value < settings.heartRate.criticalMin || m.value > settings.heartRate.criticalMax;
    case 'spo2':
      return m.value < settings.spo2.criticalMin;
    case 'temperature':
      return m.value < settings.temperature.criticalMin || m.value > settings.temperature.criticalMax;
    default:
      return false;
  }
}

function isAbnormalVital(m: HealthMeasurement, settings: PersonSettings): boolean {
  switch (m.metricType) {
    case 'heartRate':
      return m.value < settings.heartRate.min || m.value > settings.heartRate.max;
    case 'spo2':
      return m.value < settings.spo2.min;
    case 'temperature':
      return m.value < settings.temperature.min || m.value > settings.temperature.max;
    default:
      return false;
  }
}

export function assessRisk(input: RiskInput): RiskOutput {
  const { person, measurements, movementEvents, now } = input;
  const settings = person.monitoringPreferences;

  const validFalls = movementEvents.filter(
    e => e.eventType === 'suspectedFall' && isMovementValid(e, settings, now) && (e.fallConfidence ?? 0) >= settings.fallConfidenceThreshold
  );
  const fall = validFalls.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())[0] || null;

  const validInactivity = movementEvents.filter(
    e => (e.eventType === 'prolongedInactivity' || e.eventType === 'postFallInactivity') && isMovementValid(e, settings, now)
  );
  const inactivity = validInactivity.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())[0] || null;

  const abnormalVitals = measurements.filter(m => isMeasurementValid(m, settings, now) && isAbnormalVital(m, settings));
  const criticalVitals = measurements.filter(m => isMeasurementValid(m, settings, now) && isCriticalVital(m, settings));

  const resumedMovement = movementEvents.some(
    e => e.eventType === 'normalActivity' && isMovementValid(e, settings, now) && fall && new Date(e.occurredAt) > new Date(fall.occurredAt)
  );

  // 1. Fall + Inactivity + Abnormal Vitals (High)
  if (fall && inactivity && abnormalVitals.length > 0) {
    return {
      severity: 'high',
      incidentType: 'fall-inactivity-abnormal-vitals',
      title: 'CRITICAL: Fall Detected with Inactivity & Abnormal Vitals',
      explanation: `Suspected fall followed by prolonged inactivity and abnormal vital signs (${abnormalVitals.map(v => `${v.metricType}: ${v.value}`).join(', ')}). Immediate assistance needed.`,
      evidence: { measurements: abnormalVitals, movementEvents: [fall, inactivity] },
      confidence: 0.95,
      ruleTriggered: 'fall-inactivity-abnormal-vitals',
      isDuplicate: false,
    };
  }

  // 2. Fall + Inactivity (High)
  if (fall && inactivity) {
    return {
      severity: 'high',
      incidentType: 'fall-inactivity',
      title: 'Fall Detected - No Movement Resumed',
      explanation: `Suspected fall followed by prolonged inactivity. Person has not resumed normal motion.`,
      evidence: { measurements: [], movementEvents: [fall, inactivity] },
      confidence: 0.9,
      ruleTriggered: 'fall-inactivity',
      isDuplicate: false,
    };
  }

  // 3. Critical / Abnormal Vitals (Medium)
  if (criticalVitals.length > 0 || abnormalVitals.length > 0) {
    const list = criticalVitals.length > 0 ? criticalVitals : abnormalVitals;
    return {
      severity: 'medium',
      incidentType: 'critical-vitals',
      title: 'Abnormal Vital Signs Detected',
      explanation: `Patient vitals deviate from safe baseline (${list.map(v => `${v.metricType}: ${v.value}${v.unit}`).join(', ')}).`,
      evidence: { measurements: list, movementEvents: [] },
      confidence: 0.85,
      ruleTriggered: 'critical-vitals',
      isDuplicate: false,
    };
  }

  // 4. Fall with Recovery (Medium)
  if (fall && resumedMovement) {
    return {
      severity: 'medium',
      incidentType: 'fall-recovered',
      title: 'Suspected Fall - Movement Resumed',
      explanation: 'Suspected fall impact detected, but subsequent movement was detected shortly after.',
      evidence: { measurements: [], movementEvents: [fall] },
      confidence: 0.75,
      ruleTriggered: 'fall-recovered',
      isDuplicate: false,
    };
  }

  // 5. Hardware Checks
  const braceletMs = measurements.filter(m => m.sourceDeviceId.includes('bracelet'));
  if (braceletMs.length === 0 || braceletMs.every(m => m.validityStatus !== 'valid')) {
    return {
      severity: 'device-warning',
      incidentType: 'device-bracelet-offline',
      title: 'Health Bracelet Disconnected',
      explanation: 'No valid data received from the health band in configured window.',
      evidence: { measurements: [], movementEvents: [] },
      confidence: 1.0,
      ruleTriggered: 'device-bracelet-offline',
      isDuplicate: false,
    };
  }

  // Default normal
  return {
    severity: 'low',
    incidentType: 'normal-monitoring',
    title: 'Normal Monitoring Active',
    explanation: 'All physiological vitals and movement signals within normal ranges.',
    evidence: { measurements: measurements.slice(0, 3), movementEvents: movementEvents.slice(0, 2) },
    confidence: 0.99,
    ruleTriggered: 'normal-monitoring',
    isDuplicate: false,
  };
}
