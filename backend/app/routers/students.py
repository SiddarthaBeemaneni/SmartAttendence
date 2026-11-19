"""
SmartAttend AI / CampusAI - Multi-Tenant Student Management Router

Features:
- Strict university-level tenant data isolation
- Add student manually
- Bulk upload from Excel (.xlsx) or CSV
- Sample template download (.csv and .xlsx)
- Pre-import preview with data validation & duplicate detection
- Real-time in-table corrections
- Batch database import into PostgreSQL / SQLite
- View, search, filter, edit, and delete student records
"""

import io
import csv
import uuid
import openpyxl
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.student import Student
from app.routers.university_profile import get_current_tenant_user
from app.schemas.student import (
    StudentCreate,
    StudentUpdate,
    StudentResponse,
    BulkPreviewResponse,
    BulkPreviewRow,
    BulkImportRequest,
    BulkImportResponse,
)

router = APIRouter(prefix="/api/students", tags=["Student Management"])

VALID_LANGUAGES = {"ta", "en", "te", "hi", "ml", "kn"}
LANGUAGE_ALIASES = {
    "tamil": "ta", "தமிழ்": "ta",
    "english": "en",
    "telugu": "te", "తెలుగు": "te",
    "hindi": "hi", "हिन्दी": "hi",
    "malayalam": "ml", "മലയാളം": "ml",
    "kannada": "kn", "ಕನ್ನಡ": "kn",
}

VALID_SALUTATIONS = {"Mr.", "Mrs.", "Ms.", "Dr.", "Prof."}


def normalize_language(lang_raw: str) -> str:
    cleaned = str(lang_raw).strip().lower()
    if cleaned in VALID_LANGUAGES:
        return cleaned
    return LANGUAGE_ALIASES.get(cleaned, "en")


def normalize_salutation(sal_raw: str) -> str:
    cleaned = str(sal_raw).strip()
    for s in VALID_SALUTATIONS:
        if cleaned.lower() == s.lower().replace(".", "") or cleaned.lower() == s.lower():
            return s
    return "Mr."


# ========================================================
# 1. VIEW & SEARCH STUDENTS (TENANT ISOLATED)
# ========================================================
@router.get("", response_model=List[StudentResponse])
def get_students(
    search: Optional[str] = Query(None, description="Search by student name or roll number"),
    department: Optional[str] = Query(None, description="Filter by department"),
    year: Optional[int] = Query(None, description="Filter by academic year"),
    semester: Optional[int] = Query(None, description="Filter by semester"),
    section: Optional[str] = Query(None, description="Filter by class section"),
    user: dict = Depends(get_current_tenant_user),
    db: Session = Depends(get_db),
):
    """
    List all students belonging exclusively to the authenticated university administrator's institution.
    """
    university_id = user.get("university_id") or user.get("college_id") or "UNI-2026-0001"
    query = db.query(Student).filter(Student.university_id == university_id)

    if department and department != "All":
        query = query.filter(Student.department == department)

    if year:
        query = query.filter(Student.year == year)

    if semester:
        query = query.filter(Student.semester == semester)

    if section and section != "All":
        query = query.filter(Student.section == section.strip().upper())

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Student.name.ilike(search_term),
                Student.roll_number.ilike(search_term),
                Student.parent_name.ilike(search_term),
                Student.parent_phone.ilike(search_term),
            )
        )

    students = query.order_by(Student.roll_number.asc()).all()
    return students


