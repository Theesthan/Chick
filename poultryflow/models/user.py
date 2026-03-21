import enum
from sqlalchemy import Column, String, Boolean, Enum
from sqlalchemy.orm import relationship
from models.base import Base, TimestampMixin, gen_uuid


class UserRole(str, enum.Enum):
    admin = "admin"
    supervisor = "supervisor"
    operator = "operator"


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String(100), nullable=False)
    email = Column(String(150), nullable=False, unique=True, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.supervisor)
    is_active = Column(Boolean, default=True, nullable=False)

    # relationships
    farms_created = relationship("Farm", back_populates="creator", foreign_keys="Farm.created_by")
    daily_reports = relationship("DailyReport", back_populates="reporter", foreign_keys="DailyReport.reported_by")
    verified_reports = relationship("DailyReport", back_populates="verifier", foreign_keys="DailyReport.verified_by")
    weighings = relationship("Weighing", back_populates="recorder")
    processings = relationship("Processing", back_populates="processor")
