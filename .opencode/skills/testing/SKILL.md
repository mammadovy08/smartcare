---
name: testing
description: Testing conventions and required test cases for the risk engine and app flows
---

# Testing Skill (Vitest + React Native Testing Library)

## Stack
- **Unit**: Vitest (fast, ESM-native, Jest-compatible API)
- **Component**: @testing-library/react-native
- **E2E**: Detox (Phase 2+)
- **Coverage**: v8 (via Vitest)

## Configuration
```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['src/**/*.d.ts', 'src/mock/**', 'src/simulator/**'],
    },
  },
});
```

```ts
// vitest.setup.ts
import '@testing-library/jest-native';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock Expo modules
vi.mock('expo-router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useLocalSearchParams: () => ({}),
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('expo-notifications', () => ({
  getPermissionsAsync: vi.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: vi.fn().mockResolvedValue({ status: 'granted' }),
  scheduleNotificationAsync: vi.fn(),
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  getItem: vi.fn().mockResolvedValue(null),
  setItem: vi.fn().mockResolvedValue(undefined),
  removeItem: vi.fn().mockResolvedValue(undefined),
}));
```

## Unit Tests (Risk Engine - Pure Functions)
```ts
// engine/risk.test.ts
import { describe, it, expect } from 'vitest';
import { assessRisk } from './risk';
import { createMockMeasurements, createMockMovementEvents } from '@/mock/measurements';

describe('Risk Engine', () => {
  const baseInput = {
    personSettings: { inactivityThresholdMinutes: 30, ... },
    now: '2026-10-09T12:00:00Z',
  };

  it('returns low for normal vitals + normal movement', () => {
    const result = assessRisk({
      ...baseInput,
      measurements: createMockMeasurements({ heartRate: 72, spo2: 98, temperature: 36.8 }),
      movementEvents: createMockMovementEvents({ type: 'normalActivity' }),
    });

    expect(result.severity).toBe('low');
    expect(result.ruleTriggered).toBe('normal-monitoring');
  });

  it('returns high for suspected fall + prolonged inactivity + abnormal vitals', () => {
    const result = assessRisk({
      ...baseInput,
      measurements: createMockMeasurements({ heartRate: 110, spo2: 90, temperature: 37.5 }),
      movementEvents: createMockMovementEvents({ type: 'suspectedFall', inactivityDurationSeconds: 1800 }),
    });

    expect(result.severity).toBe('high');
    expect(result.ruleTriggered).toBe('fall-inactivity-abnormal-vitals');
  });

  it('returns device-warning when bracelet offline', () => {
    const result = assessRisk({
      ...baseInput,
      measurements: createMockMeasurements({ validityStatus: 'invalid', isDemo: true }),
      movementEvents: createMockMovementEvents({ type: 'normalActivity' }),
    });

    expect(result.severity).toBe('device-warning');
  });

  it('deduplicates same incident within window', () => {
    const input = { ...baseInput, measurements: [...], movementEvents: [...] };
    const r1 = assessRisk(input);
    const r2 = assessRisk(input); // Same cause, within dedup window
    expect(r1.incidentId).toBe(r2.incidentId);
  });
});
```

## Component Tests
```tsx
// components/incidents/IncidentCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { IncidentCard } from './IncidentCard';
import { mockIncident } from '@/mock/incidents';

describe('IncidentCard', () => {
  it('renders severity badge with correct color', () => {
    render(<IncidentCard incident={mockIncident.high} onPress={vi.fn()} />);
    expect(screen.getByText('HIGH')).toHaveStyle({ backgroundColor: '#dc2626' });
  });

  it('calls onAcknowledge when button pressed', () => {
    const onAcknowledge = vi.fn();
    render(<IncidentCard incident={mockIncident.medium} onAcknowledge={onAcknowledge} />);
    fireEvent.press(screen.getByText('Acknowledge'));
    expect(onAcknowledge).toHaveBeenCalledWith(mockIncident.medium.id);
  });

  it('shows escalation history', () => {
    const incident = { ...mockIncident.high, escalationHistory: [{ contact: 'John', status: 'delivered' }] };
    render(<IncidentCard incident={incident} onPress={vi.fn()} />);
    expect(screen.getByText('John')).toBeTruthy();
    expect(screen.getByText('delivered')).toBeTruthy();
  });
});
```

