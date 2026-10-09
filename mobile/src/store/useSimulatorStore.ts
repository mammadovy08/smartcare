// Simulator Store - Deterministic Scenario Runner
// For demo/testing without real hardware

import { create } from 'zustand';
import type { RiskInput } from '@/engine/types';
import { assessRisk, clearRiskCache } from '@/engine/risk';
import { useAppStore } from './useAppStore';
import { SCENARIO_DATA } from '@/mock/factories';
import type { HealthMeasurement, MovementEvent, Severity } from '@/types';

interface SimulatorState {
  isRunning: boolean;
  currentScenario: string | null;
  lastResult: { severity: Severity; ruleTriggered: string } | null;
  history: Array<{ scenario: string; timestamp: string; severity: Severity; ruleTriggered: string }>;
  runScenario: (scenarioKey: keyof typeof SCENARIO_DATA) => Promise<void>;
  runAllScenarios: () => Promise<void>;
  stop: () => void;
  clearHistory: () => void;
}

const SCENARIO_KEYS = [
  'normal',
  'minorAnomaly',
  'fallRecovered',
  'fallThenInactivity',
  'abnormalVitals',
  'braceletDisconnected',
  'esp32Offline',
  'staleMeasurements',
  'notificationFailure',
  'fallInactivityAbnormalVitals',
] as const;

export const useSimulatorStore = create<SimulatorState>((set, get) => ({
  isRunning: false,
  currentScenario: null,
  lastResult: null,
  history: [],

  runScenario: async (scenarioKey) => {
    const scenario = SCENARIO_DATA[scenarioKey];
    if (!scenario) throw new Error(`Unknown scenario: ${scenarioKey}`);

    set({ isRunning: true, currentScenario: scenarioKey });

    const { selectedPersonId, people } = useAppStore.getState();
    const person = people.find(p => p.id === selectedPersonId);
    if (!person) throw new Error('No person selected');

    const input: RiskInput = {
      person,
      measurements: scenario.measurements,
      movementEvents: scenario.movementEvents,
      now: new Date().toISOString(),
    };

    const result = assessRisk(input);

    // Update app store with new measurements/events
    const { addMeasurement, addMovementEvent, addIncident } = useAppStore.getState();
    scenario.measurements.forEach(addMeasurement);
    scenario.movementEvents.forEach(addMovementEvent);

    // Add incident if not low/normal
    if (result.severity !== 'low') {
      const incident = {
        id: `inc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        personId: person.id,
        severity: result.severity,
        incidentType: result.incidentType,
        title: result.title,
        explanation: result.explanation,
        detectedAt: input.now,
        updatedAt: input.now,
        status: 'new' as const,
        evidence: result.evidence,
        confidence: result.confidence,
        ruleTriggered: result.ruleTriggered,
      };
      addIncident(incident);
    }

    set((state) => ({
      isRunning: false,
      currentScenario: null,
      lastResult: { severity: result.severity, ruleTriggered: result.ruleTriggered },
      history: [
        { scenario: scenarioKey, timestamp: input.now, severity: result.severity, ruleTriggered: result.ruleTriggered },
        ...state.history.slice(0, 49),
      ],
    }));
  },

  runAllScenarios: async () => {
    for (const key of SCENARIO_KEYS) {
      await get().runScenario(key);
      // Small delay between scenarios
      await new Promise<void>(r => setTimeout(() => r(), 100));
    }
  },

  stop: () => set({ isRunning: false, currentScenario: null }),

  clearHistory: () => set({ history: [], lastResult: null }),
  clearRiskCache,
}));