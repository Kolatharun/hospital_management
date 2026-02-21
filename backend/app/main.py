"""
Balaji Heart Center - Hospital Management System API

Main FastAPI application entry point.

This backend supports the React frontend with:
- JWT-based authentication
- Role-based access control (front-office, doctor)
- RESTful API endpoints

Frontend mapping:
- LoginPage.tsx → POST /api/v1/auth/login
- AuthContext.tsx → GET /api/v1/auth/me
- FrontOfficeDashboard.tsx → Front office endpoints
- DoctorDashboard.tsx → Doctor endpoints
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.config import settings
from app.core.database import check_db_connection
from app.core.startup import run_startup_initialization
from app.controllers.auth_controller import router as auth_router
from app.controllers.patient_controller import router as patient_router
from app.controllers.appointment_controller import router as appointment_router
from app.controllers.vitals_controller import router as vitals_router
from app.controllers.billing_controller import router as billing_router
from app.controllers.department_controller import router as department_router
from app.controllers.queue_controller import router as queue_router
from app.controllers.prescription_controller import router as prescription_router
from app.controllers.doctor_controller import router as doctor_router
from app.controllers.document_controller import router as document_router
from app.controllers.master_data_controller import router as master_router
from app.controllers.admin_controller import router as admin_router
from app.controllers.tts_controller import router as tts_router
from app.schemas.common import HealthCheckResponse, ErrorResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.

    Handles startup and shutdown events.
    """
    # Startup
    print(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"API documentation available at: http://{settings.HOST}:{settings.PORT}/docs")

    # Check database connection
    if check_db_connection():
        print("✓ Database connection successful")
        # Initialize tables, folders, and default data (safe for production)
        run_startup_initialization()
    else:
        print("✗ Database connection failed - check DATABASE_URL")

    yield

    # Shutdown
    print(f"Shutting down {settings.APP_NAME}")
  

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="""
## Balaji Heart Center - Hospital Management System API

Backend API for the Balaji Heart Center Hospital Management System.

### Features
- **Authentication**: JWT-based login with role-based access control
- **Front Office Module**: Patient registration, billing, vitals, queue management
- **Doctor Module**: Prescriptions, consultations, patient history

### Roles
- **Admin**: Full system access, user management, settings
- **Front Office**: Access to registration, billing, vitals, queue management
- **Doctor**: Access to prescriptions, consultations, patient queue

### Demo Credentials
- **Admin**: username=`admin`, password=`admin123`
- **Front Office**: username=`frontoffice`, password=`front123`
- **Doctor**: username=`doctor`, password=`doctor123`

### API Versioning
All endpoints are prefixed with `/api/v1`
    """,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)


# Configure CORS for frontend
# Derived from frontend running on Vite (localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

print("CORS allowed origins:", settings.allowed_origins_list)
# Global exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
):
    """
    Handle Pydantic validation errors.

    Returns a consistent error format.
    """
    errors = exc.errors()
    error_messages = []
    for error in errors:
        loc = " -> ".join(str(l) for l in error["loc"])
        error_messages.append(f"{loc}: {error['msg']}")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation error",
            "errors": error_messages,
            "error_code": "VALIDATION_ERROR",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )


# Global exception handler for unexpected errors
@app.exception_handler(Exception)
async def global_exception_handler(
    request: Request,
    exc: Exception,
):
    """
    Handle unexpected exceptions.

    Logs the error and returns a generic error response.
    """
    # In production, you would log this to a monitoring service
    print(f"Unexpected error: {exc}")

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An unexpected error occurred",
            "error_code": "INTERNAL_ERROR",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )


# ============================================================
# Health Check Endpoints
# ============================================================

@app.get(
    "/health",
    response_model=HealthCheckResponse,
    tags=["Health"],
    summary="Health Check",
    description="Check if the API is running and database is connected.",
)
async def health_check() -> HealthCheckResponse:
    """
    Health check endpoint for monitoring.

    Returns service status and database connectivity.
    """
    db_status = "connected" if check_db_connection() else "disconnected"

    return HealthCheckResponse(
        status="healthy",
        version=settings.APP_VERSION,
        database=db_status,
        timestamp=datetime.now(timezone.utc),
    )


@app.get(
    "/",
    tags=["Health"],
    summary="Root",
    description="API root - redirects to documentation.",
)
async def root():
    """
    Root endpoint with API information.
    """
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health",
    }


# ============================================================
# Include Routers
# ============================================================

# Authentication routes
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)

# Phase 2 - Front Office Module
app.include_router(patient_router, prefix=settings.API_V1_PREFIX)
app.include_router(appointment_router, prefix=settings.API_V1_PREFIX)
app.include_router(vitals_router, prefix=settings.API_V1_PREFIX)
app.include_router(billing_router, prefix=settings.API_V1_PREFIX)
app.include_router(department_router, prefix=settings.API_V1_PREFIX)
app.include_router(queue_router, prefix=settings.API_V1_PREFIX)

# Phase 3 - Doctor Module
app.include_router(prescription_router, prefix=settings.API_V1_PREFIX)
app.include_router(doctor_router, prefix=settings.API_V1_PREFIX)

# Phase 4 - Document Management
app.include_router(document_router, prefix=settings.API_V1_PREFIX)

# Master Data Management
app.include_router(master_router, prefix=settings.API_V1_PREFIX)

# Admin Module
app.include_router(admin_router, prefix=settings.API_V1_PREFIX)

# TTS Module
app.include_router(tts_router, prefix=settings.API_V1_PREFIX)


# ============================================================
# Run with Uvicorn
# ============================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
