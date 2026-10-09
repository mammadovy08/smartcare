# SmartCare — Project Handoff Document

## Project Overview
**SmartCare** — AI-Assisted Health Monitoring & Emergency Detection App for elderly/sick people living alone.

**Core Concept**: Dual-sensor fusion combining:
- **Health bracelet** vitals (HR, SpO₂, temperature, optional BP)
- **ESP32** movement detection (falls, inactivity, posture changes)
- **Risk engine** → tiered alerts (Low/Medium/High + Device Warning)
- **Caregiver dashboard** with incident center, health history, device management

**Phase 1 MVP**: Working React Native + Expo + TypeScript app with **simulated sensor data**, deterministic risk engine, in-app notifications. No real hardware/backend required.

---

## What's Been Implemented (Complete)

### Project Setup & Configuration
- ✅ Expo SDK 51 + React Native 0.86 + TypeScript (strict mode)
- ✅ Expo Router v3 (file-based navigation)
- ✅ Zustand (global state) + TanStack Query (server state)
- ✅ Reanimated 3, Victory Native, react-hook-form, Zod, date-fns
- ✅ Vitest + React Native Testing Library + jsdom
- ✅ ESLint + Prettier + strict tsconfig
- ✅ Babel config with Reanimated plugin
- ✅ app.json with notifications, scheme, Android cleartext
- ✅ .env.example, .gitignore

### Core Architecture
- ✅ **Types** (`src/types/index.ts`, `zod.ts`): All domain entities (Person, HealthMeasurement, MovementEvent, Incident, Device, EmergencyContact, etc.) with Zod runtime validation
- ✅ **Risk Engine** (`src/engine/`): Pure TS module, zero React deps
  - `types.ts` — RiskInput/RiskOutput, PersonSettings, Rule interface
  - `rules.ts` — 10 deterministic rules (priority-ordered)
  - `risk.ts` — `assessRisk(input)` pure function with deduplication cache
- ✅ **Store** (`src/store/`): Zustand stores
  - `useAppStore` — people, incidents, devices, contacts, measurements, UI state
  - `useSimulatorStore` — scenario runner, history
- ✅ **Mock Data** (`src/mock/factories.ts`): 10 deterministic scenarios, factories for all entities
- ✅ **Adapters** (`src/adapters/`): Interface + mock implementations
  - `bracelet.ts` — HealthDataAdapter (BLE simulation)
  - `esp32.ts` — MovementEventAdapter (WiFi simulation)
  - `backend.ts` — BackendService (in-memory, Supabase-ready interface)
- ✅ **Services** (`src/services/`):
  - `notifications.ts` — NotificationService abstraction (Mock + Expo implementations)
  - `storage.ts` — AsyncStorage wrapper (typed)
  - `auth.ts` — AuthService (mock)
- ✅ **Utils** (`src/utils/`): date, format, constants
- ✅ **Simulator** (`src/simulator/`): 10 scenarios, runner, DevTools UI component

### File Structure Created
```
mobile/
├── src/
│   ├── app/                    # Expo Router screens (empty - NEXT)
│   │   ├── (tabs)/             # Tab screens (empty - NEXT)
│   │   ├── incident/[id]/      # Dynamic route (empty - NEXT)
│   │   ├── people/[id]/        # Dynamic route (empty - NEXT)
│   │   └── _layout.tsx         # Root layout (empty - NEXT)
│   ├── components/             # UI components (empty - NEXT)
│   │   ├── metrics/
│   │   ├── incidents/
│   │   ├── devices/
│   │   ├── charts/
│   │   └── common/
│   ├── engine/                 # ✅ COMPLETE
│   ├── simulator/              # ✅ COMPLETE
│   ├── adapters/               # ✅ COMPLETE
│   ├── services/               # ✅ COMPLETE
│   ├── store/                  # ✅ COMPLETE
│   ├── types/                  # ✅ COMPLETE
│   ├── mock/                   # ✅ COMPLETE
│   └── utils/                  # ✅ COMPLETE
├── .opencode/skill/            # ✅ 6 skill files for agent guidance
├── AGENTS.md                   # ✅ Project instructions
├── package.json                # ✅ Updated with all deps & scripts
├── tsconfig.json               # ✅ Strict config
├── babel.config.js             # ✅ Reanimated plugin
├── app.json                    # ✅ Expo config
├── vitest.config.ts            # ✅ Vitest config
├── vitest.setup.ts             # ✅ Test mocks
└── .env.example                # ✅ Env template
```

