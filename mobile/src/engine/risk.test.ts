import { describe, it, expect, beforeEach } from 'vitest';
import { assessRisk, clearRiskCache } from './risk';
import { SCENARIOS } from '@/simulator/scenarios';
import { createMockPerson, SCENARIO_DATA } from '@/mock/factories';

describe('Risk Engine - 10 Deterministic Scenarios', () => {
  const person = createMockPerson();
  const now = new Date().toISOString();

  beforeEach(() => {
    clearRiskCache();
  });

  SCENARIOS.forEach((scenario) => {
    it(`evaluates Scenario: ${scenario.name} -> ${scenario.severity}`, () => {
      const input = scenario.buildInput(person, now);
      const result = assessRisk(input);

      expect(result.severity).toBe(scenario.severity);
      expect(result.ruleTriggered).toBe(scenario.ruleTriggered);
      expect(result.title).toBeDefined();
      expect(result.explanation).toBeDefined();
    });
  });

  it('deduplicates identical alerts within the deduplication window', () => {
    const fallScenario = SCENARIOS.find((s) => s.id === 'fallThenInactivity')!;
    const input1 = fallScenario.buildInput(person, now);
    const result1 = assessRisk(input1);

    expect(result1.isDuplicate).toBe(false);
    expect(result1.incidentId).toBeDefined();

    // Immediate second assessment with same cause
    const result2 = assessRisk(input1);
    expect(result2.isDuplicate).toBe(true);
    expect(result2.incidentId).toBe(result1.incidentId);
  });
});
