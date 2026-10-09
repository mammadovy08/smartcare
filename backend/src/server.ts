import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { store } from './store.js';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// 1. Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'SmartCare Telemetry & Risk Ingestion Gateway',
    version: '1.0.0',
  });
});

// 2. People (Patients)
app.get('/api/v1/people', (req, res) => {
  res.json(store.getPeople());
});

app.get('/api/v1/people/:id', (req, res) => {
  const person = store.getPerson(req.params.id);
  if (!person) return res.status(404).json({ error: 'Person not found' });
  res.json(person);
});

// 3. Devices
app.get('/api/v1/devices', (req, res) => {
  res.json(store.getDevices());
});

app.patch('/api/v1/devices/:id', (req, res) => {
  const updated = store.updateDevice(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Device not found' });
  res.json(updated);
});

// 4. Telemetry - Vitals (Bracelet)
app.get('/api/v1/telemetry/vitals', (req, res) => {
  const personId = req.query.personId as string | undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  res.json(store.getMeasurements(personId, limit));
});

app.post('/api/v1/telemetry/vitals', (req, res) => {
  const payload = Array.isArray(req.body) ? req.body : [req.body];
  const created = store.ingestVitals(payload);
  res.status(201).json({ count: created.length, measurements: created });
});

// 5. Telemetry - Movement & Falls (ESP32)
app.get('/api/v1/telemetry/movement', (req, res) => {
  const personId = req.query.personId as string | undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  res.json(store.getMovementEvents(personId, limit));
});

app.post('/api/v1/telemetry/movement', (req, res) => {
  const created = store.ingestMovement(req.body);
  res.status(201).json(created);
});

// 6. Incidents
app.get('/api/v1/incidents', (req, res) => {
  const personId = req.query.personId as string | undefined;
  res.json(store.getIncidents(personId));
});

app.post('/api/v1/incidents/:id/acknowledge', (req, res) => {
  const caregiverName = req.body.caregiverName || 'On-duty Caregiver';
  const updated = store.acknowledgeIncident(req.params.id, caregiverName);
  if (!updated) return res.status(404).json({ error: 'Incident not found' });
  res.json(updated);
});

app.post('/api/v1/incidents/:id/resolve', (req, res) => {
  const note = req.body.note || 'Resolved via caregiver intervention';
  const caregiverName = req.body.caregiverName || 'On-duty Caregiver';
  const updated = store.resolveIncident(req.params.id, note, caregiverName);
  if (!updated) return res.status(404).json({ error: 'Incident not found' });
  res.json(updated);
});

// 7. Contacts
app.get('/api/v1/contacts', (req, res) => {
  const personId = req.query.personId as string | undefined;
  res.json(store.getContacts(personId));
});

app.post('/api/v1/contacts', (req, res) => {
  const contact = store.addContact({
    ...req.body,
    id: `contact-${Date.now()}`,
  });
  res.status(201).json(contact);
});

app.delete('/api/v1/contacts/:id', (req, res) => {
  const deleted = store.deleteContact(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Contact not found' });
  res.json({ success: true });
});

// 8. Scenario Simulator Endpoint
app.post('/api/v1/simulator/scenario/:scenarioId', (req, res) => {
  const { scenarioId } = req.params;
  const personId = 'person-demo-1';
  const nowIso = new Date().toISOString();

  switch (scenarioId) {
    case 'fallThenInactivity': {
      store.ingestMovement({
        personId,
        sourceDeviceId: 'esp32-01',
        eventType: 'suspectedFall',
        occurredAt: nowIso,
        fallConfidence: 0.94,
        dataQuality: 'good',
        isDemo: true,
      });
      store.ingestMovement({
        personId,
        sourceDeviceId: 'esp32-01',
        eventType: 'prolongedInactivity',
        occurredAt: nowIso,
        inactivityDurationSeconds: 1800,
        dataQuality: 'good',
        isDemo: true,
      });
      break;
    }
    case 'abnormalVitals': {
      store.ingestVitals([
        {
          personId,
          sourceDeviceId: 'bracelet-01',
          metricType: 'spo2',
          value: 86,
          unit: '%',
          measuredAt: nowIso,
          validityStatus: 'valid',
          signalQuality: 'good',
          isDemo: true,
        },
        {
          personId,
          sourceDeviceId: 'bracelet-01',
          metricType: 'heartRate',
          value: 128,
          unit: 'bpm',
          measuredAt: nowIso,
          validityStatus: 'valid',
          signalQuality: 'good',
          isDemo: true,
        },
      ]);
      break;
    }
    case 'fallRecovered': {
      store.ingestMovement({
        personId,
        sourceDeviceId: 'esp32-01',
        eventType: 'suspectedFall',
        occurredAt: new Date(Date.now() - 60000).toISOString(),
        fallConfidence: 0.88,
        dataQuality: 'good',
        isDemo: true,
      });
      store.ingestMovement({
        personId,
        sourceDeviceId: 'esp32-01',
        eventType: 'normalActivity',
        occurredAt: nowIso,
        dataQuality: 'good',
        isDemo: true,
      });
      break;
    }
    case 'normal':
    default: {
      store.ingestVitals([
        {
          personId,
          sourceDeviceId: 'bracelet-01',
          metricType: 'heartRate',
          value: 74,
          unit: 'bpm',
          measuredAt: nowIso,
          validityStatus: 'valid',
          signalQuality: 'good',
          isDemo: true,
        },
        {
          personId,
          sourceDeviceId: 'bracelet-01',
          metricType: 'spo2',
          value: 99,
          unit: '%',
          measuredAt: nowIso,
          validityStatus: 'valid',
          signalQuality: 'good',
          isDemo: true,
        },
      ]);
      store.ingestMovement({
        personId,
        sourceDeviceId: 'esp32-01',
        eventType: 'normalActivity',
        occurredAt: nowIso,
        dataQuality: 'good',
        isDemo: true,
      });
      break;
    }
  }

  res.json({ message: `Scenario '${scenarioId}' simulated successfully.`, incidents: store.getIncidents(personId) });
});

// HTTP & WebSocket Server Setup
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', ws => {
  ws.send(JSON.stringify({ type: 'connected', message: 'Connected to SmartCare Real-Time Stream' }));

  ws.on('message', message => {
    try {
      const parsed = JSON.parse(message.toString());
      if (parsed.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
      }
    } catch {
      // ignore
    }
  });
});

// Broadcast all store events to all WebSocket clients
store.subscribe(event => {
  const payload = JSON.stringify(event);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
});

server.listen(port, () => {
  console.log(`=================================================`);
  console.log(`🏥 SmartCare Backend API & WebSocket Gateway`);
  console.log(`📡 HTTP Server: http://localhost:${port}`);
  console.log(`🔌 WebSocket:   ws://localhost:${port}/ws`);
  console.log(`❤️ Health Check: http://localhost:${port}/health`);
  console.log(`=================================================`);
});
