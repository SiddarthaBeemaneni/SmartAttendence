"""
SmartAttend AI / CampusAI - All India Higher Education Institutions Model

Stores verified and accredited universities, autonomous colleges, and affiliated
institutions across all 36 Indian States and Union Territories.
Sourced from official UGC and AISHE directories.
"""

from sqlalchemy import Column, String, Text, Boolean, Integer, DateTime, Index
from datetime import datetime, timezone
from app.database import Base


# Standard 8 Indian Higher Education Institution Categories
INSTITUTION_TYPES = [
    "Central University",
    "State Public University",
    "State Private University",
    "Deemed-to-be University",
    "Autonomous College",
    "Affiliated College",
    "Constituent College",
    "Other recognized Higher Education Institution",
]

# All 36 States & Union Territories of India
INDIAN_STATES_AND_UTS = [
    # 28 States
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    # 8 Union Territories
    "Andaman and Nicobar Islands",
    "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Jammu and Kashmir",
    "Ladakh",
    "Lakshadweep",
    "Puducherry",
]


class Institution(Base):
    __tablename__ = "institutions"

    id = Column(String(50), primary_key=True, index=True)
    official_name = Column(String(255), nullable=False, index=True)
    normalized_name = Column(String(255), nullable=False, index=True)
    institution_type = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    city = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    aishe_code = Column(String(50), nullable=True, unique=True, index=True)
    ugc_reference = Column(String(150), nullable=True)
    recognition_status = Column(String(50), default="verified", nullable=False, index=True)  # verified, pending_verification, rejected
    autonomous_status = Column(Boolean, default=False)
    autonomous_validity = Column(String(100), nullable=True)
    affiliating_university_id = Column(String(50), nullable=True, index=True)
    affiliating_university_name = Column(String(255), nullable=True)
    official_website = Column(String(255), nullable=True)
    source = Column(String(100), default="UGC & AISHE Official Directory", nullable=False)
    last_verified_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("idx_inst_state_type", "state", "institution_type"),
        Index("idx_inst_search", "normalized_name", "state"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "official_name": self.official_name,
            "institution_type": self.institution_type,
            "state": self.state,
            "district": self.district,
            "city": self.city or self.district,
            "address": self.address,
            "aishe_code": self.aishe_code,
            "ugc_reference": self.ugc_reference,
            "recognition_status": self.recognition_status,
            "autonomous_status": self.autonomous_status,
            "autonomous_validity": self.autonomous_validity,
            "affiliating_university_id": self.affiliating_university_id,
            "affiliating_university_name": self.affiliating_university_name,
            "official_website": self.official_website,
            "source": self.source,
            "last_verified_at": self.last_verified_at.isoformat() if self.last_verified_at else None,
        }


class InstitutionAdditionRequest(Base):
    __tablename__ = "institution_addition_requests"

    id = Column(String(50), primary_key=True, index=True)
    official_name = Column(String(255), nullable=False, index=True)
    institution_type = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    city = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    official_website = Column(String(255), nullable=True)
    aishe_code = Column(String(50), nullable=True)
    ugc_reference = Column(String(150), nullable=True)
    affiliating_university = Column(String(255), nullable=True)
    official_email = Column(String(150), nullable=False, index=True)
    applicant_name = Column(String(150), nullable=False)
    status = Column(String(50), default="pending", nullable=False, index=True)  # pending, approved, rejected
    admin_notes = Column(Text, nullable=True)
    reviewed_by = Column(String(100), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "official_name": self.official_name,
            "institution_type": self.institution_type,
            "state": self.state,
            "district": self.district,
            "city": self.city,
            "address": self.address,
            "official_website": self.official_website,
            "aishe_code": self.aishe_code,
            "ugc_reference": self.ugc_reference,
            "affiliating_university": self.affiliating_university,
            "official_email": self.official_email,
            "applicant_name": self.applicant_name,
            "status": self.status,
            "admin_notes": self.admin_notes,
            "reviewed_by": self.reviewed_by,
            "reviewed_at": self.reviewed_at.isoformat() if self.reviewed_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class DirectoryImportLog(Base):
    __tablename__ = "directory_import_logs"

    id = Column(String(50), primary_key=True, index=True)
    source_name = Column(String(150), nullable=False)
    records_processed = Column(Integer, default=0)
    records_added = Column(Integer, default=0)
    records_updated = Column(Integer, default=0)
    records_skipped = Column(Integer, default=0)
    performed_by = Column(String(100), default="system")
    notes = Column(Text, nullable=True)
    imported_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "source_name": self.source_name,
            "records_processed": self.records_processed,
            "records_added": self.records_added,
            "records_updated": self.records_updated,
            "records_skipped": self.records_skipped,
            "performed_by": self.performed_by,
            "notes": self.notes,
            "imported_at": self.imported_at.isoformat() if self.imported_at else None,
        }
