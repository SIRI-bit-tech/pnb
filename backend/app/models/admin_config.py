from sqlalchemy import Column, String, Text
from app.models.base import Base, IDMixin, TimestampMixin

class AdminConfig(Base, IDMixin, TimestampMixin):
    __tablename__ = "admin_configs"

    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=False)