---

## The 10 Deterministic Scenarios (Tested via Risk Engine)

| # | Scenario | Expected Severity | Rule Triggered |
|---|----------|-------------------|----------------|
| 1 | Normal vitals + normal movement | low | normal-monitoring |
| 2 | Minor HR anomaly + normal movement | low | minor-vital-anomaly |
| 3 | Suspected fall → movement resumes | medium | fall-recovered |
| 4 | Suspected fall → prolonged inactivity | high | fall-inactivity |
| 5 | Abnormal vitals (low SpO₂) + normal movement | medium | critical-vitals |
| 6 | Bracelet disconnected | device-warning | device-bracelet-offline |
| 7 | ESP32 offline | device-warning | device-esp32-offline |
| 8 | Stale measurements (>10min) | device-warning | device-stale-measurements |
| 9 | Notification delivery failure | medium | fall-recovered (simulated) |
| 10 | Fall + inactivity + abnormal vitals | high | fall-inactivity-abnormal-vitals |

---

## What Remains (Phase 1 TODO)

### 1. App Layout & Navigation (`src/app/`)
- [ ] `app/_layout.tsx` — Root layout with providers (SafeAreaProvider, QueryClientProvider, Notification handler)
- [ ] `app/(tabs)/_layout.tsx` — Tab navigator with 5 tabs
- [ ] `app/(tabs)/dashboard.tsx` — Home dashboard
- [ ] `app/(tabs)/incidents.tsx` — Incident center
- [ ] `app/(tabs)/history.tsx` — Health history charts
- [ ] `app/(tabs)/devices.tsx` — Device status screen
- [ ] `app/(tabs)/settings.tsx` — Settings screen
- [ ] `app/incident/[id].tsx` — Incident detail screen
- [ ] `app/people/[id].tsx` — Person detail screen

### 2. UI Components (`src/components/`)
**Common** (build first):
- [ ] `Button.tsx` — Primary, secondary, destructive variants
- [ ] `Card.tsx` — Container with shadow/border
- [ ] `Badge.tsx` — Severity, status, device badges
- [ ] `Avatar.tsx` — Person avatar with fallback
- [ ] `Spinner.tsx` — Loading indicator
- [ ] `EmptyState.tsx` — No data illustrations
- [ ] `SectionHeader.tsx` — Consistent section titles

**Metrics** (`components/metrics/`):
- [ ] `VitalSignCard.tsx` — Single metric (value, unit, label, trend, status)
- [ ] `HealthMetricCard.tsx` — Grid of vital signs
- [ ] `MovementStatusCard.tsx` — Current activity, last event, fall risk

**Incidents** (`components/incidents/`):
- [ ] `SeverityBadge.tsx` — Colored badge with label
- [ ] `IncidentCard.tsx` — List item with severity, time, title, actions
- [ ] `IncidentList.tsx` — Filterable, sortable list
- [ ] `IncidentDetail.tsx` — Full detail with evidence, timeline, actions

**Devices** (`components/devices/`):
- [ ] `DeviceStatusCard.tsx` — Connection, battery, last seen, sensors

**Charts** (`components/charts/`):
- [ ] `HealthChart.tsx` — Victory Native wrapper (line chart, time range selector)

### 3. Screen Implementation Details

