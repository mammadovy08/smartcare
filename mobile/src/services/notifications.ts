// Notification Service Abstraction
// Mock implementation for Phase 1

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { EmergencyContact } from '@/types';

export interface NotificationService {
  sendLocal(title: string, body: string, data?: Record<string, unknown>): Promise<void>;
  sendPush(token: string, title: string, body: string, data?: Record<string, unknown>): Promise<DeliveryResult>;
  sendSMS(phone: string, message: string): Promise<DeliveryResult>;
  sendCall(phone: string, message: string): Promise<DeliveryResult>;
  onNotificationReceived(callback: (notification: Notification) => void): () => void;
  requestPermissions(): Promise<boolean>;
  getExpoPushToken(): Promise<string | null>;
}

export interface DeliveryResult {
  success: boolean;
  providerId: string;
  error: string | undefined;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  data: Record<string, unknown> | undefined;
  timestamp: string;
}

export interface NotificationConfig {
  incidentId: string;
  personId: string;
  personName: string;
  severity: 'low' | 'medium' | 'high' | 'device-warning';
  title: string;
  explanation: string;
  contacts: EmergencyContact[];
}

// Mock implementation for development
export class MockNotificationService implements NotificationService {
  private callbacks: Array<(notification: Notification) => void> = [];
  private sentNotifications: Notification[] = [];

  async sendLocal(title: string, body: string, data?: Record<string, unknown>): Promise<void> {
    const notification: Notification = {
      id: `notif_${Date.now()}`,
      title,
      body,
      data,
      timestamp: new Date().toISOString(),
    };
    this.sentNotifications.push(notification);
    this.callbacks.forEach(cb => cb(notification));
    console.log('[MockNotification] Local:', title, body);
  }

  async sendPush(token: string, title: string, body: string, data?: Record<string, unknown>): Promise<DeliveryResult> {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 100));
    const notification: Notification = {
      id: `push_${Date.now()}`,
      title,
      body,
      data,
      timestamp: new Date().toISOString(),
    };
    this.sentNotifications.push(notification);
    this.callbacks.forEach(cb => cb(notification));
    console.log('[MockNotification] Push:', title, body, 'to', token);
    return { success: true, providerId: 'expo-push', error: undefined };
  }

  async sendSMS(phone: string, message: string): Promise<DeliveryResult> {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 200));
    console.log('[MockNotification] SMS:', message, 'to', phone);
    // Simulate 95% success rate
    const success = Math.random() > 0.05;
    return {
      success,
      providerId: 'twilio',
      error: success ? undefined : 'Carrier rejected',
    };
  }

  async sendCall(phone: string, message: string): Promise<DeliveryResult> {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 300));
    console.log('[MockNotification] Call:', message, 'to', phone);
    // Simulate 90% success rate
    const success = Math.random() > 0.1;
    return {
      success,
      providerId: 'twilio-voice',
      error: success ? undefined : 'No answer',
    };
  }

  onNotificationReceived(callback: (notification: Notification) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  async requestPermissions(): Promise<boolean> {
    return true;
  }

  async getExpoPushToken(): Promise<string | null> {
    return 'ExponentPushToken[mock-token]';
  }

  // Test helpers
  getSentNotifications(): Notification[] {
    return [...this.sentNotifications];
  }

  clearSentNotifications(): void {
    this.sentNotifications = [];
  }
}

// Production implementation using Expo Notifications
export class ExpoNotificationService implements NotificationService {
  private callbacks: Array<(notification: Notification) => void> = [];

  constructor() {
    this.configure();
  }

  private configure(): void {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // Handle received notifications
    Notifications.addNotificationReceivedListener(notification => {
      const n: Notification = {
        id: notification.request.identifier,
        title: notification.request.content.title || '',
        body: notification.request.content.body || '',
        data: notification.request.content.data as Record<string, unknown> | undefined,
        timestamp: new Date().toISOString(),
      };
      this.callbacks.forEach(cb => cb(n));
    });
  }

