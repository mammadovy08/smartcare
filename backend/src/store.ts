import type {
  Person,
  Device,
  EmergencyContact,
  HealthMeasurement,
  MovementEvent,
  Incident,
} from './types.js';
import { assessRisk } from './engine.js';

export class DataStore {
  private people: Map<string, Person> = new Map();
  private devices: Map<string, Device> = new Map();
  private contacts: Map<string, EmergencyContact> = new Map();
  private measurements: HealthMeasurement[] = [];
  private movementEvents: MovementEvent[] = [];
  private incidents: Incident[] = [];

  private listeners: ((event: { type: string; data: unknown }) => void)[] = [];

  constructor() {
    this.seedInitialData();
  }

  public subscribe(cb: (event: { type: string; data: unknown }) => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private broadcast(type: string, data: unknown) {
    for (const listener of this.listeners) {
      try {
        listener({ type, data });
      } catch (err) {
        console.error('Broadcast error:', err);
      }
    }
  }

  private seedInitialData() {
    const demoPerson: Person = {
      id: 'person-demo-1',
      fullName: 'Eleanor Vance',
      preferredName: 'Ellie',
      birthDate: '1948-03-14',
      gender: 'female',
      roomOrUnit: 'Room 204B',
      notes: 'History of hypertension and mild unsteady gait.',
      assignedCaregiverIds: ['cg-1'],
      monitoringPreferences: {
        inactivityThresholdMinutes: 30,
        heartRate: { min: 50, max: 100, criticalMin: 40, criticalMax: 130 },
        spo2: { min: 92, criticalMin: 88 },
        temperature: { min: 36.0, max: 37.5, criticalMin: 35.0, criticalMax: 38.5 },
        systolicBP: { min: 90, max: 140, criticalMin: 80, criticalMax: 170 },
        diastolicBP: { min: 60, max: 90, criticalMin: 50, criticalMax: 105 },
        fallConfidenceThreshold: 0.7,
        measurementStaleMinutes: 10,
        movementStaleMinutes: 15,
      },
      isActive: true,
      isDemo: true,
    };
    this.people.set(demoPerson.id, demoPerson);

    const bracelet: Device = {
      id: 'bracelet-01',
      personId: demoPerson.id,
      deviceType: 'bracelet',
      name: 'SmartCare Band Pro',
      status: 'online',
      batteryPercentage: 86,
      lastSeenAt: new Date().toISOString(),
      firmwareVersion: 'v2.4.1',
      isDemo: true,
    };
    const esp32: Device = {
      id: 'esp32-01',
      personId: demoPerson.id,
      deviceType: 'esp32',
      name: 'ESP32 Room Fall Radar',
      status: 'online',
      batteryPercentage: 100,
      lastSeenAt: new Date().toISOString(),
      firmwareVersion: 'v1.8.0',
      isDemo: true,
    };
    this.devices.set(bracelet.id, bracelet);
    this.devices.set(esp32.id, esp32);

    const contact1: EmergencyContact = {
      id: 'contact-1',
      personId: demoPerson.id,
      name: 'Sarah Vance (Daughter)',
      relationship: 'Primary Family Contact',
      phoneNumber: '+1-555-019-2834',
      priority: 1,
      isEscalationContact: true,
      preferredMethod: 'call',
    };
    const contact2: EmergencyContact = {
      id: 'contact-2',
      personId: demoPerson.id,
      name: 'Dr. Marcus Webb',
      relationship: 'Attending Physician',
      phoneNumber: '+1-555-018-9901',
      priority: 2,
      isEscalationContact: false,
      preferredMethod: 'sms',
    };
    this.contacts.set(contact1.id, contact1);
    this.contacts.set(contact2.id, contact2);

    // Initial baseline measurements
    const now = new Date();
    this.measurements.push(
      {
        id: 'm-1',
        personId: demoPerson.id,
        sourceDeviceId: bracelet.id,
        metricType: 'heartRate',
        value: 72,
        unit: 'bpm',
        measuredAt: now.toISOString(),
        receivedAt: now.toISOString(),
        validityStatus: 'valid',
        signalQuality: 'good',
        isDemo: true,
      },
      {
        id: 'm-2',
        personId: demoPerson.id,
        sourceDeviceId: bracelet.id,
        metricType: 'spo2',
        value: 98,
        unit: '%',
        measuredAt: now.toISOString(),
        receivedAt: now.toISOString(),
        validityStatus: 'valid',
        signalQuality: 'good',
        isDemo: true,
      },
      {
        id: 'm-3',
        personId: demoPerson.id,
        sourceDeviceId: bracelet.id,
        metricType: 'temperature',
        value: 36.6,
        unit: '°C',
        measuredAt: now.toISOString(),
        receivedAt: now.toISOString(),
        validityStatus: 'valid',
        signalQuality: 'good',
        isDemo: true,
      }
    );

    this.movementEvents.push({
      id: 'mov-1',
      personId: demoPerson.id,
      sourceDeviceId: esp32.id,
      eventType: 'normalActivity',
      occurredAt: now.toISOString(),
      receivedAt: now.toISOString(),
      dataQuality: 'good',
      isDemo: true,
    });
  }

  // People
  public getPeople(): Person[] {
    return Array.from(this.people.values());
  }

  public getPerson(id: string): Person | undefined {
    return this.people.get(id);
  }

  // Devices
  public getDevices(): Device[] {
    return Array.from(this.devices.values());
  }

  public updateDevice(id: string, update: Partial<Device>): Device | undefined {
    const existing = this.devices.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...update };
    this.devices.set(id, updated);
    this.broadcast('device_updated', updated);
    return updated;
  }

