"""
Base Repository - Common CRUD Operations

Provides generic database operations that can be reused
across all repositories.
"""

from typing import TypeVar, Generic, Type, Optional, List, Any, Dict
from uuid import UUID

from sqlalchemy import select, func, and_
from sqlalchemy.orm import Session

from app.models.base import BaseModel

# Generic type for model
ModelType = TypeVar("ModelType", bound=BaseModel)


class BaseRepository(Generic[ModelType]):
    """
    Generic repository with common CRUD operations.

    Inherit from this class to create model-specific repositories.
    Supports soft delete pattern used throughout the application.
    """

    def __init__(self, model: Type[ModelType], db: Session):
        """
        Initialize repository with model class and database session.

        Args:
            model: SQLAlchemy model class
            db: Database session
        """
        self.model = model
        self.db = db

    def get_by_id(
        self,
        id: UUID,
        include_deleted: bool = False,
    ) -> Optional[ModelType]:
        """
        Get a single record by ID.

        Args:
            id: Record UUID
            include_deleted: Whether to include soft-deleted records

        Returns:
            Model instance or None if not found
        """
        query = self.db.query(self.model).filter(self.model.id == id)

        if not include_deleted:
            query = query.filter(self.model.is_deleted == False)

        return query.first()

    def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        include_deleted: bool = False,
    ) -> List[ModelType]:
        """
        Get all records with pagination.

        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            include_deleted: Whether to include soft-deleted records

        Returns:
            List of model instances
        """
        query = self.db.query(self.model)

        if not include_deleted:
            query = query.filter(self.model.is_deleted == False)

        return query.offset(skip).limit(limit).all()

    def count(self, include_deleted: bool = False) -> int:
        """
        Count total records.

        Args:
            include_deleted: Whether to include soft-deleted records

        Returns:
            Total count of records
        """
        query = self.db.query(func.count(self.model.id))

        if not include_deleted:
            query = query.filter(self.model.is_deleted == False)

        return query.scalar() or 0

    def create(self, obj_data: Dict[str, Any]) -> ModelType:
        """
        Create a new record.

        Args:
            obj_data: Dictionary of field values

        Returns:
            Created model instance
        """
        db_obj = self.model(**obj_data)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update(
        self,
        id: UUID,
        obj_data: Dict[str, Any],
    ) -> Optional[ModelType]:
        """
        Update an existing record.

        Args:
            id: Record UUID
            obj_data: Dictionary of fields to update

        Returns:
            Updated model instance or None if not found
        """
        db_obj = self.get_by_id(id)
        if db_obj is None:
            return None

        for field, value in obj_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)

        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def delete(self, id: UUID, soft: bool = True) -> bool:
        """
        Delete a record.

        Args:
            id: Record UUID
            soft: If True, soft delete. If False, hard delete.

        Returns:
            True if deleted, False if not found
        """
        db_obj = self.get_by_id(id, include_deleted=not soft)
        if db_obj is None:
            return False

        if soft:
            db_obj.soft_delete()
            self.db.commit()
        else:
            self.db.delete(db_obj)
            self.db.commit()

        return True

    def restore(self, id: UUID) -> Optional[ModelType]:
        """
        Restore a soft-deleted record.

        Args:
            id: Record UUID

        Returns:
            Restored model instance or None if not found
        """
        db_obj = self.get_by_id(id, include_deleted=True)
        if db_obj is None or not db_obj.is_deleted:
            return None

        db_obj.restore()
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def exists(self, id: UUID, include_deleted: bool = False) -> bool:
        """
        Check if a record exists.

        Args:
            id: Record UUID
            include_deleted: Whether to include soft-deleted records

        Returns:
            True if exists, False otherwise
        """
        query = self.db.query(self.model.id).filter(self.model.id == id)

        if not include_deleted:
            query = query.filter(self.model.is_deleted == False)

        return query.first() is not None

    def get_by_ids(
        self,
        ids: List[UUID],
        include_deleted: bool = False,
    ) -> List[ModelType]:
        """
        Get multiple records by IDs.

        Args:
            ids: List of record UUIDs
            include_deleted: Whether to include soft-deleted records

        Returns:
            List of model instances
        """
        query = self.db.query(self.model).filter(self.model.id.in_(ids))

        if not include_deleted:
            query = query.filter(self.model.is_deleted == False)

        return query.all()

    def bulk_create(self, objects_data: List[Dict[str, Any]]) -> List[ModelType]:
        """
        Create multiple records at once.

        Args:
            objects_data: List of dictionaries with field values

        Returns:
            List of created model instances
        """
        db_objects = [self.model(**data) for data in objects_data]
        self.db.add_all(db_objects)
        self.db.commit()
        for obj in db_objects:
            self.db.refresh(obj)
        return db_objects