  async sendLocal(title: string, body: string, data?: Record<string, unknown>): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data },
      trigger: null, // Immediate
    });
  }

  async sendPush(token: string, title: string, body: string, data?: Record<string, unknown>): Promise<DeliveryResult> {
    try {
      // In production, this would call your backend to send push via Expo Push Service
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: token,
          title,
          body,
          data,
          sound: 'default',
          priority: 'high',
        }),
      });
      const result = await response.json();
      return { success: result.data?.status === 'ok', providerId: 'expo-push', error: undefined };
    } catch (error) {
      return { success: false, providerId: 'expo-push', error: String(error) };
    }
  }

  async sendSMS(phone: string, message: string): Promise<DeliveryResult> {
    // In production, integrate with Twilio, Vonage, or similar
    console.warn('SMS not implemented - use backend service');
    return { success: false, providerId: 'sms', error: 'Not implemented' };
  }

  async sendCall(phone: string, message: string): Promise<DeliveryResult> {
    // In production, integrate with Twilio Voice or similar
    console.warn('Voice call not implemented - use backend service');
    return { success: false, providerId: 'voice', error: 'Not implemented' };
  }

  onNotificationReceived(callback: (notification: Notification) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  }

  async getExpoPushToken(): Promise<string | null> {
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env['EXPO_PUBLIC_EAS_PROJECT_ID'],
      });
      return token.data;
    } catch {
      return null;
    }
  }
}

// Factory function to get the right implementation
export function createNotificationService(): NotificationService {
  if (__DEV__ && !process.env['EXPO_PUBLIC_SUPABASE_URL']) {
    return new MockNotificationService();
  }
  return new ExpoNotificationService();
}

// Singleton
export const notificationService = createNotificationService();

// High-level notification function for incidents
export async function notifyIncident(config: NotificationConfig): Promise<DeliveryResult[]> {
  const results: DeliveryResult[] = [];
  const { severity, contacts, personName, title, explanation, incidentId } = config;

  // Determine channels based on severity
  const channels = getChannelsForSeverity(severity);

  for (const contact of contacts.sort((a, b) => a.priority - b.priority)) {
    const contactResults = await notifyContact(contact, {
      title: `[${severity.toUpperCase()}] ${title}`,
      body: `${personName}: ${explanation}`,
      data: { incidentId, personName, severity, contactId: contact.id },
    }, channels);
    results.push(...contactResults);
  }

  return results;
}

function getChannelsForSeverity(severity: NotificationConfig['severity']): ('push' | 'sms' | 'call' | 'in-app')[] {
  switch (severity) {
    case 'high':
      return ['push', 'sms', 'call', 'in-app'];
    case 'medium':
      return ['push', 'in-app'];
    case 'low':
      return ['in-app'];
    case 'device-warning':
      return ['push', 'in-app'];
    default:
      return ['in-app'];
  }
}

async function notifyContact(
  contact: EmergencyContact,
  notification: { title: string; body: string; data: Record<string, unknown> },
  channels: ('push' | 'sms' | 'call' | 'in-app')[]
): Promise<DeliveryResult[]> {
  const results: DeliveryResult[] = [];

  for (const channel of channels) {
    switch (channel) {
      case 'push':
        if (contact.preferredMethod === 'push' || contact.preferredMethod === 'call') {
          // Would need push token from backend
          results.push({ success: true, providerId: 'push', error: undefined });
        }
        break;
      case 'sms':
        if (contact.phoneNumber) {
          results.push(await notificationService.sendSMS(contact.phoneNumber, notification.body));
        }
        break;
      case 'call':
        if (contact.phoneNumber && contact.preferredMethod === 'call') {
          results.push(await notificationService.sendCall(contact.phoneNumber, notification.body));
        }
        break;
      case 'in-app':
        // Handled by local notification
        await notificationService.sendLocal(notification.title, notification.body, notification.data);
        results.push({ success: true, providerId: 'in-app', error: undefined });
        break;
    }
  }

  return results;
}