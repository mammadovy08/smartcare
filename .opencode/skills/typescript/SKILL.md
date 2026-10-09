---
name: typescript
description: TypeScript style and typing rules for this project
---

# TypeScript Skill (Strict Mode)

## Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src/**/*", "*.config.ts"],
  "exclude": ["node_modules", "dist"]
}
```

## Domain Types Pattern (SmartCare)
```ts
// types/index.ts
export type Severity = 'low' | 'medium' | 'high' | 'device-warning';
export type IncidentStatus = 'new' | 'acknowledged' | 'resolved' | 'escalated';
export type DeviceStatus = 'online' | 'stale' | 'offline' | 'error';
export type MetricType = 'heartRate' | 'spo2' | 'temperature' | 'systolicBloodPressure' | 'diastolicBloodPressure';

export interface HealthMeasurement {
  id: string;
  personId: string;
  sourceDeviceId: string;
  metricType: MetricType;
  value: number;
  unit: string;
  measuredAt: string;        // ISO 8601
  receivedAt: string;
  signalQuality: 'good' | 'fair' | 'poor';
  validityStatus: 'valid' | 'stale' | 'invalid';
  isDemo: boolean;           // ALWAYS required for mock data
}

export interface MovementEvent {
  id: string;
  personId: string;
  sourceDeviceId: string;
  eventType: 'normalActivity' | 'suspectedFall' | 'prolongedInactivity' | 'postFallInactivity' | 'unusualMovement' | 'deviceDisconnected' | 'sensorError';
  occurredAt: string;
  receivedAt: string;
  fallConfidence?: number;       // 0-1
  inactivityDurationSeconds?: number;
  dataQuality: 'good' | 'fair' | 'poor';
  isDemo: boolean;
}

export interface Incident {
  id: string;
  personId: string;
  severity: Severity;
  incidentType: string;
  title: string;
  explanation: string;
  detectedAt: string;
  updatedAt: string;
  status: IncidentStatus;
  evidence: {
    measurements: HealthMeasurement[];
    movementEvents: MovementEvent[];
  };
  confidence: number;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

export interface Person {
  id: string;
  name: string;
  dateOfBirth?: string;
  avatar?: string;
  assignedCaregiverIds: string[];
  monitoringPreferences: MonitoringPreferences;
  createdAt: string;
}
```

## Zod Schemas (Runtime Validation)
```ts
// types/zod.ts
import { z } from 'zod';

export const HealthMeasurementSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  sourceDeviceId: z.string().uuid(),
  metricType: z.enum(['heartRate', 'spo2', 'temperature', 'systolicBloodPressure', 'diastolicBloodPressure']),
  value: z.number().finite(),
  unit: z.string(),
  measuredAt: z.string().datetime(),
  receivedAt: z.string().datetime(),
  signalQuality: z.enum(['good', 'fair', 'poor']),
  validityStatus: z.enum(['valid', 'stale', 'invalid']),
  isDemo: z.boolean(),
});

export type HealthMeasurement = z.infer<typeof HealthMeasurementSchema>;
```

## Pure Functions (Risk Engine)
```ts
// engine/risk.ts
import type { HealthMeasurement, MovementEvent, Severity } from '@/types';

export interface RiskInput {
  measurements: HealthMeasurement[];
  movementEvents: MovementEvent[];
  personSettings: PersonSettings;
  now: string;  // ISO 8601 for testability
}

export interface RiskOutput {
  severity: Severity;
  incidentType: string;
  title: string;
  explanation: string;
  evidence: RiskInput;
  confidence: number;
  ruleTriggered: string;
}

// Pure - no side effects, no async, deterministic
export function assessRisk(input: RiskInput): RiskOutput {
  // Rule-based logic here
  // Returns existing incident ID if deduplication applies
}
```

## Utility Types
```ts
// types/utils.ts
export type NonEmptyArray<T> = [T, ...T[]];
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> & {
  [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
}[Keys];

// Branded types for IDs
export type UUID = string & { readonly __brand: unique symbol };
export function uuid(): UUID { return crypto.randomUUID() as UUID; }
```

## Patterns to Follow
| Pattern | Example |
|---------|---------|
| Discriminated unions | `type Event = { type: 'fall'; confidence: number } \| { type: 'inactivity'; duration: number }` |
| Branded IDs | `type PersonId = UUID & { readonly __person: unique symbol }` |
| No `any` | Use `unknown` then narrow |
| No `as` casts | Use Zod `.parse()` or type guards |
| Pure engine functions | Input â†’ Output, no side effects |
| ISO 8601 timestamps | Always `string` with `.datetime()` validation |

## Commands
```bash
npx tsc --noEmit           # Type check (run before commit)
npm run lint               # ESLint with typescript-eslint
```
