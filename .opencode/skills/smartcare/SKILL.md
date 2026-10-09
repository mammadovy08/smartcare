---
name: smartcare
description: SmartCare project domain: bracelet and ESP32 data, incident severity, safety rules
---

# SmartCare Project Skill (Project-Specific)

## Quick Start
```bash
# First time setup
npm create expo-app@latest . -- --template blank-typescript
npm install
npx expo install expo-router react-native-gesture-handler react-native-reanimated react-native-screens react-native-safe-area-context @react-native-async-storage/async-storage expo-notifications expo-constants expo-device expo-linking expo-status-bar
npm install zustand @tanstack/react-query react-hook-form zod date-fns victory-native
npm install -D @types/react @types/react-native typescript eslint prettier vitest @testing-library/react-native @testing-library/jest-native @vitejs/plugin-react jsdom

# Daily
npx expo start
```

## Phase 1 Scope (2-Week Sprint)

### Week 1: Foundation + Dashboard
- [ ] Expo + TypeScript + ESLint + Prettier configured
- [ ] Expo Router tabs: Dashboard, Incidents, History, Devices, Settings
- [ ] Zustand store with typed Person, Incident, Device, Measurement
- [ ] Mock data factories (all marked `isDemo: true`)
- [ ] Dashboard screen: vitals cards, movement status, device status, latest incidents
- [ ] Risk engine (pure TS) with 10 deterministic rules
- [ ] Unit tests for risk engine (100% coverage)

### Week 2: Incident Center + History + Polish
- [ ] Incident list: filter by severity/status/person/date
- [ ] Incident detail: evidence, timeline, acknowledge/resolve actions
- [ ] Health history charts (Victory Native): 24h/7d/30d, empty states
- [ ] Device screen: bracelet + ESP32 status, battery, last seen, connection toggle
- [ ] Emergency contacts CRUD + test notification (local only)
- [ ] Settings: inactivity threshold, alert prefs, demo mode toggle
- [ ] Simulator dev tools: 10 scenario buttons
- [ ] README with setup/run/test commands

## File Structure (Target)
```
src/
â”œâ”€â”€ app/
â”‚   â”œâ”€â”€ (tabs)/
â”‚   â”‚   â”œâ”€â”€ dashboard.tsx
â”‚   â”‚   â”œâ”€â”€ incidents.tsx
â”‚   â”‚   â”œâ”€â”€ history.tsx
â”‚   â”‚   â”œâ”€â”€ devices.tsx
â”‚   â”‚   â””â”€â”€ settings.tsx
â”‚   â”œâ”€â”€ incident/[id].tsx
â”‚   â”œâ”€â”€ people/[id].tsx
â”‚   â””â”€â”€ _layout.tsx
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ metrics/          # VitalSignCard, HealthMetricCard
â”‚   â”œâ”€â”€ incidents/        # IncidentCard, SeverityBadge, IncidentList
â”‚   â”œâ”€â”€ devices/          # DeviceStatusCard
â”‚   â”œâ”€â”€ charts/           # HealthChart (Victory Native)
â”‚   â””â”€â”€ common/           # Button, Card, Badge, Spinner
â”œâ”€â”€ engine/
â”‚   â”œâ”€â”€ risk.ts
â”‚   â”œâ”€â”€ rules.ts
â”‚   â””â”€â”€ types.ts
â”œâ”€â”€ simulator/
â”‚   â”œâ”€â”€ scenarios.ts
â”‚   â”œâ”€â”€ runner.ts
â”‚   â””â”€â”€ DevTools.tsx
â”œâ”€â”€ adapters/
â”‚   â”œâ”€â”€ bracelet.ts
â”‚   â”œâ”€â”€ esp32.ts
â”‚   â””â”€â”€ backend.ts
â”œâ”€â”€ services/
â”‚   â”œâ”€â”€ notifications.ts
â”‚   â”œâ”€â”€ storage.ts
â”‚   â””â”€â”€ backend.ts
â”œâ”€â”€ store/
â”‚   â”œâ”€â”€ useAppStore.ts
â”‚   â””â”€â”€ useSimulatorStore.ts
â”œâ”€â”€ types/
â”‚   â”œâ”€â”€ index.ts
â”‚   â””â”€â”€ zod.ts
â”œâ”€â”€ mock/
â”‚   â”œâ”€â”€ people.ts
â”‚   â”œâ”€â”€ measurements.ts
â”‚   â””â”€â”€ incidents.ts
â””â”€â”€ utils/
    â”œâ”€â”€ date.ts
    â”œâ”€â”€ format.ts
    â””â”€â”€ constants.ts
```

## Key Types (from types/index.ts)
```ts
type Severity = 'low' | 'medium' | 'high' | 'device-warning';
type IncidentStatus = 'new' | 'acknowledged' | 'resolved' | 'escalated';
type DeviceStatus = 'online' | 'stale' | 'offline' | 'error';

interface HealthMeasurement { isDemo: boolean; ... }  // ALWAYS required
interface MovementEvent { isDemo: boolean; ... }
interface Incident { severity: Severity; status: IncidentStatus; evidence: { measurements, movementEvents }; ... }
interface Person { monitoringPreferences: PersonSettings; ... }
```

## Simulator Scenarios (10 Deterministic)
| # | Scenario | Expected Severity |
|---|----------|-------------------|
| 1 | Normal vitals + normal movement | low |
| 2 | Minor HR anomaly + normal movement | low |
| 3 | Suspected fall â†’ movement resumes | medium |
| 4 | Suspected fall â†’ prolonged inactivity | high |
| 5 | Abnormal vitals (low SpO2) + normal movement | medium |
| 6 | Bracelet disconnected | device-warning |
| 7 | ESP32 offline | device-warning |
| 8 | Stale measurements (>10min) | device-warning |
| 9 | Notification delivery failure | medium (escalation) |
| 10 | Fall + inactivity + abnormal vitals | high |

## Critical Conventions
1. **Every mock measurement has `isDemo: true`** â€” never mistaken for real
2. **Risk engine is pure** â€” no React, no async, no side effects
3. **Device health â‰  medical risk** â€” separate `DeviceStatus` enum
4. **No "dead" claims** â€” UI: "Unresponsive, escalation initiated"
5. **Incident deduplication** â€” same cause within window updates existing
6. **ISO 8601 timestamps** â€” always strings, validated by Zod
7. **Supabase RLS for authz** â€” not client-side checks

## Testing Checklist
```bash
# Unit
npm test src/engine/risk.test.ts

# Component
npm test src/components/incidents/IncidentCard.test.tsx

# Store
npm test src/store/useAppStore.test.ts

# Simulator
npm test src/simulator/scenarios.test.ts

# All + coverage
npm test -- --coverage
```

## Environment
```bash
# .env.example (committed)
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

# .env.local (gitignored)
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## References
- AGENTS.md â€” Full project context
- .opencode/skill/react-native-expo.md â€” Expo patterns
- .opencode/skill/typescript.md â€” Strict TS patterns
- .opencode/skill/backend-api.md â€” Adapter pattern + Supabase
- .opencode/skill/testing.md â€” Vitest + RNTL patterns
- .opencode/skill/ai-ml.md â€” Rule engine + future ML
