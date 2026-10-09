---
name: ai-ml
description: Deterministic risk engine rules and the path to a future ML fall-detection model
---

# AI/ML Skill (Rule Engine â†’ Future ML)

## Current: Deterministic Rule Engine (Phase 1)

### Architecture
```
src/engine/
â”œâ”€â”€ risk.ts           # Pure function: assessRisk(input) â†’ output
â”œâ”€â”€ rules.ts          # Configurable thresholds & rule definitions
â”œâ”€â”€ types.ts          # Engine input/output types
â””â”€â”€ index.ts          # Exports
```

### Rule Structure
```ts
// engine/rules.ts
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

export const RULES: Rule[] = [
  {
    id: 'fall-inactivity-abnormal-vitals',
    name: 'Fall + Prolonged Inactivity + Abnormal Vitals',
    severity: 'high',
    condition: (input) => {
      const fall = input.movementEvents.find(e => e.eventType === 'suspectedFall');
      const inactivity = input.movementEvents.find(e => e.eventType === 'prolongedInactivity');
      const abnormalVitals = input.measurements.some(m => isAbnormal(m));
      return !!fall && !!inactivity && abnormalVitals;
    },
    explanation: (input) => {
      const fall = input.movementEvents.find(e => e.eventType === 'suspectedFall');
      const vitals = input.measurements.filter(isAbnormal);
      return `Fall detected (confidence: ${fall?.fallConfidence?.toFixed(2)}) followed by ${input.personSettings.inactivityThresholdMinutes}min inactivity. Abnormal vitals: ${vitals.map(v => `${v.metricType}=${v.value}${v.unit}`).join(', ')}`;
    },
    incidentType: 'fall-with-inactivity-and-abnormal-vitals',
    confidence: 0.9,
    deduplicationWindowMinutes: 15,
  },
  {
    id: 'bracelet-offline',
    name: 'Health Bracelet Offline',
    severity: 'device-warning',
    condition: (input) => {
      const bracelet = input.measurements.find(m => m.sourceDeviceId.includes('bracelet'));
      return !bracelet || bracelet.validityStatus === 'invalid' || isStale(bracelet, 10);
    },
    explanation: () => 'Health bracelet has not reported valid measurements in the last 10 minutes. Health status cannot be verified.',
    incidentType: 'device-bracelet-offline',
    confidence: 1.0,
    deduplicationWindowMinutes: 5,
  },
  // ... more rules
];
```

### Engine Core
```ts
// engine/risk.ts
import { RULES } from './rules';
import type { RiskInput, RiskOutput, Severity } from './types';

export function assessRisk(input: RiskInput): RiskOutput {
  // 1. Sort rules by severity priority (high â†’ medium â†’ low â†’ device-warning)
  const sortedRules = [...RULES].sort((a, b) => severityPriority(b.severity) - severityPriority(a.severity));

  // 2. Check deduplication cache (in practice, stored in DB)
  const recentIncidents = getRecentIncidents(input.personId);

  // 3. Evaluate rules in priority order
  for (const rule of sortedRules) {
    if (rule.condition(input)) {
      // Check deduplication
      const duplicate = recentIncidents.find(
        i => i.incidentType === rule.incidentType &&
             minutesSince(i.detectedAt) < rule.deduplicationWindowMinutes
      );
      if (duplicate) {
        return { ...buildOutput(rule, input), incidentId: duplicate.id, isDuplicate: true };
      }

      return buildOutput(rule, input);
    }
  }

  // 4. Default: low risk
  return {
    severity: 'low',
    incidentType: 'normal-monitoring',
    title: 'Normal Monitoring',
    explanation: 'All measurements within normal ranges. No concerning movement patterns detected.',
    evidence: input,
    confidence: 1.0,
    ruleTriggered: 'normal-monitoring',
  };
}

function severityPriority(s: Severity): number {
  return { high: 4, medium: 3, low: 2, 'device-warning': 1 }[s];
}

function buildOutput(rule: Rule, input: RiskInput): RiskOutput {
  return {
    severity: rule.severity,
    incidentType: rule.incidentType,
    title: rule.name,
    explanation: rule.explanation(input),
    evidence: input,
    confidence: rule.confidence,
    ruleTriggered: rule.id,
  };
}
```

