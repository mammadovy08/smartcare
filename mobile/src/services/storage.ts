// AsyncStorage Wrapper
// Type-safe storage with JSON serialization

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER_PREFERENCES: '@smartcare:user_preferences',
  DEMO_MODE: '@smartcare:demo_mode',
  LAST_SELECTED_PERSON: '@smartcare:last_selected_person',
  NOTIFICATION_SETTINGS: '@smartcare:notification_settings',
  DEVICE_TOKENS: '@smartcare:device_tokens',
  OFFLINE_QUEUE: '@smartcare:offline_queue',
  AUTH_TOKEN: '@smartcare:auth_token',
} as const;

type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  units: 'metric' | 'imperial';
  autoRefresh: boolean;
  refreshIntervalMinutes: number;
}

export interface NotificationSettings {
  pushEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  quietHours: { enabled: boolean; start: string; end: string }; // HH:mm format
}

export class StorageService {
  private static instance: StorageService;

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // Generic get/set
  async get<T>(key: StorageKey): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Storage get error for ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: StorageKey, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Storage set error for ${key}:`, error);
    }
  }

  async remove(key: StorageKey): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Storage remove error for ${key}:`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  }

  // Specific methods
  async getUserPreferences(): Promise<UserPreferences> {
    const prefs = await this.get<UserPreferences>(STORAGE_KEYS.USER_PREFERENCES);
    return prefs || {
      theme: 'system',
      language: 'en',
      units: 'metric',
      autoRefresh: true,
      refreshIntervalMinutes: 5,
    };
  }

  async setUserPreferences(prefs: Partial<UserPreferences>): Promise<void> {
    const current = await this.getUserPreferences();
    await this.set(STORAGE_KEYS.USER_PREFERENCES, { ...current, ...prefs });
  }

  async getDemoMode(): Promise<boolean> {
    const value = await this.get<boolean>(STORAGE_KEYS.DEMO_MODE);
    return value ?? true;
  }

  async setDemoMode(enabled: boolean): Promise<void> {
    await this.set(STORAGE_KEYS.DEMO_MODE, enabled);
  }

  async getLastSelectedPerson(): Promise<string | null> {
    return this.get<string>(STORAGE_KEYS.LAST_SELECTED_PERSON);
  }

  async setLastSelectedPerson(personId: string): Promise<void> {
    await this.set(STORAGE_KEYS.LAST_SELECTED_PERSON, personId);
  }

  async getAuthToken(): Promise<string | null> {
    return this.get<string>(STORAGE_KEYS.AUTH_TOKEN);
  }

  async setAuthToken(token: string): Promise<void> {
    await this.set(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  async removeAuthToken(): Promise<void> {
    await this.remove(STORAGE_KEYS.AUTH_TOKEN);
  }

  async getNotificationSettings(): Promise<NotificationSettings> {
    const settings = await this.get<NotificationSettings>(STORAGE_KEYS.NOTIFICATION_SETTINGS);
    return settings || {
      pushEnabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
      quietHours: { enabled: false, start: '22:00', end: '07:00' },
    };
  }

  async setNotificationSettings(settings: Partial<NotificationSettings>): Promise<void> {
    const current = await this.getNotificationSettings();
    await this.set(STORAGE_KEYS.NOTIFICATION_SETTINGS, { ...current, ...settings });
  }

  async getDeviceTokens(): Promise<Record<string, string>> {
    const tokens = await this.get<Record<string, string>>(STORAGE_KEYS.DEVICE_TOKENS);
    return tokens || {};
  }

  async setDeviceToken(deviceId: string, token: string): Promise<void> {
    const tokens = await this.getDeviceTokens();
    tokens[deviceId] = token;
    await this.set(STORAGE_KEYS.DEVICE_TOKENS, tokens);
  }

  async removeDeviceToken(deviceId: string): Promise<void> {
    const tokens = await this.getDeviceTokens();
    delete tokens[deviceId];
    await this.set(STORAGE_KEYS.DEVICE_TOKENS, tokens);
  }

  // Offline queue for when network is unavailable
  async addToOfflineQueue<T>(action: { type: string; payload: T; timestamp: string }): Promise<void> {
    const queue = await this.getOfflineQueue();
    queue.push(action);
    await this.set(STORAGE_KEYS.OFFLINE_QUEUE, queue);
  }

  async getOfflineQueue(): Promise<Array<{ type: string; payload: unknown; timestamp: string }>> {
    const queue = await this.get<Array<{ type: string; payload: unknown; timestamp: string }>>(STORAGE_KEYS.OFFLINE_QUEUE);
    return queue || [];
  }

  async clearOfflineQueue(): Promise<void> {
    await this.remove(STORAGE_KEYS.OFFLINE_QUEUE);
  }

  async processOfflineQueue(processor: (action: { type: string; payload: unknown; timestamp: string }) => Promise<void>): Promise<void> {
    const queue = await this.getOfflineQueue();
    for (const action of queue) {
      try {
        await processor(action);
      } catch (error) {
        console.error('Failed to process offline action:', action, error);
        // Keep failed actions in queue for retry
        return;
      }
    }
    await this.clearOfflineQueue();
  }
}

export const storage = StorageService.getInstance();