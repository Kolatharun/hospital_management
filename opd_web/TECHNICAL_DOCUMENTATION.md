# Balaji Heart Center - Clinic Management System

## Technical Documentation v1.0.0

---

# Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Diagram](#2-architecture-diagram)
3. [Backend Architecture](#3-backend-architecture)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Database Schema](#5-database-schema)
6. [Authentication & Role Flow](#6-authentication--role-flow)
7. [Appointment Status Flow](#7-appointment-status-flow)
8. [Voice Announcement Logic](#8-voice-announcement-logic)
9. [ETA Calculation Logic](#9-eta-calculation-logic)
10. [WhatsApp Hybrid Mode Architecture](#10-whatsapp-hybrid-mode-architecture)
11. [Bills & Day Payments Flow](#11-bills--day-payments-flow)
12. [Environment Variables](#12-environment-variables)
13. [API Endpoint Documentation](#13-api-endpoint-documentation)
14. [Security Design](#14-security-design)
15. [Deployment Guide](#15-deployment-guide)
16. [Future Scalability Suggestions](#16-future-scalability-suggestions)

---

# 1. System Overview

## 1.1 Purpose

The Balaji Heart Center Clinic Management System is a full-stack web application designed to streamline outpatient (OP) clinic operations. It provides comprehensive functionality for patient registration, appointment queue management, prescription generation, billing, and real-time TV display with voice announcements.

## 1.2 Key Features

| Module | Features |
|--------|----------|
| **Patient Management** | New patient registration, Review patient lookup, Medical record (MR) number generation |
| **Queue Management** | Token-based queue system, Real-time queue updates via WebSocket, TV display with voice announcements |
| **Doctor Module** | Patient queue view, Prescription creation, Lab test ordering, Patient history |
| **Billing** | Bill generation, Multiple payment methods (Cash/Card/UPI), PDF receipt generation |
| **Communication** | WhatsApp integration (LOCAL/META modes), Email with PDF attachments |
| **Admin** | User management, Doctor management, Medicine master, System settings |

## 1.3 Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context API + TanStack Query
- **Routing**: React Router DOM v6

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **ORM**: SQLAlchemy 2.0
- **Database**: PostgreSQL 15+
- **Authentication**: JWT (python-jose) + Bcrypt
- **Real-time**: Socket.IO (python-socketio)
- **PDF Generation**: ReportLab
- **TTS**: Google Cloud Text-to-Speech API

---

# 2. Architecture Diagram

## 2.1 High-Level System Architecture

```
+-----------------------------------------------------------------------------------+
|                                    CLIENTS                                        |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|   +-------------------+    +-------------------+    +-------------------+          |
|   |   Front Office    |    |  Doctor Desktop   |    |   TV Display      |          |
|   |   Dashboard       |    |  Dashboard        |    |   (Kiosk Mode)    |          |
|   +-------------------+    +-------------------+    +-------------------+          |
|           |                        |                        |                     |
|           +------------------------+------------------------+                     |
|                                    |                                              |
|                            [HTTPS / WSS]                                          |
|                                    |                                              |
+-----------------------------------------------------------------------------------+
                                     |
                                     v
+-----------------------------------------------------------------------------------+
|                              NGINX REVERSE PROXY                                  |
|                         (SSL Termination, Load Balancing)                         |
+-----------------------------------------------------------------------------------+
                                     |
                    +----------------+----------------+
                    |                                 |
                    v                                 v
+-----------------------------------------------------------------------------------+
|                              BACKEND LAYER                                        |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|   +-------------------+    +-------------------+    +-------------------+          |
|   |   FastAPI App     |    |   Socket.IO       |    |   Background      |          |
|   |   (REST API)      |    |   Server          |    |   Tasks           |          |
|   |   Port: 8000      |    |   /socket.io/     |    |   (PDF Gen, etc)  |          |
|   +-------------------+    +-------------------+    +-------------------+          |
|           |                        |                        |                     |
|           +------------------------+------------------------+                     |
|                                    |                                              |
+-----------------------------------------------------------------------------------+
                                     |
                    +----------------+----------------+
                    |                                 |
                    v                                 v
+-----------------------------------------------------------------------------------+
|                              DATA LAYER                                           |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|   +-------------------+    +-------------------+    +-------------------+          |
|   |   PostgreSQL      |    |   File Storage    |    |   Google Cloud    |          |
|   |   Database        |    |   (Documents)     |    |   TTS API         |          |
|   +-------------------+    +-------------------+    +-------------------+          |
|                                                                                   |
+-----------------------------------------------------------------------------------+
                                     |
                                     v
+-----------------------------------------------------------------------------------+
|                           EXTERNAL SERVICES                                       |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|   +-------------------+    +-------------------+    +-------------------+          |
|   |   WhatsApp        |    |   SMTP Email      |    |   Google Cloud    |          |
|   |   Business API    |    |   Server          |    |   TTS             |          |
|   +-------------------+    +-------------------+    +-------------------+          |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

## 2.2 Request Flow Diagram

```
[User Action] --> [React Frontend] --> [Axios HTTP Client]
                                              |
                                              v
                                    [FastAPI Backend]
                                              |
                      +-----------+-----------+-----------+
                      |           |           |           |
                      v           v           v           v
                [Controller] [Service]  [Repository] [Socket.IO]
                      |           |           |           |
                      v           v           v           v
                [Schema     [Business   [SQLAlchemy  [Real-time
                Validation]  Logic]      ORM]        Events]
                                              |
                                              v
                                    [PostgreSQL Database]
```

---

# 3. Backend Architecture

## 3.1 Directory Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI application entry point
│   ├── core/
│   │   ├── config.py              # Environment configuration (Pydantic Settings)
│   │   ├── database.py            # SQLAlchemy database connection
│   │   ├── deps.py                # Dependency injection (auth, roles)
│   │   ├── security.py            # JWT and password hashing
│   │   ├── socket_manager.py      # Socket.IO real-time manager
│   │   └── startup.py             # Application startup initialization
│   ├── controllers/               # API route handlers
│   │   ├── admin_controller.py
│   │   ├── appointment_controller.py
│   │   ├── auth_controller.py
│   │   ├── billing_controller.py
│   │   ├── department_controller.py
│   │   ├── doctor_controller.py
│   │   ├── document_controller.py
│   │   ├── master_data_controller.py
│   │   ├── patient_controller.py
│   │   ├── prescription_controller.py
│   │   ├── queue_controller.py
│   │   ├── tts_controller.py
│   │   └── vitals_controller.py
│   ├── models/                    # SQLAlchemy ORM models
│   │   ├── appointment.py
│   │   ├── base.py
│   │   ├── billing.py
│   │   ├── department.py
│   │   ├── doctor.py
│   │   ├── document.py
│   │   ├── master_data.py
│   │   ├── medicine.py
│   │   ├── patient.py
│   │   ├── prescription.py
│   │   ├── queue.py
│   │   ├── user.py
│   │   └── vitals.py
│   ├── repositories/              # Data access layer
│   ├── schemas/                   # Pydantic request/response schemas
│   ├── services/                  # Business logic layer
│   └── utils/
│       ├── notification_service.py    # Email/WhatsApp notifications
│       └── prescription_generator.py  # PDF generation
├── alembic/                       # Database migrations
├── scripts/                       # Utility scripts
├── requirements.txt
└── .env
```

## 3.2 Layered Architecture Pattern

The backend follows a strict layered architecture:

```
┌─────────────────────────────────────────┐
│           CONTROLLER LAYER              │  Route definitions, request validation
│         (appointment_controller.py)     │  HTTP status codes, response formatting
├─────────────────────────────────────────┤
│            SERVICE LAYER                │  Business logic, data transformation
│         (appointment_service.py)        │  Cross-cutting concerns, orchestration
├─────────────────────────────────────────┤
│          REPOSITORY LAYER               │  Data access, SQL queries
│       (appointment_repository.py)       │  Database operations, caching
├─────────────────────────────────────────┤
│            MODEL LAYER                  │  SQLAlchemy ORM models
│           (appointment.py)              │  Table definitions, relationships
└─────────────────────────────────────────┘
```

## 3.3 Application Entry Point

The main FastAPI application (`main.py`) initializes:

1. **CORS Middleware** - Configured for frontend origins
2. **Exception Handlers** - Global validation and error handling
3. **Route Mounting** - All controller routers under `/api/v1`
4. **Socket.IO** - Mounted at `/socket.io/` for real-time events
5. **Lifespan Manager** - Database connection verification and startup initialization

## 3.4 Socket.IO Real-time Events

| Event | Direction | Purpose |
|-------|-----------|---------|
| `queue_updated` | Server → Client | Notify queue state changes |
| `patient_called` | Server → Client | Trigger TV voice announcement |
| `join_queue` | Client → Server | Subscribe to doctor-specific room |
| `leave_queue` | Client → Server | Unsubscribe from room |

---

# 4. Frontend Architecture

## 4.1 Directory Structure

```
src/
├── main.tsx                       # Application entry point
├── App.tsx                        # Root component with routing
├── vite-env.d.ts                  # TypeScript environment declarations
├── components/
│   ├── ui/                        # shadcn/ui component library
│   ├── layout/
│   │   ├── Header.tsx             # Application header
│   │   ├── PageContainer.tsx      # Layout wrapper
│   │   └── TabNavigation.tsx      # Tab-based navigation
│   ├── frontoffice/
│   │   ├── PatientRegistration.tsx
│   │   ├── PatientSearch.tsx
│   │   ├── AppointmentQueue.tsx
│   │   ├── VitalsCollection.tsx
│   │   ├── BillingSection.tsx
│   │   ├── BillsList.tsx
│   │   ├── DayPayments.tsx
│   │   └── DocumentUpload.tsx
│   ├── doctor/
│   │   ├── TodayPatients.tsx
│   │   ├── PrescriptionForm.tsx
│   │   ├── PatientHistory.tsx
│   │   └── DocumentViewer.tsx
│   └── admin/
│       ├── StaffManagement.tsx
│       ├── DoctorsManagement.tsx
│       ├── MedicinesManagement.tsx
│       └── SettingsManagement.tsx
├── contexts/
│   ├── AuthContext.tsx            # Authentication state
│   ├── ClinicDataContext.tsx      # Shared clinic data
│   └── AdminContext.tsx           # Admin module state
├── hooks/
│   ├── use-toast.ts               # Toast notifications
│   ├── use-mobile.tsx             # Responsive detection
│   └── useVoiceAnnouncement.ts    # TTS voice control
├── pages/
│   ├── LoginPage.tsx
│   ├── FrontOfficeDashboard.tsx
│   ├── DoctorDashboard.tsx
│   ├── AdminDashboard.tsx
│   ├── TVDisplayPage.tsx
│   └── NotFound.tsx
├── services/
│   ├── api.ts                     # Axios instance with interceptors
│   ├── authService.ts
│   ├── patientService.ts
│   ├── appointmentService.ts
│   ├── prescriptionService.ts
│   ├── billingService.ts
│   ├── whatsappService.ts
│   └── ...
└── lib/
    └── utils.ts                   # Utility functions
```

## 4.2 State Management

### Context API Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    QueryClientProvider                  │
│                   (TanStack Query Cache)                │
├─────────────────────────────────────────────────────────┤
│                     AuthProvider                        │
│            (user, login, logout, isAuthenticated)       │
├─────────────────────────────────────────────────────────┤
│                   ClinicDataProvider                    │
│    (appointments, patients, doctors, departments)       │
├─────────────────────────────────────────────────────────┤
│                    AdminProvider                        │
│           (staff, medicines, settings)                  │
└─────────────────────────────────────────────────────────┘
```

## 4.3 Routing Configuration

| Path | Component | Access |
|------|-----------|--------|
| `/login` | LoginPage | Public |
| `/` | DashboardRouter | Authenticated (role-based redirect) |
| `/admin/*` | AdminDashboard | Admin only |
| `/tv-display` | TVDisplayPage | Authenticated |
| `*` | NotFound | Public |

## 4.4 Protected Routes

```tsx
// Role-based dashboard routing
function DashboardRouter() {
  const { user } = useAuth();

  if (user.role === 'admin') return <Navigate to="/admin" />;
  if (user.role === 'doctor') return <DoctorDashboard />;
  return <FrontOfficeDashboard />;
}
```

---

# 5. Database Schema

## 5.1 Entity Relationship Diagram (Textual)

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    users    │       │   doctors   │       │ departments │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │◄──────│ user_id(FK) │       │ id (PK)     │
│ username    │       │ id (PK)     │◄──┐   │ name        │
│ password    │       │ department  │───┘   │ code        │
│ role        │       │ room_number │       └─────────────┘
│ display_name│       └─────────────┘
└─────────────┘              │
                             │
┌─────────────┐       ┌──────┴──────┐       ┌─────────────┐
│  patients   │       │appointments │       │   vitals    │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │◄──────│ patient_id  │       │ id (PK)     │
│ mr_number   │       │ doctor_id   │───────│appointment_id│
│ first_name  │       │ id (PK)     │       │ bp, pulse   │
│ last_name   │       │ op_number   │       │ temperature │
│ phone       │       │ token_number│       └─────────────┘
│ dob         │       │ status      │
└─────────────┘       │ waiting_time│
      │               │ buffer_time │
      │               └─────────────┘
      │                      │
      │               ┌──────┴──────┐       ┌─────────────────────┐
      │               │prescriptions│       │prescription_medicines│
      │               ├─────────────┤       ├─────────────────────┤
      └───────────────│ patient_id  │       │ id (PK)             │
                      │appointment_id│◄─────│ prescription_id(FK) │
                      │ doctor_id   │       │ medicine_name       │
                      │ diagnosis   │       │ dosage, frequency   │
                      │ lab_tests   │       └─────────────────────┘
                      │ advice      │
                      └─────────────┘
                             │
                      ┌──────┴──────┐
                      │    bills    │
                      ├─────────────┤
                      │ id (PK)     │
                      │ patient_id  │
                      │appointment_id│
                      │ bill_number │
                      │ total_amount│
                      │ paid_amount │
                      │ payment_status│
                      └─────────────┘
```

## 5.2 Core Tables

### 5.2.1 users

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| username | VARCHAR(100) | Unique login identifier |
| password_hash | VARCHAR(255) | Bcrypt hashed password |
| display_name | VARCHAR(200) | UI display name |
| role | ENUM | `admin`, `front-office`, `doctor` |
| is_active | BOOLEAN | Account status |
| last_login | TIMESTAMP | Audit tracking |

### 5.2.2 patients

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| mr_number | VARCHAR(20) | Medical Record Number (MR-XXXXX) |
| first_name | VARCHAR(100) | Patient first name |
| last_name | VARCHAR(100) | Patient last name |
| date_of_birth | DATE | For age calculation |
| gender | ENUM | `Male`, `Female`, `Other` |
| phone | VARCHAR(15) | Primary contact (Indian format) |
| patient_type | ENUM | `New`, `Review`, `Emergency`, `Referral` |

### 5.2.3 appointments

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| op_number | VARCHAR(20) | Outpatient Number (OP-YYYYMMDD-XXX) |
| patient_id | UUID (FK) | Link to patient |
| doctor_id | UUID (FK) | Assigned doctor |
| token_number | INTEGER | Daily queue position |
| status | ENUM | `waiting`, `calling`, `in-progress`, `completed`, `cancelled` |
| waiting_time_minutes | INTEGER | Calculated ETA |
| buffer_time_minutes | INTEGER | Additional buffer time |
| announcement_played | BOOLEAN | TTS tracking for TV display |
| room | VARCHAR(20) | Consultation room number |

### 5.2.4 prescriptions

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| patient_id | UUID (FK) | Link to patient |
| appointment_id | UUID (FK) | Link to appointment |
| doctor_id | UUID (FK) | Prescribing doctor |
| diagnosis | TEXT | Primary diagnosis |
| complaint | TEXT | Chief complaint |
| lab_tests | TEXT | Ordered lab tests |
| advice | TEXT | Medical advice |
| follow_up_days | INTEGER | Follow-up recommendation |

### 5.2.5 bills

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| bill_number | VARCHAR(20) | Bill Number (BLL-YYYYMMDD-XXX) |
| patient_id | UUID (FK) | Link to patient |
| appointment_id | UUID (FK) | Link to appointment |
| consultation_fee | DECIMAL(10,2) | Consultation charge |
| subtotal | DECIMAL(10,2) | Before discount |
| discount_amount | DECIMAL(10,2) | Discount applied |
| total_amount | DECIMAL(10,2) | Final amount |
| paid_amount | DECIMAL(10,2) | Amount paid |
| payment_status | ENUM | `pending`, `partial`, `paid` |
| payment_method | ENUM | `cash`, `card`, `upi` |

---

# 6. Authentication & Role Flow

## 6.1 Authentication Mechanism

### JWT Token Structure

```json
{
  "sub": "user-uuid-here",
  "role": "doctor",
  "name": "Dr. Rajesh Kumar",
  "doctor_id": "doctor-uuid-here",
  "exp": 1735689600,
  "iat": 1735660800,
  "type": "access"
}
```

### Token Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| Algorithm | HS256 | HMAC with SHA-256 |
| Access Token Expiry | 480 minutes | 8-hour clinic day |
| Refresh Token Expiry | 7 days | Weekly renewal |
| Bcrypt Rounds | 12 | Password hashing strength |

## 6.2 Authentication Flow

```
┌─────────┐         ┌─────────┐         ┌─────────┐         ┌─────────┐
│ Browser │         │ Frontend│         │ Backend │         │Database │
└────┬────┘         └────┬────┘         └────┬────┘         └────┬────┘
     │                   │                   │                   │
     │  Enter Credentials│                   │                   │
     │──────────────────>│                   │                   │
     │                   │                   │                   │
     │                   │ POST /auth/login  │                   │
     │                   │──────────────────>│                   │
     │                   │                   │                   │
     │                   │                   │ Query User        │
     │                   │                   │──────────────────>│
     │                   │                   │                   │
     │                   │                   │ User Record       │
     │                   │                   │<──────────────────│
     │                   │                   │                   │
     │                   │                   │ Verify Password   │
     │                   │                   │ (Bcrypt)          │
     │                   │                   │                   │
     │                   │ {access_token,    │                   │
     │                   │  refresh_token,   │                   │
     │                   │  user}            │                   │
     │                   │<──────────────────│                   │
     │                   │                   │                   │
     │                   │ Store in          │                   │
     │                   │ localStorage      │                   │
     │                   │                   │                   │
     │  Redirect to      │                   │                   │
     │  Dashboard        │                   │                   │
     │<──────────────────│                   │                   │
```

## 6.3 Role-Based Access Control (RBAC)

### Role Definitions

| Role | Code | Access Scope |
|------|------|--------------|
| **Admin** | `admin` | Full system access, user management, settings |
| **Front Office** | `front-office` | Patient registration, billing, vitals, queue management |
| **Doctor** | `doctor` | Prescriptions, consultations, patient history |

### Route Protection Matrix

| Endpoint | Admin | Front Office | Doctor |
|----------|:-----:|:------------:|:------:|
| `/api/v1/patients` | Yes | Yes | Yes |
| `/api/v1/appointments/call` | No | Yes | Yes |
| `/api/v1/prescriptions` | No | No | Yes |
| `/api/v1/billing` | No | Yes | No |
| `/api/v1/admin/*` | Yes | No | No |

### Backend Role Checker Implementation

```python
class RoleChecker:
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    async def __call__(self, current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Required roles: {[r.value for r in self.allowed_roles]}"
            )
        return current_user

# Pre-configured checkers
require_admin = RoleChecker([UserRole.ADMIN])
require_front_office = RoleChecker([UserRole.FRONT_OFFICE])
require_doctor = RoleChecker([UserRole.DOCTOR])
```

---

# 7. Appointment Status Flow

## 7.1 State Machine Diagram

```
                    ┌─────────────────────────────────────────────────┐
                    │                                                 │
                    │                   CANCELLED                     │
                    │                                                 │
                    └─────────────────────────────────────────────────┘
                                          ▲
                                          │ cancel()
                    ┌─────────────────────┴─────────────────────┐
                    │                                           │
┌─────────┐    ┌────┴────┐    ┌─────────┐    ┌─────────┐    ┌───┴─────┐
│ WAITING │───>│ CALLING │───>│IN-PROG- │───>│COMPLETED│    │ (error) │
│         │    │         │    │  RESS   │    │         │    │         │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
     │              │              │
     │         Doctor clicks  TV announcement
     │            "Call"       completes
     │              │              │
     └──────────────┴──────────────┘
         New appointment created
```

## 7.2 Status Transitions

| From Status | To Status | Trigger | Actor |
|-------------|-----------|---------|-------|
| `waiting` | `calling` | Doctor clicks "Call Next" | Doctor/Front Office |
| `calling` | `in-progress` | TV announcement completes | TV Display (automatic) |
| `in-progress` | `completed` | Doctor completes consultation | Doctor |
| `waiting`/`calling`/`in-progress` | `cancelled` | Appointment cancelled | Any authorized user |

## 7.3 Critical Flow: Calling → In-Progress

This transition is controlled by TV announcement completion to ensure:

1. **Doctor clicks "Call"** → Status becomes `calling`
2. **TV Display detects `calling` status** → Plays voice announcement
3. **Voice announcement finishes** → API call to `complete-announcement`
4. **Backend atomically** → Sets `announcement_played=true` AND `status=in-progress`

This prevents race conditions when multiple TV displays are active.

---

# 8. Voice Announcement Logic

## 8.1 System Overview

The voice announcement system uses Google Cloud Text-to-Speech API to generate bilingual (Telugu + English) announcements for patient calls.

## 8.2 Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Doctor clicks  │────>│   Backend sets  │────>│  Socket.IO emits │
│   "Call Next"   │     │ status=calling  │     │  queue_updated   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Status changes │<────│  Backend sets   │<────│  TV Display      │
│  to in-progress │     │ announce=true   │     │  plays TTS audio │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## 8.3 Announcement Sequence

The announcement plays **4 times** in alternating languages with 2.5-second gaps:

```
1. Telugu:  "ఓపీ నంబర్ [number], పేరు [name], దయచేసి రూమ్ నెంబర్ [room] కి వెళ్లండి"
   (2.5 second pause)
2. English: "OP number [number], name [name], please proceed to room number [room]"
   (2.5 second pause)
3. Telugu:  (repeat)
   (2.5 second pause)
4. English: (repeat)
```

## 8.4 Number-to-Words Conversion

For clarity, OP numbers are converted to spoken words:

```typescript
// English: "019" → "zero one nine"
const digitToWordEnglish = {
  '0': 'zero', '1': 'one', '2': 'two', ...
};

// Telugu: "019" → "సున్న ఒకటి తొమ్మిది"
const digitToWordTelugu = {
  '0': 'సున్న', '1': 'ఒకటి', '2': 'రెండు', ...
};
```

## 8.5 Backend TTS Endpoint

```python
@router.post("/tts/generate")
def generate_speech(request: TTSRequest):
    # Uses SSML for proper number pronunciation
    if request.language == "english":
        ssml_text = convert_to_ssml_english(request.text)
        synthesis_input = texttospeech.SynthesisInput(ssml=ssml_text)
    else:
        synthesis_input = texttospeech.SynthesisInput(text=request.text)

    voice = texttospeech.VoiceSelectionParams(
        language_code="te-IN" if request.language == "telugu" else "en-IN",
        ssml_gender=texttospeech.SsmlVoiceGender.FEMALE,
    )

    return Response(content=audio_content, media_type="audio/mpeg")
```

## 8.6 Multi-TV Safety

The system prevents duplicate announcements across multiple TV displays:

1. **Backend tracking**: `announcement_played` field in appointments table
2. **Frontend tracking**: `triggeredAnnouncementsRef` prevents local duplicates
3. **Atomic completion**: Only first TV to complete announcement succeeds

---

# 9. ETA Calculation Logic

## 9.1 Overview

ETA (Estimated Time of Arrival) shows patients their expected wait time in the queue.

## 9.2 Calculation Method

```
ETA = waiting_time_minutes + buffer_time_minutes
```

Where:
- `waiting_time_minutes` = Position in queue × Average consultation time (default: 15 min)
- `buffer_time_minutes` = Additional time added by doctor for complex cases

## 9.3 ETA Recalculation on Patient Call

When a doctor calls the next patient:

```python
def call_next_patient(doctor_id: UUID, reduce_minutes: int = 15):
    # 1. Get first waiting patient
    appointment = get_first_waiting_patient(doctor_id)

    # 2. Set to 'calling' status
    appointment.status = AppointmentStatus.CALLING

    # 3. Reduce waiting time for ALL remaining patients
    db.execute(
        update(Appointment)
        .where(Appointment.doctor_id == doctor_id)
        .where(Appointment.status == 'waiting')
        .values(waiting_time_minutes=func.greatest(0,
            Appointment.waiting_time_minutes - reduce_minutes))
    )
```

### Example Progression

```
Before call:   Patient A=0min, B=15min, C=30min, D=45min
After call:    A=in-progress, B=0min, C=15min, D=30min
Next call:     B=in-progress, C=0min, D=15min
```

## 9.4 Buffer Time Management

Doctors can add extra buffer time for complex cases:

```python
@router.post("/{appointment_id}/buffer")
def add_buffer_time(appointment_id: UUID, minutes: int):
    # Adds buffer to specific appointment
    appointment.buffer_time_minutes += minutes

    # Also adds to all subsequent waiting patients
    db.execute(
        update(Appointment)
        .where(Appointment.token_number > appointment.token_number)
        .values(waiting_time_minutes=Appointment.waiting_time_minutes + minutes)
    )
```

---

# 10. WhatsApp Hybrid Mode Architecture

## 10.1 Overview

The system supports two WhatsApp modes controlled by environment variable:

| Mode | `VITE_WHATSAPP_MODE` | Use Case |
|------|---------------------|----------|
| **META** | `META` | Production - Uses WhatsApp Business Cloud API |
| **LOCAL** | `LOCAL` | Development - Downloads PDF + opens WhatsApp app |

## 10.2 META Mode (Production)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────>│   Backend   │────>│ WhatsApp    │────>│  Patient    │
│  "Send via  │     │  Upload PDF │     │ Cloud API   │     │  Receives   │
│  WhatsApp"  │     │  to Graph   │     │ Send Doc    │     │  Document   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

**Flow:**
1. Frontend calls `prescriptionService.sendWhatsApp(prescriptionId, phone)`
2. Backend generates PDF
3. Backend uploads media to WhatsApp Cloud API
4. Backend sends document message via Graph API
5. Patient receives PDF in WhatsApp

## 10.3 LOCAL Mode (Development)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────>│   Backend   │     │   Browser   │     │  WhatsApp   │
│  "Send via  │     │  Generate   │────>│  Download   │────>│  App Opens  │
│  WhatsApp"  │     │  PDF        │     │  PDF File   │     │  with Text  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                              Manual attachment ◄──┘
```

**Flow:**
1. Frontend downloads PDF from backend (same endpoint as email)
2. Frontend opens WhatsApp via `whatsapp://send?phone=...` URL
3. User manually attaches downloaded PDF
4. User sends message

## 10.4 Frontend Implementation

```typescript
export async function sendPrescriptionToPatient(
  prescriptionId: string,
  phone: string,
  patientName: string,
  opNumber: string
): Promise<WhatsAppSendResult> {
  const mode = getWhatsAppMode(); // Reads VITE_WHATSAPP_MODE

  if (mode === 'LOCAL') {
    // Download PDF + open WhatsApp app
    await downloadPrescriptionPdf(prescriptionId, opNumber);
    openWhatsAppChat(phone, `Hi ${patientName}, your prescription...`);
    return { success: true, mode: 'LOCAL', message: 'PDF downloaded...' };
  }

  // META mode - backend handles everything
  await prescriptionService.sendWhatsApp(prescriptionId, phone);
  return { success: true, mode: 'META', message: 'Sent successfully' };
}
```

## 10.5 Phone Number Sanitization

```typescript
function sanitizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, '');

  // Handle Indian numbers
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned; // Add country code
  }

  return cleaned; // Returns: "919876543210"
}
```

---

# 11. Bills & Day Payments Flow

## 11.1 Billing Workflow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Patient   │────>│   Vitals    │────>│Consultation │────>│   Billing   │
│Registration │     │ Collection  │     │ (Doctor)    │     │  (Front     │
│             │     │             │     │             │     │   Office)   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                        ┌──────────────────────────┘
                                        │
                                        ▼
                              ┌─────────────────────┐
                              │   Bill Generation   │
                              ├─────────────────────┤
                              │ - Consultation Fee  │
                              │ - Lab Tests         │
                              │ - Other Charges     │
                              │ - Discount          │
                              └─────────────────────┘
                                        │
                         ┌──────────────┼──────────────┐
                         │              │              │
                         ▼              ▼              ▼
                   ┌─────────┐   ┌─────────┐   ┌─────────┐
                   │  Cash   │   │  Card   │   │   UPI   │
                   └─────────┘   └─────────┘   └─────────┘
                         │              │              │
                         └──────────────┴──────────────┘
                                        │
                                        ▼
                              ┌─────────────────────┐
                              │  Receipt Generation │
                              │  (PDF)              │
                              └─────────────────────┘
                                        │
                         ┌──────────────┼──────────────┐
                         │              │              │
                         ▼              ▼              ▼
                   ┌─────────┐   ┌─────────┐   ┌─────────┐
                   │  Print  │   │  Email  │   │WhatsApp │
                   └─────────┘   └─────────┘   └─────────┘
```

## 11.2 Bill Structure

```python
class Bill:
    bill_number: str           # BLL-YYYYMMDD-XXX
    patient_id: UUID
    appointment_id: UUID

    # Amounts
    consultation_fee: Decimal
    lab_total: Decimal
    subtotal: Decimal
    discount_percent: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    paid_amount: Decimal
    due_amount: Decimal

    # Payment
    payment_status: PaymentStatus  # pending, partial, paid
    payment_method: PaymentMethod  # cash, card, upi
```

## 11.3 Day Payments Summary

The Day Payments feature provides end-of-day financial reporting:

```typescript
interface DaySummary {
  date: string;
  cashTotal: number;
  cardTotal: number;
  upiTotal: number;
  grandTotal: number;
  totalTransactions: number;
  bills: BillSummary[];
}
```

### Features:
- Filter by date
- Group by payment method
- Export to PDF
- Send via Email/WhatsApp

---

# 12. Environment Variables

## 12.1 Backend (.env)

```bash
# Application Settings
APP_NAME=Balaji Heart Center API
APP_VERSION=1.0.0
DEBUG=False                              # Set to False in production
API_V1_PREFIX=/api/v1

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/balaji_heart_center
DATABASE_ECHO=False                      # SQL logging (disable in production)

# JWT Authentication
JWT_SECRET_KEY=your-super-secret-key-min-32-chars  # CHANGE IN PRODUCTION
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480          # 8-hour clinic day
REFRESH_TOKEN_EXPIRE_DAYS=7

# Security Settings
BCRYPT_ROUNDS=12

# CORS - Allowed Origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Server Configuration
HOST=0.0.0.0
PORT=8000

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=clinic@example.com
SMTP_PASSWORD=app-password-here
SMTP_FROM=clinic@example.com
SMTP_USE_TLS=true

# WhatsApp Business Cloud API
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_ACCESS_TOKEN=your-access-token

# Lab & Pharmacy Contacts
LAB_EMAIL=lab@example.com
LAB_PHONE=+919876543210
PHARMACY_EMAIL=pharmacy@example.com
PHARMACY_PHONE=+919876543211

# Google Cloud TTS
GOOGLE_APPLICATION_CREDENTIALS=./google-tts-key.json
```

## 12.2 Frontend (.env)

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_API_URL=http://localhost:8000

# App Settings
VITE_APP_NAME=Balaji Heart Center
VITE_APP_VERSION=1.0.0

# WhatsApp Mode: 'LOCAL' or 'META'
VITE_WHATSAPP_MODE=LOCAL

# Feature Flags
VITE_ENABLE_DEBUG=false
```

---

# 13. API Endpoint Documentation

## 13.1 Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:-------------:|
| POST | `/api/v1/auth/login` | User login | No |
| POST | `/api/v1/auth/refresh` | Refresh access token | No |
| GET | `/api/v1/auth/me` | Get current user | Yes |

### Login Request/Response

```json
// POST /api/v1/auth/login
// Request
{
  "username_or_email": "doctor",
  "password": "doctor123"
}

// Response
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "username": "doctor",
    "display_name": "Dr. Rajesh",
    "role": "doctor",
    "doctor_id": "uuid",
    "doctor_linked": true
  }
}
```

## 13.2 Patient Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/v1/patients` | Create patient | Front Office |
| GET | `/api/v1/patients` | List patients | All |
| GET | `/api/v1/patients/{id}` | Get patient by ID | All |
| GET | `/api/v1/patients/search` | Search patients | All |
| GET | `/api/v1/patients/mr/{mr_number}` | Get by MR number | All |
| PUT | `/api/v1/patients/{id}` | Update patient | Front Office |

## 13.3 Appointment Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/v1/appointments` | Create appointment | Front Office |
| GET | `/api/v1/appointments/today` | Get today's appointments | All |
| GET | `/api/v1/appointments/queue/stats` | Get queue statistics | All |
| GET | `/api/v1/appointments/queue/waiting` | Get waiting queue | All |
| POST | `/api/v1/appointments/{id}/call` | Call specific patient | Doctor, FO |
| POST | `/api/v1/appointments/call-next/{doctor_id}` | Call next patient | Doctor, FO |
| POST | `/api/v1/appointments/{id}/complete` | Complete appointment | Doctor |
| POST | `/api/v1/appointments/{id}/cancel` | Cancel appointment | All |
| POST | `/api/v1/appointments/{id}/buffer` | Add buffer time | Doctor, FO |
| POST | `/api/v1/appointments/{id}/complete-announcement` | Complete TTS | All |

## 13.4 Prescription Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/v1/prescriptions` | Create prescription | Doctor |
| GET | `/api/v1/prescriptions/{id}` | Get prescription | Doctor |
| GET | `/api/v1/prescriptions/appointment/{id}` | Get by appointment | Doctor |
| GET | `/api/v1/prescriptions/patient/{id}` | Patient history | Doctor |
| GET | `/api/v1/prescriptions/{id}/pdf` | Download PDF | Doctor |
| POST | `/api/v1/prescriptions/{id}/send/email` | Send via email | Doctor |
| POST | `/api/v1/prescriptions/{id}/send/whatsapp` | Send via WhatsApp | Doctor |

## 13.5 Billing Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/v1/billing` | Create bill | Front Office |
| GET | `/api/v1/billing/{id}` | Get bill | Front Office |
| GET | `/api/v1/billing/appointment/{id}` | Get by appointment | Front Office |
| PUT | `/api/v1/billing/{id}/payment` | Update payment | Front Office |
| GET | `/api/v1/billing/{id}/receipt/pdf` | Download receipt PDF | Front Office |
| GET | `/api/v1/billing/day-summary` | Get day summary | Front Office |
| POST | `/api/v1/billing/{id}/send/email` | Email receipt | Front Office |
| POST | `/api/v1/billing/{id}/send/whatsapp` | WhatsApp receipt | Front Office |

## 13.6 Admin Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/v1/admin/users` | List all users | Admin |
| POST | `/api/v1/admin/users` | Create user | Admin |
| PUT | `/api/v1/admin/users/{id}` | Update user | Admin |
| DELETE | `/api/v1/admin/users/{id}` | Delete user | Admin |
| GET | `/api/v1/admin/doctors` | List doctors | Admin |
| POST | `/api/v1/admin/doctors` | Create doctor | Admin |
| PUT | `/api/v1/admin/doctors/{id}` | Update doctor | Admin |

## 13.7 TTS Endpoint

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/v1/tts/generate` | Generate speech audio | All |

```json
// POST /api/v1/tts/generate
// Request
{
  "text": "ఓపీ నంబర్ ఒకటి రెండు మూడు, పేరు రాజేష్",
  "language": "telugu"
}

// Response: audio/mpeg binary stream
```

---

# 14. Security Design

## 14.1 Authentication Security

| Measure | Implementation |
|---------|----------------|
| Password Hashing | Bcrypt with 12 rounds |
| Token Storage | localStorage (access), httpOnly cookie (refresh) |
| Token Validation | python-jose JWT library |
| Session Duration | 8-hour access, 7-day refresh |

## 14.2 Authorization Security

| Measure | Implementation |
|---------|----------------|
| Role-Based Access | Custom `RoleChecker` dependency |
| Route Protection | FastAPI `Depends()` injection |
| Frontend Guards | `ProtectedRoute` and `AdminProtectedRoute` components |

## 14.3 API Security

| Measure | Implementation |
|---------|----------------|
| CORS | Strict origin allowlist |
| Input Validation | Pydantic schemas with type hints |
| SQL Injection | SQLAlchemy ORM (parameterized queries) |
| XSS Prevention | React automatic escaping |

## 14.4 Data Security

| Measure | Implementation |
|---------|----------------|
| Transport | HTTPS in production (Nginx SSL termination) |
| Database | PostgreSQL with role-based access |
| Sensitive Data | Environment variables (never in code) |
| Audit Trail | `created_at`, `updated_at` timestamps |

## 14.5 Security Headers (Recommended)

```nginx
# nginx.conf
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self';" always;
```

---

# 15. Deployment Guide

## 15.1 Prerequisites

- **Server**: Ubuntu 22.04 LTS (or similar)
- **Python**: 3.11+
- **Node.js**: 18+ LTS
- **PostgreSQL**: 15+
- **Nginx**: For reverse proxy
- **Domain**: With SSL certificate

## 15.2 Backend Deployment

### Step 1: Clone and Setup

```bash
# Clone repository
git clone https://github.com/your-org/balaji-heart-center.git
cd balaji-heart-center/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Database Setup

```bash
# Create PostgreSQL database
sudo -u postgres psql
CREATE DATABASE balaji_heart_center;
CREATE USER bhc_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE balaji_heart_center TO bhc_user;
\q

# Run migrations
alembic upgrade head
```

### Step 3: Configure Environment

```bash
# Copy and edit .env file
cp .env.example .env
nano .env
# Update DATABASE_URL, JWT_SECRET_KEY, etc.
```

### Step 4: Run with Gunicorn

```bash
# Install Gunicorn with Uvicorn worker
pip install gunicorn uvicorn[standard]

# Run
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

### Step 5: Systemd Service

```ini
# /etc/systemd/system/bhc-backend.service
[Unit]
Description=Balaji Heart Center Backend
After=network.target postgresql.service

[Service]
User=www-data
WorkingDirectory=/opt/balaji-heart-center/backend
Environment="PATH=/opt/balaji-heart-center/backend/venv/bin"
EnvironmentFile=/opt/balaji-heart-center/backend/.env
ExecStart=/opt/balaji-heart-center/backend/venv/bin/gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 127.0.0.1:8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable bhc-backend
sudo systemctl start bhc-backend
```

## 15.3 Frontend Deployment

### Step 1: Build

```bash
cd balaji-heart-center

# Install dependencies
npm install

# Build for production
npm run build
```

### Step 2: Serve with Nginx

```nginx
# /etc/nginx/sites-available/bhc
server {
    listen 80;
    server_name clinic.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name clinic.example.com;

    ssl_certificate /etc/letsencrypt/live/clinic.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/clinic.example.com/privkey.pem;

    # Frontend static files
    root /opt/balaji-heart-center/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.IO proxy
    location /socket.io/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## 15.4 Google Cloud TTS Setup

1. Create Google Cloud project
2. Enable Cloud Text-to-Speech API
3. Create service account with TTS permissions
4. Download JSON key file
5. Place as `google-tts-key.json` in backend directory
6. Set `GOOGLE_APPLICATION_CREDENTIALS` in .env

## 15.5 WhatsApp Business API Setup (META Mode)

1. Create Meta Business account
2. Set up WhatsApp Business API
3. Create message templates
4. Get Phone Number ID and Access Token
5. Configure in backend .env:
   ```
   WHATSAPP_PHONE_NUMBER_ID=your-id
   WHATSAPP_ACCESS_TOKEN=your-token
   ```

---

# 16. Future Scalability Suggestions

## 16.1 Performance Improvements

| Area | Suggestion | Benefit |
|------|------------|---------|
| **Caching** | Add Redis for session and query caching | Reduce database load |
| **CDN** | Use CloudFlare or AWS CloudFront for static assets | Faster global delivery |
| **Database** | Add read replicas for reporting queries | Separate read/write loads |
| **Search** | Implement Elasticsearch for patient search | Faster full-text search |

## 16.2 Architecture Enhancements

| Area | Suggestion | Benefit |
|------|------------|---------|
| **Message Queue** | Add RabbitMQ/Redis for background tasks | Decouple PDF generation, emails |
| **Microservices** | Split TTS, Billing into separate services | Independent scaling |
| **Container** | Dockerize application | Consistent deployments |
| **Orchestration** | Use Kubernetes for production | Auto-scaling, high availability |

## 16.3 Feature Additions

| Feature | Description |
|---------|-------------|
| **Multi-clinic** | Support for multiple clinic locations |
| **Telemedicine** | Video consultation integration |
| **Mobile App** | React Native patient app |
| **Analytics** | Dashboard for operational metrics |
| **Inventory** | Medicine stock management |
| **Insurance** | Direct insurance claim processing |
| **HL7/FHIR** | Healthcare interoperability standards |

## 16.4 Monitoring & Observability

| Tool | Purpose |
|------|---------|
| **Sentry** | Error tracking and reporting |
| **Prometheus + Grafana** | Metrics and dashboards |
| **ELK Stack** | Centralized logging |
| **Uptime Robot** | External availability monitoring |

## 16.5 Security Enhancements

| Enhancement | Description |
|-------------|-------------|
| **2FA** | Two-factor authentication for admin users |
| **Audit Log** | Comprehensive action logging |
| **Data Encryption** | Encrypt PHI at rest |
| **Penetration Testing** | Regular security assessments |
| **HIPAA Compliance** | For international expansion |

---

# Appendix A: Default Credentials

> **WARNING**: Change these immediately in production!

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Front Office | frontoffice | front123 |
| Doctor | doctor | doctor123 |

---

# Appendix B: Number Format Specifications

## OP Number Format
```
OP-YYYYMMDD-XXX
Example: OP-20260226-001
```

## MR Number Format
```
MR-XXXXX
Example: MR-00001
```

## Bill Number Format
```
BLL-YYYYMMDD-XXX
Example: BLL-20260226-001
```

---

# Appendix C: Status Enums Reference

## AppointmentStatus
- `waiting` - Patient in queue
- `calling` - TV announcing patient
- `in-progress` - Consultation active
- `completed` - Consultation finished
- `cancelled` - Appointment cancelled

## PaymentStatus
- `pending` - No payment received
- `partial` - Partial payment
- `paid` - Fully paid

## QueueStatus
- `pending` - Not yet started
- `waiting` - In queue
- `in-progress` - Being processed
- `completed` - Finished
- `cancelled` - Cancelled

---

# Document Information

| Property | Value |
|----------|-------|
| Document Version | 1.0.0 |
| Last Updated | February 2026 |
| Author | Technical Team |
| Application Version | 1.0.0 |

---

*This documentation is intended for developers and system administrators. For user guides, please refer to the User Manual.*
