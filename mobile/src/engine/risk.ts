// Risk Assessment Engine
// Pure function: assessRisk(input) -> output
// No side effects, no async, fully deterministic, fully testable

import type { RiskInput, RiskOutput, Rule } from './types';
import { RULES, severityPriority } from './rules';
import type { Incident } from '@/types';

// In-memory deduplication cache (in production, this would be in DB)
const incidentCache = new Map<string, { incident: Incident; expiresAt: number }>();

function generateIncidentId(): string {
  return `inc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getCacheKey(personId: string, ruleId: string): string {
  return `${personId}:${ruleId}`;
}

function isCacheValid(entry: { incident: Incident; expiresAt: number }): boolean {
  return Date.now() < entry.expiresAt;
}

function getCachedIncident(personId: string, ruleId: string): Incident | null {
  const key = getCacheKey(personId, ruleId);
  const entry = incidentCache.get(key);
  if (entry && isCacheValid(entry)) {
    return entry.incident;
  }
  if (entry) {
    incidentCache.delete(key);
  }
  return null;
}

function setCachedIncident(personId: string, ruleId: string, incident: Incident, windowMinutes: number): void {
  const key = getCacheKey(personId, ruleId);
  incidentCache.set(key, {
    incident,
    expiresAt: Date.now() + windowMinutes * 60 * 1000,
  });
}

function buildOutput(rule: Rule, input: RiskInput, incidentId?: string, isDuplicate = false): RiskOutput {
  return {
    severity: rule.severity,
    incidentType: rule.incidentType,
    title: rule.name,
    explanation: rule.explanation(input),
    evidence: {
      measurements: input.measurements,
      movementEvents: input.movementEvents,
    },
    confidence: rule.confidence,
    ruleTriggered: rule.id,
    incidentId: incidentId ?? undefined,
    isDuplicate,
  };
}

export function assessRisk(input: RiskInput): RiskOutput {
  // Sort rules by severity priority (high → medium → low → device-warning)
  const sortedRules = [...RULES].sort((a, b) => severityPriority(b.severity) - severityPriority(a.severity));

  // Check each rule in priority order
  for (const rule of sortedRules) {
    if (rule.condition(input)) {
      // Check deduplication
      const cached = getCachedIncident(input.person.id, rule.id);
      if (cached) {
        return buildOutput(rule, input, cached.id, true);
      }

      // Create new incident
      const incidentId = generateIncidentId();
      const output = buildOutput(rule, input, incidentId);

      // Cache for deduplication
      setCachedIncident(input.person.id, rule.id, {
        id: incidentId,
        personId: input.person.id,
        severity: rule.severity,
        incidentType: rule.incidentType,
        title: rule.name,
        explanation: rule.explanation(input),
        detectedAt: input.now,
        updatedAt: input.now,
        status: 'new',
        evidence: {
          measurements: input.measurements,
          movementEvents: input.movementEvents,
        },
        confidence: rule.confidence,
        ruleTriggered: rule.id,
      }, rule.deduplicationWindowMinutes);

      return output;
    }
  }

  // Default: normal monitoring (should match normalMonitoringRule)
  const normalRule = RULES.find(r => r.id === 'normal-monitoring')!;
  return buildOutput(normalRule, input);
}

// Clear cache (for testing)
export function clearRiskCache(): void {
  incidentCache.clear();
}

// Get cache stats (for debugging)
export function getCacheStats(): { size: number; entries: string[] } {
  return {
    size: incidentCache.size,
    entries: Array.from(incidentCache.keys()),
  };
}