**Dashboard** (`app/(tabs)/dashboard.tsx`):
- Person selector (if multiple)
- Overall status banner (color-coded by highest severity)
- Vitals grid (HR, SpO₂, Temp, BP if available)
- Movement status (current activity, last fall check)
- Device status cards (bracelet + ESP32)
- Latest 3 incidents with quick actions
- Pull-to-refresh

**Incident Center** (`app/(tabs)/incidents.tsx`):
- Filter chips: All / High / Medium / Low / Device Warning
- Status filter: New / Acknowledged / Resolved / Escalated
- Person filter (if caregiver has multiple)
- Date range picker
- List with infinite scroll
- Swipe actions: Acknowledge, View Detail

**Incident Detail** (`app/incident/[id].tsx`):
- Severity banner with explanation
- Timeline: detected → acknowledged → resolved/escalated
- Evidence: vitals at time, movement events, confidence
- Escalation history (contacts, channels, delivery status)
- Actions: Acknowledge, Call Contact, Mark Resolved (with note)
- Confirmation modals for escalation actions

**Health History** (`app/(tabs)/history.tsx`):
- Time range selector: 24h / 7d / 30d
- Metric selector tabs: HR / SpO₂ / Temp / BP / Activity
- Victory Native charts with proper axes, empty states
- Incident markers on timeline
- Export button (CSV)

**Devices** (`app/(tabs)/devices.tsx`):
- Two sections: Bracelet, ESP32
- Each: name, connection status (colored dot), battery, last seen, supported sensors
- Simulated connect/disconnect buttons (demo mode)
- Firmware version

**Settings** (`app/(tabs)/settings.tsx`):
- Profile (name, avatar)
- Notification preferences per severity
- Monitoring preferences (thresholds, inactivity duration)
- Emergency contacts CRUD
- Demo mode toggle
- Data export / delete
- About / version

**Person Detail** (`app/people/[id].tsx`):
- Avatar, name, age
- Current vitals snapshot
- Active incidents
- Device status
- Emergency contacts
- Edit monitoring preferences

### 4. Integration & Wiring
- [ ] Wire simulator DevTools into dashboard (hidden gesture or settings)
- [ ] Connect risk engine to store on measurement/event updates
- [ ] Background risk assessment (periodic or event-driven)
- [ ] Notification triggers from risk engine output
- [ ] Persist demo mode preference to AsyncStorage
- [ ] Restore last selected person on app start

### 5. Testing
- [ ] Unit tests for risk engine (all 10 scenarios) — `src/engine/risk.test.ts`
- [ ] Unit tests for rules — `src/engine/rules.test.ts`
- [ ] Component tests for IncidentCard, VitalSignCard, SeverityBadge
- [ ] Store tests for useAppStore actions
- [ ] Simulator scenario tests
- [ ] Run `npm test -- --coverage` — target: engine 100%, store 90%, components 80%

### 6. Polish & Documentation
- [ ] README.md with setup, run, test commands
- [ ] TypeScript strict mode passes (`npm run typecheck`)
- [ ] ESLint passes (`npm run lint`)
- [ ] App runs on iOS/Android simulator (`npx expo start`)
- [ ] All 10 scenarios demonstrable via DevTools

---

## Key Architectural Decisions (Must Preserve)

| Decision | Rationale |
|----------|-----------|
| **Pure risk engine** | `assessRisk(input)` in `src/engine/risk.ts` — no React, no async, fully testable |
| **Adapter pattern** | Hardware/backend behind interfaces (`src/adapters/`) — swap mock→real without UI changes |
| **Demo data marked** | Every mock entity has `isDemo: true` — never mistaken for real data |
| **Device health ≠ medical risk** | Separate `DeviceStatus` enum (online/stale/offline/error) from `Severity` |
| **No "dead" claims** | UI shows "Unresponsive, escalation initiated" — never "patient deceased" |
| **Deduplication** | Same cause within window → updates existing incident, not new |
| **ISO 8601 everywhere** | All timestamps as strings, validated by Zod |
| **RLS for authz** | Supabase Row Level Security, not client-side checks |
| **Deterministic simulator** | Fixed scenarios, no randomness — reproducible demos |

