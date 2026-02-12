"""
Import Master Data from CSV files.
"""

import csv
import os
import sys
from typing import List, Dict, Any, Type

# Add the project root to sys.path to allow importing from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.base import Base
from app.models.master_data import ComplaintMaster, DiagnosisMaster, LabTestMaster


def clear_table(db: Session, model: Type):
    """Delete all records from a table."""
    db.query(model).delete()
    db.commit()


def import_complaints(db: Session, file_path: str):
    print(f"Importing complaints from {file_path}...")
    with open(file_path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        count = 0
        for row in reader:
            complaint = ComplaintMaster(
                code=row['Code'],
                category=row['Category'],
                complaint=row['Complaint']
            )
            db.add(complaint)
            count += 1
        db.commit()
    print(f"Imported {count} complaints.")


def import_diagnosis(db: Session, file_path: str):
    print(f"Importing diagnosis from {file_path}...")
    with open(file_path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        count = 0
        for row in reader:
            diagnosis = DiagnosisMaster(
                code=row['Code'],
                category=row['Category'],
                diagnosis=row['Diagnosis']
            )
            db.add(diagnosis)
            count += 1
        db.commit()
    print(f"Imported {count} diagnosis records.")


def import_labtests(db: Session, file_path: str):
    print(f"Importing lab tests from {file_path}...")
    with open(file_path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        count = 0
        for row in reader:
            labtest = LabTestMaster(
                code=row['Code'],
                category=row['Category'],
                test_name=row['Test Name']
            )
            db.add(labtest)
            count += 1
        db.commit()
    print(f"Imported {count} lab tests.")


def main():
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
        
        # Mapping files to import functions
        imports = [
            (ComplaintMaster, os.path.join(data_dir, "op_complaints_master.csv"), import_complaints),
            (DiagnosisMaster, os.path.join(data_dir, "op_diagnosis_master.csv"), import_diagnosis),
            (LabTestMaster, os.path.join(data_dir, "op_labtests_master.csv"), import_labtests),
        ]
        
        for model, path, func in imports:
            if os.path.exists(path):
                clear_table(db, model)
                func(db, path)
            else:
                print(f"Warning: File not found at {path}")
                
        print("Master data import completed successfully!")
    except Exception as e:
        print(f"Error during import: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()
