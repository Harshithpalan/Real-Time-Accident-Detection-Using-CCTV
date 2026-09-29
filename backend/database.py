from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import json

Base = declarative_base()

class Incident(Base):
    __tablename__ = "incidents"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    confidence = Column(Float)
    accident_detected = Column(Boolean, default=False)
    regions = Column(Text)  # JSON string of detected regions
    image_path = Column(String, nullable=True)
    location = Column(String, nullable=True)
    severity = Column(String, default="medium")  # low, medium, high
    status = Column(String, default="new")  # new, acknowledged, resolved
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class SystemStats(Base):
    __tablename__ = "system_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    total_detections = Column(Integer, default=0)
    high_confidence_detections = Column(Integer, default=0)
    active_clients = Column(Integer, default=0)
    uptime_seconds = Column(Integer, default=0)

# Database setup
DATABASE_URL = "sqlite:///./accident_detection.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # Needed for SQLite
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Initialize the database"""
    Base.metadata.create_all(bind=engine)

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def log_incident(db, accident_data):
    """Log an incident to the database"""
    incident = Incident(
        confidence=accident_data.get("confidence", 0.0),
        accident_detected=accident_data.get("accident_detected", False),
        regions=json.dumps(accident_data.get("regions", [])),
        severity=accident_data.get("severity", "medium"),
        location=accident_data.get("location")
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident

def get_recent_incidents(db, limit=10):
    """Get recent incidents from the database"""
    return db.query(Incident).order_by(Incident.timestamp.desc()).limit(limit).all()

def update_incident_status(db, incident_id, status, notes=None):
    """Update incident status"""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if incident:
        incident.status = status
        if notes:
            incident.notes = notes
        incident.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(incident)
    return incident

def get_incident_stats(db):
    """Get incident statistics"""
    total = db.query(Incident).count()
    accidents = db.query(Incident).filter(Incident.accident_detected == True).count()
    high_confidence = db.query(Incident).filter(
        Incident.confidence > 0.7
    ).count()
    
    return {
        "total_incidents": total,
        "accidents_detected": accidents,
        "high_confidence_detections": high_confidence
    }