### Threshold Configuration (User-Configurable)
```ts
// engine/rules.ts
export interface PersonSettings {
  // Vitals thresholds (require clinical validation)
  heartRate: { min: 40; max: 120; criticalMin: 30; criticalMax: 150 };
  spo2: { min: 90; criticalMin: 85 };
  temperature: { min: 35.0; max: 38.5; criticalMin: 34.0; criticalMax: 40.0 };
  systolicBP: { min: 90; max: 160; criticalMin: 70; criticalMax: 200 };
  diastolicBP: { min: 50; max: 100; criticalMin: 40; criticalMax: 120 };

  // Movement
  inactivityThresholdMinutes: 30;
  fallConfidenceThreshold: 0.7;

  // Data quality
  measurementStaleMinutes: 10;
  movementStaleMinutes: 15;
}

export const DEFAULT_SETTINGS: PersonSettings = {
  heartRate: { min: 50, max: 100, criticalMin: 40, criticalMax: 130 },
  spo2: { min: 92, criticalMin: 88 },
  temperature: { min: 36.0, max: 37.5, criticalMin: 35.0, criticalMax: 39.0 },
  systolicBP: { min: 90, max: 140, criticalMin: 80, criticalMax: 180 },
  diastolicBP: { min: 60, max: 90, criticalMin: 50, criticalMax: 110 },
  inactivityThresholdMinutes: 30,
  fallConfidenceThreshold: 0.7,
  measurementStaleMinutes: 10,
  movementStaleMinutes: 15,
};
```

## Future: ML Pipeline (Phase 5+)

### Data Collection for Training
```ts
// engine/data-collection.ts
export interface LabeledSample {
  features: FeatureVector;
  label: Severity;
  incidentId: string;
  verifiedBy: 'clinician' | 'caregiver' | 'auto';
  createdAt: string;
}

export interface FeatureVector {
  // Vitals
  heartRate: number | null;
  spo2: number | null;
  temperature: number | null;
  systolicBP: number | null;
  diastolicBP: number | null;
  vitalsAgeMinutes: number;
  vitalsQuality: number; // 0-1

  // Movement
  fallConfidence: number | null;
  inactivityMinutes: number | null;
  unusualMovement: boolean;
  movementAgeMinutes: number;
  movementQuality: number;

  // Context
  timeOfDay: number; // 0-23
  dayOfWeek: number; // 0-6
  personAge: number;
  personConditions: string[]; // encoded
}
```

### Model Interface (Future)
```ts
// engine/ml-model.ts
export interface MLModel {
  predict(features: FeatureVector): { severity: Severity; confidence: number; probabilities: Record<Severity, number> };
  explain(features: FeatureVector): FeatureImportance[];
  version: string;
  trainedAt: string;
}

// Shadow mode: run ML alongside rules, compare, log discrepancies
export async function assessRiskWithML(input: RiskInput): Promise<RiskOutput> {
  const ruleResult = assessRisk(input);
  const mlResult = mlModel.predict(extractFeatures(input));

  // Log for evaluation
  await logPrediction({ rule: ruleResult, ml: mlResult, input });

  // Phase 5: return ML result after validation
  // Phase 4: return rule result, use ML for alerting clinicians to review
  return ruleResult;
}
```

## Safety Constraints (Non-Negotiable)
| Constraint | Implementation |
|------------|----------------|
| Never claim death | UI: "Unresponsive, escalation initiated" not "Patient deceased" |
| No diagnosis | Output: "Abnormal pattern detected" not "Heart attack" |
| Configurable thresholds | All medical thresholds in `PersonSettings`, validated by clinician |
| Missing data â‰  emergency | Device warning separate from medical severity |
| Deduplication | Same cause within window â†’ update existing, not create new |
| Audit trail | Every severity decision logs `ruleTriggered`, `confidence`, `evidence` |

## Testing Rules
```ts
// engine/rules.test.ts
import { RULES } from './rules';
import { createTestInput } from '@/mock/factories';

describe('Rules', () => {
  it.each(RULES)('$id triggers correctly', (rule) => {
    const input = createTestInput({ /* scenario matching rule */ });
    expect(rule.condition(input)).toBe(true);
  });

  it('no overlapping rules produce different severities for same input', () => {
    const inputs = generateAllScenarioInputs();
    for (const input of inputs) {
      const matches = RULES.filter(r => r.condition(input));
      const severities = new Set(matches.map(m => m.severity));
      expect(severities.size).toBeLessThanOrEqual(1);
    }
  });
});
```

## Commands
```bash
# Run engine tests
npm test src/engine/

# Type check engine
npx tsc --noEmit --project src/engine/tsconfig.json
```
