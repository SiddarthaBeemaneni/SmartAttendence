"""
SmartAttend AI / CampusAI - Comprehensive All India Institutions Ingestion Pipeline

Ingests 38,000+ accredited Indian colleges, autonomous institutions, and universities
from official AISHE & UGC datasets covering all 36 States and Union Territories.
"""

import json
import re
import sqlite3
import os
import time
from datetime import datetime, timezone

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "smartattend.db")
JSON_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "all_india_colleges_38k.json")

def normalize_name(name: str) -> str:
    """Normalize text for indexed search."""
    return re.sub(r"[^\w\s]", "", name.lower()).strip()

def run_ingestion():
    start_time = time.time()
    print("=" * 70)
    print("STARTING ALL INDIA INSTITUTIONS DIRECTORY INGESTION (38,000+ RECORDS)")
    print("=" * 70)

    if not os.path.exists(JSON_PATH):
        raise FileNotFoundError(f"Missing {JSON_PATH}. Run download first.")

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"Loaded {len(data)} college records from AISHE dataset.")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Ensure tables exist
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS institutions (
        id VARCHAR(50) PRIMARY KEY,
        official_name VARCHAR(255) NOT NULL,
        normalized_name VARCHAR(255) NOT NULL,
        institution_type VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        district VARCHAR(100) NOT NULL,
        city VARCHAR(100),
        address TEXT,
        aishe_code VARCHAR(50),
        ugc_reference VARCHAR(150),
        recognition_status VARCHAR(50) NOT NULL DEFAULT 'verified',
        autonomous_status BOOLEAN DEFAULT 0,
        autonomous_validity VARCHAR(100),
        affiliating_university_id VARCHAR(50),
        affiliating_university_name VARCHAR(255),
        official_website VARCHAR(255),
        source VARCHAR(100) NOT NULL,
        last_verified_at TIMESTAMP,
        created_at TIMESTAMP,
        updated_at TIMESTAMP
    );
    """)

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_inst_state_type ON institutions (state, institution_type);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_inst_search ON institutions (normalized_name, state);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_inst_aishe ON institutions (aishe_code);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_inst_official_name ON institutions (official_name);")

    # Step 1: Extract unique universities from the dataset
    universities_map = {}
    for row in data:
        u_raw = (row.get("university") or "").strip()
        if not u_raw:
            continue
        m_u = re.match(r"^(.*?)\s*\(Id:\s*(U-\d+)\)$", u_raw)
        if m_u:
            u_name = m_u.group(1).strip(' "\'').strip()
            u_aishe = m_u.group(2).strip()
        else:
            u_name = u_raw.strip(' "\'').strip()
            u_aishe = ""

        if u_name not in universities_map:
            # Determine university type based on name keywords
            u_lower = u_name.lower()
            if "central university" in u_lower or "national institute" in u_lower:
                u_type = "Central University"
            elif "deemed" in u_lower or "bits" in u_lower or "amrita" in u_lower or "vit" in u_lower or "manipal" in u_lower:
                u_type = "Deemed-to-be University"
            elif "private" in u_lower or "amity" in u_lower or "jindal" in u_lower or "ashoka" in u_lower:
                u_type = "State Private University"
            else:
                u_type = "State Public University"

            universities_map[u_name] = {
                "name": u_name,
                "aishe": u_aishe,
                "state": row.get("state", "India"),
                "district": row.get("district", "General"),
                "type": u_type,
            }

    print(f"Extracted {len(universities_map)} unique universities from AISHE records.")

    now_iso = datetime.now(timezone.utc).isoformat()
    institutions_batch = []
    colleges_batch = []
    seen_ids = set()
    seen_aishe = set()

    # Insert Universities first
    for u_name, u_info in universities_map.items():
        u_aishe = u_info["aishe"]
        u_id = f"INST-UNIV-{u_aishe}" if u_aishe else f"INST-UNIV-{hash(u_name) % 10000000}"
        if u_id in seen_ids:
            continue
        seen_ids.add(u_id)
        if u_aishe:
            seen_aishe.add(u_aishe)

        institutions_batch.append((
            u_id,
            u_name,
            normalize_name(u_name),
            u_info["type"],
            u_info["state"],
            u_info["district"],
            u_info["district"],  # city
            f"{u_name}, {u_info['district']}, {u_info['state']}",
            u_aishe or None,
            "UGC Recognized University",
            "verified",
            0,  # autonomous_status
            None,  # autonomous_validity
            None,  # affiliating_university_id
            None,  # affiliating_university_name
            None,  # official_website
            "AISHE & UGC Official Directory",
            now_iso,
            now_iso,
            now_iso,
        ))

        colleges_batch.append((
            u_id,
            u_name,
            u_aishe or f"CODE-{u_id}",
            u_info["district"],
            u_info["state"],
            u_info["type"],
            "verified",
        ))

    # Step 2: Insert Colleges
    for row in data:
        c_raw = (row.get("college") or "").strip()
        if not c_raw:
            continue

        m_c = re.match(r"^(.*?)\s*\(Id:\s*(C-\d+)\)$", c_raw)
        if m_c:
            c_name = m_c.group(1).strip(' "\'').strip()
            c_aishe = m_c.group(2).strip()
        else:
            c_name = c_raw.strip(' "\'').strip()
            c_aishe = ""

        u_raw = (row.get("university") or "").strip()
        m_u = re.match(r"^(.*?)\s*\(Id:\s*(U-\d+)\)$", u_raw)
        u_name = m_u.group(1).strip(' "\'').strip() if m_u else u_raw.strip(' "\'').strip()
        u_aishe = m_u.group(2).strip() if m_u else ""
        u_id = f"INST-UNIV-{u_aishe}" if u_aishe else None

        state = (row.get("state") or "India").strip()
        district = (row.get("district") or "General").strip()
        raw_type = row.get("college_type", "Affiliated College")

        is_autonomous = "autonomous" in c_name.lower() or "autonomous" in raw_type.lower()
        if is_autonomous:
            c_type = "Autonomous College"
            auton_validity = "UGC Autonomous Conferred"
        elif "constituent" in raw_type.lower():
            c_type = "Constituent College"
            auton_validity = None
        elif "recognized center" in raw_type.lower() or "pg center" in raw_type.lower():
            c_type = "Other recognized Higher Education Institution"
            auton_validity = None
        else:
            c_type = "Affiliated College"
            auton_validity = None

        inst_id = f"INST-CLG-{c_aishe}" if c_aishe else f"INST-CLG-{hash(c_name + state) % 10000000}"
        if inst_id in seen_ids:
            continue
        seen_ids.add(inst_id)

        institutions_batch.append((
            inst_id,
            c_name,
            normalize_name(c_name),
            c_type,
            state,
            district,
            district,  # city
            f"{c_name}, {district}, {state}",
            c_aishe or None,
            f"Affiliated to {u_name}" if u_name else "AISHE Registered",
            "verified",
            1 if is_autonomous else 0,
            auton_validity,
            u_id,
            u_name or None,
            None,
            "AISHE National Education Directory",
            now_iso,
            now_iso,
            now_iso,
        ))

        colleges_batch.append((
            inst_id,
            c_name,
            c_aishe or f"CODE-{inst_id}",
            district,
            state,
            u_name or c_type,
            "verified",
        ))

    print(f"Prepared {len(institutions_batch)} records for insertion into SQLite.")

    # Execute batch insertion with high performance
    cursor.execute("BEGIN TRANSACTION;")
    cursor.executemany("""
    INSERT OR REPLACE INTO institutions (
        id, official_name, normalized_name, institution_type, state, district,
        city, address, aishe_code, ugc_reference, recognition_status,
        autonomous_status, autonomous_validity, affiliating_university_id,
        affiliating_university_name, official_website, source,
        last_verified_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, institutions_batch)

    cursor.executemany("""
    INSERT OR REPLACE INTO colleges (
        college_id, college_name, college_code, location, state, affiliation, verification_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?);
    """, colleges_batch)

    conn.commit()
    conn.close()

    elapsed = round(time.time() - start_time, 2)
    print("=" * 70)
    print(f"SUCCESSFULLY INGESTED {len(institutions_batch)} INSTITUTIONS ACROSS ALL 36 STATES/UTS in {elapsed}s!")
    print("=" * 70)

if __name__ == "__main__":
    run_ingestion()
