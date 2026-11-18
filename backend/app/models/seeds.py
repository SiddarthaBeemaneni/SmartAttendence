"""
SmartAttend AI / CampusAI - Verified Colleges Seed Data

Pre-populates an official directory of recognized institutions across India
(accredited by UGC / AICTE / State Universities).
"""

from app.models.college import College

VERIFIED_COLLEGES = [
    {
        "college_id": "CLG-TN-001",
        "college_name": "Indian Institute of Technology Madras",
        "college_code": "IITM-001",
        "location": "Chennai",
        "state": "Tamil Nadu",
        "affiliation": "Autonomous / Institute of National Importance",
        "verification_status": "verified",
    },
    {
        "college_id": "CLG-TN-002",
        "college_name": "College of Engineering, Guindy",
        "college_code": "AU-CEG-1001",
        "location": "Chennai",
        "state": "Tamil Nadu",
        "affiliation": "Anna University",
        "verification_status": "verified",
    },
    {
        "college_id": "CLG-TN-003",
        "college_name": "PSG College of Technology",
        "college_code": "PSG-TECH-1002",
        "location": "Coimbatore",
        "state": "Tamil Nadu",
        "affiliation": "Anna University",
        "verification_status": "verified",
    },
    {
        "college_id": "CLG-TN-004",
        "college_name": "SSN College of Engineering",
        "college_code": "SSN-1003",
        "location": "Kalavakkam, Chennai",
        "state": "Tamil Nadu",
        "affiliation": "Anna University",
        "verification_status": "verified",
    },
    {
        "college_id": "CLG-TN-005",
        "college_name": "Vellore Institute of Technology",
        "college_code": "VIT-VELLORE-2001",
        "location": "Vellore",
        "state": "Tamil Nadu",
        "affiliation": "Deemed University / UGC",
        "verification_status": "verified",
    },
    {
        "college_id": "CLG-TN-006",
        "college_name": "National Institute of Technology Tiruchirappalli",
        "college_code": "NITT-3001",
        "location": "Tiruchirappalli",
        "state": "Tamil Nadu",
        "affiliation": "NIT Council / INI",
        "verification_status": "verified",
    },
    {
        "college_id": "CLG-TN-007",
        "college_name": "Coimbatore Institute of Technology",
        "college_code": "CIT-1004",
        "location": "Coimbatore",
        "state": "Tamil Nadu",
        "affiliation": "Anna University",
        "verification_status": "verified",
    },
    {
        "college_id": "CLG-TN-008",
        "college_name": "Madras Christian College",
        "college_code": "MCC-4001",
        "location": "Chennai",
        "state": "Tamil Nadu",
        "affiliation": "University of Madras",
        "verification_status": "verified",
    },
    {
        "college_id": "CLG-TN-009",
        "college_name": "Loyola College",
        "college_code": "LOYOLA-4002",
        "location": "Chennai",
        "state": "Tamil Nadu",
        "affiliation": "University of Madras",
        "verification_status": "verified",
    },
    {
        "college_id": "CLG-TN-010",
        "college_name": "SRM Institute of Science and Technology",
        "college_code": "SRM-IST-2002",
        "location": "Kattankulathur",
        "state": "Tamil Nadu",
        "affiliation": "Deemed University / UGC",
        "verification_status": "verified",
    },
    {
        "college_id": "CLG-KA-001",
        "college_name": "Indian Institute of Science Bangalore",
        "college_code": "IISC-6004",
        "location": "Bengaluru",
        "state": "Karnataka",
        "affiliation": "Autonomous / Institute of National Importance",
        "verification_status": "verified",
    },
    {
        "college_id": "CLG-KA-002",
        "college_name": "RV College of Engineering",
        "college_code": "RVCE-6001",
        "location": "Bengaluru",
        "state": "Karnataka",
        "affiliation": "Visvesvaraya Technological University (VTU)",
        "verification_status": "verified",
    },
    {
        "college_id": "CLG-KA-003",
        "college_name": "National Institute of Technology Karnataka, Surathkal",
        "college_code": "NITK-6003",
        "location": "Mangaluru",
        "state": "Karnataka",
        "affiliation": "NIT Council / INI",
        "verification_status": "verified",
    },
    {
        "college_id": "CLG-KA-004",
        "college_name": "Manipal Institute of Technology",
        "college_code": "MAHE-MIT-6002",
        "location": "Manipal",
        "state": "Karnataka",
        "affiliation": "MAHE Deemed University",
        "verification_status": "verified",
    },
    {
        "college_id": "CLG-TG-001",
        "college_name": "Jawaharlal Nehru Technological University Hyderabad",
        "college_code": "JNTUH-7001",
        "location": "Hyderabad",
        "state": "Telangana",
        "affiliation": "JNTU",
        "verification_status": "verified",
    },
    {
        "college_id": "CLG-TG-002",
        "college_name": "Osmania University College of Engineering",
        "college_code": "OUCE-7002",
        "location": "Hyderabad",
        "state": "Telangana",
        "affiliation": "Osmania University",
        "verification_status": "verified",
    },
    {
        "college_id": "CLG-MH-001",
        "college_name": "College of Engineering, Pune",
        "college_code": "COEP-8001",
        "location": "Pune",
        "state": "Maharashtra",
        "affiliation": "COEP Technological University",
        "verification_status": "verified",
    },
    {
        "college_id": "CLG-DL-001",
        "college_name": "Delhi Technological University",
        "college_code": "DTU-9001",
        "location": "New Delhi",
        "state": "Delhi",
        "affiliation": "State University / UGC",
        "verification_status": "verified",
    },
    {
        "college_id": "CLG-RJ-001",
        "college_name": "Birla Institute of Technology and Science, Pilani",
        "college_code": "BITS-PILANI-5001",
        "location": "Pilani",
        "state": "Rajasthan",
        "affiliation": "Deemed University / UGC",
        "verification_status": "verified",
    },
    {
        "college_id": "CLG-DEMO-001",
        "college_name": "ABC Institute of Technology & Management",
        "college_code": "ABC-TECH-001",
        "location": "Chennai",
        "state": "Tamil Nadu",
        "affiliation": "Anna University",
        "verification_status": "verified",
    },
]


def seed_verified_colleges(db_session):
    """Populates verified colleges into database if table is empty."""
    count = db_session.query(College).count()
    if count == 0:
        for item in VERIFIED_COLLEGES:
            col = College(**item)
            db_session.add(col)
        db_session.commit()
        print(f"[Seed] Successfully seeded {len(VERIFIED_COLLEGES)} verified colleges.")
