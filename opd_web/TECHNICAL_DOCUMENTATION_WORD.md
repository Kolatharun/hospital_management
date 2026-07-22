# BALAJI HEART CENTER
# CLINIC MANAGEMENT SYSTEM
# Technical Documentation

**Version:** 1.0.0
**Date:** February 2026
**Classification:** Internal Technical Document

---

## DOCUMENT CONTROL

| Property | Value |
|----------|-------|
| Document Title | Technical Documentation |
| Version | 1.0.0 |
| Status | Final |
| Author | Technical Team |
| Application Version | 1.0.0 |

---

## TABLE OF CONTENTS

1. System Overview
2. Architecture Diagram
3. Backend Architecture
4. Frontend Architecture
5. Database Schema Explanation
6. Authentication & Role Flow
7. Appointment Status Flow Diagram
8. Voice Announcement Logic
9. ETA Calculation Logic
10. WhatsApp Hybrid Mode Architecture
11. Bills & Day Payments Flow
12. Environment Variables
13. API Endpoint Documentation
14. Security Design
15. Deployment Guide
16. Future Scalability Suggestions

---

## 1. SYSTEM OVERVIEW

### 1.1 Purpose

The Balaji Heart Center Clinic Management System is a full-stack web application designed to streamline outpatient (OP) clinic operations. It provides comprehensive functionality for patient registration, appointment queue management, prescription generation, billing, and real-time TV display with voice announcements.

### 1.2 Key Features Summary

**Patient Management**
- New patient registration
- Review patient lookup
- Medical record (MR) number generation
- Patient search by name, phone, or MR number

**Queue Management**
- Token-based queue system
- Real-time queue updates via WebSocket
- TV display with voice announcements
- ETA calculation for waiting patients

**Doctor Module**
- Patient queue view
- Prescription creation with medicines
- Lab test ordering
- Complete patient history access

**Billing Module**
- Bill generation with line items
- Multiple payment methods (Cash/Card/UPI)
- PDF receipt generation
- Day payment summary reports

**Communication**
- WhatsApp integration (LOCAL/META modes)
- Email with PDF attachments
- Prescription and bill delivery

**Admin Module**
- User management
- Doctor management
- Medicine master data
- System settings configuration

### 1.3 Technology Stack

**Frontend Technologies:**
- Framework: React 18 with TypeScript
- Build Tool: Vite
- Styling: Tailwind CSS with shadcn/ui components
- State Management: React Context API + TanStack Query
- Routing: React Router DOM v6

**Backend Technologies:**
- Framework: FastAPI (Python 3.11+)
- ORM: SQLAlchemy 2.0
- Database: PostgreSQL 15+
- Authentication: JWT (python-jose) + Bcrypt
- Real-time: Socket.IO (python-socketio)
- PDF Generation: ReportLab
- TTS: Google Cloud Text-to-Speech API

---

## 2. ARCHITECTURE DIAGRAM

### 2.1 High-Level System Architecture

The system follows a three-tier architecture pattern with clear separation between presentation, business logic, and data layers.

**Client Layer (Presentation Tier):**
- Front Office Dashboard - Patient registration, billing, vitals
- Doctor Dashboard - Prescriptions, consultations, patient queue
- TV Display - Public queue display with voice announcements
- Admin Dashboard - System configuration and user management

**Application Layer (Logic Tier):**
- FastAPI REST API Server (Port 8000)
- Socket.IO WebSocket Server (mounted at /socket.io/)
- Background Task Processing (PDF generation, notifications)

**Data Layer (Data Tier):**
- PostgreSQL Database - Primary data storage
- File Storage - Document uploads and generated PDFs
- External Services - Google Cloud TTS, WhatsApp API, SMTP

### 2.2 Request Flow Description

1. User performs action in React frontend
2. Axios HTTP client sends request to backend
3. FastAPI controller receives and validates request
4. Service layer executes business logic
5. Repository layer performs database operations via SQLAlchemy
6. Response returns through the same path
7. Socket.IO emits real-time events for queue updates

---

## 3. BACKEND ARCHITECTURE

### 3.1 Directory Structure

```
backend/
    app/
        __init__.py
        main.py                    - FastAPI application entry point
        core/
            config.py              - Environment configuration
            database.py            - SQLAlchemy database connection
            deps.py                - Dependency injection
            security.py            - JWT and password hashing
            socket_manager.py      - Socket.IO manager
            startup.py             - Application startup
        controllers/               - API route handlers
        models/                    - SQLAlchemy ORM models
        repositories/              - Data access layer
        schemas/                   - Pydantic schemas
        services/                  - Business logic layer
        utils/
            notification_service.py
            prescription_generator.py
    alembic/                       - Database migrations
    scripts/                       - Utility scripts
    requirements.txt
    .env
```