# ========================================================
# 2. ADD STUDENT MANUALLY
# ========================================================
@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def add_student_manually(
    student_data: StudentCreate,
    user: dict = Depends(get_current_tenant_user),
    db: Session = Depends(get_db),
):
    """
    Manually add a single student record with multi-tenant university isolation.
    """
    university_id = user.get("university_id", "UNI-2026-0001")
    roll = student_data.roll_number.strip()

    # Check duplicate roll number within this university
    existing = db.query(Student).filter(
        Student.university_id == university_id,
        Student.roll_number == roll,
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Roll number '{roll}' already exists in your university database.",
        )

    student_id = f"stu-{uuid.uuid4().hex[:10]}"
    student = Student(
        id=student_id,
        university_id=university_id,
        name=student_data.name.strip(),
        roll_number=roll,
        department=student_data.department.strip(),
        year=student_data.year,
        semester=student_data.semester,
        section=student_data.section.strip().upper(),
        parent_name=student_data.parent_name.strip(),
        parent_phone=student_data.parent_phone.strip(),
        preferred_language=normalize_language(student_data.preferred_language),
        preferred_form_of_address=normalize_salutation(student_data.preferred_form_of_address),
        consent_given=student_data.consent_given,
        phone_verified=student_data.phone_verified,
        attendance_percentage=100.0,
        status="active",
    )

    db.add(student)
    db.commit()
    db.refresh(student)
    return student


# ========================================================
# 3. EDIT STUDENT RECORD
# ========================================================
@router.put("/{student_id}", response_model=StudentResponse)
def update_student(
    student_id: str,
    update_data: StudentUpdate,
    user: dict = Depends(get_current_tenant_user),
    db: Session = Depends(get_db),
):
    """
    Update an existing student record. Enforces tenant ownership.
    """
    university_id = user.get("university_id", "UNI-2026-0001")
    student = db.query(Student).filter(
        Student.id == student_id,
        Student.university_id == university_id,
    ).first()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student record not found in your university database.",
        )

    # Check roll number uniqueness if changed
    if update_data.roll_number and update_data.roll_number.strip() != student.roll_number:
        new_roll = update_data.roll_number.strip()
        collision = db.query(Student).filter(
            Student.university_id == university_id,
            Student.roll_number == new_roll,
            Student.id != student_id,
        ).first()
        if collision:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Roll number '{new_roll}' is already in use by another student.",
            )
        student.roll_number = new_roll

    for field, val in update_data.model_dump(exclude_unset=True).items():
        if field == "roll_number":
            continue
        if val is not None:
            if field == "preferred_language":
                val = normalize_language(val)
            elif field == "preferred_form_of_address":
                val = normalize_salutation(val)
            setattr(student, field, val)

    db.commit()
    db.refresh(student)
    return student


# ========================================================
# 4. DELETE STUDENT RECORD
# ========================================================
@router.delete("/{student_id}")
def delete_student(
    student_id: str,
    user: dict = Depends(get_current_tenant_user),
    db: Session = Depends(get_db),
):
    """
    Delete a student record permanently from university records.
    """
    university_id = user.get("university_id", "UNI-2026-0001")
    student = db.query(Student).filter(
        Student.id == student_id,
        Student.university_id == university_id,
    ).first()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student record not found.",
        )

    db.delete(student)
    db.commit()
    return {"status": "success", "message": f"Student '{student.name}' ({student.roll_number}) deleted successfully."}


