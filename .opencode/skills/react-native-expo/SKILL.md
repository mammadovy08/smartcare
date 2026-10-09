---
name: react-native-expo
description: React Native and Expo conventions for the SmartCare mobile app
---

# React Native + Expo Skill

## Stack
- **Framework**: React Native 0.74+ via Expo SDK 51+
- **Language**: TypeScript (strict mode)
- **Navigation**: Expo Router (file-based, v3+)
- **State**: Zustand (global) + TanStack Query (server)
- **UI**: Custom components + Reanimated 3 for animations
- **Charts**: Victory Native
- **Storage**: @react-native-async-storage/async-storage
- **Notifications**: expo-notifications

## Project Structure
```
src/
â”œâ”€â”€ app/                    # Expo Router screens
â”‚   â”œâ”€â”€ (tabs)/             # Tab layout screens
â”‚   â”œâ”€â”€ incident/[id].tsx   # Dynamic routes
â”‚   â”œâ”€â”€ people/[id].tsx
â”‚   â””â”€â”€ _layout.tsx         # Root layout
â”œâ”€â”€ components/             # Reusable UI components
â”œâ”€â”€ engine/                 # Pure logic (risk assessment)
â”œâ”€â”€ simulator/              # Deterministic test scenarios
â”œâ”€â”€ adapters/               # Hardware/backend interfaces
â”œâ”€â”€ services/               # Notifications, storage, auth
â”œâ”€â”€ store/                  # Zustand stores
â”œâ”€â”€ types/                  # Domain types + Zod schemas
â”œâ”€â”€ mock/                   # Demo data (marked isDemo: true)
â””â”€â”€ utils/                  # Helpers
```

## Key Commands
```bash
npx expo start              # Dev server
npx expo start --clear      # Clear cache
npx expo run:android        # Android build
npx expo run:ios            # iOS build (macOS only)
npx expo install <pkg>      # Expo-managed packages
```

## Critical Patterns

### Expo Router Navigation
```tsx
// app/(tabs)/dashboard.tsx
import { useRouter } from 'expo-router';

export default function Dashboard() {
  const router = useRouter();
  return <Button onPress={() => router.push('/incident/123')} />;
}
```

### Zustand Store (Typed)
```tsx
// store/useAppStore.ts
import { create } from 'zustand';
import { Person, Incident } from '@/types';

interface AppState {
  people: Person[];
  incidents: Incident[];
  addIncident: (i: Incident) => void;
}

export const useAppStore = create<AppState>((set) => ({
  people: [],
  incidents: [],
  addIncident: (incident) => set((s) => ({ incidents: [incident, ...s.incidents] })),
}));
```

### Reanimated 3 Worklet
```tsx
// components/AnimatedMetric.tsx
import Animated, { useSharedValue, withTiming } from 'react-native-reanimated';

const scale = useSharedValue(1);
scale.value = withTiming(1.2, { duration: 200 });
```

### Victory Native Chart
```tsx
import { VictoryChart, VictoryLine, VictoryTheme } from 'victory-native';

<VictoryChart theme={VictoryTheme.material}>
  <VictoryLine data={data} x="time" y="value" />
</VictoryChart>
```

## TypeScript Config (tsconfig.json)
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

## Gotchas
| Issue | Fix |
|-------|-----|
| TS server stale after new route | Restart TS server in VS Code (`Cmd+Shift+P` â†’ "TypeScript: Restart TS Server") |
| Reanimated 3 not working | Add `plugin: 'react-native-reanimated/plugin'` to `babel.config.js` |
| Cleartext HTTP on Android | Set `android:usesCleartextTraffic="true"` in `app.json` |
| Safe area insets | Wrap root in `<SafeAreaProvider>` (Expo template includes) |
| Metro cache issues | Run `npx expo start --clear` |

## Testing
```bash
npm test                      # Jest + React Native Testing Library
npm test -- --testNamePattern="risk engine"
```

## Phase 1 Deliverables
- [ ] Tab navigation (Dashboard, Incidents, History, Devices, Settings)
- [ ] Dashboard with simulated vitals + movement + device status
- [ ] Risk engine classifying 10 deterministic scenarios
- [ ] Incident center: list, filter, acknowledge, detail
- [ ] Health history charts (24h/7d/30d)
- [ ] Device screen (bracelet + ESP32 status)
- [ ] Emergency contacts CRUD + test notification
- [ ] Settings with inactivity duration, alert prefs, demo toggle
