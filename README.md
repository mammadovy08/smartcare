# SmartCare — AI Health & Fall Detection Platform

**SmartCare** is an intelligent remote caregiving and safety monitoring platform combining wearable health vitals, ESP32 movement & fall detection, deterministic clinical risk assessment, and real-time alert escalation.

---

## Architecture Overview

```
┌─────────────────────────────────┐     ┌────────────────────────────────┐
│ Health Bracelet (BLE/Telemetry) │     │ ESP32 Movement Sensor (Wi-Fi)  │
│ - Heart Rate, SpO2, Temp, BP    │     │ - Falls, Post-Fall Inactivity  │
└────────────────┬────────────────┘     └────────────────┬───────────────┘
                 │                                       │
                 ▼                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│             SmartCare Backend API Gateway (Port 4000)                  │
│  • REST Endpoints: Ingestion, Incidents, Patients, Devices, Contacts   │
│  • WebSocket Server (`ws://localhost:4000/ws`): Real-time alert stream │
│  • Clinical Risk Assessment Engine: Evaluates 10 clinical rules        │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   SmartCare Frontend & Mobile Client                   │
│  • Web Application (Desktop Browser: `http://localhost:8081`)          │
│  • Mobile App (iOS / Android via Expo Go or simulator)                 │
│  • Built-in Scenario Simulator & Caregiver Incidents Center            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 1. How to Run the Backend

The backend is located in [`backend/`](file:///c:/Users/User/neurobrdige/backend). It provides REST endpoints for hardware ingestion and WebSocket broadcasting.

```bash
# In terminal 1:
cd backend

# Option A: Start in development mode (hot-reloading)
npm run dev

# Option B: Run built production server
npm start
```

The server starts at:
- **HTTP API**: `http://localhost:4000`
- **Health Check**: `http://localhost:4000/health`
- **WebSocket Stream**: `ws://localhost:4000/ws`

### Useful Backend Test Commands (PowerShell / Curl):
- **Check health**:
  ```powershell
  Invoke-RestMethod -Uri http://localhost:4000/health
  ```
- **Fetch monitored patient**:
  ```powershell
  Invoke-RestMethod -Uri http://localhost:4000/api/v1/people
  ```
- **Trigger a clinical scenario (e.g., Fall + Inactivity)**:
  ```powershell
  Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/v1/simulator/scenario/fallThenInactivity
  ```
- **Fetch incidents**:
  ```powershell
  Invoke-RestMethod -Uri http://localhost:4000/api/v1/incidents
  ```

---

## 2. How to Run the Frontend / Mobile App

The frontend is located in [`mobile/`](file:///c:/Users/User/neurobrdige/mobile). It can run as a **web application** in your desktop browser or as a **native mobile app** on your phone.

```bash
# In terminal 2:
cd mobile

# Run on Web (opens in your default desktop browser)
npm run web

# Run on Mobile (starts Expo dev server with QR code for Expo Go)
npm run start

# Run on Android Emulator
npm run android

# Run on iOS Simulator (macOS only)
npm run ios
```

---

## 3. How to Test the Application

### A. Run Automated Unit Tests (11/11 Passing)
The risk assessment engine has 11 automated unit tests verifying all 10 clinical scenarios and incident deduplication:
```bash
cd mobile
npm run test
```

### B. Typecheck Codebase
```bash
cd mobile
npm run typecheck
```

### C. Test Scenarios Interactively in the App UI
When you launch the app (`npm run web` or `npm run start`):
1. **Open the Dashboard tab**: You'll see Eleanor Vance's vitals (HR, SpO2, Temperature), movement status, and connected devices.
2. **Tap "Dev Simulator" / Scenario button**: A modal opens with the 10 deterministic clinical scenarios:
   - *Normal Monitoring* (Low risk)
   - *Minor Vital Anomaly* (Low risk)
   - *Fall - Movement Resumed* (Medium risk)
   - *Fall + Prolonged Inactivity* (High risk alert)
   - *Abnormal Vital Signs* (Medium risk alert)
   - *Bracelet Disconnected* (Device warning)
   - *Movement Sensor Offline* (Device warning)
   - *Stale Measurements (>10m)* (Device warning)
   - *Notification Delivery Failure* (Medium risk)
   - *Fall + Inactivity + Abnormal Vitals* (High risk alert)
3. Tap any scenario: The dashboard vitals and movement indicators update immediately, a new incident card appears with clinical evidence, and the **Alerts tab badge increments**.
4. Go to the **Alerts tab**: View the incident, tap it to see full evidence, and test the **Acknowledge** or **Resolve** buttons.
5. Go to the **Trends tab**: View the 24h, 7d, and 30d vitals charts and test the CSV export.
6. Go to the **Devices tab**: Inspect the battery level, signal quality, and test device pairing.
7. Go to the **Settings tab**: Add/edit emergency contacts, configure vital thresholds, and toggle demo mode.