# ========================================================
# 5. DOWNLOAD SAMPLE EXCEL & CSV TEMPLATES
# ========================================================
SAMPLE_STUDENT_ROWS = [
    {
        "student_name": "Karthik Subramanian",
        "roll_number": "2026-CSE-001",
        "department": "Computer Science & Engineering",
        "year": 3,
        "semester": 5,
        "section": "A",
        "parent_name": "S. Subramanian",
        "parent_phone": "+91 98410 99881",
        "preferred_language": "ta",
        "preferred_form_of_address": "Mr.",
    },
    {
        "student_name": "Pooja Venkatesh",
        "roll_number": "2026-CSE-002",
        "department": "Computer Science & Engineering",
        "year": 3,
        "semester": 5,
        "section": "A",
        "parent_name": "Malathi Venkatesh",
        "parent_phone": "+91 98422 11223",
        "preferred_language": "ta",
        "preferred_form_of_address": "Mrs.",
    },
    {
        "student_name": "Rahul R. Menon",
        "roll_number": "2026-CSE-003",
        "department": "Computer Science & Engineering",
        "year": 3,
        "semester": 5,
        "section": "A",
        "parent_name": "Radhakrishnan Menon",
        "parent_phone": "+91 94471 33445",
        "preferred_language": "ml",
        "preferred_form_of_address": "Mr.",
    },
    {
        "student_name": "Aditya Varma",
        "roll_number": "2026-CSE-004",
        "department": "Computer Science & Engineering",
        "year": 3,
        "semester": 5,
        "section": "A",
        "parent_name": "B. Varma",
        "parent_phone": "+91 98490 55667",
        "preferred_language": "te",
        "preferred_form_of_address": "Mr.",
    },
    {
        "student_name": "Deepika Joshi",
        "roll_number": "2026-CSE-005",
        "department": "Information Technology",
        "year": 2,
        "semester": 3,
        "section": "B",
        "parent_name": "Sunita Joshi",
        "parent_phone": "+91 98110 77889",
        "preferred_language": "hi",
        "preferred_form_of_address": "Mrs.",
    },
]


@router.get("/template/csv")
def download_csv_template():
    """
    Download a formatted CSV sample template for student bulk uploading.
    """
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Student Name",
        "Roll Number",
        "Department",
        "Year",
        "Semester",
        "Section",
        "Parent Name",
        "Parent Phone",
        "Preferred Parent Language (en/ta/te/hi/ml/kn)",
        "Preferred Form of Address (Mr/Mrs/Dr/Prof)",
    ])
    for row in SAMPLE_STUDENT_ROWS:
        writer.writerow([
            row["student_name"],
            row["roll_number"],
            row["department"],
            row["year"],
            row["semester"],
            row["section"],
            row["parent_name"],
            row["parent_phone"],
            row["preferred_language"],
            row["preferred_form_of_address"],
        ])
    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=student_upload_template.csv"},
    )


@router.get("/template/excel")
def download_excel_template():
    """
    Download a styled Excel (.xlsx) sample template for student bulk uploading.
    """
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Students Template"

    headers = [
        "Student Name",
        "Roll Number",
        "Department",
        "Year",
        "Semester",
        "Section",
        "Parent Name",
        "Parent Phone",
        "Preferred Parent Language",
        "Preferred Form of Address",
    ]
    ws.append(headers)

    # Header styling
    header_font = openpyxl.styles.Font(bold=True, color="FFFFFF")
    header_fill = openpyxl.styles.PatternFill(start_color="1E3A5F", end_color="1E3A5F", fill_type="solid")
    for col_idx in range(1, len(headers) + 1):
        cell = ws.cell(row=1, column=col_idx)
        cell.font = header_font
        cell.fill = header_fill

    for r in SAMPLE_STUDENT_ROWS:
        ws.append([
            r["student_name"],
            r["roll_number"],
            r["department"],
            r["year"],
            r["semester"],
            r["section"],
            r["parent_name"],
            r["parent_phone"],
            r["preferred_language"],
            r["preferred_form_of_address"],
        ])

    # Auto column width
    for col in ws.columns:
        max_len = max(len(str(cell.value or "")) for cell in col)
        col_letter = openpyxl.utils.get_column_letter(col[0].column)
        ws.column_dimensions[col_letter].width = max(max_len + 3, 14)

    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)

    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=student_upload_template.xlsx"},
    )


