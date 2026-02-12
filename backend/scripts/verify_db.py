"""
Check database connection and verify master models.
"""

import os
import sys
from sqlalchemy import text
from sqlalchemy.orm import Session

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine, SessionLocal
from app.models.master_data import ComplaintMaster, DiagnosisMaster, LabTestMaster

def check_connection():
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("DONE: Database connection successful")
            return True
    except Exception as e:
        print(f"FAILED: Database connection failed: {e}")
        return False

def check_tables():
    db = SessionLocal()
    try:
        complaints_count = db.query(ComplaintMaster).count()
        diagnosis_count = db.query(DiagnosisMaster).count()
        labtests_count = db.query(LabTestMaster).count()
        
        print(f"Complaints count: {complaints_count}")
        print(f"Diagnosis count: {diagnosis_count}")
        print(f"Lab tests count: {labtests_count}")
        
        # Test a search
        q = "che"
        results = db.query(ComplaintMaster).filter(ComplaintMaster.complaint.ilike(f"%{q}%")).all()
        print(f"Search results for 'che' in complaints: {len(results)}")
        for r in results:
            print(f" - {r.complaint}")
            
    except Exception as e:
        print(f"Error checking tables: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if check_connection():
        check_tables()
