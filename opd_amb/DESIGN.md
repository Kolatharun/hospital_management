# BALAJI EMS RESPONDER & OPD AMBULANCE PWA — DESIGN SPECIFICATION

### Production-Grade UI/UX Design System & Application Architecture
**Scope:** Mobile-first Emergency Medical Services (EMS) Responder PWA & OPD Ambulance Dispatch Interface  
**Target Platform:** Mobile PWA (iOS/Android) & Tablet / Desktop Operations  
**Prepared for:** UI/UX Teams, Frontend Engineers, Stitch MCP, AI Coding Assistants  

---

## 1. PRODUCT DESIGN DIRECTION & BRAND POSITIONING

The **Balaji EMS Responder Application** is designed as a mission-critical, high-urgency mobile Progressive Web App (PWA) for paramedic crews, ambulance drivers, and emergency response teams connected to Balaji Heart Center.

### 1.1 Visual & Operational Intent
- **Calm, High-Contrast & Mission-Focused:** Eliminates visual noise; critical telemetry (vitals, ETA, turn-by-turn directions) is readable at a glance during high-stress ambulance runs.
- **Dark-Mode Optimized:** Primary high-stress screens (Navigation, Clinical Care, Telemetry) use sleek dark themes (`#0B0F19` background) to reduce eye fatigue and screen glare inside emergency vehicles.
- **Single Dominant Action (SDA):** Every mission stage features a clear, unambiguous primary CTA (e.g., *Accept Incident*, *Arrived at Scene*, *Start Care Log*, *Transfer to Hospital*, *Complete Handover*).
- **Tactile Touch Targets:** Large 48px+ touch targets designed for use while wearing medical gloves or inside a moving vehicle.

---

## 2. DESIGN TOKENS & SYSTEM SCALINGS

### 2.1 Color System

```css
:root {
  /* Brand Primary & Medical Accents */
  --color-primary: #0B6875;         /* Clinical Cyan / Teal */
  --color-primary-hover: #084F59;
  --color-primary-light: #E0F2FE;
  
  /* Emergency Status Colors */
  --color-emergency-red: #DC2626;   /* Critical Alert / Level 1 Triage */
  --color-emergency-bg: #FEF2F2;
  --color-warning-amber: #F59E0B;  /* Moderate Priority / Level 2 Triage */
  --color-warning-bg: #FFFBEB;
  --color-success-green: #10B981;  /* Stable / Completed / Level 3 Triage */
  --color-success-bg: #ECFDF5;
  --color-info-blue: #3B82F6;      /* En Route / Telematics */

  /* Neutral Dark Theme Scale */
  --bg-dark-canvas: #0B0F19;
  --bg-dark-card: #111827;
  --bg-dark-border: #1F2937;
  --text-dark-primary: #F9FAFB;
  --text-dark-secondary: #9CA3AF;

  /* Neutral Light Theme Scale */
  --bg-light-canvas: #F8FAFC;
  --bg-light-card: #FFFFFF;
  --bg-light-border: #E2E8F0;
  --text-light-primary: #0F172A;
  --text-light-secondary: #64748B;
}
```

### 2.2 Typography Scale
Font Family: `Inter`, `Roboto`, system sans-serif.

| Token | Size / Line-Height | Weight | Purpose |
|---|---|---|---|
| `display-xl` | 32px / 40px | 700 (Bold) | ETA Counter, Critical Telematics |
| `heading-lg` | 24px / 32px | 700 (Bold) | Page Titles, Patient Name |
| `heading-md` | 18px / 24px | 600 (SemiBold) | Section Headers, Alert Titles |
| `body-md` | 14px / 20px | 400 / 500 | Vitals Details, Navigation Steps |
| `caption-sm` | 12px / 16px | 500 (Medium) | Micro-labels, Timestamps |

---

## 3. LAYOUT ARCHITECTURE & APPLICATION SHELL

### 3.1 Mobile-First Viewport Standard
- **Max Width:** 480px centered container on desktop, 100% full screen on mobile devices.
- **Top Navigation Bar:** Sticky header with active ambulance unit callsign (e.g. `AMB-04`), network/GPS telemetry badge, and quick emergency call trigger.
- **Bottom Action Dock:** Persistent bottom bar housing stage-specific primary action buttons and quick navigation controls.

---

## 4. SCREEN-BY-SCREEN SPECIFICATIONS

### Screen 1 — Shift Duty Dashboard (`/ems`)
- **Header:** Paramedic Duty Status Toggle (*On Duty* / *Off Duty*), Ambulance ID (`AMB-04 Balaji Cardiac Unit`).
- **Unit Telemetry:** Vehicle fuel level, oxygen tank pressure, medical kit inventory check status.
- **Active Dispatch Readiness:** Pulse radar graphic signaling active standby mode.
- **Recent Mission Metrics:** Quick overview of completed runs, average response time, shift duration.

### Screen 2 — Incoming Dispatch Alert (`/ems/missions/:incidentId/alert`)
- **Emergency Level Banner:** Blinking high-priority alert header (*CODE RED — Cardiac Arrest*).
- **Incident Summary:** Location address, distance (e.g. `3.4 km`), estimated arrival time (`7 mins`).
- **Patient Initial Details:** Age, gender, reported chief complaint.
- **Action Buttons:** Large high-contrast dual buttons: **ACCEPT DISPATCH** (Primary Green) vs **REJECT / RE-ROUTE** (Ghost Gray).

