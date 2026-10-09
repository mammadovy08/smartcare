// Backend Service Adapter Interface
// Mock implementation for Phase 1, Supabase-ready for Phase 3+

import type {
  Person,
  HealthMeasurement,
  MovementEvent,
  Incident,
  Device,
  EmergencyContact,
  TimeRange,
  IncidentFilters,
  AuthResult,
  User,
  SignUpData,
  CreatePersonData,
} from '@/types';
import { mockPeople, mockDevices, mockEmergencyContacts, mockIncidents } from '@/mock';

export interface BackendService {
  // Auth
  signIn(email: string, password: string): Promise<AuthResult>;
  signUp(data: SignUpData): Promise<AuthResult>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<User | null>;

  // People
  getPeople(caregiverId: string): Promise<Person[]>;
  getPerson(id: string): Promise<Person | null>;
  createPerson(data: CreatePersonData): Promise<Person>;
  updatePerson(id: string, data: Partial<Person>): Promise<Person>;

  // Measurements
  saveMeasurement(m: HealthMeasurement): Promise<void>;
  getMeasurements(personId: string, range: TimeRange): Promise<HealthMeasurement[]>;

  // Movement Events
  saveMovementEvent(e: MovementEvent): Promise<void>;
  getMovementEvents(personId: string, range: TimeRange): Promise<MovementEvent[]>;

  // Incidents
  saveIncident(i: Incident): Promise<void>;
  getIncidents(filters: IncidentFilters): Promise<Incident[]>;
  acknowledgeIncident(id: string, caregiverId: string): Promise<void>;
  resolveIncident(id: string, note: string): Promise<void>;

  // Devices
  getDevices(personId: string): Promise<Device[]>;
  updateDeviceStatus(id: string, status: Device['connectionStatus']): Promise<void>;

  // Emergency Contacts
  getEmergencyContacts(personId: string): Promise<EmergencyContact[]>;
  saveEmergencyContact(c: EmergencyContact): Promise<void>;
  deleteEmergencyContact(id: string): Promise<void>;

  // Real-time subscriptions
  subscribeToIncidents(personId: string, callback: IncidentCallback): Subscription;
  subscribeToMeasurements(personId: string, callback: MeasurementCallback): Subscription;
}

export interface Subscription {
  unsubscribe(): void;
}

export type IncidentCallback = (incident: Incident) => void;
export type MeasurementCallback = (measurement: HealthMeasurement) => void;

// Mock implementation using in-memory storage
export class MockBackendService implements BackendService {
  private delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  private incidentCallbacks: Map<string, Array<(incident: Incident) => void>> = new Map();
  private measurementCallbacks: Map<string, Array<(measurement: HealthMeasurement) => void>> = new Map();

  private people = [...mockPeople];
  private devices = [...mockDevices];
  private emergencyContacts = [...mockEmergencyContacts];
  private incidents = [...mockIncidents];
  private measurements: HealthMeasurement[] = [];
  private movementEvents: MovementEvent[] = [];

  // Auth
  async signIn(email: string, password: string): Promise<AuthResult> {
    await this.delay(500);
    const domainPrefix = email.split('@')[0]?.toLowerCase() ?? '';
    const user = this.people.find(p => p.name.toLowerCase().includes(domainPrefix));
    if (user) {
      return { user: { id: user.id, email, name: user.name }, session: { accessToken: 'mock-token' } };
    }
    throw new Error('Invalid credentials');
  }

  async signUp(data: SignUpData): Promise<AuthResult> {
    await this.delay(500);
    return { user: { id: 'new-user', email: data.email, name: data.name }, session: { accessToken: 'mock-token' } };
  }

  async signOut(): Promise<void> {
    await this.delay(100);
  }

  async getCurrentUser(): Promise<User | null> {
    await this.delay(100);
    return { id: 'caregiver-demo-1', email: 'caregiver@demo.com', name: 'Demo Caregiver' };
  }

  // People
  async getPeople(caregiverId: string): Promise<Person[]> {
    await this.delay(300);
    return this.people.filter(p => p.assignedCaregiverIds.includes(caregiverId));
  }

  async getPerson(id: string): Promise<Person | null> {
    await this.delay(200);
    return this.people.find(p => p.id === id) || null;
  }

  async createPerson(data: CreatePersonData): Promise<Person> {
    await this.delay(300);
    const person: Person = {
      id: `person-${Date.now()}`,
      ...data,
      assignedCaregiverIds: [data.caregiverId],
      monitoringPreferences: data.monitoringPreferences,
      createdAt: new Date().toISOString(),
    };
    this.people.push(person);
    return person;
  }

  async updatePerson(id: string, data: Partial<Person>): Promise<Person> {
    await this.delay(300);
    const index = this.people.findIndex(p => p.id === id);
    const current = this.people[index];
    if (index === -1 || !current) throw new Error('Person not found');
    const updated: Person = {
      ...current,
      ...data,
      id: current.id,
      name: data.name ?? current.name,
      assignedCaregiverIds: data.assignedCaregiverIds ?? current.assignedCaregiverIds,
      monitoringPreferences: data.monitoringPreferences ?? current.monitoringPreferences,
      createdAt: current.createdAt,
    };
    this.people[index] = updated;
    return updated;
  }

