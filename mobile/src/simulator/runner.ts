// Simulator Runner
// Executes scenarios against the risk engine

import { assessRisk } from '@/engine/risk';
import { SCENARIOS, Scenario, ScenarioId, getScenario } from './scenarios';
import type { Person } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { useSimulatorStore } from '@/store/useSimulatorStore';

export interface ScenarioResult {
  scenario: Scenario;
  severity: string;
  ruleTriggered: string;
  incidentCreated: boolean;
  incidentId: string | undefined;
}

export async function runScenario(scenarioId: ScenarioId): Promise<ScenarioResult> {
  const scenario = getScenario(scenarioId);
  if (!scenario) throw new Error(`Unknown scenario: ${scenarioId}`);

  const { selectedPersonId, people, addMeasurement, addMovementEvent, addIncident } = useAppStore.getState();
  const person = people.find(p => p.id === selectedPersonId);
  if (!person) throw new Error('No person selected');

  const now = new Date().toISOString();
  const input = scenario.buildInput(person, now);

  // Add measurements and events to store with unique IDs
  input.measurements.forEach(m => addMeasurement({
    ...m,
    id: `${m.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  }));
  input.movementEvents.forEach(e => addMovementEvent({
    ...e,
    id: `${e.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  }));

  // Run risk assessment
  const result = assessRisk(input);

  let incidentCreated = false;
  let incidentId: string | undefined;

  if (result.severity !== 'low') {
    incidentCreated = true;
    incidentId = result.incidentId;
    const incident = {
      id: incidentId!,
      personId: person.id,
      severity: result.severity,
      incidentType: result.incidentType,
      title: result.title,
      explanation: result.explanation,
      detectedAt: now,
      updatedAt: now,
      status: 'new' as const,
      evidence: result.evidence,
      confidence: result.confidence,
      ruleTriggered: result.ruleTriggered,
    };
    addIncident(incident);
  }

  // Update simulator store
  useSimulatorStore.getState().runScenario(scenarioId);

  return {
    scenario,
    severity: result.severity,
    ruleTriggered: result.ruleTriggered,
    incidentCreated,
    incidentId,
  };
}

export async function runAllScenarios(): Promise<ScenarioResult[]> {
  const results: ScenarioResult[] = [];
  for (const scenario of SCENARIOS) {
    const result = await runScenario(scenario.id);
    results.push(result);
    // Small delay between scenarios
    await new Promise<void>(r => setTimeout(() => r(), 200));
  }
  return results;
}