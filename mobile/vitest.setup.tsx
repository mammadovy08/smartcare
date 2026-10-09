import '@testing-library/jest-native';
import { vi } from 'vitest';
import { TextEncoder, TextDecoder } from 'util';

const g = globalThis as unknown as Record<string, unknown>;
g['TextEncoder'] = TextEncoder;
g['TextDecoder'] = TextDecoder;

// Mock Expo modules
vi.mock('expo-router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useLocalSearchParams: () => ({}),
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSegments: () => [],
  usePathname: () => '/',
}));

vi.mock('expo-notifications', () => ({
  getPermissionsAsync: vi.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: vi.fn().mockResolvedValue({ status: 'granted' }),
  scheduleNotificationAsync: vi.fn(),
  setNotificationHandler: vi.fn(),
  AndroidImportance: { HIGH: 4, MAX: 5 },
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  getItem: vi.fn().mockResolvedValue(null),
  setItem: vi.fn().mockResolvedValue(undefined),
  removeItem: vi.fn().mockResolvedValue(undefined),
  multiGet: vi.fn().mockResolvedValue([]),
  multiSet: vi.fn().mockResolvedValue(undefined),
  multiRemove: vi.fn().mockResolvedValue(undefined),
  clear: vi.fn().mockResolvedValue(undefined),
  getAllKeys: vi.fn().mockResolvedValue([]),
}));

vi.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      router: { origin: false },
      eas: { projectId: '' },
    },
  },
}));

vi.mock('expo-device', () => ({
  isDevice: true,
  modelName: 'Test Device',
  osName: 'android',
  osVersion: '14',
}));

vi.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock react-native-gesture-handler
vi.mock('react-native-gesture-handler', () => {
  return {
    GestureDetector: ({ children }: { children: React.ReactNode }) => children,
    PanGestureHandler: ({ children }: { children: React.ReactNode }) => children,
    TapGestureHandler: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock victory-native
vi.mock('victory-native', () => ({
  VictoryChart: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  VictoryLine: () => null,
  VictoryBar: () => null,
  VictoryAxis: () => null,
  VictoryTheme: { material: {} },
}));

// Suppress specific warnings
const originalError = console.error;
console.error = (...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (
    msg.includes('Warning: ReactDOM.render is no longer supported') ||
    msg.includes('act(...)') ||
    msg.includes('useLayoutEffect')
  ) {
    return;
  }
  originalError.apply(console, args);
};