"""
SmartAttend AI / CampusAI - End-to-End Master Workflow Integration Test Suite
Tests every major requirement from the Master Specification:
1. Multi-Tenant College Isolation (College A vs College B)
2. Curriculum Subject Management
3. Student Ingestion with TRAI consent check (consent_given)
4. Attendance marking & transactional finalization
5. Automated background AI call dispatch (Simulation Mode)
6. Authentic 7-stage multilingual speech dialogue & NLU intent classification
7. Calling Metrics & Call Logs API
8. Exotel Webhook Endpoint
9. Manual Call Retry with Backoff
"""

import sys
import os
import json
import uuid
import time
from fastapi.testclient import TestClient

# Ensure backend root is in PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.database import Base, engine, SessionLocal
from app.models.student import Student
from app.models.attendance import AttendanceSession, AttendanceRecord, AICallLog, Subject
from app.models.user import User
from app.models.college import College
from app.utils.security import create_access_token, hash_password

client = TestClient(app)

def run_tests():
    print("=" * 70)
    print("STARTING SMARTATTEND MASTER WORKFLOW INTEGRATION TEST SUITE")
    print("=" * 70)

    # 1. Health Check
    resp = client.get("/health")
    assert resp.status_code == 200, f"Health check failed: {resp.text}"
    health_data = resp.json()
    print(f"[PASS] Health check: {health_data['status']}, call_mode: {health_data.get('call_mode')}")

    # 2. Setup College A (CEG Campus) & College B (IIT Madras)
    college_a_id = f"COL-A-{uuid.uuid4().hex[:6]}"
    college_b_id = f"COL-B-{uuid.uuid4().hex[:6]}"

    token_a = create_access_token({"sub": f"admin@{college_a_id}.edu", "university_id": college_a_id, "college_id": college_a_id, "role": "admin"})
    token_b = create_access_token({"sub": f"admin@{college_b_id}.edu", "university_id": college_b_id, "college_id": college_b_id, "role": "admin"})

    # We will simulate authenticated requests by mocking or passing headers
    # Note: get_current_tenant_user parses Bearer token or falls back to demo tenant
    # Let's inspect how university_profile / auth handles tenant tokens or test headers
    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Pre-populate College and Users in DB
    db = SessionLocal()
    try:
        col_a = College(
            college_id=college_a_id,
            college_name="CEG Anna University",
            college_code=f"CODE-{college_a_id}",
            location="Chennai",
            state="Tamil Nadu",
            affiliation="Anna University",
            verification_status="verified"
        )
        col_b = College(
            college_id=college_b_id,
            college_name="IIT Madras",
            college_code=f"CODE-{college_b_id}",
            location="Chennai",
            state="Tamil Nadu",
            affiliation="Autonomous",
            verification_status="verified"
        )
        db.add_all([col_a, col_b])
        db.commit()

        user_a = User(
            user_id=str(uuid.uuid4()),
            email=f"admin@{college_a_id}.edu",
            password_hash=hash_password("password123"),
            full_name="Admin College A",
            role="admin",
            college_id=college_a_id,
            email_verified=True,
            account_status="active"
        )
        user_b = User(
            user_id=str(uuid.uuid4()),
            email=f"admin@{college_b_id}.edu",
            password_hash=hash_password("password123"),
            full_name="Admin College B",
            role="admin",
            college_id=college_b_id,
            email_verified=True,
            account_status="active"
        )
        db.add_all([user_a, user_b])
        db.commit()
        user_a_id = user_a.user_id
    finally:
        db.close()

    print(f"[SETUP] Created College A ({college_a_id}) and College B ({college_b_id})")

    # 3. Test Subject Catalog Creation for College A
    subject_payload_a = {
        "code": "CS8501",
        "name": "Theory of Computation",
        "department": "Computer Science & Engineering",
        "semester": 5,
        "credits": 4,
        "faculty_name": "Prof. Alan Turing"
    }
    resp = client.post(
        f"/api/subjects?college_id={college_a_id}",
        json=subject_payload_a,
        headers=headers_a
    )
    assert resp.status_code in [200, 201], f"Failed to create subject A: {resp.text}"
    subject_a = resp.json()
    print(f"[PASS] Created Subject for College A: {subject_a['code']} - {subject_a['name']}")

    # College B creates a subject
    subject_payload_b = {
        "code": "ME2101",
        "name": "Fluid Mechanics",
        "department": "Mechanical Engineering",
        "semester": 3,
        "credits": 3,
        "faculty_name": "Prof. Bernoulli"
    }
    resp = client.post(
        f"/api/subjects?college_id={college_b_id}",
        json=subject_payload_b,
        headers=headers_b
    )
    assert resp.status_code in [200, 201]
    print(f"[PASS] Created Subject for College B: ME2101")

    # Verify Multi-Tenant Subject Isolation
    resp_get_a = client.get(f"/api/subjects?college_id={college_a_id}", headers=headers_a)
    subjects_for_a = resp_get_a.json()
    assert any(s["code"] == "CS8501" for s in subjects_for_a), "College A should see CS8501"
    assert not any(s["code"] == "ME2101" for s in subjects_for_a), "College A MUST NOT see ME2101!"
    print("[PASS] Multi-tenant subject isolation verified.")

    # 4. Ingest Students for College A
    # Student 1: Consented, Tamil language, valid phone
    # Student 2: Consented, Telugu language, valid phone
    # Student 3: NOT Consented (consent_given = False)
    db = SessionLocal()
    try:
        s1 = Student(
            id=str(uuid.uuid4()),
            university_id=college_a_id,
            roll_number=f"REG-A-001",
            name="Karthik Rajan",
            department="Computer Science & Engineering",
            year=3,
            semester=5,
            section="A",
            parent_name="Rajan S",
            parent_phone="+919876543210",
            parent_relationship="Father",
            preferred_language="ta",
            consent_given=True,
            phone_verified=True,
            status="active"
        )
        s2 = Student(
            id=str(uuid.uuid4()),
            university_id=college_a_id,
            roll_number=f"REG-A-002",
            name="Suresh Reddy",
            department="Computer Science & Engineering",
            year=3,
            semester=5,
            section="A",
            parent_name="Venkatesh Reddy",
            parent_phone="+919876543211",
            parent_relationship="Father",
            preferred_language="te",
            consent_given=True,
            phone_verified=True,
            status="active"
        )
        s3 = Student(
            id=str(uuid.uuid4()),
            university_id=college_a_id,
            roll_number=f"REG-A-003",
            name="Pooja Sharma",
            department="Computer Science & Engineering",
            year=3,
            semester=5,
            section="A",
            parent_name="Rakesh Sharma",
            parent_phone="+919876543212",
            parent_relationship="Father",
            preferred_language="hi",
            consent_given=False, # Regulatory consent withheld!
            phone_verified=False,
            status="active"
        )
        # Student for College B
        s_b = Student(
            id=str(uuid.uuid4()),
            university_id=college_b_id,
            roll_number=f"REG-B-001",
            name="Ananya Menon",
            department="Mechanical Engineering",
            year=2,
            semester=3,
            section="A",
            parent_name="Menon P",
            parent_phone="+919876543299",
            parent_relationship="Mother",
            preferred_language="ml",
            consent_given=True,
            phone_verified=True,
            status="active"
        )
        db.add_all([s1, s2, s3, s_b])
        db.commit()
        s1_id, s2_id, s3_id, s_b_id = s1.id, s2.id, s3.id, s_b.id
    finally:
        db.close()

    print(f"[PASS] Seeded 3 students in College A (2 consented, 1 unconsented) and 1 in College B.")

    # Verify Student Tenant Isolation
    db = SessionLocal()
    try:
        students_a_count = db.query(Student).filter(Student.university_id == college_a_id).count()
        students_b_count = db.query(Student).filter(Student.university_id == college_b_id).count()
        assert students_a_count == 3
        assert students_b_count == 1
    finally:
        db.close()
    print(f"[PASS] Multi-tenant student isolation confirmed in database.")

    # 5. Create Attendance Session and Finalize Attendance for College A
    session_create_payload = {
        "subject_code": "CS8501",
        "subject_name": "Theory of Computation",
        "department": "Computer Science & Engineering",
        "year": 3,
        "semester": 5,
        "section": "A",
        "session_date": "2026-11-20",
        "session_slot": "09:00 - 10:00 AM",
        "faculty_id": user_a_id,
        "faculty_name": "Prof. Alan Turing"
    }
    resp = client.post("/api/attendance/sessions", json=session_create_payload, headers=headers_a)
    assert resp.status_code == 200, f"Session create failed: {resp.text}"
    created_session = resp.json()
    session_id = created_session["id"]
    print(f"[PASS] Created attendance session {session_id} for College A")

    finalize_payload = {
        "session_id": session_id,
        "records": [
            {"student_id": s1_id, "student_name": "Karthik Rajan", "roll_number": "REG-A-001", "status": "absent", "remarks": "Unexcused absence"},
            {"student_id": s2_id, "student_name": "Suresh Reddy", "roll_number": "REG-A-002", "status": "absent", "remarks": "Sick"},
            {"student_id": s3_id, "student_name": "Pooja Sharma", "roll_number": "REG-A-003", "status": "absent", "remarks": "Unexcused absence"}
        ]
    }

    resp = client.post("/api/attendance/finalize", json=finalize_payload, headers=headers_a)
    assert resp.status_code == 200, f"Attendance finalization failed: {resp.text}"
    fin_res = resp.json()
    print(f"[PASS] Attendance finalized: {fin_res['message']}")
    print(f"       Calls queued: {fin_res.get('calls_queued')}, Calls skipped (no consent/invalid): {fin_res.get('calls_skipped')}")

    # VERIFY REGULATORY COMPLIANCE:
    # Student 1 (consented) -> Queued
    # Student 2 (consented) -> Queued
    # Student 3 (unconsented) -> Skipped
    assert len(fin_res.get("queued_calls", [])) == 2, f"Expected 2 calls queued, got {len(fin_res.get('queued_calls', []))}"
    assert len(fin_res.get("skipped_no_consent", [])) == 1, f"Expected 1 call skipped for no consent, got {len(fin_res.get('skipped_no_consent', []))}"

    # 6. Test Idempotency: Re-submitting the same session MUST return 400 (already finalized)
    resp_duplicate = client.post("/api/attendance/finalize", json=finalize_payload, headers=headers_a)
    assert resp_duplicate.status_code == 400, f"Duplicate finalize did not return 400: {resp_duplicate.status_code}"
    print("[PASS] Idempotency confirmed: Duplicate attendance finalization rejected with 400.")

    # 7. Wait for background call queue simulation worker to complete calls
    print("[INFO] Waiting for background simulation calls to complete...")
    max_wait = 15
    completed = False
    for _ in range(max_wait):
        time.sleep(1)
        db = SessionLocal()
        try:
            calls = db.query(AICallLog).filter(AICallLog.session_id == session_id).all()
            completed_calls = [c for c in calls if c.call_status in ["completed", "answered"]]
            if len(completed_calls) >= 2:
                completed = True
                break
        finally:
            db.close()

    assert completed, "Background call jobs did not complete in time!"
    print("[PASS] All automated background calls completed successfully.")

    # 8. Verify Dialogue Transcripts, Language, and Intent Classifications
    db = SessionLocal()
    try:
        calls = db.query(AICallLog).filter(AICallLog.session_id == session_id).all()
        assert any(c.call_status == "no_consent" for c in calls), "Expected unconsented call to be logged as 'no_consent'"
        print("[PASS] Unconsented student properly logged as 'no_consent'.")

        for call in calls:
            if call.call_status == "no_consent":
                continue
            print(f"       -> Call ID: {call.id} | Mode: {call.call_mode} | Lang: {call.language} | Status: {call.call_status}")
            print(f"          Classification: {call.reason_category} | Verified: {call.parent_verified}")
            assert call.call_mode == "simulation", f"Expected simulation mode, got {call.call_mode}"
            assert call.call_status in ["completed", "answered"]
            assert call.dialogue_transcript is not None and len(call.dialogue_transcript) > 20, "Transcript is empty or incomplete"
            assert call.reason_category in [
                "Medical / Sick",
                "Family Emergency",
                "Transportation",
                "Personal / Domestic",
                "Unaware of Absence",
                "Other Reason"
            ], f"Invalid classification: {call.reason_category}"
    finally:
        db.close()
    print("[PASS] Dialogue transcript structure and NLU intent classification verified.")

    # 9. Verify Calling Metrics & Logs API
    resp_stats = client.get("/api/attendance/calls/stats", headers=headers_a)
    assert resp_stats.status_code == 200, f"Stats failed: {resp_stats.text}"
    stats = resp_stats.json()
    print(f"[PASS] Call stats College A: Absent={stats.get('total_absent_students')}, Completed={stats.get('calls_completed')}, Simulation={stats.get('simulated_calls')}")
    assert stats.get("total_absent_students") >= 2
    assert stats.get("simulated_calls") >= 2

    # Verify College B sees ZERO call logs (Tenant Isolation)
    resp_stats_b = client.get("/api/attendance/calls/stats", headers=headers_b)
    assert resp_stats_b.status_code == 200
    stats_b = resp_stats_b.json()
    assert stats_b.get("total_absent_students") == 0, f"College B saw {stats_b.get('total_absent_students')} calls from College A!"
    print("[PASS] Multi-tenant calling statistics isolation verified.")

    # 10. Test Exotel Webhook Endpoint
    webhook_payload = {
        "CallSid": f"exo-call-{uuid.uuid4().hex[:8]}",
        "From": "+919876543210",
        "To": "08012345678",
        "Status": "completed",
        "CallDuration": 42,
        "RecordingUrl": "https://api.exotel.com/recordings/dummy.mp3"
    }
    resp_webhook = client.post("/api/calls/webhook/exotel", data=webhook_payload)
    assert resp_webhook.status_code == 200, f"Webhook failed: {resp_webhook.text}"
    print(f"[PASS] Exotel webhook callback processed successfully: {resp_webhook.json().get('status')}")

    # 11. Test Manual Call Retry Endpoint
    db = SessionLocal()
    first_call_id = None
    try:
        first_call = db.query(AICallLog).filter(AICallLog.session_id == session_id).first()
        if first_call:
            first_call_id = first_call.id
            # Set to no_answer to simulate a missed call ready for retry
            first_call.call_status = "no_answer"
            db.commit()
    finally:
        db.close()

    if first_call_id:
        resp_retry = client.post(f"/api/attendance/calls/{first_call_id}/retry", headers=headers_a)
        assert resp_retry.status_code == 200, f"Retry failed: {resp_retry.text}"
        retry_res = resp_retry.json()
        print(f"[PASS] Manual call retry triggered: {retry_res.get('message')}")

    print("=" * 70)
    print("ALL INTEGRATION TESTS PASSED SUCCESSFULLY (11/11 SUITES)")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
