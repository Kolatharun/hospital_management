"""
Admin Controller - Admin Module API Endpoints

Provides endpoints for:
- User management (CRUD, status toggle)
- Doctor management (CRUD, availability)
- Medicine master management (CRUD, bulk import)
- Master data management

All endpoints require admin role authentication.
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.core.database import get_db
from app.core.deps import get_admin_user
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.doctor import Doctor
from app.models.department import Department
from app.models.medicine import MedicineMaster
from app.schemas.admin import (
    MedicineMasterCreate,
    MedicineMasterUpdate,
    MedicineMasterResponse,
    MedicineMasterListResponse,
    MedicineMasterBulkCreate,
    AdminUserResponse,
    AdminUserListResponse,
    AdminUserStatusUpdate,
    AdminDoctorResponse,
    AdminDoctorListResponse,
    AdminDepartmentResponse,
    AdminDepartmentListResponse,
    AdminDepartmentCreate,
    AdminDepartmentUpdate,
)
from app.schemas.auth import UserCreate, UserUpdate
from app.schemas.department import DoctorCreate, DoctorUpdate
from app.schemas.common import MessageResponse


router = APIRouter(prefix="/admin", tags=["Admin"])


# ============================================================
# User Management Endpoints
# ============================================================

@router.get(
    "/users",
    response_model=AdminUserListResponse,
    summary="List all users",
    description="Get paginated list of all users. Admin only.",
)
async def list_users(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by username or display name"),
    role: Optional[str] = Query(None, description="Filter by role"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> AdminUserListResponse:
    """List all users with pagination and filters."""
    query = db.query(User).filter(User.is_deleted == False)

    # Apply filters
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                User.username.ilike(search_term),
                User.display_name.ilike(search_term),
                User.email.ilike(search_term),
            )
        )

    if role:
        query = query.filter(User.role == role)

    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    # Get total count
    total = query.count()

    # Apply pagination
    offset = (page - 1) * page_size
    users = query.order_by(User.created_at.desc()).offset(offset).limit(page_size).all()

    return AdminUserListResponse(
        items=[AdminUserResponse.model_validate(u) for u in users],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post(
    "/users",
    response_model=AdminUserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new user",
    description="Create a new user account. Admin only.",
)
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> AdminUserResponse:
    """Create a new user."""
    # Check if username exists
    existing = db.query(User).filter(
        User.username == user_data.username,
        User.is_deleted == False,
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists",
        )

    # Check if email exists (if provided)
    if user_data.email:
        existing_email = db.query(User).filter(
            User.email == user_data.email,
            User.is_deleted == False,
        ).first()

        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists",
            )

    # Create user
    user = User(
        username=user_data.username,
        password_hash=get_password_hash(user_data.password),
        display_name=user_data.display_name,
        email=user_data.email,
        role=UserRole(user_data.role),
        is_active=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return AdminUserResponse.model_validate(user)


@router.get(
    "/users/{user_id}",
    response_model=AdminUserResponse,
    summary="Get user by ID",
    description="Get user details by ID. Admin only.",
)
async def get_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> AdminUserResponse:
    """Get user by ID."""
    user = db.query(User).filter(
        User.id == user_id,
        User.is_deleted == False,
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return AdminUserResponse.model_validate(user)


@router.patch(
    "/users/{user_id}",
    response_model=AdminUserResponse,
    summary="Update user",
    description="Update user details. Admin only.",
)
async def update_user(
    user_id: UUID,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> AdminUserResponse:
    """Update user details."""
    user = db.query(User).filter(
        User.id == user_id,
        User.is_deleted == False,
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Update fields
    update_data = user_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)

    return AdminUserResponse.model_validate(user)


@router.post(
    "/users/{user_id}/toggle-status",
    response_model=AdminUserResponse,
    summary="Toggle user status",
    description="Activate or deactivate a user. Admin only.",
)
async def toggle_user_status(
    user_id: UUID,
    status_data: AdminUserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> AdminUserResponse:
    """Toggle user active status."""
    user = db.query(User).filter(
        User.id == user_id,
        User.is_deleted == False,
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Prevent self-deactivation
    if user.id == current_user.id and not status_data.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account",
        )

    user.is_active = status_data.is_active
    db.commit()
    db.refresh(user)

    return AdminUserResponse.model_validate(user)


@router.delete(
    "/users/{user_id}",
    response_model=MessageResponse,
    summary="Delete user (soft delete)",
    description="Soft delete a user. Admin only.",
)
async def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> MessageResponse:
    """Soft delete a user."""
    user = db.query(User).filter(
        User.id == user_id,
        User.is_deleted == False,
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Prevent self-deletion
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account",
        )

    user.soft_delete()
    db.commit()

    return MessageResponse(message="User deleted successfully")


@router.get(
    "/users/unlinked-doctors",
    response_model=list[AdminUserResponse],
    summary="List unlinked doctor users",
    description="Get list of users with doctor role who are not linked to any doctor profile. Admin only.",
)
async def list_unlinked_doctor_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> list[AdminUserResponse]:
    """Get doctor-role users not linked to any doctor profile."""
    # Get all user IDs that are already linked to doctors
    linked_user_ids = db.query(Doctor.user_id).filter(
        Doctor.user_id.isnot(None),
        Doctor.is_deleted == False,
    ).all()
    linked_ids = {uid[0] for uid in linked_user_ids}

    # Get all active doctor-role users not in the linked list
    users = db.query(User).filter(
        User.role == UserRole.DOCTOR,
        User.is_active == True,
        User.is_deleted == False,
        ~User.id.in_(linked_ids) if linked_ids else True,
    ).order_by(User.display_name.asc()).all()

    return [AdminUserResponse.model_validate(u) for u in users]


# ============================================================
# Doctor Management Endpoints
# ============================================================

@router.get(
    "/doctors",
    response_model=AdminDoctorListResponse,
    summary="List all doctors",
    description="Get paginated list of all doctors. Admin only.",
)
async def list_doctors(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by name or speciality"),
    department_id: Optional[UUID] = Query(None, description="Filter by department"),
    is_available: Optional[bool] = Query(None, description="Filter by availability"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> AdminDoctorListResponse:
    """List all doctors with pagination and filters."""
    query = db.query(Doctor).filter(Doctor.is_deleted == False)

    # Apply filters
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Doctor.name.ilike(search_term),
                Doctor.speciality.ilike(search_term),
                Doctor.registration_number.ilike(search_term),
            )
        )

    if department_id:
        query = query.filter(Doctor.department_id == department_id)

    if is_available is not None:
        query = query.filter(Doctor.is_available == is_available)

    # Get total count
    total = query.count()

    # Apply pagination
    offset = (page - 1) * page_size
    doctors = query.order_by(Doctor.created_at.desc()).offset(offset).limit(page_size).all()

    # Build response with department names
    items = []
    for doctor in doctors:
        doctor_dict = {
            "id": doctor.id,
            "name": doctor.name,
            "registration_number": doctor.registration_number,
            "qualification": doctor.qualification,
            "speciality": doctor.speciality,
            "consultation_fee": float(doctor.consultation_fee) if doctor.consultation_fee else None,
            "department_id": doctor.department_id,
            "department_name": doctor.department.name if doctor.department else None,
            "phone": doctor.phone,
            "email": doctor.email,
            "room": doctor.room,
            "is_available": doctor.is_available,
            "user_id": doctor.user_id,
            "created_at": doctor.created_at,
        }
        items.append(AdminDoctorResponse(**doctor_dict))

    return AdminDoctorListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post(
    "/doctors",
    response_model=AdminDoctorResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new doctor",
    description="Create a new doctor record. Admin only.",
)
async def create_doctor(
    doctor_data: DoctorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> AdminDoctorResponse:
    """Create a new doctor."""
    # Validate department if provided
    if doctor_data.department_id:
        dept = db.query(Department).filter(
            Department.id == doctor_data.department_id,
            Department.is_deleted == False,
        ).first()
        if not dept:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Department not found",
            )

    # Validate user_id - check if user exists and has doctor role
    if doctor_data.user_id:
        user = db.query(User).filter(
            User.id == doctor_data.user_id,
            User.is_deleted == False,
        ).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        if user.role != UserRole.DOCTOR:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User must have 'doctor' role to be linked to a doctor profile",
            )
        # Check if user is already linked to another doctor
        existing_link = db.query(Doctor).filter(
            Doctor.user_id == doctor_data.user_id,
            Doctor.is_deleted == False,
        ).first()
        if existing_link:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User is already linked to doctor: {existing_link.name}",
            )

    # Create doctor
    doctor = Doctor(
        name=doctor_data.name,
        speciality=doctor_data.speciality,
        qualification=doctor_data.qualification,
        registration_number=doctor_data.registration_number,
        phone=doctor_data.phone,
        email=doctor_data.email,
        room=doctor_data.room,
        consultation_fee=doctor_data.consultation_fee,
        department_id=doctor_data.department_id,
        user_id=doctor_data.user_id,
        is_available=True,
    )

    db.add(doctor)
    db.commit()
    db.refresh(doctor)

    return AdminDoctorResponse(
        id=doctor.id,
        name=doctor.name,
        registration_number=doctor.registration_number,
        qualification=doctor.qualification,
        speciality=doctor.speciality,
        consultation_fee=float(doctor.consultation_fee) if doctor.consultation_fee else None,
        department_id=doctor.department_id,
        department_name=doctor.department.name if doctor.department else None,
        phone=doctor.phone,
        email=doctor.email,
        room=doctor.room,
        is_available=doctor.is_available,
        user_id=doctor.user_id,
        created_at=doctor.created_at,
    )


@router.patch(
    "/doctors/{doctor_id}",
    response_model=AdminDoctorResponse,
    summary="Update doctor",
    description="Update doctor details. Admin only.",
)
async def update_doctor(
    doctor_id: UUID,
    doctor_data: DoctorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> AdminDoctorResponse:
    """Update doctor details."""
    doctor = db.query(Doctor).filter(
        Doctor.id == doctor_id,
        Doctor.is_deleted == False,
    ).first()

    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found",
        )

    # Validate user_id if being updated
    if doctor_data.user_id is not None:
        # If setting to a new user (not None/empty)
        if doctor_data.user_id:
            user = db.query(User).filter(
                User.id == doctor_data.user_id,
                User.is_deleted == False,
            ).first()
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found",
                )
            if user.role != UserRole.DOCTOR:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User must have 'doctor' role to be linked to a doctor profile",
                )
            # Check if user is already linked to another doctor (not this one)
            existing_link = db.query(Doctor).filter(
                Doctor.user_id == doctor_data.user_id,
                Doctor.id != doctor_id,
                Doctor.is_deleted == False,
            ).first()
            if existing_link:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"User is already linked to doctor: {existing_link.name}",
                )

    # Update fields
    update_data = doctor_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(doctor, field, value)

    db.commit()
    db.refresh(doctor)

    return AdminDoctorResponse(
        id=doctor.id,
        name=doctor.name,
        registration_number=doctor.registration_number,
        qualification=doctor.qualification,
        speciality=doctor.speciality,
        consultation_fee=float(doctor.consultation_fee) if doctor.consultation_fee else None,
        department_id=doctor.department_id,
        department_name=doctor.department.name if doctor.department else None,
        phone=doctor.phone,
        email=doctor.email,
        room=doctor.room,
        is_available=doctor.is_available,
        user_id=doctor.user_id,
        created_at=doctor.created_at,
    )


@router.delete(
    "/doctors/{doctor_id}",
    response_model=MessageResponse,
    summary="Delete doctor (soft delete)",
    description="Soft delete a doctor. Admin only.",
)
async def delete_doctor(
    doctor_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> MessageResponse:
    """Soft delete a doctor."""
    doctor = db.query(Doctor).filter(
        Doctor.id == doctor_id,
        Doctor.is_deleted == False,
    ).first()

    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found",
        )

    doctor.soft_delete()
    db.commit()

    return MessageResponse(message="Doctor deleted successfully")


# ============================================================
# Department Management Endpoints
# ============================================================

@router.get(
    "/departments",
    response_model=AdminDepartmentListResponse,
    summary="List all departments",
    description="Get paginated list of all departments. Admin only.",
)
async def list_departments(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by name or code"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> AdminDepartmentListResponse:
    """List all departments with pagination and filters."""
    query = db.query(Department).filter(Department.is_deleted == False)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Department.name.ilike(search_term),
                Department.code.ilike(search_term),
            )
        )

    if is_active is not None:
        query = query.filter(Department.is_active == is_active)

    total = query.count()
    offset = (page - 1) * page_size
    departments = query.order_by(Department.name.asc()).offset(offset).limit(page_size).all()

    items = []
    for dept in departments:
        items.append(AdminDepartmentResponse(
            id=dept.id,
            name=dept.name,
            code=dept.code,
            description=dept.description,
            base_consultation_fee=float(dept.base_consultation_fee) if dept.base_consultation_fee else 300.0,
            is_active=dept.is_active,
            created_at=dept.created_at,
        ))

    return AdminDepartmentListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post(
    "/departments",
    response_model=AdminDepartmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new department",
    description="Create a new department. Admin only.",
)
async def create_department(
    dept_data: AdminDepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> AdminDepartmentResponse:
    """Create a new department."""
    # Check if code exists
    existing = db.query(Department).filter(
        Department.code == dept_data.code,
        Department.is_deleted == False,
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department code already exists",
        )

    # Check if name exists
    existing_name = db.query(Department).filter(
        Department.name == dept_data.name,
        Department.is_deleted == False,
    ).first()

    if existing_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department name already exists",
        )

    department = Department(
        name=dept_data.name,
        code=dept_data.code,
        description=dept_data.description,
        base_consultation_fee=dept_data.base_consultation_fee,
        is_active=True,
    )

    db.add(department)
    db.commit()
    db.refresh(department)

    return AdminDepartmentResponse(
        id=department.id,
        name=department.name,
        code=department.code,
        description=department.description,
        base_consultation_fee=float(department.base_consultation_fee) if department.base_consultation_fee else 300.0,
        is_active=department.is_active,
        created_at=department.created_at,
    )


@router.get(
    "/departments/{department_id}",
    response_model=AdminDepartmentResponse,
    summary="Get department by ID",
    description="Get department details by ID. Admin only.",
)
async def get_department(
    department_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> AdminDepartmentResponse:
    """Get department by ID."""
    department = db.query(Department).filter(
        Department.id == department_id,
        Department.is_deleted == False,
    ).first()

    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )

    return AdminDepartmentResponse(
        id=department.id,
        name=department.name,
        code=department.code,
        description=department.description,
        base_consultation_fee=float(department.base_consultation_fee) if department.base_consultation_fee else 300.0,
        is_active=department.is_active,
        created_at=department.created_at,
    )


@router.patch(
    "/departments/{department_id}",
    response_model=AdminDepartmentResponse,
    summary="Update department",
    description="Update department details. Admin only.",
)
async def update_department(
    department_id: UUID,
    dept_data: AdminDepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> AdminDepartmentResponse:
    """Update department details."""
    department = db.query(Department).filter(
        Department.id == department_id,
        Department.is_deleted == False,
    ).first()

    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )

    update_data = dept_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(department, field, value)

    db.commit()
    db.refresh(department)

    return AdminDepartmentResponse(
        id=department.id,
        name=department.name,
        code=department.code,
        description=department.description,
        base_consultation_fee=float(department.base_consultation_fee) if department.base_consultation_fee else 300.0,
        is_active=department.is_active,
        created_at=department.created_at,
    )


@router.delete(
    "/departments/{department_id}",
    response_model=MessageResponse,
    summary="Delete department (soft delete)",
    description="Soft delete a department. Admin only.",
)
async def delete_department(
    department_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> MessageResponse:
    """Soft delete a department."""
    department = db.query(Department).filter(
        Department.id == department_id,
        Department.is_deleted == False,
    ).first()

    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )

    # Check if any doctors are linked to this department
    linked_doctors = db.query(Doctor).filter(
        Doctor.department_id == department_id,
        Doctor.is_deleted == False,
    ).count()

    if linked_doctors > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete department. {linked_doctors} doctor(s) are linked to it.",
        )

    department.soft_delete()
    db.commit()

    return MessageResponse(message="Department deleted successfully")


# ============================================================
# Medicine Master Endpoints
# ============================================================

@router.get(
    "/medicines",
    response_model=MedicineMasterListResponse,
    summary="List all medicines",
    description="Get paginated list of all medicines. Admin only.",
)
async def list_medicines(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by name, code, or generic name"),
    category: Optional[str] = Query(None, description="Filter by category"),
    specialization: Optional[str] = Query(None, description="Filter by specialization"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> MedicineMasterListResponse:
    """List all medicines with pagination and filters."""
    query = db.query(MedicineMaster).filter(MedicineMaster.is_deleted == False)

    # Apply filters
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                MedicineMaster.name.ilike(search_term),
                MedicineMaster.code.ilike(search_term),
                MedicineMaster.generic_name.ilike(search_term),
            )
        )

    if category:
        query = query.filter(MedicineMaster.category == category)

    if specialization:
        query = query.filter(MedicineMaster.specialization == specialization)

    if is_active is not None:
        query = query.filter(MedicineMaster.is_active == is_active)

    # Get total count
    total = query.count()

    # Apply pagination
    offset = (page - 1) * page_size
    medicines = query.order_by(MedicineMaster.name.asc()).offset(offset).limit(page_size).all()

    return MedicineMasterListResponse(
        items=[MedicineMasterResponse.model_validate(m) for m in medicines],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post(
    "/medicines",
    response_model=MedicineMasterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new medicine",
    description="Create a new medicine record. Admin only.",
)
async def create_medicine(
    medicine_data: MedicineMasterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> MedicineMasterResponse:
    """Create a new medicine."""
    # Check if code exists
    existing = db.query(MedicineMaster).filter(
        MedicineMaster.code == medicine_data.code,
        MedicineMaster.is_deleted == False,
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Medicine code already exists",
        )

    # Create medicine
    medicine = MedicineMaster(
        code=medicine_data.code,
        name=medicine_data.name,
        generic_name=medicine_data.generic_name,
        category=medicine_data.category,
        specialization=medicine_data.specialization,
        dosage_form=medicine_data.dosage_form,
        strength=medicine_data.strength,
        manufacturer=medicine_data.manufacturer,
        is_active=True,
    )

    db.add(medicine)
    db.commit()
    db.refresh(medicine)

    return MedicineMasterResponse.model_validate(medicine)


@router.post(
    "/medicines/bulk",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Bulk import medicines",
    description="Import multiple medicines at once. Admin only.",
)
async def bulk_import_medicines(
    bulk_data: MedicineMasterBulkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> MessageResponse:
    """Bulk import medicines."""
    imported = 0
    skipped = 0

    for medicine_data in bulk_data.medicines:
        # Check if code exists
        existing = db.query(MedicineMaster).filter(
            MedicineMaster.code == medicine_data.code,
            MedicineMaster.is_deleted == False,
        ).first()

        if existing:
            skipped += 1
            continue

        # Create medicine
        medicine = MedicineMaster(
            code=medicine_data.code,
            name=medicine_data.name,
            generic_name=medicine_data.generic_name,
            category=medicine_data.category,
            specialization=medicine_data.specialization,
            dosage_form=medicine_data.dosage_form,
            strength=medicine_data.strength,
            manufacturer=medicine_data.manufacturer,
            is_active=True,
        )

        db.add(medicine)
        imported += 1

    db.commit()

    return MessageResponse(
        message=f"Imported {imported} medicines, skipped {skipped} duplicates"
    )


@router.get(
    "/medicines/{medicine_id}",
    response_model=MedicineMasterResponse,
    summary="Get medicine by ID",
    description="Get medicine details by ID. Admin only.",
)
async def get_medicine(
    medicine_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> MedicineMasterResponse:
    """Get medicine by ID."""
    medicine = db.query(MedicineMaster).filter(
        MedicineMaster.id == medicine_id,
        MedicineMaster.is_deleted == False,
    ).first()

    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine not found",
        )

    return MedicineMasterResponse.model_validate(medicine)


@router.patch(
    "/medicines/{medicine_id}",
    response_model=MedicineMasterResponse,
    summary="Update medicine",
    description="Update medicine details. Admin only.",
)
async def update_medicine(
    medicine_id: UUID,
    medicine_data: MedicineMasterUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> MedicineMasterResponse:
    """Update medicine details."""
    medicine = db.query(MedicineMaster).filter(
        MedicineMaster.id == medicine_id,
        MedicineMaster.is_deleted == False,
    ).first()

    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine not found",
        )

    # Update fields
    update_data = medicine_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(medicine, field, value)

    db.commit()
    db.refresh(medicine)

    return MedicineMasterResponse.model_validate(medicine)


@router.post(
    "/medicines/{medicine_id}/toggle-status",
    response_model=MedicineMasterResponse,
    summary="Toggle medicine status",
    description="Activate or deactivate a medicine. Admin only.",
)
async def toggle_medicine_status(
    medicine_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> MedicineMasterResponse:
    """Toggle medicine active status."""
    medicine = db.query(MedicineMaster).filter(
        MedicineMaster.id == medicine_id,
        MedicineMaster.is_deleted == False,
    ).first()

    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine not found",
        )

    medicine.is_active = not medicine.is_active
    db.commit()
    db.refresh(medicine)

    return MedicineMasterResponse.model_validate(medicine)


@router.delete(
    "/medicines/{medicine_id}",
    response_model=MessageResponse,
    summary="Delete medicine (soft delete)",
    description="Soft delete a medicine. Admin only.",
)
async def delete_medicine(
    medicine_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> MessageResponse:
    """Soft delete a medicine."""
    medicine = db.query(MedicineMaster).filter(
        MedicineMaster.id == medicine_id,
        MedicineMaster.is_deleted == False,
    ).first()

    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine not found",
        )

    medicine.soft_delete()
    db.commit()

    return MessageResponse(message="Medicine deleted successfully")


# ============================================================
# Master Data Lookup Endpoints
# ============================================================

@router.get(
    "/master/categories",
    response_model=list[str],
    summary="Get medicine categories",
    description="Get list of unique medicine categories. Admin only.",
)
async def get_categories(
    specialization: Optional[str] = Query(None, description="Filter by specialization"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> list[str]:
    """Get unique medicine categories."""
    query = db.query(MedicineMaster.category).filter(
        MedicineMaster.is_deleted == False,
        MedicineMaster.is_active == True,
        MedicineMaster.category.isnot(None),
    )

    if specialization:
        query = query.filter(MedicineMaster.specialization == specialization)

    categories = query.distinct().all()
    return [c[0] for c in categories if c[0]]


@router.get(
    "/master/specializations",
    response_model=list[str],
    summary="Get medicine specializations",
    description="Get list of unique medicine specializations. Admin only.",
)
async def get_specializations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> list[str]:
    """Get unique medicine specializations."""
    specializations = db.query(MedicineMaster.specialization).filter(
        MedicineMaster.is_deleted == False,
        MedicineMaster.is_active == True,
        MedicineMaster.specialization.isnot(None),
    ).distinct().all()

    return [s[0] for s in specializations if s[0]]
