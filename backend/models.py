from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String

from database import Base


class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(String, index=True)
    page_index = Column(Integer)
    x = Column(Float)
    y = Column(Float)
    status = Column(String, default="open")
    comment = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