### Screen 3 — Live Telematics & Navigation (`/ems/missions/:incidentId`)
- **Interactive GPS Map:** Real-time route tracking, traffic congestion overlays, ETA countdown (`05:22` remaining).
- **Turn-by-Turn Instruction Card:** Prominent direction overlay with distance to next turn.
- **Quick Controls:** One-touch siren activation toggle, traffic signal override log, direct dispatch audio link.
- **Next Stage CTA:** **ARRIVED AT SCENE** (Sticky bottom button).

### Screen 4 — Scene Protocols & Safety Triage (`/ems/missions/:incidentId/scene`)
- **Scene Hazard Checklist:** Hazards identified (Traffic, Electrical, Hazmat, Violent Scene) with safety clearance confirmation.
- **START Triage Matrix:** Quick categorization (Red - Immediate, Yellow - Delayed, Green - Minor, Black - Deceased).
- **Patient Count & Identification:** Rapid scene head-count logger and initial contact record.
- **Next Stage CTA:** **BEGIN PATIENT CARE LOG**.

### Screen 5 — Clinical Patient Care & Live Vitals (`/ems/missions/:incidentId/care`)
- **Live Vitals Monitor:** Pulse, BP (e.g. `120/80 mmHg`), SpO2 (`98%`), ECG Trace preview, Respiratory Rate.
- **Intervention Log:** Medications administered (e.g. *Epinephrine 1mg IV*), IV line placement, Oxygen therapy.
- **Symptom Tracker:** Chest pain severity slider (1-10), consciousness scale (AVPU / GCS).
- **Next Stage CTA:** **INITIATE HOSPITAL TRANSPORT**.

### Screen 6 — Hospital Telemetry & En-Route Transit (`/ems/missions/:incidentId/transport`)
- **Receiving ER Telemetry:** Direct telemetry stream to Balaji ER Trauma Center (`ER Bay 2 Pre-alerted`).
- **Attending Physician Notes:** Doctor prep alerts, requested pre-arrival interventions.
- **ETA to ER:** Live countdown timer to hospital entrance.
- **Next Stage CTA:** **ARRIVED AT HOSPITAL / ER HANDOVER**.

### Screen 7 — Handover & ER Sign-off Protocol (`/ems/missions/:incidentId/handover`)
- **SBAR Summary:** Situation, Background, Assessment, Recommendation auto-compiled document.
- **Receiving Nurse / Physician Digital Signature:** In-person touch screen sign-off canvas.
- **Transfer of Care Timestamp:** Exact recorded hand-off timestamp.
- **Next Stage CTA:** **FINALIZE MISSION & RETURN TO BASE**.

### Screen 8 — Mission Completion Summary (`/ems/missions/:incidentId/complete`)
- **Run Summary Card:** Total duration, total distance, response time vs SLA performance badge.
- **Restock & Sanitization Checklist:** Oxygen refill log, medical supplies consumed, cabin sanitization flag.
- **Next Stage CTA:** **RETURN TO DUTY DASHBOARD**.

### Screen 9 — Run History & Audit Log (`/ems/history`)
- **Filterable List:** Past emergency calls sorted by date, emergency severity, and outcome status.
- **Detailed Run Reports:** Complete PDF-style transcript of telemetry, care interventions, and hospital sign-offs.

### Screen 10 — Responder Profile & Inventory Settings (`/ems/profile`)
- **Paramedic Credentials:** Certification details, shift schedules, responder rating.
- **Vehicle Maintenance Logs:** Oil check, tire pressure, siren test, equipment sync status.

---

## 5. STITCH MCP CONFIGURATION SPECIFICATION

To connect Google Stitch AI with this project:

```json
{
  "mcpServers": {
    "stitch": {
      "serverUrl": "https://stitch.googleapis.com/mcp",
      "headers": {
        "X-Goog-Api-Key": "YOUR_STITCH_API_KEY_HERE"
      }
    }
  }
}
```

### 5.1 Recommended Prompt Pattern for Stitch Generation
When generating or modifying screens via Stitch MCP, use the following structured prompt format:
> *"Generate a mobile-first dark-mode React component for Balaji EMS Responder app matching the DESIGN.md specifications. Use Tailwind CSS, Lucide icons, high-contrast text, 48px+ touch targets, and full TypeScript type definitions."*

---

## 6. PWA & OFFLINE-FIRST CAPABILITIES

1. **Service Worker Caching:** Caches static app shell assets (`/`, `/ems`, offline fallback).
2. **IndexedDB Local Storage:** Auto-saves ongoing mission logs and vitals telemetry locally if cellular connectivity drops during transit.
3. **Background Sync:** Queues patient care reports and signatures when offline and syncs automatically upon re-establishing connection.

---

## 7. FINAL PRODUCTION CHECKLIST

- [x] Configure `mcp.json` and `.vscode/mcp.json` with Google Stitch API credentials.
- [x] Create `DESIGN.md` in workspace root.
- [x] Ensure Vite React TypeScript routing covers all 10 EMS screens.
- [x] Validate responsive mobile PWA layout and accessible contrast ratios.
