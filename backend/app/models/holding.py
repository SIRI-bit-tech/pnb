from sqlalchemy import Column, String, ForeignKey, Numeric, Integer
from sqlalchemy.orm import relationship
from app.models.base import Base, IDMixin, TimestampMixin

class Holding(Base, IDMixin, TimestampMixin):
    __tablename__ = "holdings"

    user_id = Column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    ticker = Column(String(10), nullable=False)
    shares = Column(Integer, default=0, nullable=False)
    avg_cost = Column(Numeric(19, 4), default=0.0000, nullable=False)
    type = Column(String(10), default="long", nullable=False) # "long" or "short"

    # Relationships
    user = relationship("User", back_populates="holdings")
