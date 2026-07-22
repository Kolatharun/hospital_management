# Balaji Heart Center - Hospital Management System

A comprehensive hospital management system for Balaji Heart Center, featuring patient management, appointment scheduling, queue management, billing, and more.

## Features

- **Patient Management**: Register and manage patient records with complete medical history
- **Appointment Scheduling**: Book and manage doctor appointments with buffer time support
- **Queue Management**: Real-time queue tracking with TV display and voice announcements
- **Billing System**: Generate bills and receipts for consultations and lab services
- **Prescription Management**: Digital prescription creation and management
- **Master Data Management**: Configure doctors, medicines, and other master data
- **Role-based Access**: Admin, Doctor, and Front Office user roles

## Tech Stack

### Frontend
- React with TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- shadcn/ui (component library)

### Backend
- Python with FastAPI
- SQLAlchemy (ORM)
- Alembic (database migrations)
- PostgreSQL (database)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- PostgreSQL

### Frontend Setup

```sh
# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Setup

```sh
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload
```

## Project Structure

```
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── pages/              # Page components
│   ├── services/           # API services
│   └── hooks/              # Custom React hooks
├── backend/                # Backend source code
│   ├── app/
│   │   ├── controllers/    # API controllers
│   │   ├── models/         # Database models
│   │   ├── repositories/   # Data access layer
│   │   ├── schemas/        # Pydantic schemas
│   │   └── services/       # Business logic
│   └── alembic/            # Database migrations
└── public/                 # Static assets
```

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/balaji_heart_center
SECRET_KEY=your-secret-key
```

## License

This project is proprietary software for Balaji Heart Center.
