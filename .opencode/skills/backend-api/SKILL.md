---
name: backend-api
description: Backend API conventions, endpoints, validation and error handling for SmartCare
---

# Backend/API Skill (Supabase + Mock-First)

## Architecture
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Mobile App â”‚â”€â”€â”€â”€â–¶â”‚  Adapter     â”‚â”€â”€â”€â”€â–¶â”‚  Backend    â”‚
â”‚  (React    )â”‚     â”‚  (Interface) â”‚     â”‚  (Supabase) â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                           â”‚
                    â”Œâ”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”
                    â–¼             â–¼
             Mock Adapter    Real Adapter
             (Phase 1)       (Phase 3+)
```

## Adapter Interfaces (src/adapters/)
```ts
// adapters/backend.ts
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
  updateDeviceStatus(id: string, status: DeviceStatus): Promise<void>;

  // Emergency Contacts
  getEmergencyContacts(personId: string): Promise<EmergencyContact[]>;
  saveEmergencyContact(c: EmergencyContact): Promise<void>;
  deleteEmergencyContact(id: string): Promise<void>;

  // Real-time subscriptions
  subscribeToIncidents(personId: string, callback: (i: Incident) => void): Subscription;
  subscribeToMeasurements(personId: string, callback: (m: HealthMeasurement) => void): Subscription;
}

export interface Subscription {
  unsubscribe(): void;
}
```

## Mock Implementation (Phase 1)
```ts
// adapters/backend.mock.ts
import { BackendService } from './backend';
import { mockPeople, mockIncidents, mockMeasurements } from '@/mock';

export class MockBackendService implements BackendService {
  private delay = (ms: number) => new Promise(r => setTimeout(r, ms));

  async getPeople(caregiverId: string) {
    await this.delay(300);
    return mockPeople.filter(p => p.assignedCaregiverIds.includes(caregiverId));
  }

  async getMeasurements(personId: string, range: TimeRange) {
    await this.delay(200);
    return mockMeasurements
      .filter(m => m.personId === personId && this.inRange(m.measuredAt, range))
      .sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime());
  }

  async saveIncident(incident: Incident) {
    await this.delay(100);
    mockIncidents.unshift(incident);
    // Trigger real-time callbacks
    this.notifySubscribers('incidents', incident);
  }

  // ... other methods with simulated latency & in-memory storage
}
```

## Supabase Implementation (Phase 3+)
```ts
// adapters/backend.supabase.ts
import { createClient } from '@supabase/supabase-js';
import { BackendService } from './backend';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

export class SupabaseBackendService implements BackendService {
  async getPeople(caregiverId: string) {
    const { data, error } = await supabase
      .from('people')
      .select('*')
      .contains('assigned_caregiver_ids', [caregiverId]);
    if (error) throw error;
    return data;
  }

  // Row Level Security policies handle authorization
  // No client-side role checks as only security control
}
```

## Environment Config
```bash
# .env.example (committed)
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000

# .env.local (gitignored - real values)
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## Database Schema (Supabase)
```sql
-- People
create table people (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date_of_birth date,
  avatar_url text,
  assigned_caregiver_ids uuid[] not null default '{}',
  monitoring_preferences jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Measurements
create table health_measurements (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references people(id) on delete cascade,
  source_device_id uuid not null,
  metric_type text not null check (metric_type in ('heartRate','spo2','temperature','systolicBloodPressure','diastolicBloodPressure')),
  value numeric not null,
  unit text not null,
  measured_at timestamptz not null,
  received_at timestamptz not null default now(),
  signal_quality text not null check (signal_quality in ('good','fair','poor')),
  validity_status text not null check (validity_status in ('valid','stale','invalid')),
  is_demo boolean not null default false
);

-- Movement Events
create table movement_events (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references people(id) on delete cascade,
  source_device_id uuid not null,
  event_type text not null,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  fall_confidence numeric,
  inactivity_duration_seconds integer,
  data_quality text not null check (data_quality in ('good','fair','poor')),
  is_demo boolean not null default false
);

-- Incidents
create table incidents (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references people(id) on delete cascade,
  severity text not null check (severity in ('low','medium','high','device-warning')),
  incident_type text not null,
  title text not null,
  explanation text not null,
  detected_at timestamptz not null,
  updated_at timestamptz not null default now(),
  status text not null check (status in ('new','acknowledged','resolved','escalated')),
  evidence jsonb not null,
  confidence numeric not null,
  acknowledged_at timestamptz,
  resolved_at timestamptz
);

-- RLS: Caregivers only see their assigned people
alter table people enable row level security;
create policy "Caregivers see assigned" on people
  for select using (auth.uid() = any(assigned_caregiver_ids));
```

## Service Factory (Runtime Switching)
```ts
// services/backend.ts
import { BackendService } from '@/adapters/backend';
import { MockBackendService } from '@/adapters/backend.mock';
import { SupabaseBackendService } from '@/adapters/backend.supabase';

let backendInstance: BackendService | null = null;

export function getBackend(): BackendService {
  if (backendInstance) return backendInstance;

  const useMock = __DEV__ && !process.env.EXPO_PUBLIC_SUPABASE_URL;
  backendInstance = useMock ? new MockBackendService() : new SupabaseBackendService();
  return backendInstance;
}

export function setBackendForTesting(mock: BackendService) {
  backendInstance = mock;
}
```

## Notification Abstraction
```ts
// services/notifications.ts
export interface NotificationService {
  sendLocal(title: string, body: string, data?: Record<string, unknown>): Promise<void>;
  sendPush(token: string, title: string, body: string, data?: Record<string, unknown>): Promise<DeliveryResult>;
  sendSMS(phone: string, message: string): Promise<DeliveryResult>;
  sendCall(phone: string, message: string): Promise<DeliveryResult>;
  onNotificationReceived(callback: (notification: Notification) => void): () => void;
}

export interface DeliveryResult {
  success: boolean;
  providerId: string;
  error?: string;
}
```

## Key Principles
| Principle | Implementation |
|-----------|----------------|
| **Mock-first** | Phase 1 runs entirely on `MockBackendService` |
| **Interface segregation** | Small adapters, not one god interface |
| **No secrets in client** | Supabase anon key only; service role on server |
| **RLS = authz** | Row Level Security, not client-side checks |
| **Deterministic mocks** | Same seed â†’ same data for reproducible tests |
| **Subscription pattern** | Real-time via Supabase Realtime or mock EventEmitter |
