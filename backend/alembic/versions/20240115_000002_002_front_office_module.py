"""Front Office Module - Phase 2 tables

Revision ID: 002
Revises: 001
Create Date: 2024-01-15 00:00:02

Creates tables for:
- departments (hospital departments)
- doctors (physician records)
- patients (patient master)
- appointments (patient visits)
- patient_vitals (vital signs)
- prescriptions (medical prescriptions)
- prescription_medicines (prescribed medicines)
- bills (invoices)
- bill_line_items (invoice items)
- lab_queue_items (lab queue)
- pharmacy_queue_items (pharmacy queue)
- patient_documents (uploaded files)
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB, ENUM
from sqlalchemy import text

# Define enum types (they will be created manually before table creation)
gender_enum = ENUM('Male', 'Female', 'Other', name='gender_enum', create_type=False)
marital_status_enum = ENUM('Single', 'Married', 'Divorced', 'Widowed', name='marital_status_enum', create_type=False)
patient_type_enum = ENUM('New', 'Review', 'Emergency', 'Referral', name='patient_type_enum', create_type=False)
appointment_status_enum = ENUM('waiting', 'in-progress', 'completed', 'cancelled', name='appointment_status_enum', create_type=False)
queue_type_enum = ENUM('main', 'lab', 'pharmacy', name='queue_type_enum', create_type=False)
payment_status_enum = ENUM('pending', 'partial', 'paid', name='payment_status_enum', create_type=False)
payment_method_enum = ENUM('cash', 'card', 'upi', name='payment_method_enum', create_type=False)
bill_item_type_enum = ENUM('consultation', 'lab', 'pharmacy', 'procedure', 'other', name='bill_item_type_enum', create_type=False)
queue_status_enum = ENUM('waiting', 'in-progress', 'completed', name='queue_status_enum', create_type=False)

revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create all Phase 2 tables."""

    # Create enum types only if they don't exist (PostgreSQL safe pattern)
    op.execute(text("""
        DO $$ BEGIN
            CREATE TYPE gender_enum AS ENUM ('Male', 'Female', 'Other');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """))
    op.execute(text("""
        DO $$ BEGIN
            CREATE TYPE marital_status_enum AS ENUM ('Single', 'Married', 'Divorced', 'Widowed');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """))
    op.execute(text("""
        DO $$ BEGIN
            CREATE TYPE patient_type_enum AS ENUM ('New', 'Review', 'Emergency', 'Referral');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """))
    op.execute(text("""
        DO $$ BEGIN
            CREATE TYPE appointment_status_enum AS ENUM ('waiting', 'in-progress', 'completed', 'cancelled');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """))
    op.execute(text("""
        DO $$ BEGIN
            CREATE TYPE queue_type_enum AS ENUM ('main', 'lab', 'pharmacy');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """))
    op.execute(text("""
        DO $$ BEGIN
            CREATE TYPE payment_status_enum AS ENUM ('pending', 'partial', 'paid');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """))
    op.execute(text("""
        DO $$ BEGIN
            CREATE TYPE payment_method_enum AS ENUM ('cash', 'card', 'upi');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """))
    op.execute(text("""
        DO $$ BEGIN
            CREATE TYPE bill_item_type_enum AS ENUM ('consultation', 'lab', 'pharmacy', 'procedure', 'other');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """))
    op.execute(text("""
        DO $$ BEGIN
            CREATE TYPE queue_status_enum AS ENUM ('waiting', 'in-progress', 'completed');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """))

    # 1. Departments table
    op.create_table(
        'departments',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()')),
        sa.Column('name', sa.String(100), unique=True, nullable=False),
        sa.Column('code', sa.String(20), unique=True, nullable=False),
        sa.Column('description', sa.String(500), nullable=True),
        sa.Column('base_consultation_fee', sa.Numeric(10, 2), nullable=False, server_default='300.00'),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_departments_name', 'departments', ['name'])
    op.create_index('ix_departments_code', 'departments', ['code'])
    op.create_index('ix_departments_is_active', 'departments', ['is_active'])

    # 2. Doctors table
    op.create_table(
        'doctors',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()')),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, unique=True),
        sa.Column('department_id', UUID(as_uuid=True), sa.ForeignKey('departments.id', ondelete='SET NULL'), nullable=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('speciality', sa.String(100), nullable=True),
        sa.Column('qualification', sa.String(200), nullable=True),
        sa.Column('registration_number', sa.String(50), nullable=True, unique=True),
        sa.Column('phone', sa.String(15), nullable=True),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('room', sa.String(20), nullable=True),
        sa.Column('consultation_fee', sa.Numeric(10, 2), nullable=True),
        sa.Column('is_available', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_doctors_name', 'doctors', ['name'])
    op.create_index('ix_doctors_user_id', 'doctors', ['user_id'])
    op.create_index('ix_doctors_department_id', 'doctors', ['department_id'])
    op.create_index('ix_doctors_is_available', 'doctors', ['is_available'])

    # 3. Patients table
    op.create_table(
        'patients',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()')),
        sa.Column('mr_number', sa.String(20), unique=True, nullable=False),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('date_of_birth', sa.Date(), nullable=True),
        sa.Column('gender', gender_enum, nullable=False),
        sa.Column('marital_status', marital_status_enum, nullable=True),
        sa.Column('patient_type', patient_type_enum, nullable=True),
        sa.Column('phone', sa.String(15), nullable=False),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('emergency_contact', sa.String(15), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('city', sa.String(100), nullable=True),
        sa.Column('state', sa.String(100), nullable=True),
        sa.Column('pin_code', sa.String(10), nullable=True),
        sa.Column('blood_group', sa.String(10), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_patients_mr_number', 'patients', ['mr_number'])
    op.create_index('ix_patients_first_name', 'patients', ['first_name'])
    op.create_index('ix_patients_last_name', 'patients', ['last_name'])
    op.create_index('ix_patients_phone', 'patients', ['phone'])
    op.create_index('ix_patients_email', 'patients', ['email'])
    op.create_index('ix_patients_created_at', 'patients', ['created_at'])

    # 4. Appointments table
    op.create_table(
        'appointments',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()')),
        sa.Column('op_number', sa.String(20), unique=True, nullable=False),
        sa.Column('patient_id', UUID(as_uuid=True), sa.ForeignKey('patients.id', ondelete='CASCADE'), nullable=False),
        sa.Column('doctor_id', UUID(as_uuid=True), sa.ForeignKey('doctors.id', ondelete='SET NULL'), nullable=True),
        sa.Column('appointment_date', sa.Date(), nullable=False),
        sa.Column('appointment_time', sa.Time(), nullable=True),
        sa.Column('token_number', sa.Integer(), nullable=False),
        sa.Column('status', appointment_status_enum, nullable=False, server_default='waiting'),
        sa.Column('queue_type', queue_type_enum, nullable=False, server_default='main'),
        sa.Column('room', sa.String(20), nullable=True),
        sa.Column('waiting_time_minutes', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('called_at', sa.String(50), nullable=True),
        sa.Column('completed_at', sa.String(50), nullable=True),
        sa.Column('notes', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_appointments_op_number', 'appointments', ['op_number'])
    op.create_index('ix_appointments_patient_id', 'appointments', ['patient_id'])
    op.create_index('ix_appointments_doctor_id', 'appointments', ['doctor_id'])
    op.create_index('ix_appointments_date', 'appointments', ['appointment_date'])
    op.create_index('ix_appointments_status', 'appointments', ['status'])
    op.create_index('ix_appointments_date_status', 'appointments', ['appointment_date', 'status'])
    op.create_index('ix_appointments_doctor_date', 'appointments', ['doctor_id', 'appointment_date'])

    # 5. Patient Vitals table
    op.create_table(
        'patient_vitals',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()')),
        sa.Column('appointment_id', UUID(as_uuid=True), sa.ForeignKey('appointments.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('patient_id', UUID(as_uuid=True), sa.ForeignKey('patients.id', ondelete='CASCADE'), nullable=False),
        sa.Column('recorded_by', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('spo2', sa.Integer(), nullable=True),
        sa.Column('pulse', sa.Integer(), nullable=False),
        sa.Column('blood_pressure', sa.String(20), nullable=False),
        sa.Column('cvs', sa.String(100), nullable=True),
        sa.Column('rs', sa.String(100), nullable=True),
        sa.Column('jvp', sa.String(50), nullable=True),
        sa.Column('weight', sa.Numeric(5, 2), nullable=True),
        sa.Column('hlp', sa.String(50), nullable=True),
        sa.Column('htn', sa.String(50), nullable=True),
        sa.Column('dm', sa.String(50), nullable=True),
        sa.Column('smoking', sa.String(50), nullable=True),
        sa.Column('family_ho_cad', sa.String(100), nullable=True),
        sa.Column('heart_disease', sa.String(100), nullable=True),
        sa.Column('ptca_cabg', sa.String(100), nullable=True),
        sa.Column('current_drugs', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_patient_vitals_appointment_id', 'patient_vitals', ['appointment_id'])
    op.create_index('ix_patient_vitals_patient_id', 'patient_vitals', ['patient_id'])

    # 6. Prescriptions table
    op.create_table(
        'prescriptions',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()')),
        sa.Column('patient_id', UUID(as_uuid=True), sa.ForeignKey('patients.id', ondelete='CASCADE'), nullable=False),
        sa.Column('appointment_id', UUID(as_uuid=True), sa.ForeignKey('appointments.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('doctor_id', UUID(as_uuid=True), sa.ForeignKey('doctors.id', ondelete='SET NULL'), nullable=True),
        sa.Column('diagnosis', sa.Text(), nullable=False),
        sa.Column('complaint', sa.Text(), nullable=True),
        sa.Column('history', sa.Text(), nullable=True),
        sa.Column('lab_tests', sa.Text(), nullable=True),
        sa.Column('advice', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('follow_up_days', sa.Integer(), nullable=True),
        sa.Column('sent_to_patient', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('sent_via', sa.String(20), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_prescriptions_patient_id', 'prescriptions', ['patient_id'])
    op.create_index('ix_prescriptions_appointment_id', 'prescriptions', ['appointment_id'])
    op.create_index('ix_prescriptions_doctor_id', 'prescriptions', ['doctor_id'])

    # 7. Prescription Medicines table
    op.create_table(
        'prescription_medicines',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()')),
        sa.Column('prescription_id', UUID(as_uuid=True), sa.ForeignKey('prescriptions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('medicine_name', sa.String(200), nullable=False),
        sa.Column('dosage', sa.String(100), nullable=True),
        sa.Column('frequency', sa.String(50), nullable=True),
        sa.Column('duration', sa.String(50), nullable=True),
        sa.Column('instructions', sa.String(200), nullable=True),
        sa.Column('sequence_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_prescription_medicines_prescription_id', 'prescription_medicines', ['prescription_id'])

    # 8. Bills table
    op.create_table(
        'bills',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()')),
        sa.Column('bill_number', sa.String(20), unique=True, nullable=False),
        sa.Column('appointment_id', UUID(as_uuid=True), sa.ForeignKey('appointments.id', ondelete='SET NULL'), nullable=True, unique=True),
        sa.Column('patient_id', UUID(as_uuid=True), sa.ForeignKey('patients.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_by', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('uhid', sa.String(50), nullable=True),
        sa.Column('patient_name', sa.String(200), nullable=False),
        sa.Column('patient_age', sa.String(10), nullable=True),
        sa.Column('patient_gender', sa.String(10), nullable=True),
        sa.Column('doctor_name', sa.String(200), nullable=True),
        sa.Column('speciality', sa.String(100), nullable=True),
        sa.Column('mobile_no', sa.String(15), nullable=True),
        sa.Column('patient_type', sa.String(50), nullable=True),
        sa.Column('token_number', sa.String(20), nullable=True),
        sa.Column('consultation_fee', sa.Numeric(10, 2), nullable=False, server_default='0.00'),
        sa.Column('other_charges', sa.String(200), nullable=True),
        sa.Column('subtotal', sa.Numeric(10, 2), nullable=False, server_default='0.00'),
        sa.Column('discount_amount', sa.Numeric(10, 2), nullable=False, server_default='0.00'),
        sa.Column('discount_percent', sa.Numeric(5, 2), nullable=False, server_default='0.00'),
        sa.Column('discount_given_by', sa.String(100), nullable=True),
        sa.Column('total_amount', sa.Numeric(10, 2), nullable=False, server_default='0.00'),
        sa.Column('paid_amount', sa.Numeric(10, 2), nullable=False, server_default='0.00'),
        sa.Column('due_amount', sa.Numeric(10, 2), nullable=False, server_default='0.00'),
        sa.Column('payment_status', payment_status_enum, nullable=False, server_default='pending'),
        sa.Column('payment_method', payment_method_enum, nullable=True),
        sa.Column('payment_reference', sa.String(100), nullable=True),
        sa.Column('insurance_provider', sa.String(100), nullable=True),
        sa.Column('insurance_policy_number', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_bills_bill_number', 'bills', ['bill_number'])
    op.create_index('ix_bills_patient_id', 'bills', ['patient_id'])
    op.create_index('ix_bills_payment_status', 'bills', ['payment_status'])
    op.create_index('ix_bills_created_at', 'bills', ['created_at'])

    # 9. Bill Line Items table
    op.create_table(
        'bill_line_items',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()')),
        sa.Column('bill_id', UUID(as_uuid=True), sa.ForeignKey('bills.id', ondelete='CASCADE'), nullable=False),
        sa.Column('item_type', bill_item_type_enum, nullable=False, server_default='other'),
        sa.Column('item_name', sa.String(200), nullable=False),
        sa.Column('quantity', sa.Numeric(10, 2), nullable=False, server_default='1.00'),
        sa.Column('unit_price', sa.Numeric(10, 2), nullable=False, server_default='0.00'),
        sa.Column('amount', sa.Numeric(10, 2), nullable=False, server_default='0.00'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_bill_line_items_bill_id', 'bill_line_items', ['bill_id'])

    # 10. Lab Queue Items table
    op.create_table(
        'lab_queue_items',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()')),
        sa.Column('appointment_id', UUID(as_uuid=True), sa.ForeignKey('appointments.id', ondelete='CASCADE'), nullable=False),
        sa.Column('patient_id', UUID(as_uuid=True), sa.ForeignKey('patients.id', ondelete='CASCADE'), nullable=False),
        sa.Column('patient_name', sa.String(200), nullable=False),
        sa.Column('mr_number', sa.String(20), nullable=False),
        sa.Column('op_number', sa.String(20), nullable=False),
        sa.Column('token_number', sa.Integer(), nullable=False),
        sa.Column('lab_tests', JSONB(), nullable=False, server_default='[]'),
        sa.Column('status', queue_status_enum, nullable=False, server_default='waiting'),
        sa.Column('collected_at', sa.String(50), nullable=True),
        sa.Column('completed_at', sa.String(50), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_lab_queue_items_appointment_id', 'lab_queue_items', ['appointment_id'])
    op.create_index('ix_lab_queue_items_patient_id', 'lab_queue_items', ['patient_id'])
    op.create_index('ix_lab_queue_items_status', 'lab_queue_items', ['status'])
    op.create_index('ix_lab_queue_items_created_status', 'lab_queue_items', ['created_at', 'status'])

    # 11. Pharmacy Queue Items table
    op.create_table(
        'pharmacy_queue_items',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()')),
        sa.Column('appointment_id', UUID(as_uuid=True), sa.ForeignKey('appointments.id', ondelete='CASCADE'), nullable=False),
        sa.Column('patient_id', UUID(as_uuid=True), sa.ForeignKey('patients.id', ondelete='CASCADE'), nullable=False),
        sa.Column('patient_name', sa.String(200), nullable=False),
        sa.Column('mr_number', sa.String(20), nullable=False),
        sa.Column('op_number', sa.String(20), nullable=False),
        sa.Column('token_number', sa.Integer(), nullable=False),
        sa.Column('medicines', JSONB(), nullable=False, server_default='[]'),
        sa.Column('status', queue_status_enum, nullable=False, server_default='waiting'),
        sa.Column('dispensed_at', sa.String(50), nullable=True),
        sa.Column('completed_at', sa.String(50), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_pharmacy_queue_items_appointment_id', 'pharmacy_queue_items', ['appointment_id'])
    op.create_index('ix_pharmacy_queue_items_patient_id', 'pharmacy_queue_items', ['patient_id'])
    op.create_index('ix_pharmacy_queue_items_status', 'pharmacy_queue_items', ['status'])
    op.create_index('ix_pharmacy_queue_items_created_status', 'pharmacy_queue_items', ['created_at', 'status'])

    # 12. Patient Documents table
    op.create_table(
        'patient_documents',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()')),
        sa.Column('patient_id', UUID(as_uuid=True), sa.ForeignKey('patients.id', ondelete='CASCADE'), nullable=False),
        sa.Column('appointment_id', UUID(as_uuid=True), sa.ForeignKey('appointments.id', ondelete='SET NULL'), nullable=True),
        sa.Column('uploaded_by', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('file_name', sa.String(255), nullable=False),
        sa.Column('file_path', sa.String(500), nullable=False),
        sa.Column('file_type', sa.String(100), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('document_type', sa.String(100), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_patient_documents_patient_id', 'patient_documents', ['patient_id'])
    op.create_index('ix_patient_documents_appointment_id', 'patient_documents', ['appointment_id'])

    # Seed default departments
    op.execute(text("""
        INSERT INTO departments (id, name, code, base_consultation_fee)
        VALUES
            (gen_random_uuid(), 'Cardiology', 'CARD', 500.00),
            (gen_random_uuid(), 'General Medicine', 'GENM', 300.00),
            (gen_random_uuid(), 'Orthopedics', 'ORTH', 400.00),
            (gen_random_uuid(), 'Pediatrics', 'PEDI', 350.00),
            (gen_random_uuid(), 'Dermatology', 'DERM', 400.00),
            (gen_random_uuid(), 'ENT', 'ENT', 350.00),
            (gen_random_uuid(), 'Ophthalmology', 'OPHT', 400.00),
            (gen_random_uuid(), 'Gynecology', 'GYNE', 450.00),
            (gen_random_uuid(), 'Neurology', 'NEUR', 600.00),
            (gen_random_uuid(), 'Gastroenterology', 'GAST', 500.00)
    """))

    # Seed default doctors (linked to departments by code)
    op.execute(text("""
        INSERT INTO doctors (id, name, department_id, speciality, qualification, registration_number, phone, email, room, consultation_fee, user_id)
        VALUES
            (gen_random_uuid(), 'Dr. R. Balaji',
             (SELECT id FROM departments WHERE code = 'CARD'),
             'Interventional Cardiology', 'MD, DM (Cardiology)', 'MCI-12345',
             '+91 9100079990', 'dr.balaji@balajiheart.com', '1', 500.00,
             (SELECT id FROM users WHERE username = 'doctor')),
            (gen_random_uuid(), 'Dr. Priya Sharma',
             (SELECT id FROM departments WHERE code = 'CARD'),
             'Non-Invasive Cardiology', 'MD, DM (Cardiology)', 'MCI-12346',
             '+91 9100079991', 'dr.priya@balajiheart.com', '2', 450.00, NULL),
            (gen_random_uuid(), 'Dr. Rajesh Kumar',
             (SELECT id FROM departments WHERE code = 'GENM'),
             'Internal Medicine', 'MD (Medicine)', 'MCI-12347',
             '+91 9100079992', 'dr.rajesh@balajiheart.com', '3', 300.00, NULL),
            (gen_random_uuid(), 'Dr. Lakshmi Devi',
             (SELECT id FROM departments WHERE code = 'PEDI'),
             'Pediatric Care', 'MD (Pediatrics)', 'MCI-12348',
             '+91 9100079993', 'dr.lakshmi@balajiheart.com', '4', 350.00, NULL),
            (gen_random_uuid(), 'Dr. Suresh Reddy',
             (SELECT id FROM departments WHERE code = 'DERM'),
             'Clinical Dermatology', 'MD (Dermatology)', 'MCI-12349',
             '+91 9100079994', 'dr.suresh@balajiheart.com', '5', 350.00, NULL)
    """))

    # Create sequence for MR numbers
    op.execute(text("CREATE SEQUENCE IF NOT EXISTS mr_number_seq START 1"))

    # Create sequence for OP numbers (daily reset would be handled in application)
    op.execute(text("CREATE SEQUENCE IF NOT EXISTS op_number_seq START 1"))

    # Create sequence for bill numbers
    op.execute(text("CREATE SEQUENCE IF NOT EXISTS bill_number_seq START 1"))


def downgrade() -> None:
    """Drop all Phase 2 tables."""

    # Drop sequences
    op.execute(text("DROP SEQUENCE IF EXISTS bill_number_seq"))
    op.execute(text("DROP SEQUENCE IF EXISTS op_number_seq"))
    op.execute(text("DROP SEQUENCE IF EXISTS mr_number_seq"))

    # Drop tables in reverse order (respect foreign keys)
    op.drop_table('patient_documents')
    op.drop_table('pharmacy_queue_items')
    op.drop_table('lab_queue_items')
    op.drop_table('bill_line_items')
    op.drop_table('bills')
    op.drop_table('prescription_medicines')
    op.drop_table('prescriptions')
    op.drop_table('patient_vitals')
    op.drop_table('appointments')
    op.drop_table('patients')
    op.drop_table('doctors')
    op.drop_table('departments')

    # Drop enum types
    op.execute(text("DROP TYPE IF EXISTS queue_status_enum"))
    op.execute(text("DROP TYPE IF EXISTS bill_item_type_enum"))
    op.execute(text("DROP TYPE IF EXISTS payment_method_enum"))
    op.execute(text("DROP TYPE IF EXISTS payment_status_enum"))
    op.execute(text("DROP TYPE IF EXISTS queue_type_enum"))
    op.execute(text("DROP TYPE IF EXISTS appointment_status_enum"))
    op.execute(text("DROP TYPE IF EXISTS patient_type_enum"))
    op.execute(text("DROP TYPE IF EXISTS marital_status_enum"))
    op.execute(text("DROP TYPE IF EXISTS gender_enum"))
