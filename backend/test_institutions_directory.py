"""
SmartAttend AI / CampusAI - Institutions Directory Integration Test Suite
Verifies all 14 scenarios from the prompt specification.
"""

import sys
import os
import uuid
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.database import SessionLocal
from app.models.institution import Institution, InstitutionAdditionRequest
from app.models.user import User
from app.models.otp import EmailOTP
from app.utils.security import create_access_token
from datetime import datetime, timezone

client = TestClient(app)

def run_institutions_tests():
    print("=" * 70)
    print("STARTING ALL INDIA INSTITUTIONS DIRECTORY TEST SUITE")
    print("=" * 70)

    # 1. Health check includes institutions directory
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json().get("institutions_directory") == "enabled"
    print("[PASS 1] Health check includes institutions_directory.")

    # 2. Test institution types endpoint (all 8 types)
    resp = client.get("/api/institutions/types")
    assert resp.status_code == 200
    types = resp.json()
    assert len(types) == 8
    type_names = [t["name"] for t in types]
    assert "Central University" in type_names
    assert "Autonomous College" in type_names
    assert "Deemed-to-be University" in type_names
    print(f"[PASS 2] All 8 institution types verified: {len(types)} categories.")

    # 3. Test states endpoint (all 36 States and UTs)
    resp = client.get("/api/institutions/states")
    assert resp.status_code == 200
    states = resp.json()
    assert len(states) == 36
    state_names = [s["state"] for s in states]
    assert "Tamil Nadu" in state_names
    assert "Maharashtra" in state_names
    assert "Delhi" in state_names
    assert "Ladakh" in state_names
    assert "Andaman and Nicobar Islands" in state_names
    assert "Lakshadweep" in state_names
    print(f"[PASS 3] All 36 States and Union Territories verified.")

    # 4. Search by Category: Central Universities
    resp = client.get("/api/institutions/search?institution_type=Central University")
    assert resp.status_code == 200
    cu_data = resp.json()
    assert cu_data["total"] >= 10
    assert all(item["institution_type"] == "Central University" for item in cu_data["items"])
    print(f"[PASS 4] Central Universities search: {cu_data['total']} found.")

    # 5. Search by Category: State Public Universities
    resp = client.get("/api/institutions/search?institution_type=State Public University")
    assert resp.status_code == 200
    spu_data = resp.json()
    assert spu_data["total"] >= 5
    print(f"[PASS 5] State Public Universities search: {spu_data['total']} found.")

    # 6. Search by Category: State Private Universities
    resp = client.get("/api/institutions/search?institution_type=State Private University")
    assert resp.status_code == 200
    assert resp.json()["total"] >= 2
    print(f"[PASS 6] State Private Universities search: {resp.json()['total']} found.")

    # 7. Search by Category: Deemed-to-be Universities
    resp = client.get("/api/institutions/search?institution_type=Deemed-to-be University")
    assert resp.status_code == 200
    assert resp.json()["total"] >= 3
    print(f"[PASS 7] Deemed-to-be Universities search: {resp.json()['total']} found.")

    # 8. Search Autonomous Colleges (with UGC autonomous details & affiliating university)
    resp = client.get("/api/institutions/search?institution_type=Autonomous College")
    assert resp.status_code == 200
    ac_data = resp.json()
    assert ac_data["total"] >= 5
    for ac in ac_data["items"]:
        assert ac["autonomous_status"] == True
        assert ac["affiliating_university_name"] is not None
    print(f"[PASS 8] Autonomous Colleges search: {ac_data['total']} found with valid autonomous status and affiliating universities.")

    # 9. Search Affiliated Colleges
    resp = client.get("/api/institutions/search?institution_type=Affiliated College")
    assert resp.status_code == 200
    aff_data = resp.json()
    assert aff_data["total"] >= 2
    print(f"[PASS 9] Affiliated Colleges search: {aff_data['total']} found.")

    # 10. Filter by State (e.g. Maharashtra, Tamil Nadu, Karnataka)
    resp = client.get("/api/institutions/search?state=Maharashtra")
    assert resp.status_code == 200
    mh_data = resp.json()
    assert mh_data["total"] >= 3
    assert all(item["state"] == "Maharashtra" for item in mh_data["items"])
    print(f"[PASS 10] State filter (Maharashtra): {mh_data['total']} institutions strictly in Maharashtra.")

    # 11. Search using partial institution names (e.g. "Tech", "Xavier", "Jawaharlal")
    resp = client.get("/api/institutions/search?q=Xavier")
    assert resp.status_code == 200
    xavier_items = resp.json()["items"]
    assert len(xavier_items) >= 2
    print(f"[PASS 11] Partial name search ('Xavier'): Found {[x['official_name'] for x in xavier_items]}.")

    # 12. Search using AISHE codes (e.g. "U-0120", "C-43890")
    resp = client.get("/api/institutions/search?q=U-0120")
    assert resp.status_code == 200
    assert len(resp.json()["items"]) == 1
    assert "University of Delhi" in resp.json()["items"][0]["official_name"]

    resp2 = client.get("/api/institutions/search?q=C-44006")
    assert resp2.status_code == 200
    assert len(resp2.json()["items"]) == 1
    assert "LOYOLA COLLEGE" in resp2.json()["items"][0]["official_name"]
    print("[PASS 12] AISHE code search verified: U-0120 (Delhi University) & C-44006 (Loyola College).")

    # 13. Handle institutions not found (empty state)
    resp = client.get("/api/institutions/search?q=NonExistentInstitutionXYZ999")
    assert resp.status_code == 200
    assert resp.json()["total"] == 0
    assert len(resp.json()["items"]) == 0
    print("[PASS 13] Empty state correctly handled for non-existent search.")

    # 14. Affiliating universities lookup
    resp = client.get("/api/institutions/affiliating-universities?state=Tamil Nadu")
    assert resp.status_code == 200
    univs_tn = resp.json()
    assert len(univs_tn) >= 2
    assert any("Anna University" in u["official_name"] for u in univs_tn)
    print(f"[PASS 14] Affiliating universities for Tamil Nadu: {[u['official_name'] for u in univs_tn]}.")

    # 15. Submit Institution Addition Request
    unique_aishe = f"C-TEST-{uuid.uuid4().hex[:6].upper()}"
    req_payload = {
        "official_name": f"Government Engineering College Bharatpur {uuid.uuid4().hex[:4]}",
        "institution_type": "Affiliated College",
        "state": "Rajasthan",
        "district": "Bharatpur",
        "city": "Bharatpur",
        "address": "NH-11, Shrawan Kunj, Bharatpur, Rajasthan - 321001",
        "official_website": "https://ecbharatpur.ac.in",
        "aishe_code": unique_aishe,
        "ugc_reference": "RTU Kota Affiliated / AICTE Approved",
        "affiliating_university": "Rajasthan Technical University",
        "official_email": f"principal_{uuid.uuid4().hex[:6]}@ecbharatpur.ac.in",
        "applicant_name": "Dr. S. K. Sharma",
    }
    resp_req = client.post("/api/institutions/request-addition", json=req_payload)
    assert resp_req.status_code == 201, f"Failed: {resp_req.text}"
    addition_data = resp_req.json()
    assert addition_data["status"] == "pending"
    request_id = addition_data["id"]
    print(f"[PASS 15] Institution addition request submitted: ID={request_id}, Status={addition_data['status']}.")

    # 16. Admin approves request
    admin_token = create_access_token({"sub": "admin@smartattend.edu", "role": "admin"})
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    resp_pending = client.get("/api/admin/institutions/pending", headers=admin_headers)
    assert resp_pending.status_code == 200
    pending_list = resp_pending.json()
    assert any(p["id"] == request_id for p in pending_list)
    print(f"[PASS 16] Admin retrieved pending list containing request {request_id}.")

    resp_approve = client.post(
        "/api/admin/institutions/approve",
        json={"request_id": request_id, "admin_notes": "Verified against AICTE gazette."},
        headers=admin_headers,
    )
    assert resp_approve.status_code == 200
    approved_inst = resp_approve.json()
    assert "Government Engineering College Bharatpur" in approved_inst["official_name"]
    assert approved_inst["recognition_status"] == "verified"
    print(f"[PASS 17] Admin approved request. Created verified institution ID={approved_inst['id']}.")

    # Verify newly approved institution can now be found in search
    resp_search_new = client.get("/api/institutions/search?q=Bharatpur")
    assert resp_search_new.status_code == 200
    assert resp_search_new.json()["total"] >= 1
    print("[PASS 18] Newly approved institution is immediately searchable.")

    # 17. Test Registration Integration with Verified Institution
    # Setup verified OTP in database
    test_email = f"dean_{uuid.uuid4().hex[:6]}@annauniv.edu"
    db = SessionLocal()
    try:
        otp_rec = EmailOTP(
            otp_id=f"otp-{uuid.uuid4().hex[:8]}",
            email=test_email,
            otp_hash="dummy_hash_for_test",
            verified=True,
            expires_at=datetime.now(timezone.utc),
            created_at=datetime.now(timezone.utc),
        )
        db.add(otp_rec)
        db.commit()
    finally:
        db.close()

    register_payload = {
        "full_name": "Prof. S. R. Nathan",
        "email": test_email,
        "password": "Password123!",
        "institution_id": "INST-UNIV-U-0120",
        "role": "admin",
    }
    resp_reg = client.post("/api/auth/register", json=register_payload)
    if resp_reg.status_code != 200:
        print(f"FAILED REGISTRATION: status={resp_reg.status_code}, body={resp_reg.text}")
    assert resp_reg.status_code == 200
    reg_res = resp_reg.json()
    assert reg_res["status"] == "success"
    assert reg_res["college_id"] == "INST-UNIV-U-0120"
    print(f"[PASS 19] University registration successfully integrated with institution ID: {reg_res['college_id']}.")

    # 18. Prevent duplicate registration
    resp_dup = client.post("/api/auth/register", json=register_payload)
    assert resp_dup.status_code == 409
    print("[PASS 20] Duplicate registration rejected with 409 Conflict.")

    print("=" * 70)
    print("ALL 20 INSTITUTIONS DIRECTORY TEST SUITES PASSED (100% SUCCESS)")
    print("=" * 70)

if __name__ == "__main__":
    run_institutions_tests()
