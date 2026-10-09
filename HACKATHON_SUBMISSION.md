# SmartCare — Hackathon Submission (Algolrhythm)

## Demo Link
**Mobile Web (Vercel):** https://smartcare-mammadovy08.vercel.app  
**Backend API (Railway):** https://smartcare-backend-production-xxxx.up.railway.app

> Replace `xxxx` with your actual Railway deployment ID after deploy completes.

---

## GitHub Repository
https://github.com/mammadovy08/smartcare

---

## Setup Instructions

### Quick Start (Web Demo — No Install)
1. Open the Vercel demo link above in any browser
2. App runs in **demo mode** with simulated sensor data
3. Tap scenarios in the Dev Tools panel (bottom right) to trigger:
   - Fall + Inactivity → High severity incident
   - Abnormal Vitals (SpO₂ 86%, HR 128) → High severity
   - Fall Recovered → Medium → Auto-resolve
   - Normal → Low/Green

### Local Development
```bash
# Clone
git clone https://github.com/mammadovy08/smartcare.git
cd smartcare

# Backend
cd backend
npm ci
npm run dev          # Runs on http://localhost:4000
# WebSocket: ws://localhost:4000/ws

# Mobile (new terminal)
cd ../mobile
npm ci
npx expo start       # Press 'w' for web, scan QR for Expo Go
```

### Environment Variables
**Mobile (.env.local):**
```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000
EXPO_PUBLIC_DEMO_MODE=true
```

**Backend (.env):**
```bash
PORT=4000
NODE_ENV=development
```

---

## Disclosure

### Models
- **Current MVP:** Deterministic risk engine (pure TypeScript, no ML) — 10 rule-based scenarios tested
- **Phase 2 (Post-Hackathon):** LLM-based clinical reasoning via camera/device scanning
  - **Use case:** Caregiver points phone camera at medication labels, wound photos, skin pallor, edema, or environment hazards
  - **Models:** GPT-4o mini (cloud) or local Llama 3.2 Vision (on-device via TensorFlow Lite / MLC LLM) for privacy
  - **Flow:** Camera capture → structured JSON (meds, dosage, frequency / wound stage / hazard type) → fused with vitals + movement history → LLM generates risk summary + suggested actions for caregiver
  - **Why LLM:** Rules cannot cover open-ended visual context (med adherence, wound progression, clutter/falls risk); LLM provides clinical reasoning traceable to evidence
  - **Safety:** LLM output never auto-triggers alerts — only supplements human decision; all LLM calls logged with prompt/response for audit
- **Future:** Local TensorFlow Lite fall detection on ESP32 (edge inference, no cloud)

### Data
- **100% synthetic/demo data** — All measurements marked `isDemo: true`
- Deterministic scenario runner (`src/simulator/scenarios.ts`) generates reproducible test cases
- No real patient data, no PHI, no external datasets

### Libraries & Components
| Category | Libraries |
|----------|-----------|
| **Mobile Framework** | Expo 57 (React Native 0.86, React 19), Expo Router |
| **State & Data** | Zustand (global), TanStack React Query (server), React Hook Form + Zod |
| **UI** | Victory Native (charts), Expo Vector Icons, Reanimated 4, Gesture Handler |
| **Backend** | Express.js, ws (WebSocket), Zod (validation) |
| **Testing** | Vitest, React Native Testing Library, @testing-library/jest-native |
| **Build/Deploy** | EAS Build, Vercel (web), Railway (backend), GitHub Actions |

### Templates / Starters
- `npx create-expo-app@latest --template blank-typescript` (official Expo template)
- No external boilerplates, no previously developed products

---

## Quality Testing — 20/100 Points

### What We Tested

#### 1. Risk Engine Unit Tests (10 deterministic scenarios)
| Scenario | Inputs | Expected Severity | Result |
|----------|--------|-------------------|--------|
| Normal vitals + normal activity | HR 74, SpO₂ 99, normalActivity | Low (0) | ✅ Pass |
| Fall only | suspectedFall (confidence 0.88) | Medium (1) | ✅ Pass |
| Fall + prolonged inactivity | fall + inactivity 1800s | High (2) | ✅ Pass |
| SpO₂ critical | SpO₂ 86% | High (2) | ✅ Pass |
| HR critical high | HR 130 bpm | High (2) | ✅ Pass |
| HR critical low | HR 40 bpm | High (2) | ✅ Pass |
| Temp fever | Temp 39.5°C | Medium (1) | ✅ Pass |
| Temp hypothermia | Temp 34.5°C | High (2) | ✅ Pass |
| Fall recovered | fall then normalActivity | Medium → Low | ✅ Pass |
| Device stale | No data > 30 min | Device Warning | ✅ Pass |

**Test command:** `cd mobile && npm test -- --testNamePattern="risk engine"`

#### 2. Component Tests
- Incident acknowledgment flow (acknowledge → escalate timer → auto-escalate)
- Device status card (Online/Stale/Offline/Error states)
- Health metric cards (color coding, unit formatting)
- Empty states for history charts (24h/7d/30d)

#### 3. Integration Tests (Manual)
- Full simulator → backend → mobile web data flow
- WebSocket real-time updates (incident appears < 500ms after ingest)
- Offline demo mode (no backend) — all features work

---