### 3.2 Layered Architecture Pattern

**Controller Layer:**
- Route definitions and request handling
- Input validation using Pydantic schemas
- HTTP status code management
- Response formatting

**Service Layer:**
- Business logic implementation
- Data transformation and aggregation
- Cross-cutting concerns
- Orchestration of multiple operations

**Repository Layer:**
- Data access abstraction
- SQL query construction
- Database operations
- Optional caching layer

**Model Layer:**
- SQLAlchemy ORM model definitions
- Table and column definitions
- Relationship mappings
- Data constraints

### 3.3 Socket.IO Events

| Event Name | Direction | Purpose |
|------------|-----------|---------|
| queue_updated | Server to Client | Notify all clients of queue state changes |
| patient_called | Server to Client | Trigger TV voice announcement |
| join_queue | Client to Server | Subscribe to doctor-specific room |
| leave_queue | Client to Server | Unsubscribe from room |

---

## 4. FRONTEND ARCHITECTURE

### 4.1 Directory Structure

```
src/
    main.tsx                       - Application entry point
    App.tsx                        - Root component with routing
    components/
        ui/                        - shadcn/ui component library
        layout/                    - Layout components
        frontoffice/               - Front office components
        doctor/                    - Doctor module components
        admin/                     - Admin module components
    contexts/
        AuthContext.tsx            - Authentication state
        ClinicDataContext.tsx      - Shared clinic data
        AdminContext.tsx           - Admin module state
    hooks/
        useVoiceAnnouncement.ts    - TTS voice control hook
    pages/                         - Page components
    services/                      - API service modules
    lib/
        utils.ts                   - Utility functions
```

### 4.2 State Management Architecture

**QueryClientProvider (Top Level):**
- TanStack Query for server state caching
- Automatic refetching and cache invalidation

**AuthProvider:**
- User authentication state
- Login/logout functions
- Token management

**ClinicDataProvider:**
- Shared clinic data (appointments, patients, doctors)
- Data fetching and caching
- Cross-component data sharing

**AdminProvider:**
- Admin-specific state
- Staff, medicines, settings data

### 4.3 Routing Configuration