# ========================================================
# 6. BULK PREVIEW & VALIDATION (EXCEL / CSV)
# ========================================================
@router.post("/bulk-preview", response_model=BulkPreviewResponse)
async def preview_student_upload(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_tenant_user),
    db: Session = Depends(get_db),
):
    """
    Parse uploaded Excel or CSV file, validate fields, check duplicates
    against database and intra-file, and return structured preview rows.
    """
    university_id = user.get("university_id", "UNI-2026-0001")
    filename = file.filename.lower()

    if not (filename.endswith(".csv") or filename.endswith(".xlsx")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload a CSV (.csv) or Excel (.xlsx) file.",
        )

    content = await file.read()
    raw_rows = []

    # Parse Excel or CSV
    if filename.endswith(".xlsx"):
        try:
            wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
            ws = wb.active
            rows_iter = ws.iter_rows(values_only=True)
            for row in rows_iter:
                if any(row):  # skip completely blank rows
                    raw_rows.append([str(c) if c is not None else "" for c in row])
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unable to read Excel file: {str(e)}",
            )
    else:
        try:
            text_stream = io.StringIO(content.decode("utf-8-sig"))
            reader = csv.reader(text_stream)
            for row in reader:
                if any(row):
                    raw_rows.append([str(c) for c in row])
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unable to read CSV file: {str(e)}",
            )

    if len(raw_rows) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file contains no data rows besides the header.",
        )

    # Header mapping
    header_row = [c.strip().lower() for c in raw_rows[0]]
    data_rows = raw_rows[1:]

    def find_idx(candidates: List[str], default_idx: int) -> int:
        for c in candidates:
            for idx, h in enumerate(header_row):
                if c in h:
                    return idx
        return default_idx

    name_idx = find_idx(["student name", "name", "student"], 0)
    roll_idx = find_idx(["roll", "reg", "id"], 1)
    dept_idx = find_idx(["dept", "department", "branch"], 2)
    year_idx = find_idx(["year"], 3)
    sem_idx = find_idx(["sem", "semester"], 4)
    sec_idx = find_idx(["sec", "section"], 5)
    p_name_idx = find_idx(["parent name", "guardian name", "parent"], 6)
    p_phone_idx = find_idx(["parent phone", "guardian phone", "mobile", "phone"], 7)
    lang_idx = find_idx(["lang", "language"], 8)
    sal_idx = find_idx(["salutation", "address", "title"], 9)

    # Existing roll numbers in university DB for duplicate check
    existing_rolls = set(
        r[0] for r in db.query(Student.roll_number).filter(Student.university_id == university_id).all()
    )

    seen_rolls_in_file = set()
    preview_rows = []
    valid_count = 0
    invalid_count = 0
    duplicate_count = 0

    for i, row in enumerate(data_rows, start=2):
        def get_val(idx: int) -> str:
            return row[idx].strip() if idx < len(row) else ""

        name = get_val(name_idx)
        roll = get_val(roll_idx)
        dept = get_val(dept_idx) or "General"
        year_str = get_val(year_idx) or "1"
        sem_str = get_val(sem_idx) or "1"
        sec = get_val(sec_idx) or "A"
        p_name = get_val(p_name_idx)
        p_phone = get_val(p_phone_idx)
        lang_raw = get_val(lang_idx) or "en"
        sal_raw = get_val(sal_idx) or "Mr."

        # Parse integers safely
        try:
            year = int(float(year_str))
        except ValueError:
            year = 1

        try:
            sem = int(float(sem_str))
        except ValueError:
            sem = 1

        errors = []
        is_duplicate = False

        if not name:
            errors.append("Student Name is required.")
        if not roll:
            errors.append("Roll Number is required.")
        elif roll in seen_rolls_in_file:
            errors.append(f"Duplicate Roll Number '{roll}' found multiple times in this file.")
            is_duplicate = True
        elif roll in existing_rolls:
            errors.append(f"Roll Number '{roll}' already exists in your university database.")
            is_duplicate = True

        if roll:
            seen_rolls_in_file.add(roll)

        if not p_name:
            errors.append("Parent/Guardian Name is required.")
        if not p_phone:
            errors.append("Parent Phone Number is required.")
        elif len(p_phone.replace(" ", "").replace("-", "")) < 8:
            errors.append("Invalid phone number format.")

        lang_code = normalize_language(lang_raw)
        salutation = normalize_salutation(sal_raw)

        is_valid = len(errors) == 0

        if is_valid:
            valid_count += 1
        else:
            invalid_count += 1
            if is_duplicate:
                duplicate_count += 1

        preview_rows.append(
            BulkPreviewRow(
                row_number=i,
                name=name,
                roll_number=roll,
                department=dept,
                year=year,
                semester=sem,
                section=sec.upper(),
                parent_name=p_name,
                parent_phone=p_phone,
                preferred_language=lang_code,
                preferred_form_of_address=salutation,
                is_valid=is_valid,
                is_duplicate=is_duplicate,
                errors=errors,
            )
        )

    return BulkPreviewResponse(
        total_records=len(preview_rows),
        valid_count=valid_count,
        invalid_count=invalid_count,
        duplicate_count=duplicate_count,
        records=preview_rows,
    )