### What Broke / Known Limitations

| Issue | Severity | Status |
|-------|----------|--------|
| **React 19 + jest-native peer dep conflict** | Medium | Workaround: `--legacy-peer-deps` in Vercel; test libs not in production bundle |
| **In-memory backend store** | High | Data lost on restart; needs PostgreSQL/Redis for production |
| **No authentication** | High | MVP only; Phase 2 adds Supabase Auth + RLS |
| **WebSocket not auto-reconnect on mobile web** | Medium | Works in native; web needs `reconnect` logic |
| **Victory Native chart memory leak on rapid re-renders** | Low | Mitigated with `React.memo` + stable keys |
| **ESP32 adapter not implemented** | Planned | Mock only; real hardware needs binary protocol parser |
| **iOS push notifications untested** | Medium | Requires Apple Developer account + EAS credentials |

---

### Comparison With Current Approach

| Aspect | Current Practice (Manual/Reactive) | SmartCare (This Prototype) |
|--------|-----------------------------------|----------------------------|
| **Fall detection** | Caregiver finds person hours later | ESP32 detects fall in seconds → instant alert |
| **Vitals monitoring** | Spot checks (daily/weekly nurse visit) | Continuous bracelet stream → trend analysis |
| **Incident response** | Phone call tree, no audit trail | Tiered alerts + auto-escalation + full timeline |
| **Device health** | Unknown until visit | Real-time Online/Stale/Offline + battery |
| **Data for clinicians** | Paper notes / memory | 30-day charts, exportable CSV, incident log |
| **Cost** | 24/7 human sitter ($15k–30k/mo) | Hardware ~$200 + cloud ~$20/mo (est.) |
| **Scalability** | 1 caregiver : 1–2 patients | 1 caregiver : 20+ patients via dashboard |

---

### Test Evidence (Run Locally)
```bash
# Risk engine tests
cd mobile && npm test -- --run --reporter=verbose 2>&1 | head -50

# Backend API health
curl https://smartcare-backend-production-xxxx.up.railway.app/health

# Simulate scenario via API
curl -X POST https://smartcare-backend-production-xxxx.up.railway.app/api/v1/simulator/scenario/fallThenInactivity
```

---

## Feasibility Notes (for 15/100)

- **Data requirements:** ~2 KB/min per patient (vitals + movement) → ~3 MB/day → trivial storage
  - Camera scans: ~500 KB/image, ~5–10 scans/day per patient → ~5 MB/day additional
- **Running costs (est.):** Railway Hobby ($5/mo) + Vercel Free + Expo Free = **~$5/mo for 100 patients**
  - LLM API (GPT-4o mini): ~$0.15/1M input tokens, ~$0.60/1M output → ~$2–5/mo for 100 patients (est. 20 scans/day)
  - Local Llama 3.2 Vision: runs on-device, zero API cost
- **Next step:** 
  1. PostgreSQL persistence + Supabase Auth + real ESP32 firmware + caregiver mobile push (FCM/APNs)
  2. Camera scan flow: Expo Camera → image compression → LLM API (cloud or local) → structured JSON → fuse with risk engine
  3. Prompt engineering + eval harness for medical accuracy (hallucination guardrails)
- **Regulatory:** Not a medical device (wellness monitoring); no FDA clearance needed for MVP
  - LLM clinical reasoning = Clinical Decision Support (CDS) — non-diagnostic, caregiver-facing, human-in-the-loop

---

## Originality (for 10/100)

| Common Solution | SmartCare Difference |
|-----------------|---------------------|
| Single-purpose fall pendant | **Multi-modal**: bracelet vitals + ESP32 movement + device health + **camera/LLM visual context** |
| Reactive alerts only | **Tiered risk engine** with evidence trail + auto-escalation rules |
| Proprietary hardware lock-in | **Adapter pattern** — swap bracelet/ESP32/backend/camera-LLM without UI changes |
| No device monitoring | **Device Status** as first-class citizen (stale = alert) |
| Cloud-only | **Offline-first demo mode** — runs entirely in browser/app |
| Binary "fall/no fall" | **Confidence-scored events** + context (inactivity, vitals, **visual evidence**) → severity |
| Manual chart review | **LLM-fused clinical summary** — camera scan (meds, wounds, hazards) + vitals history → structured risk narrative |

---

## Pitch Deck Link
https://docs.google.com/presentation/d/EDIT_THIS_ID/edit?usp=sharing

> Set sharing to **"Anyone with the link can view"** before submitting.

---

## Video (2 min max)
Record a screen capture showing:
1. Dashboard with live vitals + movement
2. Trigger "Fall + Inactivity" scenario → High incident appears
3. Acknowledge incident → escalation timer starts
4. Device tab shows bracelet + ESP32 status
5. History charts (24h/7d/30d)
6. Settings → Demo mode toggle

Upload to YouTube (unlisted) or Google Drive → paste link above.

---

## Final Checklist Before 20:00 Freeze
- [ ] Demo link works on fresh laptop (incognito mode)
- [ ] GitHub repo public
- [ ] Pitch deck PDF uploaded / Google Slides link shared
- [ ] Video link works
- [ ] This MD file committed to repo root
- [ ] Railway backend deployed + URL in Vercel env vars
- [ ] Vercel mobile web redeployed with backend URL