| Route Path | Component | Access Level |
|------------|-----------|--------------|
| /login | LoginPage | Public |
| / | DashboardRouter | Authenticated |
| /admin/* | AdminDashboard | Admin only |
| /tv-display | TVDisplayPage | Authenticated |
| * | NotFound | Public |

---

## 5. DATABASE SCHEMA EXPLANATION

### 5.1 Core Tables Overview

The database consists of interconnected tables that support the clinic workflow from patient registration through billing.

### 5.2 Users Table

| Column | Data Type | Description |
|--------|-----------|-------------|
| id | UUID | Primary key |
| username | VARCHAR(100) | Unique login identifier |
| password_hash | VARCHAR(255) | Bcrypt hashed password |
| display_name | VARCHAR(200) | Name shown in UI |
| role | ENUM | admin, front-office, doctor |
| is_active | BOOLEAN | Account status |
| last_login | TIMESTAMP | Last login timestamp |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last modification time |

### 5.3 Patients Table

| Column | Data Type | Description |
|--------|-----------|-------------|
| id | UUID | Primary key |
| mr_number | VARCHAR(20) | Medical Record Number (MR-XXXXX) |
| first_name | VARCHAR(100) | Patient first name |
| last_name | VARCHAR(100) | Patient last name |
| date_of_birth | DATE | For age calculation |
| gender | ENUM | Male, Female, Other |
| phone | VARCHAR(15) | Primary contact number |
| email | VARCHAR(255) | Email address |
| patient_type | ENUM | New, Review, Emergency, Referral |
| address | TEXT | Street address |
| city | VARCHAR(100) | City name |
| state | VARCHAR(100) | State name |
| pin_code | VARCHAR(10) | Postal code |

### 5.4 Appointments Table

| Column | Data Type | Description |
|--------|-----------|-------------|
| id | UUID | Primary key |
| op_number | VARCHAR(20) | Outpatient Number (OP-YYYYMMDD-XXX) |
| patient_id | UUID (FK) | Foreign key to patients |
| doctor_id | UUID (FK) | Foreign key to doctors |
| appointment_date | DATE | Date of appointment |
| appointment_time | TIME | Scheduled time |
| token_number | INTEGER | Daily queue position |
| status | ENUM | waiting, calling, in-progress, completed, cancelled |
| waiting_time_minutes | INTEGER | Calculated ETA |
| buffer_time_minutes | INTEGER | Additional buffer time |
| announcement_played | BOOLEAN | TTS tracking flag |
| room | VARCHAR(20) | Consultation room number |

### 5.5 Prescriptions Table

| Column | Data Type | Description |
|--------|-----------|-------------|
| id | UUID | Primary key |
| patient_id | UUID (FK) | Foreign key to patients |
| appointment_id | UUID (FK) | Foreign key to appointments |
| doctor_id | UUID (FK) | Foreign key to doctors |
| diagnosis | TEXT | Primary diagnosis |
| complaint | TEXT | Chief complaint |
| lab_tests | TEXT | Ordered lab tests |
| advice | TEXT | Medical advice |
| follow_up_days | INTEGER | Follow-up recommendation |
| sent_to_patient | BOOLEAN | Delivery status |
| sent_via | VARCHAR(20) | Delivery method |

### 5.6 Bills Table

| Column | Data Type | Description |
|--------|-----------|-------------|
| id | UUID | Primary key |
| bill_number | VARCHAR(20) | Bill Number (BLL-YYYYMMDD-XXX) |
| patient_id | UUID (FK) | Foreign key to patients |
| appointment_id | UUID (FK) | Foreign key to appointments |
| consultation_fee | DECIMAL(10,2) | Consultation charge |
| subtotal | DECIMAL(10,2) | Amount before discount |
| discount_amount | DECIMAL(10,2) | Discount applied |
| total_amount | DECIMAL(10,2) | Final amount |
| paid_amount | DECIMAL(10,2) | Amount received |
| due_amount | DECIMAL(10,2) | Balance amount |
| payment_status | ENUM | pending, partial, paid |
| payment_method | ENUM | cash, card, upi |

---

## 6. AUTHENTICATION & ROLE FLOW

### 6.1 JWT Token Structure

The system uses JSON Web Tokens (JWT) for authentication with the following payload structure:

```
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

### 6.2 Token Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| Algorithm | HS256 | HMAC with SHA-256 |
| Access Token Expiry | 480 minutes | 8-hour clinic day |
| Refresh Token Expiry | 7 days | Weekly renewal |
| Bcrypt Rounds | 12 | Password hashing strength |

### 6.3 Authentication Flow

**Step 1: User Login**
- User enters credentials on login page
- Frontend sends POST request to /api/v1/auth/login

**Step 2: Credential Verification**
- Backend queries user by username
- Bcrypt verifies password hash

**Step 3: Token Generation**
- Backend generates access token (8-hour expiry)
- Backend generates refresh token (7-day expiry)

**Step 4: Token Storage**
- Frontend stores access token in localStorage
- Refresh token stored securely

**Step 5: Session Restoration**
- On app load, frontend checks for stored token
- If valid, fetches current user profile
- Redirects to appropriate dashboard

### 6.4 Role Definitions

**Admin Role (admin):**
- Full system access
- User management
- Doctor and staff management
- System settings configuration
- All data viewing privileges

**Front Office Role (front-office):**
- Patient registration
- Appointment creation
- Vitals collection
- Billing and payments
- Queue management
- Document upload

**Doctor Role (doctor):**
- View patient queue
- Create prescriptions
- Order lab tests
- View patient history
- Complete appointments
- Send prescriptions to patient/lab/pharmacy

### 6.5 Route Protection Matrix

| Endpoint Category | Admin | Front Office | Doctor |
|-------------------|:-----:|:------------:|:------:|
| Patient Management | Yes | Yes | View Only |
| Appointment Create | No | Yes | No |
| Appointment Call | No | Yes | Yes |
| Prescriptions | No | No | Yes |
| Billing | No | Yes | No |
| Admin Endpoints | Yes | No | No |
| Queue View | Yes | Yes | Yes |

---

## 7. APPOINTMENT STATUS FLOW DIAGRAM

### 7.1 Status States

| Status | Description |
|--------|-------------|
| waiting | Patient registered, waiting in queue |
| calling | Doctor clicked Call, TV announcing patient |
| in-progress | Consultation in progress |
| completed | Consultation finished |
| cancelled | Appointment cancelled |

### 7.2 State Transitions

**Transition 1: waiting to calling**
- Trigger: Doctor clicks "Call Next" button
- Action: Backend sets status to calling
- Socket Event: queue_updated emitted

**Transition 2: calling to in-progress**
- Trigger: TV announcement completes
- Action: Frontend calls complete-announcement API
- Backend: Sets announcement_played=true AND status=in-progress atomically

**Transition 3: in-progress to completed**
- Trigger: Doctor completes consultation
- Action: Doctor clicks "Complete" button
- Backend: Sets status to completed with timestamp

**Transition 4: Any to cancelled**
- Trigger: User cancels appointment
- Action: Status set to cancelled
- Note: Can only cancel from waiting, calling, or in-progress

### 7.3 Critical Flow: Calling to In-Progress

This transition is controlled by TV announcement completion to ensure patient is properly called before consultation begins:

1. Doctor clicks "Call" button
2. Backend sets status to "calling"
3. Socket.IO emits queue_updated event
4. TV Display detects calling status
5. TV plays voice announcement (Telugu + English)
6. After announcement completes, TV calls complete-announcement API
7. Backend atomically sets announcement_played=true AND status=in-progress
8. Only first TV to complete succeeds (multi-TV safe)

---

## 8. VOICE ANNOUNCEMENT LOGIC

### 8.1 System Overview

The voice announcement system uses Google Cloud Text-to-Speech API to generate bilingual announcements for patient calls on the TV display.

### 8.2 Supported Languages

| Language | Code | Voice Type |
|----------|------|------------|
| Telugu | te-IN | Female |
| English | en-IN | Female |

### 8.3 Announcement Sequence

The announcement plays 4 times in alternating languages:

**Sequence 1: Telugu**
"OP number [number], name [name], please proceed to room number [room]"
(Translated to Telugu)

**Pause: 2.5 seconds**

**Sequence 2: English**
"OP number [number], name [name], please proceed to room number [room]"

**Pause: 2.5 seconds**

**Sequence 3: Telugu (repeat)**

**Pause: 2.5 seconds**

**Sequence 4: English (repeat)**

### 8.4 Number Conversion

For clarity, OP numbers are converted to spoken words:

| Digit | English | Telugu |
|-------|---------|--------|
| 0 | zero | sunna |
| 1 | one | okati |
| 2 | two | rendu |
| 3 | three | moodu |
| 4 | four | naalugu |
| 5 | five | aidu |
| 6 | six | aaru |
| 7 | seven | edu |
| 8 | eight | enimidi |
| 9 | nine | tommidi |

### 8.5 TTS API Endpoint

**Endpoint:** POST /api/v1/tts/generate

**Request:**
```
{
  "text": "announcement text here",
  "language": "telugu" or "english"
}
```

**Response:** Binary audio stream (audio/mpeg)

### 8.6 Multi-TV Safety Features

- Backend tracks announcement_played field
- Frontend tracks triggered announcements locally
- Atomic database update prevents race conditions
- Only first TV to complete announcement succeeds

---

## 9. ETA CALCULATION LOGIC

### 9.1 Overview

ETA (Estimated Time of Arrival) shows patients their expected wait time in the queue.

### 9.2 Calculation Formula

```
ETA = waiting_time_minutes + buffer_time_minutes
```

**waiting_time_minutes:**
- Queue position multiplied by average consultation time
- Default average: 15 minutes per patient

**buffer_time_minutes:**
- Additional time added by doctor for complex cases
- Added individually to specific appointments

### 9.3 ETA Recalculation Process

When a doctor calls the next patient:

**Step 1:** Get first waiting patient for the doctor

**Step 2:** Set patient status to "calling"

**Step 3:** Reduce waiting time for ALL remaining waiting patients

**Reduction Formula:**
```
new_waiting_time = MAX(0, current_waiting_time - reduce_minutes)
```

Default reduce_minutes = 15

### 9.4 Example Progression

**Initial State:**
- Patient A: 0 minutes
- Patient B: 15 minutes
- Patient C: 30 minutes
- Patient D: 45 minutes

**After First Call (Patient A called):**
- Patient A: in-progress
- Patient B: 0 minutes
- Patient C: 15 minutes
- Patient D: 30 minutes

**After Second Call (Patient B called):**
- Patient A: completed
- Patient B: in-progress
- Patient C: 0 minutes
- Patient D: 15 minutes

### 9.5 Buffer Time Management

Doctors can add extra buffer time for complex cases:

**Action:** Add 10 minutes buffer to Patient C

**Effect:**
- Patient C: waiting_time + 10 minutes buffer
- Patient D: waiting_time + 10 minutes (cascade effect)

---

## 10. WHATSAPP HYBRID MODE ARCHITECTURE

### 10.1 Overview

The system supports two WhatsApp modes for sending documents to patients:

| Mode | Environment Variable | Use Case |
|------|---------------------|----------|
| META | VITE_WHATSAPP_MODE=META | Production - WhatsApp Business Cloud API |
| LOCAL | VITE_WHATSAPP_MODE=LOCAL | Development - Manual sending |

### 10.2 META Mode (Production)

**Flow Description:**

1. User clicks "Send via WhatsApp" button
2. Frontend calls backend API endpoint
3. Backend generates PDF document
4. Backend uploads PDF to WhatsApp Cloud API
5. Backend sends document message via Graph API
6. Patient receives PDF in WhatsApp automatically

**Advantages:**
- Fully automated
- No manual intervention required
- Professional delivery

**Requirements:**
- Meta Business account
- WhatsApp Business API access
- Approved message templates

### 10.3 LOCAL Mode (Development)

**Flow Description:**

1. User clicks "Send via WhatsApp" button
2. Frontend downloads PDF from backend
3. Browser saves PDF to downloads folder
4. Frontend opens WhatsApp via URL scheme
5. WhatsApp app opens with pre-filled message
6. User manually attaches downloaded PDF
7. User sends message

**Advantages:**
- No API setup required
- Works with personal WhatsApp
- Good for testing

**Limitations:**
- Requires manual attachment
- User must have WhatsApp installed

### 10.4 Phone Number Sanitization

The system automatically sanitizes phone numbers:

**Input Formats Supported:**
- 9876543210 (10 digits)
- +919876543210 (with country code)
- 09876543210 (with leading zero)
- 91 9876543210 (with spaces)

**Output Format:**
919876543210 (12 digits with country code)

### 10.5 Supported Document Types

| Document Type | META Mode | LOCAL Mode |
|---------------|:---------:|:----------:|
| Prescriptions | Yes | Yes |
| Bill Receipts | Yes | Yes |
| Day Summaries | Yes | Yes |

---

## 11. BILLS & DAY PAYMENTS FLOW

### 11.1 Billing Workflow

**Step 1: Patient Registration**
- Front office registers patient
- Creates appointment with token number

**Step 2: Vitals Collection**
- Nurse/technician collects vitals
- BP, pulse, temperature, weight recorded

**Step 3: Doctor Consultation**
- Doctor examines patient
- Creates prescription with diagnosis

**Step 4: Bill Generation**
- Front office creates bill
- Adds consultation fee
- Adds lab tests if ordered
- Applies discount if applicable

**Step 5: Payment Collection**
- Patient pays via Cash/Card/UPI
- Payment status updated
- Receipt generated

**Step 6: Receipt Delivery**
- Print receipt
- Email PDF
- Send via WhatsApp

### 11.2 Bill Components

| Component | Description |
|-----------|-------------|
| Consultation Fee | Doctor's consultation charge |
| Lab Tests | Ordered diagnostic tests |
| Other Charges | Additional services |
| Subtotal | Sum before discount |
| Discount | Percentage or fixed discount |
| Total Amount | Final payable amount |
| Paid Amount | Amount received |
| Due Amount | Balance remaining |

### 11.3 Payment Methods

| Method | Code | Description |
|--------|------|-------------|
| Cash | cash | Physical currency payment |
| Card | card | Debit/Credit card payment |
| UPI | upi | UPI digital payment |

### 11.4 Payment Status

| Status | Description |
|--------|-------------|
| pending | No payment received yet |
| partial | Some amount paid, balance due |
| paid | Full amount received |

### 11.5 Day Payments Summary

The Day Payments feature provides end-of-day financial reporting:

**Summary Fields:**
- Date
- Cash total
- Card total
- UPI total
- Grand total
- Total transaction count
- List of all bills

**Export Options:**
- View on screen
- Download as PDF
- Send via Email
- Send via WhatsApp

---

## 12. ENVIRONMENT VARIABLES

### 12.1 Backend Environment Variables

**Application Settings:**

| Variable | Default | Description |
|----------|---------|-------------|
| APP_NAME | Balaji Heart Center API | Application name |
| APP_VERSION | 1.0.0 | Version number |
| DEBUG | False | Debug mode flag |
| API_V1_PREFIX | /api/v1 | API prefix |

**Database Configuration:**

| Variable | Example | Description |
|----------|---------|-------------|
| DATABASE_URL | postgresql://user:pass@host:5432/db | Connection string |
| DATABASE_ECHO | False | SQL logging |

**JWT Authentication:**

| Variable | Default | Description |
|----------|---------|-------------|
| JWT_SECRET_KEY | (required) | Secret key for JWT signing |
| JWT_ALGORITHM | HS256 | Signing algorithm |
| ACCESS_TOKEN_EXPIRE_MINUTES | 480 | Access token lifetime |
| REFRESH_TOKEN_EXPIRE_DAYS | 7 | Refresh token lifetime |

**Security:**

| Variable | Default | Description |
|----------|---------|-------------|
| BCRYPT_ROUNDS | 12 | Password hashing rounds |
| ALLOWED_ORIGINS | localhost origins | CORS allowed origins |

**Server:**

| Variable | Default | Description |
|----------|---------|-------------|
| HOST | 0.0.0.0 | Server bind address |
| PORT | 8000 | Server port |

**Email (SMTP):**

| Variable | Description |
|----------|-------------|
| SMTP_HOST | SMTP server hostname |
| SMTP_PORT | SMTP port (usually 587) |
| SMTP_USER | SMTP username |
| SMTP_PASSWORD | SMTP password |
| SMTP_FROM | From email address |
| SMTP_USE_TLS | Enable TLS |

**WhatsApp Business API:**

| Variable | Description |
|----------|-------------|
| WHATSAPP_PHONE_NUMBER_ID | WhatsApp Business phone ID |
| WHATSAPP_ACCESS_TOKEN | API access token |

**Google Cloud TTS:**

| Variable | Description |
|----------|-------------|
| GOOGLE_APPLICATION_CREDENTIALS | Path to service account JSON |

### 12.2 Frontend Environment Variables

| Variable | Example | Description |
|----------|---------|-------------|
| VITE_API_BASE_URL | http://localhost:8000/api/v1 | API base URL |
| VITE_API_URL | http://localhost:8000 | Server URL |
| VITE_APP_NAME | Balaji Heart Center | App name |
| VITE_APP_VERSION | 1.0.0 | App version |
| VITE_WHATSAPP_MODE | LOCAL or META | WhatsApp mode |
| VITE_ENABLE_DEBUG | false | Debug flag |

---

## 13. API ENDPOINT DOCUMENTATION

### 13.1 Authentication Endpoints

**POST /api/v1/auth/login**
- Description: User login
- Auth Required: No
- Request: { username_or_email, password }
- Response: { access_token, refresh_token, user }

**POST /api/v1/auth/refresh**
- Description: Refresh access token
- Auth Required: No (requires refresh token)
- Request: { refresh_token }
- Response: { access_token }

**GET /api/v1/auth/me**
- Description: Get current user profile
- Auth Required: Yes
- Response: User object

### 13.2 Patient Endpoints

**POST /api/v1/patients**
- Description: Create new patient
- Auth Required: Yes (Front Office)
- Request: Patient data
- Response: Created patient

**GET /api/v1/patients**
- Description: List patients with pagination
- Auth Required: Yes
- Query: skip, limit
- Response: Patient list

**GET /api/v1/patients/{id}**
- Description: Get patient by ID
- Auth Required: Yes
- Response: Patient object

**GET /api/v1/patients/search**
- Description: Search patients
- Auth Required: Yes
- Query: q (search term)
- Response: Matching patients

**GET /api/v1/patients/mr/{mr_number}**
- Description: Get patient by MR number
- Auth Required: Yes
- Response: Patient object

### 13.3 Appointment Endpoints

**POST /api/v1/appointments**
- Description: Create appointment
- Auth Required: Yes (Front Office)
- Request: Appointment data
- Response: Created appointment

**GET /api/v1/appointments/today**
- Description: Get today's appointments
- Auth Required: Yes
- Query: doctor_id, status
- Response: Appointment list

**GET /api/v1/appointments/queue/stats**
- Description: Get queue statistics
- Auth Required: Yes
- Response: Queue statistics

**POST /api/v1/appointments/{id}/call**
- Description: Call specific patient
- Auth Required: Yes (Doctor, Front Office)
- Response: Updated appointment

**POST /api/v1/appointments/call-next/{doctor_id}**
- Description: Call next waiting patient
- Auth Required: Yes (Doctor, Front Office)
- Query: reduce_minutes (default: 15)
- Response: Called appointment

**POST /api/v1/appointments/{id}/complete**
- Description: Complete appointment
- Auth Required: Yes (Doctor)
- Response: Completed appointment

**POST /api/v1/appointments/{id}/cancel**
- Description: Cancel appointment
- Auth Required: Yes
- Response: Cancelled appointment

**POST /api/v1/appointments/{id}/buffer**
- Description: Add buffer time
- Auth Required: Yes (Doctor, Front Office)
- Query: minutes
- Response: Updated appointment

**POST /api/v1/appointments/{id}/complete-announcement**
- Description: Mark announcement as completed
- Auth Required: Yes
- Response: Updated appointment

### 13.4 Prescription Endpoints

**POST /api/v1/prescriptions**
- Description: Create prescription
- Auth Required: Yes (Doctor)
- Request: Prescription data with medicines
- Response: Created prescription

**GET /api/v1/prescriptions/{id}**
- Description: Get prescription by ID
- Auth Required: Yes (Doctor)
- Response: Prescription object

**GET /api/v1/prescriptions/appointment/{id}**
- Description: Get prescription by appointment
- Auth Required: Yes (Doctor)
- Response: Prescription object

**GET /api/v1/prescriptions/patient/{id}**
- Description: Get patient prescription history
- Auth Required: Yes (Doctor)
- Response: Prescription list

**GET /api/v1/prescriptions/{id}/pdf**
- Description: Download prescription PDF
- Auth Required: Yes (Doctor)
- Response: PDF file

**POST /api/v1/prescriptions/{id}/send/email**
- Description: Send prescription via email
- Auth Required: Yes (Doctor)
- Response: Success status

**POST /api/v1/prescriptions/{id}/send/whatsapp**
- Description: Send prescription via WhatsApp
- Auth Required: Yes (Doctor)
- Response: Success status

### 13.5 Billing Endpoints

**POST /api/v1/billing**
- Description: Create bill
- Auth Required: Yes (Front Office)
- Request: Bill data
- Response: Created bill

**GET /api/v1/billing/{id}**
- Description: Get bill by ID
- Auth Required: Yes (Front Office)
- Response: Bill object

**GET /api/v1/billing/appointment/{id}**
- Description: Get bill by appointment
- Auth Required: Yes (Front Office)
- Response: Bill object

**PUT /api/v1/billing/{id}/payment**
- Description: Update payment
- Auth Required: Yes (Front Office)
- Request: Payment data
- Response: Updated bill

**GET /api/v1/billing/{id}/receipt/pdf**
- Description: Download receipt PDF
- Auth Required: Yes (Front Office)
- Response: PDF file

**GET /api/v1/billing/day-summary**
- Description: Get day payment summary
- Auth Required: Yes (Front Office)
- Query: date
- Response: Day summary

### 13.6 Admin Endpoints

**GET /api/v1/admin/users**
- Description: List all users
- Auth Required: Yes (Admin)
- Response: User list

**POST /api/v1/admin/users**
- Description: Create user
- Auth Required: Yes (Admin)
- Request: User data
- Response: Created user

**PUT /api/v1/admin/users/{id}**
- Description: Update user
- Auth Required: Yes (Admin)
- Request: User data
- Response: Updated user

**DELETE /api/v1/admin/users/{id}**
- Description: Delete user
- Auth Required: Yes (Admin)
- Response: Success status

**GET /api/v1/admin/doctors**
- Description: List doctors
- Auth Required: Yes (Admin)
- Response: Doctor list

**POST /api/v1/admin/doctors**
- Description: Create doctor
- Auth Required: Yes (Admin)
- Request: Doctor data
- Response: Created doctor

### 13.7 TTS Endpoint

**POST /api/v1/tts/generate**
- Description: Generate speech audio
- Auth Required: Yes
- Request: { text, language }
- Response: Audio stream (audio/mpeg)

---

## 14. SECURITY DESIGN

### 14.1 Authentication Security

| Measure | Implementation |
|---------|----------------|
| Password Storage | Bcrypt with 12 rounds |
| Token Format | JWT with HS256 algorithm |
| Token Storage | localStorage for access token |
| Session Duration | 8-hour access, 7-day refresh |
| Token Validation | python-jose library |

### 14.2 Authorization Security

| Measure | Implementation |
|---------|----------------|
| Access Control | Role-based (RBAC) |
| Route Protection | FastAPI dependencies |
| Frontend Guards | Protected route components |
| Role Verification | On every API request |

### 14.3 API Security

| Measure | Implementation |
|---------|----------------|
| CORS | Strict origin allowlist |
| Input Validation | Pydantic schema validation |
| SQL Injection | SQLAlchemy parameterized queries |
| XSS Prevention | React automatic escaping |

### 14.4 Data Security

| Measure | Implementation |
|---------|----------------|
| Transport | HTTPS (production) |
| Database Access | Role-based PostgreSQL users |
| Sensitive Data | Environment variables only |
| Audit Trail | Created/updated timestamps |

### 14.5 Recommended Security Headers

| Header | Value |
|--------|-------|
| X-Frame-Options | SAMEORIGIN |
| X-Content-Type-Options | nosniff |
| X-XSS-Protection | 1; mode=block |
| Referrer-Policy | strict-origin-when-cross-origin |

---

## 15. DEPLOYMENT GUIDE

### 15.1 Prerequisites

| Component | Version | Purpose |
|-----------|---------|---------|
| Ubuntu Server | 22.04 LTS | Operating system |
| Python | 3.11+ | Backend runtime |
| Node.js | 18+ LTS | Frontend build |
| PostgreSQL | 15+ | Database |
| Nginx | Latest | Reverse proxy |
| SSL Certificate | - | HTTPS |

### 15.2 Backend Deployment Steps

**Step 1: Clone Repository**
```
git clone https://github.com/your-org/balaji-heart-center.git
cd balaji-heart-center/backend
```

**Step 2: Create Virtual Environment**
```
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Step 3: Configure Database**
```
sudo -u postgres psql
CREATE DATABASE balaji_heart_center;
CREATE USER bhc_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE balaji_heart_center TO bhc_user;
```

**Step 4: Configure Environment**
```
cp .env.example .env
# Edit .env with production values
```

**Step 5: Run Migrations**
```
alembic upgrade head
```

**Step 6: Start with Gunicorn**
```
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

### 15.3 Frontend Deployment Steps

**Step 1: Install Dependencies**
```
cd balaji-heart-center
npm install
```

**Step 2: Build for Production**
```
npm run build
```

**Step 3: Deploy to Web Server**
Copy the dist folder to your web server root.

### 15.4 Nginx Configuration

**Server Block:**
- Listen on ports 80 and 443
- SSL certificate configuration
- Serve frontend static files from dist folder
- Proxy /api/ requests to backend port 8000
- Proxy /socket.io/ requests with WebSocket upgrade headers

### 15.5 Systemd Service

Create service file at /etc/systemd/system/bhc-backend.service

Enable and start service:
```
sudo systemctl enable bhc-backend
sudo systemctl start bhc-backend
```

### 15.6 Google Cloud TTS Setup

1. Create Google Cloud project
2. Enable Cloud Text-to-Speech API
3. Create service account with TTS permissions
4. Download JSON key file
5. Configure GOOGLE_APPLICATION_CREDENTIALS

### 15.7 WhatsApp Business API Setup

1. Create Meta Business account
2. Apply for WhatsApp Business API
3. Create and approve message templates
4. Configure phone number ID and access token

---

## 16. FUTURE SCALABILITY SUGGESTIONS

### 16.1 Performance Improvements

| Area | Suggestion | Benefit |
|------|------------|---------|
| Caching | Add Redis | Reduce database load |
| CDN | CloudFlare or AWS | Faster static delivery |
| Database | Read replicas | Separate read/write |
| Search | Elasticsearch | Faster patient search |

### 16.2 Architecture Enhancements

| Area | Suggestion | Benefit |
|------|------------|---------|
| Message Queue | RabbitMQ/Redis | Background task processing |
| Microservices | Split services | Independent scaling |
| Containers | Docker | Consistent deployments |
| Orchestration | Kubernetes | Auto-scaling |

### 16.3 Feature Additions

| Feature | Description |
|---------|-------------|
| Multi-clinic | Support multiple locations |
| Telemedicine | Video consultation |
| Mobile App | Patient mobile application |
| Analytics | Operational dashboards |
| Inventory | Medicine stock management |
| Insurance | Direct claim processing |
| HL7/FHIR | Healthcare interoperability |

### 16.4 Monitoring Recommendations

| Tool | Purpose |
|------|---------|
| Sentry | Error tracking |
| Prometheus + Grafana | Metrics and dashboards |
| ELK Stack | Centralized logging |
| Uptime Robot | Availability monitoring |

### 16.5 Security Enhancements

| Enhancement | Description |
|-------------|-------------|
| Two-Factor Auth | For admin users |
| Audit Logging | Comprehensive action logs |
| Data Encryption | Encrypt data at rest |
| Penetration Testing | Regular assessments |

---

## APPENDIX A: DEFAULT CREDENTIALS

**WARNING: Change these immediately in production!**

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Front Office | frontoffice | front123 |
| Doctor | doctor | doctor123 |

---

## APPENDIX B: NUMBER FORMAT SPECIFICATIONS

**OP Number Format:**
OP-YYYYMMDD-XXX
Example: OP-20260226-001

**MR Number Format:**
MR-XXXXX
Example: MR-00001

**Bill Number Format:**
BLL-YYYYMMDD-XXX
Example: BLL-20260226-001

---

## APPENDIX C: STATUS ENUMS REFERENCE

**AppointmentStatus:**
- waiting - Patient in queue
- calling - TV announcing patient
- in-progress - Consultation active
- completed - Consultation finished
- cancelled - Appointment cancelled

**PaymentStatus:**
- pending - No payment received
- partial - Partial payment
- paid - Fully paid

**QueueStatus:**
- pending - Not yet started
- waiting - In queue
- in-progress - Being processed
- completed - Finished
- cancelled - Cancelled

---

## APPENDIX D: CONTACT INFORMATION

For technical support or questions regarding this documentation, please contact the development team.

---

**END OF DOCUMENT**
