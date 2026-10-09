// ESP32 Movement Sensor Adapter Interface
// Mock implementation for Phase 1

import type { MovementEvent } from '@/types';
import { createMockMovementEvent } from '@/mock/factories';

export interface MovementEventAdapter {
  startMonitoring(personId: string): Promise<void>;
  stopMonitoring(personId: string): Promise<void>;
  onMovementEvent(callback: (event: MovementEvent) => void): () => void;
  isConnected(): boolean;
}

export class MockMovementEventAdapter implements MovementEventAdapter {
  private callbacks: Array<(event: MovementEvent) => void> = [];
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private connected = true;
  private personId: string | null = null;
  private scenario: 'normal' | 'fall' | 'inactivity' | 'unusual' | null = 'normal';

  async startMonitoring(personId: string): Promise<void> {
    this.personId = personId;
    this.connected = true;
    this.scenario = 'normal';
    // Simulate periodic normal activity events
    this.intervalId = setInterval(() => {
      if (!this.connected) return;
      const event = createMockMovementEvent({ eventType: 'normalActivity' });
      this.callbacks.forEach(cb => cb(event));
    }, 10000);
  }

  async stopMonitoring(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.connected = false;
  }

  onMovementEvent(callback: (event: MovementEvent) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  isConnected(): boolean {
    return this.connected;
  }

  // Test helpers
  simulateDisconnect(): void {
    this.connected = false;
    const event = createMockMovementEvent({ eventType: 'deviceDisconnected', dataQuality: 'poor' });
    this.callbacks.forEach(cb => cb(event));
  }

  simulateReconnect(): void {
    this.connected = true;
    const event = createMockMovementEvent({ eventType: 'normalActivity' });
    this.callbacks.forEach(cb => cb(event));
  }

  simulateFall(confidence = 0.85): void {
    if (!this.personId) return;
    const event = createMockMovementEvent({
      eventType: 'suspectedFall',
      fallConfidence: confidence,
    });
    this.callbacks.forEach(cb => cb(event));
  }

  simulateInactivity(durationSeconds = 1800): void {
    if (!this.personId) return;
    const event = createMockMovementEvent({
      eventType: 'prolongedInactivity',
      inactivityDurationSeconds: durationSeconds,
    });
    this.callbacks.forEach(cb => cb(event));
  }

  simulatePostFallInactivity(durationSeconds = 1800): void {
    if (!this.personId) return;
    const event = createMockMovementEvent({
      eventType: 'postFallInactivity',
      inactivityDurationSeconds: durationSeconds,
    });
    this.callbacks.forEach(cb => cb(event));
  }

  simulateUnusualMovement(): void {
    if (!this.personId) return;
    const event = createMockMovementEvent({ eventType: 'unusualMovement' });
    this.callbacks.forEach(cb => cb(event));
  }

  setScenario(scenario: 'normal' | 'fall' | 'inactivity' | 'unusual'): void {
    this.scenario = scenario;
  }
}

// Singleton instance for app
export const movementEventAdapter = new MockMovementEventAdapter();