  // Measurements
  async saveMeasurement(m: HealthMeasurement): Promise<void> {
    await this.delay(50);
    this.measurements.push(m);
    // Notify subscribers
    const callbacks = this.measurementCallbacks.get(m.personId) || [];
    callbacks.forEach(cb => cb(m));
  }

  async getMeasurements(personId: string, range: TimeRange): Promise<HealthMeasurement[]> {
    await this.delay(200);
    return this.measurements
      .filter(m =>
        m.personId === personId &&
        new Date(m.measuredAt) >= new Date(range.start) &&
        new Date(m.measuredAt) <= new Date(range.end)
      )
      .sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime());
  }

  // Movement Events
  async saveMovementEvent(e: MovementEvent): Promise<void> {
    await this.delay(50);
    this.movementEvents.push(e);
  }

  async getMovementEvents(personId: string, range: TimeRange): Promise<MovementEvent[]> {
    await this.delay(200);
    return this.movementEvents
      .filter(e =>
        e.personId === personId &&
        new Date(e.occurredAt) >= new Date(range.start) &&
        new Date(e.occurredAt) <= new Date(range.end)
      )
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  }

  // Incidents
  async saveIncident(i: Incident): Promise<void> {
    await this.delay(100);
    this.incidents.unshift(i);
    // Notify subscribers
    const callbacks = this.incidentCallbacks.get(i.personId) || [];
    callbacks.forEach(cb => cb(i));
  }

  async getIncidents(filters: IncidentFilters): Promise<Incident[]> {
    await this.delay(200);
    let result = [...this.incidents];

    if (filters.personId) {
      result = result.filter(i => i.personId === filters.personId);
    }
    if (filters.severity?.length) {
      result = result.filter(i => filters.severity!.includes(i.severity));
    }
    if (filters.status?.length) {
      result = result.filter(i => filters.status!.includes(i.status));
    }
    if (filters.dateRange) {
      result = result.filter(i =>
        new Date(i.detectedAt) >= new Date(filters.dateRange!.start) &&
        new Date(i.detectedAt) <= new Date(filters.dateRange!.end)
      );
    }
    if (filters.incidentType?.length) {
      result = result.filter(i => filters.incidentType!.includes(i.incidentType));
    }

    return result.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
  }

  async acknowledgeIncident(id: string, caregiverId: string): Promise<void> {
    await this.delay(100);
    const incident = this.incidents.find(i => i.id === id);
    if (incident) {
      incident.status = 'acknowledged';
      incident.acknowledgedAt = new Date().toISOString();
      incident.acknowledgedBy = caregiverId;
      incident.updatedAt = new Date().toISOString();
    }
  }

  async resolveIncident(id: string, note: string): Promise<void> {
    await this.delay(100);
    const incident = this.incidents.find(i => i.id === id);
    if (incident) {
      incident.status = 'resolved';
      incident.resolvedAt = new Date().toISOString();
      incident.resolutionNote = note;
      incident.updatedAt = new Date().toISOString();
    }
  }

  // Devices
  async getDevices(personId: string): Promise<Device[]> {
    await this.delay(200);
    return this.devices.filter(d => d.personId === personId);
  }

  async updateDeviceStatus(id: string, connectionStatus: Device['connectionStatus']): Promise<void> {
    await this.delay(100);
    const device = this.devices.find(d => d.id === id);
    if (device) {
      device.connectionStatus = connectionStatus;
      device.lastSeenAt = new Date().toISOString();
    }
  }

  // Emergency Contacts
  async getEmergencyContacts(personId: string): Promise<EmergencyContact[]> {
    await this.delay(200);
    return this.emergencyContacts.filter(c => c.personId === personId);
  }

  async saveEmergencyContact(c: EmergencyContact): Promise<void> {
    await this.delay(100);
    const existing = this.emergencyContacts.findIndex(e => e.id === c.id);
    if (existing >= 0) {
      this.emergencyContacts[existing] = c;
    } else {
      this.emergencyContacts.push(c);
    }
  }

  async deleteEmergencyContact(id: string): Promise<void> {
    await this.delay(100);
    this.emergencyContacts = this.emergencyContacts.filter(c => c.id !== id);
  }

  // Subscriptions
  subscribeToIncidents(personId: string, callback: (i: Incident) => void): Subscription {
    const callbacks = this.incidentCallbacks.get(personId) || [];
    callbacks.push(callback);
    this.incidentCallbacks.set(personId, callbacks);

    return {
      unsubscribe: () => {
        const updated = callbacks.filter(cb => cb !== callback);
        if (updated.length === 0) {
          this.incidentCallbacks.delete(personId);
        } else {
          this.incidentCallbacks.set(personId, updated);
        }
      },
    };
  }

  subscribeToMeasurements(personId: string, callback: (m: HealthMeasurement) => void): Subscription {
    const callbacks = this.measurementCallbacks.get(personId) || [];
    callbacks.push(callback);
    this.measurementCallbacks.set(personId, callbacks);

    return {
      unsubscribe: () => {
        const updated = callbacks.filter(cb => cb !== callback);
        if (updated.length === 0) {
          this.measurementCallbacks.delete(personId);
        } else {
          this.measurementCallbacks.set(personId, updated);
        }
      },
    };
  }

  // Test helpers
  clearAllData(): void {
    this.incidents = [...mockIncidents];
    this.measurements = [];
    this.movementEvents = [];
  }

  getIncidentsCount(): number {
    return this.incidents.length;
  }
}

// Singleton instance
export const backendService = new MockBackendService();