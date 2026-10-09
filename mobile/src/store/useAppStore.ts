// Zustand Store - Global App State
// Single source of truth for UI state

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  Person,
  Incident,
  Device,
  HealthMeasurement,
  MovementEvent,
  EmergencyContact,
  Severity,
  IncidentStatus,
} from '@/types';
import { mockPeople, mockDevices, mockEmergencyContacts, mockIncidents, generateHistoricalMeasurements, SCENARIO_DATA } from '@/mock';

interface AppState {
  // People
  people: Person[];
  selectedPersonId: string | null;
  setPeople: (people: Person[]) => void;
  selectPerson: (id: string) => void;
  addPerson: (person: Person) => void;
  updatePerson: (id: string, data: Partial<Person>) => void;

  // Incidents
  incidents: Incident[];
  addIncident: (incident: Incident) => void;
  updateIncident: (id: string, data: Partial<Incident>) => void;
  acknowledgeIncident: (id: string, caregiverId: string) => void;
  resolveIncident: (id: string, caregiverId: string, note: string) => void;
  getIncidentsForPerson: (personId: string) => Incident[];
  getIncidentsBySeverity: (severity: Severity) => Incident[];
  getIncidentsByStatus: (status: IncidentStatus) => Incident[];

  // Devices
  devices: Device[];
  addDevice: (device: Device) => void;
  deleteDevice: (id: string) => void;
  updateDeviceStatus: (id: string, status: Device['connectionStatus'], batteryLevel?: number) => void;
  getDevicesForPerson: (personId: string) => Device[];

  // Emergency Contacts
  emergencyContacts: EmergencyContact[];
  addEmergencyContact: (contact: EmergencyContact) => void;
  updateEmergencyContact: (id: string, data: Partial<EmergencyContact>) => void;
  deleteEmergencyContact: (id: string) => void;
  getEmergencyContactsForPerson: (personId: string) => EmergencyContact[];

  // Measurements (cached for charts)
  measurements: HealthMeasurement[];
  movementEvents: MovementEvent[];
  addMeasurement: (measurement: HealthMeasurement) => void;
  addMovementEvent: (event: MovementEvent) => void;
  getMeasurementsForPerson: (personId: string, metricType?: HealthMeasurement['metricType']) => HealthMeasurement[];
  getMovementEventsForPerson: (personId: string) => MovementEvent[];

  // UI State
  isDemoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  lastSyncAt: string | null;
  setLastSyncAt: (date: string) => void;

  // Notifications
  unreadNotificationCount: number;
  incrementUnread: () => void;
  markAllRead: () => void;

  // Reset
  reset: () => void;
}