## Store Tests (Zustand)
```ts
// store/useAppStore.test.ts
import { act } from '@testing-library/react-native';
import { useAppStore } from './useAppStore';

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState({ people: [], incidents: [], devices: [] });
  });

  it('adds incident and sorts by date desc', () => {
    const incident1 = { id: '1', detectedAt: '2026-10-09T10:00:00Z', ... };
    const incident2 = { id: '2', detectedAt: '2026-10-09T12:00:00Z', ... };

    act(() => { useAppStore.getState().addIncident(incident1); });
    act(() => { useAppStore.getState().addIncident(incident2); });

    expect(useAppStore.getState().incidents[0].id).toBe('2');
  });

  it('acknowledges incident', () => {
    const incident = { id: '1', status: 'new' as const, ... };
    act(() => { useAppStore.getState().addIncident(incident); });
    act(() => { useAppStore.getState().acknowledgeIncident('1'); });

    expect(useAppStore.getState().incidents[0].status).toBe('acknowledged');
    expect(useAppStore.getState().incidents[0].acknowledgedAt).toBeDefined();
  });
});
```

## Simulator/Scenario Tests
```ts
// simulator/scenarios.test.ts
import { describe, it, expect } from 'vitest';
import { runScenario } from './runner';
import { SCENARIOS } from './scenarios';

describe('Simulator Scenarios', () => {
  it('scenario 1: normal monitoring', async () => {
    const result = await runScenario(SCENARIOS.normal);
    expect(result.incidents).toHaveLength(0);
    expect(result.deviceStatus.bracelet).toBe('online');
  });

  it('scenario 4: fall + prolonged inactivity â†’ high risk', async () => {
    const result = await runScenario(SCENARIOS.fallThenInactivity);
    expect(result.incidents).toHaveLength(1);
    expect(result.incidents[0].severity).toBe('high');
    expect(result.incidents[0].ruleTriggered).toBe('fall-inactivity-abnormal-vitals');
  });

  it('scenario 6: disconnected bracelet â†’ device warning', async () => {
    const result = await runScenario(SCENARIOS.braceletDisconnected);
    expect(result.incidents.some(i => i.severity === 'device-warning')).toBe(true);
  });
});
```

## Running Tests
```bash
npm test                      # All tests
npm test -- --run             # CI mode (no watch)
npm test -- --coverage        # With coverage
npm test -- --testNamePattern="risk engine"  # Single test pattern
npm test src/engine/risk.test.ts             # Single file
```

## Test Data Factories
```ts
// mock/factories.ts
export function createMockMeasurement(overrides: Partial<HealthMeasurement> = {}): HealthMeasurement {
  return {
    id: crypto.randomUUID(),
    personId: 'person-1',
    sourceDeviceId: 'bracelet-1',
    metricType: 'heartRate',
    value: 72,
    unit: 'BPM',
    measuredAt: new Date().toISOString(),
    receivedAt: new Date().toISOString(),
    signalQuality: 'good',
    validityStatus: 'valid',
    isDemo: true,
    ...overrides,
  };
}

export function createMockIncident(overrides: Partial<Incident> = {}): Incident {
  return {
    id: crypto.randomUUID(),
    personId: 'person-1',
    severity: 'medium',
    incidentType: 'suspectedFall',
    title: 'Suspected Fall Detected',
    explanation: 'Fall detected followed by 5 minutes inactivity',
    detectedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'new',
    evidence: { measurements: [], movementEvents: [] },
    confidence: 0.85,
    ...overrides,
  };
}
```

## Coverage Targets (Phase 1)
| Layer | Target |
|-------|--------|
| Risk engine | 100% (pure functions) |
| Store actions | 90% |
| Components (critical) | 80% |
| Simulator scenarios | 100% |
| Adapters (mock) | 70% |

## Commands
```bash
npm test -- --ui              # Vitest UI
npm test -- --reporter=verbose
```
