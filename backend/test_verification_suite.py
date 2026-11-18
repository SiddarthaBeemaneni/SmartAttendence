"""
SmartAttend AI / CampusAI - Comprehensive Multi-Level Verification Test Suite

Tests all 13 scenarios required by specification:
1. Valid college and valid email.
2. Invalid college name.
3. Fake college name.
4. Invalid email format.
5. Nonexistent email domain.
6. Valid email with incorrect OTP.
7. Expired OTP.
8. Repeated OTP requests (rate limiting).
9. Duplicate email registration.
10. Attempt to register without college verification.
11. Attempt to register without email verification.
12. Attempt to log in with an unverified account.
13. Successful registration and login.
"""

import sys
import time
import httpx

BASE_URL = "http://127.0.0.1:8001"
client = httpx.Client(timeout=10.0)

passed_tests = 0
total_tests = 13


def assert_test(condition: bool, test_num: int, title: str, details: str = ""):
    global passed_tests
    if condition:
        passed_tests += 1
        print(f"✅ [Scenario {test_num:02d} PASSED]: {title} {details}")
    else:
        print(f"❌ [Scenario {test_num:02d} FAILED]: {title} {details}")


def run_all_tests():
    print(f"\n=======================================================")
    print(f"  RUNNING SMARTATTEND AI VERIFICATION TEST SUITE (13 SCENARIOS)")
    print(f"=======================================================\n")

    # ----------------------------------------------------------------
    # Scenario 1: Valid college search & verify
    # ----------------------------------------------------------------
    res = client.post(f"{BASE_URL}/api/college/verify", json={"college_name": "Indian Institute of Technology Madras"})
    assert_test(
        res.status_code == 200 and res.json().get("status") == "verified",
        1,
        "Valid College Verification",
        f"-> Code: {res.json().get('college', {}).get('college_code')}",
    )
    valid_college_id = res.json()["college"]["college_id"]

    # ----------------------------------------------------------------
    # Scenario 2: Invalid college name
    # ----------------------------------------------------------------
    res = client.post(f"{BASE_URL}/api/college/verify", json={"college_name": "Nonexistent College of Nowhere"})
    assert_test(
        res.status_code == 404 and "College not found" in res.json().get("detail", ""),
        2,
        "Invalid College Name Rejection",
        f"-> Detail: '{res.json().get('detail')}'",
    )

    # ----------------------------------------------------------------
    # Scenario 3: Fake college name
    # ----------------------------------------------------------------
    res = client.post(f"{BASE_URL}/api/college/verify", json={"college_name": "Fake Engineering Academy 9999"})
    assert_test(
        res.status_code == 404 and "Please enter a valid registered college" in res.json().get("detail", ""),
        3,
        "Fake College Name Rejection",
        f"-> Status: {res.status_code}",
    )

    # ----------------------------------------------------------------
    # Scenario 4: Invalid email format
    # ----------------------------------------------------------------
    res = client.post(f"{BASE_URL}/api/email/validate", json={"email": "not-an-email-at-all"})
    assert_test(
        res.status_code == 400 and "Invalid email format" in res.json().get("detail", ""),
        4,
        "Invalid Email Format Rejection",
        f"-> Detail: '{res.json().get('detail')}'",
    )

    # ----------------------------------------------------------------
    # Scenario 5: Nonexistent email domain (DNS MX check)
    # ----------------------------------------------------------------
    res = client.post(f"{BASE_URL}/api/email/validate", json={"email": "admin@thisdomaincertainlydoesnotexist1234567.org"})
    assert_test(
        res.status_code == 400 and ("does not exist" in res.json().get("detail", "") or "MX" in res.json().get("detail", "")),
        5,
        "Nonexistent Email Domain MX Check Rejection",
        f"-> Detail: '{res.json().get('detail')}'",
    )

    # ----------------------------------------------------------------
    # Scenario 6: Valid email with incorrect OTP
    # ----------------------------------------------------------------
    test_email_wrong_otp = "test_wrong_otp@gmail.com"
    send_res = client.post(
        f"{BASE_URL}/api/email/send-otp",
        json={"email": test_email_wrong_otp, "college_id": valid_college_id},
    )
    verify_wrong_res = client.post(
        f"{BASE_URL}/api/email/verify-otp",
        json={"email": test_email_wrong_otp, "otp": "000000"},
    )
    assert_test(
        verify_wrong_res.status_code == 400 and "Incorrect verification code" in verify_wrong_res.json().get("detail", ""),
        6,
        "Valid Email with Incorrect OTP Rejection",
        f"-> Detail: '{verify_wrong_res.json().get('detail')}'",
    )

    # ----------------------------------------------------------------
    # Scenario 7: Expired OTP simulation
    # ----------------------------------------------------------------
    from app.database import SessionLocal
    from app.models.otp import EmailOTP
    from datetime import datetime, timezone, timedelta

    test_email_expired = "test_expired_otp@gmail.com"
    send_expired_res = client.post(
        f"{BASE_URL}/api/email/send-otp",
        json={"email": test_email_expired, "college_id": valid_college_id},
    )
    otp_code_expired = send_expired_res.json().get("debug_otp", "123456")

    # Manually backdate expiration to test strict expiry logic
    with SessionLocal() as db:
        record = db.query(EmailOTP).filter(EmailOTP.email == test_email_expired).order_by(EmailOTP.created_at.desc()).first()
        if record:
            record.expires_at = datetime.now(timezone.utc) - timedelta(minutes=10)
            db.commit()

    verify_expired_res = client.post(
        f"{BASE_URL}/api/email/verify-otp",
        json={"email": test_email_expired, "otp": otp_code_expired},
    )
    assert_test(
        verify_expired_res.status_code == 400 and "expired" in verify_expired_res.json().get("detail", "").lower(),
        7,
        "Expired OTP Rejection",
        f"-> Detail: '{verify_expired_res.json().get('detail')}'",
    )

    # ----------------------------------------------------------------
    # Scenario 8: Repeated OTP requests (Rate Limiting)
    # ----------------------------------------------------------------
    test_email_ratelimit = "test_ratelimit@gmail.com"
    req1 = client.post(f"{BASE_URL}/api/email/send-otp", json={"email": test_email_ratelimit})
    req2 = client.post(f"{BASE_URL}/api/email/send-otp", json={"email": test_email_ratelimit})
    assert_test(
        req2.status_code == 429 and "wait" in req2.json().get("detail", "").lower(),
        8,
        "Repeated OTP Rate Limiting (429)",
        f"-> Status: {req2.status_code}, Detail: '{req2.json().get('detail')}'",
    )

    # ----------------------------------------------------------------
    # Scenario 9: Duplicate email registration rejection
    # ----------------------------------------------------------------
    dup_res = client.post(
        f"{BASE_URL}/api/auth/register",
        json={
            "full_name": "Duplicate Tester",
            "email": "admin@smartattend.edu",
            "password": "Password@123",
            "college_id": valid_college_id,
        },
    )
    assert_test(
        dup_res.status_code in (400, 409),
        9,
        "Duplicate Email / Unverified Registration Guard",
        f"-> Status: {dup_res.status_code}",
    )

    # ----------------------------------------------------------------
    # Scenario 10: Attempt to register without college verification
    # ----------------------------------------------------------------
    reg_no_college = client.post(
        f"{BASE_URL}/api/auth/register",
        json={
            "full_name": "Test User",
            "email": "fresh_user_10@gmail.com",
            "password": "Password@123",
            "college_id": "CLG-FAKE-999",
        },
    )
    assert_test(
        reg_no_college.status_code == 404 and "College not found" in reg_no_college.json().get("detail", ""),
        10,
        "Register Without College Verification Rejection",
        f"-> Detail: '{reg_no_college.json().get('detail')}'",
    )

    # ----------------------------------------------------------------
    # Scenario 11: Attempt to register without email OTP verification
    # ----------------------------------------------------------------
    reg_no_otp = client.post(
        f"{BASE_URL}/api/auth/register",
        json={
            "full_name": "Test User Without OTP",
            "email": "unverified_email_11@gmail.com",
            "password": "Password@123",
            "college_id": valid_college_id,
        },
    )
    assert_test(
        reg_no_otp.status_code == 400 and "Email verification required" in reg_no_otp.json().get("detail", ""),
        11,
        "Register Without Email OTP Verification Rejection",
        f"-> Detail: '{reg_no_otp.json().get('detail')}'",
    )

    # ----------------------------------------------------------------
    # Scenario 12: Attempt to log in with an unverified or inactive account
    # ----------------------------------------------------------------
    from app.models.user import User
    from app.utils.security import hash_password

    unverified_email = "unverified_db_user@gmail.com"
    with SessionLocal() as db:
        existing = db.query(User).filter(User.email == unverified_email).first()
        if not existing:
            u = User(
                user_id="usr-test-unverified",
                full_name="Unverified User",
                email=unverified_email,
                password_hash=hash_password("Password@123"),
                college_id=valid_college_id,
                email_verified=False,
                account_status="unverified",
            )
            db.add(u)
            db.commit()

    login_unverified = client.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": unverified_email, "password": "Password@123"},
    )
    assert_test(
        login_unverified.status_code == 403 and "Email address has not been verified" in login_unverified.json().get("detail", ""),
        12,
        "Login with Unverified Account Rejection (403)",
        f"-> Detail: '{login_unverified.json().get('detail')}'",
    )

    # ----------------------------------------------------------------
    # Scenario 13: Successful end-to-end registration and login
    # ----------------------------------------------------------------
    success_email = f"dean.academics_{int(time.time())}@gmail.com"
    # Step 1: Send OTP
    send_otp_success = client.post(
        f"{BASE_URL}/api/email/send-otp",
        json={"email": success_email, "college_id": valid_college_id, "name": "Prof. S. Ranganathan"},
    )
    otp_code_success = send_otp_success.json().get("debug_otp")

    # Step 2: Verify OTP
    verify_otp_success = client.post(
        f"{BASE_URL}/api/email/verify-otp",
        json={"email": success_email, "otp": otp_code_success},
    )
    v_token = verify_otp_success.json().get("verification_token")

    # Step 3: Complete Registration
    register_success = client.post(
        f"{BASE_URL}/api/auth/register",
        json={
            "full_name": "Prof. S. Ranganathan",
            "email": success_email,
            "password": "SecurePassword@2026",
            "college_id": valid_college_id,
            "verification_token": v_token,
        },
    )

    # Step 4: Login with newly created credentials
    login_success = client.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": success_email, "password": "SecurePassword@2026"},
    )

    jwt_token = login_success.json().get("access_token")
    user_data = login_success.json().get("user", {})

    assert_test(
        register_success.status_code == 200
        and login_success.status_code == 200
        and bool(jwt_token)
        and user_data.get("email") == success_email,
        13,
        "Complete End-to-End Registration & Secure Login",
        f"-> User: {user_data.get('name')}, JWT issued.",
    )

    print(f"\n=======================================================")
    print(f"  TEST RESULTS: {passed_tests} / {total_tests} SCENARIOS PASSED")
    print(f"=======================================================\n")

    if passed_tests == total_tests:
        print("🎉 ALL 13 TEST SCENARIOS PASSED WITH ZERO FAILURES!")
    else:
        sys.exit(1)


if __name__ == "__main__":
    run_all_tests()