# ========================================================
# 7. BULK IMPORT TO DATABASE
# ========================================================
@router.post("/bulk-import", response_model=BulkImportResponse)
def import_students_batch(
    payload: BulkImportRequest,
    user: dict = Depends(get_current_tenant_user),
    db: Session = Depends(get_db),
):
    """
    Import confirmed valid student records into university database with tenant isolation.
    Skips any duplicate roll numbers discovered during insertion.
    """
    university_id = user.get("university_id", "UNI-2026-0001")
    imported = 0
    skipped = 0

    existing_rolls = set(
        r[0] for r in db.query(Student.roll_number).filter(Student.university_id == university_id).all()
    )

    for item in payload.records:
        roll = item.roll_number.strip()
        if roll in existing_rolls:
            skipped += 1
            continue

        student_id = f"stu-{uuid.uuid4().hex[:10]}"
        student = Student(
            id=student_id,
            university_id=university_id,
            name=item.name.strip(),
            roll_number=roll,
            department=item.department.strip(),
            year=item.year,
            semester=item.semester,
            section=item.section.strip().upper(),
            parent_name=item.parent_name.strip(),
            parent_phone=item.parent_phone.strip(),
            preferred_language=normalize_language(item.preferred_language),
            preferred_form_of_address=normalize_salutation(item.preferred_form_of_address),
            consent_given=getattr(item, "consent_given", False) or False,
            phone_verified=getattr(item, "phone_verified", False) or False,
            attendance_percentage=100.0,
            status="active",
        )
        db.add(student)
        existing_rolls.add(roll)
        imported += 1

    db.commit()

    return BulkImportResponse(
        status="success",
        imported_count=imported,
        skipped_count=skipped,
        message=f"Successfully imported {imported} student records into your university database. {skipped} duplicates skipped.",
    )


# ========================================================
# 8. UPDATE CONSENT & VERIFY PHONE STATUS
# ========================================================
class ConsentUpdateRequest(BaseModel):
    consent_given: bool


@router.put("/{student_id}/consent")
def update_student_consent(
    student_id: str,
    payload: ConsentUpdateRequest,
    user: dict = Depends(get_current_tenant_user),
    db: Session = Depends(get_db),
):
    """Explicitly record or revoke automated parental calling consent."""
    univ_id = user.get("university_id") or user.get("college_id") or "UNI-2026-0001"
    student = db.query(Student).filter(Student.id == student_id, Student.university_id == univ_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found.")

    student.consent_given = payload.consent_given
    db.commit()
    return {"message": "Parental consent status updated successfully.", "student_id": student.id, "consent_given": student.consent_given}


@router.put("/{student_id}/verify-phone")
def verify_student_parent_phone(
    student_id: str,
    user: dict = Depends(get_current_tenant_user),
    db: Session = Depends(get_db),
):
    """Mark registered parent phone number as verified."""
    univ_id = user.get("university_id") or user.get("college_id") or "UNI-2026-0001"
    student = db.query(Student).filter(Student.id == student_id, Student.university_id == univ_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found.")

    student.phone_verified = True
    db.commit()
    return {"message": "Parent phone verified.", "student_id": student.id, "phone_verified": True}

