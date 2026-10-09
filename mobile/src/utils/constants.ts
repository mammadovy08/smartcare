// Constants
// App-wide constants, configuration defaults

export const APP_NAME = 'SmartCare';
export const APP_VERSION = '1.0.0';
export const APP_SCHEME = 'smartcare';

export const DEFAULT_REFRESH_INTERVAL_MS = 30000; // 30 seconds
export const MAX_OFFLINE_QUEUE_SIZE = 100;
export const MAX_HISTORY_POINTS = 500;

export const VITAL_THRESHOLDS = {
  heartRate: { min: 40, max: 120, criticalMin: 30, criticalMax: 150 },
  spo2: { min: 90, criticalMin: 85 },
  temperature: { min: 35.0, max: 38.5, criticalMin: 34.0, criticalMax: 40.0 },
  systolicBP: { min: 90, max: 160, criticalMin: 70, criticalMax: 200 },
  diastolicBP: { min: 50, max: 100, criticalMin: 40, criticalMax: 120 },
} as const;

export const FALL_DETECTION = {
  confidenceThreshold: 0.7,
  inactivityThresholdSeconds: 1800, // 30 minutes
  postFallInactivityThresholdSeconds: 300, // 5 minutes
} as const;

export const DATA_FRESHNESS = {
  measurementStaleMinutes: 10,
  movementStaleMinutes: 15,
  deviceOfflineMinutes: 20,
} as const;

export const INCIDENT_DEDUPLICATION = {
  high: 10, // minutes
  medium: 15,
  low: 30,
  'device-warning': 5,
} as const;

export const NOTIFICATION_CHANNELS = {
  low: ['in-app'] as const,
  medium: ['push', 'in-app'] as const,
  high: ['push', 'sms', 'call', 'in-app'] as const,
  'device-warning': ['push', 'in-app'] as const,
};

export const ESCALATION_DELAYS = {
  medium: 15 * 60 * 1000, // 15 minutes
  high: 0, // immediate
} as const;

export const CHART_COLORS = {
  heartRate: '#DC2626',
  spo2: '#2563EB',
  temperature: '#F59E0B',
  systolicBP: '#7C3AED',
  diastolicBP: '#A855F7',
} as const;

export const DEVICE_TYPES = {
  BRACELET: 'bracelet',
  ESP32: 'esp32',
} as const;

export const SEVERITY_ORDER: ('high' | 'medium' | 'low' | 'device-warning')[] = [
  'high',
  'medium',
  'low',
  'device-warning',
];

export const INCIDENT_STATUS_ORDER: ('new' | 'acknowledged' | 'escalated' | 'resolved')[] = [
  'new',
  'acknowledged',
  'escalated',
  'resolved',
];

export const TIME_RANGES = {
  '24h': { label: '24 Hours', hours: 24 },
  '7d': { label: '7 Days', hours: 24 * 7 },
  '30d': { label: '30 Days', hours: 24 * 30 },
} as const;

export const SCREEN_NAMES = {
  DASHBOARD: 'Dashboard',
  INCIDENTS: 'Incidents',
  HISTORY: 'History',
  DEVICES: 'Devices',
  SETTINGS: 'Settings',
  INCIDENT_DETAIL: 'IncidentDetail',
  PERSON_DETAIL: 'PersonDetail',
} as const;

export const STORAGE_KEYS = {
  USER_PREFERENCES: '@smartcare:user_preferences',
  DEMO_MODE: '@smartcare:demo_mode',
  LAST_SELECTED_PERSON: '@smartcare:last_selected_person',
  NOTIFICATION_SETTINGS: '@smartcare:notification_settings',
  DEVICE_TOKENS: '@smartcare:device_tokens',
  OFFLINE_QUEUE: '@smartcare:offline_queue',
} as const;

export const EXPO_CONFIG = {
  PROJECT_ID: process.env['EXPO_PUBLIC_EAS_PROJECT_ID'] || '',
  SUPABASE_URL: process.env['EXPO_PUBLIC_SUPABASE_URL'] || '',
  SUPABASE_ANON_KEY: process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY'] || '',
  API_BASE_URL: process.env['EXPO_PUBLIC_API_BASE_URL'] || 'http://localhost:3000',
} as const;