// Initial state from mock data
const initialState = {
  people: mockPeople,
  selectedPersonId: mockPeople[0]?.id ?? null,
  incidents: [...mockIncidents].sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()),
  devices: mockDevices,
  emergencyContacts: mockEmergencyContacts,
  measurements: generateHistoricalMeasurements(24),
  movementEvents: [...SCENARIO_DATA.normal.movementEvents],
  isDemoMode: true,
  lastSyncAt: new Date().toISOString(),
  unreadNotificationCount: 1,
};

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // People
    setPeople: (people) => set({ people }),
    selectPerson: (id) => set({ selectedPersonId: id }),
    addPerson: (person) => set((state) => ({ people: [person, ...state.people] })),
    updatePerson: (id, data) => set((state) => ({
      people: state.people.map((p) => (p.id === id ? { ...p, ...data } : p)),
    })),

    // Incidents
    addIncident: (incident) => set((state) => ({
      incidents: [incident, ...state.incidents].sort(
        (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
      ),
      unreadNotificationCount: state.unreadNotificationCount + 1,
    })),
    updateIncident: (id, data) => set((state) => ({
      incidents: state.incidents.map((i) => (i.id === id ? { ...i, ...data, updatedAt: new Date().toISOString() } : i)),
    })),
    acknowledgeIncident: (id, caregiverId) => set((state) => ({
      incidents: state.incidents.map((i) =>
        i.id === id
          ? { ...i, status: 'acknowledged' as IncidentStatus, acknowledgedAt: new Date().toISOString(), acknowledgedBy: caregiverId }
          : i
      ),
    })),
    resolveIncident: (id, caregiverId, note) => set((state) => ({
      incidents: state.incidents.map((i) =>
        i.id === id
          ? { ...i, status: 'resolved' as IncidentStatus, resolvedAt: new Date().toISOString(), resolvedBy: caregiverId, resolutionNote: note }
          : i
      ),
    })),
    getIncidentsForPerson: (personId) => get().incidents.filter((i) => i.personId === personId),
    getIncidentsBySeverity: (severity) => get().incidents.filter((i) => i.severity === severity),
    getIncidentsByStatus: (status) => get().incidents.filter((i) => i.status === status),

    // Devices
    addDevice: (device) => set((state) => ({ devices: [device, ...state.devices] })),
    deleteDevice: (id) => set((state) => ({ devices: state.devices.filter((d) => d.id !== id) })),
    updateDeviceStatus: (id, connectionStatus, batteryLevel) => set((state) => ({
      devices: state.devices.map((d) =>
        d.id === id
          ? { ...d, connectionStatus, lastSeenAt: new Date().toISOString(), ...(batteryLevel !== undefined ? { batteryLevel } : {}) }
          : d
      ),
    })),
    getDevicesForPerson: (personId) => get().devices.filter((d) => d.personId === personId),

    // Emergency Contacts
    addEmergencyContact: (contact) => set((state) => ({ emergencyContacts: [...state.emergencyContacts, contact] })),
    updateEmergencyContact: (id, data) => set((state) => ({
      emergencyContacts: state.emergencyContacts.map((c) => (c.id === id ? { ...c, ...data } : c)),
    })),
    deleteEmergencyContact: (id) => set((state) => ({
      emergencyContacts: state.emergencyContacts.filter((c) => c.id !== id),
    })),
    getEmergencyContactsForPerson: (personId) => get().emergencyContacts.filter((c) => c.personId === personId),

    // Measurements
    addMeasurement: (measurement) => set((state) => ({
      measurements: [measurement, ...state.measurements].slice(0, 1000), // Keep last 1000
    })),
    addMovementEvent: (event) => set((state) => ({
      movementEvents: [event, ...state.movementEvents].slice(0, 1000),
    })),
    getMeasurementsForPerson: (personId, metricType) => {
      const { measurements } = get();
      return measurements
        .filter((m) => m.personId === personId && (!metricType || m.metricType === metricType))
        .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime());
    },
    getMovementEventsForPerson: (personId) => {
      const { movementEvents } = get();
      return movementEvents
        .filter((e) => e.personId === personId)
        .sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
    },

    // UI State
    setDemoMode: (enabled) => set({ isDemoMode: enabled }),
    setLastSyncAt: (date) => set({ lastSyncAt: date }),

    // Notifications
    incrementUnread: () => set((state) => ({ unreadNotificationCount: state.unreadNotificationCount + 1 })),
    markAllRead: () => set({ unreadNotificationCount: 0 }),

    // Reset
    reset: () => set(initialState),
  }))
);

// Selectors for common use cases
export const useSelectedPerson = () => useAppStore((state) => state.people.find((p) => p.id === state.selectedPersonId));
export const useSelectedPersonIncidents = () => {
  const { selectedPersonId, incidents } = useAppStore();
  return selectedPersonId ? incidents.filter((i) => i.personId === selectedPersonId) : [];
};
export const useSelectedPersonDevices = () => {
  const { selectedPersonId, devices } = useAppStore();
  return selectedPersonId ? devices.filter((d) => d.personId === selectedPersonId) : [];
};
export const useUnreadCount = () => useAppStore((state) => state.unreadNotificationCount);