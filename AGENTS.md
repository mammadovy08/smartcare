# AGENTS.md — SmartCare (AI Health & Fall Detection)

## Project Overview
Building a React Native + Expo + TypeScript mobile app (**SmartCare**) that combines:
- Health bracelet vitals (HR, SpO₂, temp, optional BP)
- ESP32 movement detection (falls, inactivity, posture)
- Risk assessment engine → tiered alerts (Low/Medium/High + Device Warning)
- Caregiver dashboard, incident center, health history, device management

**Phase 1 MVP**: Working app with simulated sensor data, deterministic risk engine, in-app notifications. No real hardware/backend required.

---

## Commands (verify before running)

```bash
# Initialize (first time only)
npm create expo-app@latest . -- --template blank-typescript
npm install
npx expo install expo-router react-native-gesture-handler react-native-reanimated react-native-screens react-native-safe-area-context @react-native-async-storage/async-storage expo-notifications expo-constants expo-device expo-linking expo-status-bar
npm install zustand @tanstack/react-query react-hook-form zod date-fns
npm install -D @types/react @types/react-native typescript eslint prettier

# Daily dev
npx expo start                 # dev server
npx expo start --clear         # clear cache
npx expo run:android           # Android build
npx expo run:ios               # iOS build (macOS only)

# Quality
npm run lint                   # eslint (configure in package.json)
npx tsc --noEmit               # typecheck
npm test                       # jest (configure in package.json)
```

> **Note**: No `package.json` exists yet. Run init commands above first.

---

## Architecture Decisions (non-obvious)

| Area | Decision | Rationale |
|------|----------|-----------|
| **State** | Zustand (global) + React Query (server) | Simple, typed, no provider hell |
| **Navigation** | Expo Router (file-based) | Native Expo, deep linking ready |
| **Risk Engine** | Pure TS module (`src/engine/risk.ts`) | Testable, deterministic, no React deps |
| **Simulator** | `src/simulator/` — deterministic scenarios | Reproducible demos, no randomness |
| **Hardware Adapters** | `src/adapters/{bracelet,esp32,backend}.ts` | Swappable implementations (mock → real) |
| **Types** | `src/types/` — Zod schemas + TS types | Single source of truth, runtime validation |
| **Mock Data** | `src/mock/` — clearly labeled `isDemo: true` | Never mistaken for real data |

---

## Critical Conventions

1. **Never commit real secrets** — `.env.local` gitignored, `.env.example` committed
2. **Demo data always marked** — every mock measurement has `source: 'simulator'`
3. **Risk engine is pure** — no side effects, no async, inputs → severity + evidence
4. **Incident deduplication** — engine returns existing incident ID if same cause within window
5. **Device health ≠ medical risk** — separate `DeviceStatus` enum (Online/Stale/Offline/Error)
6. **No "dead" claims** — UI shows "Unresponsive, escalation initiated" not "Patient deceased"

---

## File Structure (target)

```
src/
├── app/                    # Expo Router screens
│   ├── (tabs)/             # Main tab screens
│   │   ├── dashboard.tsx
│   │   ├── incidents.tsx
│   │   ├── history.tsx
│   │   ├── devices.tsx
│   │   └── settings.tsx
│   ├── incident/[id].tsx   # Incident detail
│   ├── people/[id].tsx     # Person detail
│   └── _layout.tsx
├── components/             # Reusable UI
│   ├── metrics/            # HealthMetricCard, VitalSignCard
│   ├── incidents/          # IncidentCard, SeverityBadge
│   ├── devices/            # DeviceStatusCard
│   └── charts/             # HealthChart (victory-native or similar)
├── engine/
│   ├── risk.ts             # Core risk assessment (pure functions)
│   ├── rules.ts            # Configurable thresholds
│   └── types.ts            # Engine input/output types
├── simulator/
│   ├── scenarios.ts        # Deterministic scenario definitions
│   ├── runner.ts           # Scenario executor
│   └── dev-tools.tsx       # Dev-only trigger UI
├── adapters/
│   ├── bracelet.ts         # HealthDataAdapter interface + mock
│   ├── esp32.ts            # MovementEventAdapter interface + mock
│   └── backend.ts          # BackendService interface + mock
├── services/
│   ├── notifications.ts    # NotificationService abstraction
│   ├── storage.ts          # AsyncStorage wrappers
│   └── auth.ts             # AuthService (mock for Phase 1)
├── store/
│   ├── useAppStore.ts      # Zustand: people, incidents, devices
│   └── useSimulatorStore.ts# Simulator state
├── types/
│   ├── index.ts            # All domain types (Person, HealthMeasurement, etc.)
│   └── zod.ts              # Zod schemas for validation
├── mock/
│   ├── people.ts
│   ├── measurements.ts
│   └── incidents.ts
└── utils/
    ├── date.ts
    ├── format.ts
    └── constants.ts
```

---

## Testing Strategy

| Layer | Tool | Focus |
|-------|------|-------|
| Unit | Vitest/Jest | Risk engine rules, type guards, formatters |
| Component | React Native Testing Library | Critical flows: incident acknowledgment, escalation |
| Integration | Detox (later) | Full app navigation + simulator scenarios |

**Run single test**: `npm test -- --testNamePattern="risk engine"`

---

## Known Gotchas

- **Expo Router + TypeScript**: Restart TS server after adding new routes (`Cmd+Shift+P` → "TypeScript: Restart TS Server")
- **Reanimated 3**: Requires `babel.config.js` plugin — add after `npm install`
- **Notifications on simulator**: Expo Go supports push; standalone needs credentials
- **Android cleartext**: For local backend, `android:usesCleartextTraffic="true"` in `app.json`
- **Safe area**: Wrap root in `SafeAreaProvider` (already in Expo template)

---

## Phase 1 Definition of Done

- [ ] Expo app runs on iOS/Android simulator
- [ ] Tab navigation: Dashboard, Incidents, History, Devices, Settings
- [ ] Dashboard shows simulated vitals + movement + device status
- [ ] Risk engine classifies 10 deterministic scenarios correctly
- [ ] Incident center: list, filter, acknowledge, detail view
- [ ] Health history charts (24h/7d/30d) with empty states
- [ ] Device screen shows bracelet + ESP32 status, battery, last seen
- [ ] Emergency contacts CRUD + test notification button
- [ ] Settings: inactivity duration, alert preferences, demo mode toggle
- [ ] All mock data marked `isDemo: true`
- [ ] README with setup, run, test commands

---

## References

- Project spec: (this conversation context)
- Expo Router docs: https://expo.github.io/router/
- Zustand: https://github.com/pmndrs/zustand
- Victory Native (charts): https://formidable.com/open-source/victory/docs/victory-native/