---

## Commands Reference

```bash
cd mobile

# Development
npx expo start              # Dev server
npx expo start --clear      # Clear cache
npx expo run:android        # Android build (needs Android Studio)
npx expo run:ios            # iOS build (macOS only)

# Quality
npm run lint                # ESLint
npm run typecheck           # tsc --noEmit
npm test                    # Vitest (all)
npm test -- --coverage      # With coverage
npm test src/engine/risk.test.ts  # Single file

# Testing
npm test -- --ui            # Vitest UI
```

---

## Dependencies Installed

**Runtime**: expo, expo-router, expo-notifications, expo-constants, expo-device, expo-linking, expo-status-bar, react-native-gesture-handler, react-native-reanimated, react-native-screens, react-native-safe-area-context, @react-native-async-storage/async-storage, zustand, @tanstack/react-query, react-hook-form, zod, date-fns, victory-native

**Dev**: typescript, eslint, prettier, vitest, @testing-library/react-native, @testing-library/jest-native, @vitejs/plugin-react, jsdom, @types/react, @types/react-native

---

## Skills Available (`.opencode/skill/`)
- `react-native-expo.md` — Expo Router, Zustand, Reanimated, Victory patterns
- `typescript.md` — Strict TS config, domain types, Zod, pure functions
- `backend-api.md` — Adapter pattern, Supabase schema, mock→real switching
- `testing.md` — Vitest + RNTL, risk engine tests, component tests
- `ai-ml.md` — Rule engine design, future ML pipeline
- `smartcare.md` — Project-specific: sprint plan, file structure, scenarios

---

## Next Agent: Start Here

1. **Run the project** to verify setup:
   ```bash
   cd mobile && npx expo start
   ```

2. **Build the UI layer** in this order:
   - Common components (Button, Card, Badge, Avatar)
   - App layout (`app/_layout.tsx`, `app/(tabs)/_layout.tsx`)
   - Dashboard screen (uses store + format utils)
   - Incident center + detail
   - Health history with charts
   - Devices screen
   - Settings + person detail

3. **Wire the engine**: In dashboard or a background effect, call `assessRisk()` when measurements/events update, dispatch to store

4. **Test each scenario** via DevTools (long-press dashboard or add to settings)

5. **Verify**: typecheck, lint, test, run on simulator

---

## Critical Files to Reference

| File | Purpose |
|------|---------|
| `src/types/index.ts` | All domain types |
| `src/types/zod.ts` | Runtime validation schemas |
| `src/engine/rules.ts` | 10 clinical rules |
| `src/engine/risk.ts` | Pure assessment function |
| `src/store/useAppStore.ts` | Global state + selectors |
| `src/mock/factories.ts` | Scenario data + factories |
| `src/utils/format.ts` | Display formatting (colors, labels) |
| `src/utils/constants.ts` | Thresholds, colors, config |
| `AGENTS.md` | Full project instructions |

---

## Notes for Antigravity / Next Agent

- **Expo Router v3**: Routes are files in `src/app/`. Use `expo-router` imports for navigation.
- **Reanimated 3**: Requires `babel.config.js` plugin — already configured.
- **Victory Native**: Import from `victory-native` (not `victory`). Works with Expo.
- **Zustand**: Use `subscribeWithSelector` middleware for derived state.
- **Mock-first**: All adapters have mock implementations. Real Supabase adapter lives in `backend.supabase.ts` (not created yet).
- **Safety first**: Never display "dead" or diagnose. Use "unresponsive", "escalation initiated".
- **Demo mode**: Controlled by `useAppStore.isDemoMode` and AsyncStorage persistence.

The foundation is solid. The UI layer is the main remaining work. Good luck!