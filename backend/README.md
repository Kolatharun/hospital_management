# Balaji Heart Center - Backend API

Production-grade backend for the Balaji Heart Center Hospital Management System.

## Technology Stack

- **Framework**: FastAPI
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy 2.0
- **Migrations**: Alembic
- **Authentication**: JWT (python-jose)
- **Password Hashing**: bcrypt (passlib)
- **Validation**: Pydantic v2

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── core/                # Core modules
│   │   ├── config.py        # Application settings
│   │   ├── database.py      # Database connection
│   │   ├── security.py      # JWT & password hashing
│   │   └── deps.py          # Dependency injection
│   ├── models/              # SQLAlchemy ORM models
│   │   ├── base.py          # Base model with mixins
│   │   └── user.py          # User model
│   ├── schemas/             # Pydantic schemas
│   │   ├── common.py        # Shared schemas
│   │   └── auth.py          # Auth request/response schemas
│   ├── repositories/        # Database operations
│   │   ├── base.py          # Generic CRUD operations
│   │   └── user_repository.py
│   ├── services/            # Business logic
│   │   └── auth_service.py
│   └── controllers/         # API endpoints
│       └── auth_controller.py
├── alembic/                 # Database migrations
│   ├── env.py
│   └── versions/
├── scripts/
│   └── seed_data.py         # Demo data seeder
├── alembic.ini
├── requirements.txt
├── .env.example
└── README.md
```

## Setup Instructions

### 1. Prerequisites

- Python 3.11+
- PostgreSQL 14+
- pip or pipenv

### 2. Create Virtual Environment

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/balaji_heart_center
JWT_SECRET_KEY=your-secure-secret-key-min-32-characters
```

### 5. Create Database

```sql
CREATE DATABASE balaji_heart_center;
```

### 6. Run Migrations

```bash
alembic upgrade head
```

### 7. Seed Demo Data (Optional)

```bash
python scripts/seed_data.py
```

### 8. Start Server

```bash
# Development
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or using Python
python -m app.main
```

## API Documentation

Once running, access:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| Front Office | frontoffice | front123 |
| Doctor | doctor | doctor123 |

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | User login |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/auth/me` | Get current user |
| POST | `/api/v1/auth/logout` | Logout |
| POST | `/api/v1/auth/change-password` | Change password |

### User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/users` | Create user |
| GET | `/api/v1/auth/users/{id}` | Get user by ID |
| PATCH | `/api/v1/auth/users/{id}` | Update user |
| POST | `/api/v1/auth/users/{id}/deactivate` | Deactivate user |
| POST | `/api/v1/auth/users/{id}/activate` | Activate user |

## Authentication Flow

1. **Login**: POST `/api/v1/auth/login` with username/password
2. **Receive Tokens**: Get `access_token` and `refresh_token`
3. **Use Access Token**: Include in `Authorization: Bearer <token>` header
4. **Refresh**: When access token expires, POST `/api/v1/auth/refresh`

## Sample API Requests

### Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "frontoffice", "password": "front123"}'
```

Response:
```json
{
  "tokens": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer",
    "expires_in": 28800
  },
  "user": {
    "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "username": "frontoffice",
    "display_name": "Front Office Staff",
    "role": "front-office",
    "is_active": true
  }
}
```

### Get Current User

```bash
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer <access_token>"
```

## Development

### Adding New Migrations

```bash
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

### Running Tests

```bash
pytest
```

## Architecture Principles

1. **Separation of Concerns**
   - Models: Database structure only
   - Repositories: Database queries only
   - Services: Business logic
   - Controllers: HTTP handling

2. **Frontend-Driven Design**
   - All entities derived from UI analysis
   - API responses match frontend expectations
   - Validation rules from form requirements

3. **Security**
   - JWT with configurable expiration
   - bcrypt password hashing
   - Role-based access control
   - Soft delete pattern

## Phase 1 Complete

This is Phase 1 of the backend implementation covering:
- ✅ Authentication & Authorization
- ✅ JWT token management
- ✅ Role-based access control
- ✅ User management

Upcoming phases will add:
- Phase 2: Front Office Module (Patients, Appointments, Vitals, Billing)
- Phase 3: Doctor Module (Prescriptions, Queue Management)