  // Contacts
  public getContacts(personId?: string): EmergencyContact[] {
    const all = Array.from(this.contacts.values());
    return personId ? all.filter(c => c.personId === personId) : all;
  }

  public addContact(contact: EmergencyContact): EmergencyContact {
    this.contacts.set(contact.id, contact);
    this.broadcast('contact_added', contact);
    return contact;
  }

  public deleteContact(id: string): boolean {
    const res = this.contacts.delete(id);
    if (res) this.broadcast('contact_deleted', { id });
    return res;
  }

  // Telemetry Ingestion
  public ingestVitals(measurements: Omit<HealthMeasurement, 'id' | 'receivedAt'>[]): HealthMeasurement[] {
    const nowIso = new Date().toISOString();
    const created = measurements.map(m => ({
      ...m,
      id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      receivedAt: nowIso,
    }));
    this.measurements.unshift(...created);
    if (this.measurements.length > 500) this.measurements = this.measurements.slice(0, 500);

    for (const m of created) {
      this.broadcast('vital_measurement', m);
    }

    // Trigger risk assessment
    if (created[0]) {
      this.runRiskCheck(created[0].personId);
    }
    return created;
  }

  public ingestMovement(event: Omit<MovementEvent, 'id' | 'receivedAt'>): MovementEvent {
    const nowIso = new Date().toISOString();
    const created: MovementEvent = {
      ...event,
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      receivedAt: nowIso,
    };
    this.movementEvents.unshift(created);
    if (this.movementEvents.length > 500) this.movementEvents = this.movementEvents.slice(0, 500);

    this.broadcast('movement_event', created);
    this.runRiskCheck(created.personId);
    return created;
  }

  public getMeasurements(personId?: string, limit: number = 100): HealthMeasurement[] {
    const filtered = personId ? this.measurements.filter(m => m.personId === personId) : this.measurements;
    return filtered.slice(0, limit);
  }

  public getMovementEvents(personId?: string, limit: number = 100): MovementEvent[] {
    const filtered = personId ? this.movementEvents.filter(e => e.personId === personId) : this.movementEvents;
    return filtered.slice(0, limit);
  }

  // Incidents
  public getIncidents(personId?: string): Incident[] {
    const filtered = personId ? this.incidents.filter(i => i.personId === personId) : this.incidents;
    return filtered;
  }

  public acknowledgeIncident(id: string, caregiverName: string): Incident | undefined {
    const incident = this.incidents.find(i => i.id === id);
    if (!incident) return undefined;
    incident.status = 'acknowledged';
    incident.acknowledgedAt = new Date().toISOString();
    incident.acknowledgedBy = caregiverName;
    this.broadcast('incident_updated', incident);
    return incident;
  }

  public resolveIncident(id: string, note: string, caregiverName: string): Incident | undefined {
    const incident = this.incidents.find(i => i.id === id);
    if (!incident) return undefined;
    incident.status = 'resolved';
    incident.resolvedAt = new Date().toISOString();
    incident.resolvedBy = caregiverName;
    incident.resolutionNote = note;
    this.broadcast('incident_updated', incident);
    return incident;
  }

  public runRiskCheck(personId: string): Incident | null {
    const person = this.people.get(personId);
    if (!person) return null;

    const personMeasurements = this.measurements.filter(m => m.personId === personId);
    const personMovements = this.movementEvents.filter(e => e.personId === personId);
    const nowIso = new Date().toISOString();

    const output = assessRisk({
      person,
      measurements: personMeasurements,
      movementEvents: personMovements,
      now: nowIso,
    });

    if (output.severity !== 'low') {
      // Check recent deduplication within 5 minutes
      const existing = this.incidents.find(
        i => i.personId === personId && i.ruleTriggered === output.ruleTriggered && i.status !== 'resolved'
      );
      if (existing) return existing;

      const newIncident: Incident = {
        id: `inc-${Date.now()}`,
        personId,
        severity: output.severity,
        status: 'new',
        title: output.title,
        explanation: output.explanation,
        detectedAt: nowIso,
        evidence: output.evidence,
        ruleTriggered: output.ruleTriggered,
        isDemo: true,
      };
      this.incidents.unshift(newIncident);
      this.broadcast('incident_created', newIncident);
      return newIncident;
    }
    return null;
  }
}

export const store = new DataStore();
