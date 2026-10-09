// Health Bracelet Adapter Interface
// Mock implementation for Phase 1

import type { HealthMeasurement } from '@/types';
import { createMockMeasurements } from '@/mock/factories';

export interface HealthDataAdapter {
  startMonitoring(personId: string): Promise<void>;
  stopMonitoring(personId: string): Promise<void>;
  onMeasurement(callback: (measurement: HealthMeasurement) => void): () => void;
  getLatestMeasurements(personId: string): Promise<HealthMeasurement[]>;
  isConnected(): boolean;
}

export class MockHealthDataAdapter implements HealthDataAdapter {
  private callbacks: Array<(measurement: HealthMeasurement) => void> = [];
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private connected = true;
  private personId: string | null = null;

  async startMonitoring(personId: string): Promise<void> {
    this.personId = personId;
    this.connected = true;
    // Simulate periodic measurements every 30 seconds
    this.intervalId = setInterval(() => {
      if (!this.connected) return;
      const measurements = createMockMeasurements({
        heartRate: 65 + Math.floor(Math.random() * 15),
        spo2: 95 + Math.floor(Math.random() * 5),
        temperature: 36.5 + Math.random() * 1,
      });
      measurements.forEach(m => this.callbacks.forEach(cb => cb(m)));
    }, 30000);
  }

  async stopMonitoring(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.connected = false;
  }

  onMeasurement(callback: (measurement: HealthMeasurement) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  async getLatestMeasurements(personId: string): Promise<HealthMeasurement[]> {
    return createMockMeasurements({
      heartRate: 72,
      spo2: 98,
      temperature: 36.8,
    });
  }

  isConnected(): boolean {
    return this.connected;
  }

  // Test helpers
  simulateDisconnect(): void {
    this.connected = false;
  }

  simulateReconnect(): void {
    this.connected = true;
  }

  simulateAnomaly(): void {
    if (!this.personId) return;
    const measurements = createMockMeasurements({
      heartRate: 110,
      spo2: 88,
      temperature: 38.2,
    });
    measurements.forEach(m => this.callbacks.forEach(cb => cb(m)));
  }
}

// Singleton instance for app
export const healthDataAdapter = new MockHealthDataAdapter();