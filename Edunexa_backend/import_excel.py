import sqlite3
import pandas as pd
import json
from pathlib import Path
import sys


# ============================================================
# EduNexa Excel -> SQLite Importer
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

EXCEL_FILE = BASE_DIR / "Sample_dataset.xlsx"
DB_FILE = BASE_DIR / "data" / "edunexa.db"


# ------------------------------------------------------------
# Helper functions
# ------------------------------------------------------------

def clean(value):
    """Convert pandas NaN/empty values to None."""
    if pd.isna(value):
        return None
    return value


def text(value, default=""):
    value = clean(value)
    if value is None:
        return default
    return str(value).strip()


def number(value, default=0):
    value = clean(value)
    if value is None or value == "":
        return default

    try:
        return float(value)
    except (ValueError, TypeError):
        return default


def integer(value, default=0):
    value = clean(value)

    if value is None or value == "":
        return default

    try:
        return int(float(value))
    except (ValueError, TypeError):
        return default


def yes_no(value):
    value = text(value).lower()
    return 1 if value in ("yes", "y", "true", "1") else 0


def normalize_status(value, default="pending"):
    value = text(value, default).lower()

    mapping = {
        "pending": "pending",
        "approved": "approved",
        "approve": "approved",
        "rejected": "declined",
        "reject": "declined",
        "declined": "declined",
        "viewed": "open",
        "open": "open",
        "pass": "passed",
        "passed": "passed",
        "active": "active",
        "placed": "placed",
    }

    return mapping.get(value, value)


# ------------------------------------------------------------
# Check files
# ------------------------------------------------------------

def check_files():

    print("=" * 70)
    print("EduNexa Excel -> SQLite Import")
    print("=" * 70)

    print("\nExcel:")
    print(EXCEL_FILE)

    print("\nDatabase:")
    print(DB_FILE)

    if not EXCEL_FILE.exists():
        print("\nERROR: Sample_dataset.xlsx not found!")
        print("\nPut Sample_dataset.xlsx inside:")
        print(BASE_DIR)
        sys.exit(1)

    if not DB_FILE.exists():
        print("\nERROR: edunexa.db not found!")
        print("\nExpected:")
        print(DB_FILE)
        sys.exit(1)

    print("\nFiles found successfully.")


# ------------------------------------------------------------
# Load Excel
# ------------------------------------------------------------

def load_excel():

    excel = pd.ExcelFile(EXCEL_FILE)

    print("\nExcel sheets found:")

    for sheet in excel.sheet_names:
        df = pd.read_excel(EXCEL_FILE, sheet_name=sheet)
        print(f"  {sheet}: {len(df)} rows")

    return excel


# ------------------------------------------------------------
# USERS
# ------------------------------------------------------------

def import_students(db):

    print("\n[1/11] Importing Students...")

    df = pd.read_excel(EXCEL_FILE, sheet_name="Students")

    student_users = {}

    for _, r in df.iterrows():

        reg_no = text(r["Reg No"])
        name = text(r["Name"])
        email = text(r["Email"]).lower()

        if not email:
            email = f"{reg_no.lower()}@edunexa.local"

        department = text(r["Department"], "Data Analytics")
        batch = "2025-2028"

        phone = text(r["Phone"])
        parent_name = text(r["Parent Name"])
        parent_phone = text(r["Parent Phone"])

        # Existing student?
        existing = db.execute(
            "SELECT id FROM users WHERE email=? COLLATE NOCASE",
            (email,)
        ).fetchone()

        if existing:

            user_id = existing[0]

            db.execute(
                """
                UPDATE users
                SET
                    name=?,
                    student_id=?,
                    department=?,
                    batch=?,
                    phone=?,
                    parent_name=?,
                    parent_phone=?,
                    attendance=?,
                    is_active=?
                WHERE id=?
                """,
                (
                    name,
                    reg_no,
                    department,
                    batch,
                    phone,
                    parent_name,
                    parent_phone,
                    number(r["Attendance %"]),
                    1 if text(r["Status"]).lower() == "active" else 0,
                    user_id,
                )
            )

        else:

            db.execute(
                """
                INSERT INTO users
                (
                    name,
                    email,
                    password_hash,
                    role,
                    student_id,
                    department,
                    batch,
                    phone,
                    parent_name,
                    parent_phone,
                    attendance,
                    is_active
                )
                VALUES
                (
                    ?,?,
                    ?,
                    'student',
                    ?,?,?,?,?,?,?,?
                )
                """,
                (
                    name,
                    email,
                    "$2b$12$LQv3c1yqBW9Vj8cZ7yX7eu"
                    "5f6FQ4v7d1X0eK0mV4n4a",
                    reg_no,
                    department,
                    batch,
                    phone,
                    parent_name,
                    parent_phone,
                    number(r["Attendance %"]),
                    1 if text(r["Status"]).lower() == "active" else 0,
                )
            )

            user_id = db.execute(
                "SELECT id FROM users WHERE email=? COLLATE NOCASE",
                (email,)
            ).fetchone()[0]

        student_users[reg_no] = user_id

        # Student profile
        db.execute(
            "INSERT OR IGNORE INTO student_profiles(user_id) VALUES(?)",
            (user_id,)
        )

        db.execute(
            """
            UPDATE student_profiles
            SET
                age=?,
                sex=?,
                region=?,
                address=?,
                parent_name=?,
                parent_phone=?,
                blood_group=?,
                tenth_mark=?,
                twelfth_mark=?,
                additional_details=?
            WHERE user_id=?
            """,
            (
                integer(r["Age"]),
                text(r["Gender"]),
                text(r["City"]),
                text(r["Address"]),
                parent_name,
                parent_phone,
                text(r["Blood Group"]),
                number(r["10th %"]),
                number(r["12th %"]),
                f"Class: {text(r['Class'])}, "
                f"Section: {text(r['Section'])}, "
                f"Hostel: {text(r['Hostel'])}, "
                f"Bus: {text(r['Bus'])}",
                user_id,
            )
        )

    print(f"   Students imported: {len(student_users)}")

    return student_users


# ------------------------------------------------------------
# FACULTY
# ------------------------------------------------------------

def import_faculty(db):

    print("\n[2/11] Importing Faculty...")

    df = pd.read_excel(EXCEL_FILE, sheet_name="Faculty")

    faculty_users = {}

    for _, r in df.iterrows():

        faculty_id = text(r["Faculty ID"])
        name = text(r["Name"])
        email = text(r["Email"]).lower()

        department = text(r["Department"])
        designation = text(r["Designation"])
        phone = text(r["Phone"])

        is_hod = designation.upper() == "HOD"

        role = "hod" if is_hod else "faculty"

        existing = db.execute(
            "SELECT id FROM users WHERE email=? COLLATE NOCASE",
            (email,)
        ).fetchone()

        if existing:

            user_id = existing[0]

            db.execute(
                """
                UPDATE users
                SET
                    name=?,
                    faculty_id=?,
                    hod_id=?,
                    department=?,
                    designation=?,
                    phone=?,
                    qualification=?,
                    experience=?,
                    specialization=?,
                    office=?
                WHERE id=?
                """,
                (
                    name,
                    faculty_id,
                    faculty_id if is_hod else None,
                    department,
                    designation,
                    phone,
                    text(r["Qualification"]),
                    text(r["Experience (Years)"]),
                    text(r["Subject Position"]),
                    text(r["Class Adviser"]),
                    user_id,
                )
            )

        else:

            db.execute(
                """
                INSERT INTO users
                (
                    name,
                    email,
                    password_hash,
                    role,
                    faculty_id,
                    hod_id,
                    department,
                    designation,
                    phone,
                    qualification,
                    experience,
                    specialization,
                    office
                )
                VALUES
                (
                    ?,?,
                    ?,
                    ?,?,?,?,?,?,?,?,?,?
                )
                """,
                (
                    name,
                    email,
                    "$2b$12$LQv3c1yqBW9Vj8cZ7yX7eu"
                    "5f6FQ4v7d1X0eK0mV4n4a",
                    role,
                    faculty_id,
                    faculty_id if is_hod else None,
                    department,
                    designation,
                    phone,
                    text(r["Qualification"]),
                    text(r["Experience (Years)"]),
                    text(r["Subject Position"]),
                    text(r["Class Adviser"]),
                )
            )

            user_id = db.execute(
                "SELECT id FROM users WHERE email=? COLLATE NOCASE",
                (email,)
            ).fetchone()[0]

        faculty_users[faculty_id] = user_id

        db.execute(
            "INSERT OR IGNORE INTO faculty_profiles(user_id) VALUES(?)",
            (user_id,)
        )

        classes = [
            x.strip()
            for x in text(r["Classes Faced"]).split(",")
            if x.strip()
        ]

        subjects = [
            x.strip()
            for x in [
                text(r["Subject 1"]),
                text(r["Subject 2"])
            ]
            if x
        ]

        db.execute(
            """
            UPDATE faculty_profiles
            SET
                classes_handled=?,
                subjects_handled=?,
                is_class_adviser=?,
                extra_info=?
            WHERE user_id=?
            """,
            (
                json.dumps(classes),
                json.dumps(subjects),
                1 if text(r["Class Adviser"]) else 0,
                text(r["Extra Info"]),
                user_id,
            )
        )

    print(f"   Faculty imported: {len(faculty_users)}")

    return faculty_users


# ------------------------------------------------------------
# MANAGEMENT
# ------------------------------------------------------------

def import_management(db):

    print("\n[3/11] Importing Management...")

    df = pd.read_excel(EXCEL_FILE, sheet_name="Management")

    count = 0

    for _, r in df.iterrows():

        name = text(r["Name"])
        email = text(r["Email"]).lower()
        management_id = text(r["Management ID"])

        existing = db.execute(
            "SELECT id FROM users WHERE email=? COLLATE NOCASE",
            (email,)
        ).fetchone()

        if existing:

            db.execute(
                """
                UPDATE users
                SET
                    name=?,
                    designation=?,
                    phone=?,
                    department=?
                WHERE id=?
                """,
                (
                    name,
                    text(r["Role"]),
                    text(r["Phone"]),
                    text(r["Department"]),
                    existing[0],
                )
            )

        else:

            db.execute(
                """
                INSERT INTO users
                (
                    name,email,password_hash,role,
                    department,designation,phone
                )
                VALUES(?,?,?,?,?,?,?)
                """,
                (
                    name,
                    email,
                    "$2b$12$LQv3c1yqBW9Vj8cZ7yX7eu"
                    "5f6FQ4v7d1X0eK0mV4n4a",
                    "management",
                    text(r["Department"]),
                    text(r["Role"]),
                    text(r["Phone"]),
                )
            )

        count += 1

    print(f"   Management imported: {count}")


# ------------------------------------------------------------
# DEPARTMENTS + CLASSES
# ------------------------------------------------------------

def import_departments(db):

    print("\n[4/11] Importing Departments and Classes...")

    df = pd.read_excel(EXCEL_FILE, sheet_name="Departments")

    count = 0

    for _, r in df.iterrows():

        department = text(r["Department"])

        db.execute(
            """
            INSERT OR IGNORE INTO departments
            (name, description)
            VALUES(?,?)
            """,
            (
                department,
                f"Department of {department}",
            )
        )

        count += 1

    # Create classes from Students sheet
    students = pd.read_excel(EXCEL_FILE, sheet_name="Students")

    for _, r in students.iterrows():

        department = text(r["Department"])
        class_name = text(r["Class"])
        section = text(r["Section"])

        dept = db.execute(
            "SELECT id FROM departments WHERE name=?",
            (department,)
        ).fetchone()

        if not dept:
            continue

        department_id = dept[0]

        db.execute(
            """
            INSERT OR IGNORE INTO classes
            (
                department_id,
                name,
                batch,
                semester,
                section
            )
            VALUES(?,?,?,?,?)
            """,
            (
                department_id,
                class_name,
                "2025-2028",
                "III",
                section,
            )
        )

    print(f"   Departments imported: {count}")


# ------------------------------------------------------------
# MARKS
# ------------------------------------------------------------

def import_marks(db, student_users, faculty_users):

    print("\n[5/11] Importing Marks...")

    df = pd.read_excel(EXCEL_FILE, sheet_name="Marks")

    count = 0

    for _, r in df.iterrows():

        reg_no = text(r["Reg No"])

        student_id = student_users.get(reg_no)

        if not student_id:
            continue

        total = number(r["Total"])

        max_mark = 100

        # Use HOD/faculty user as entered_by
        entered_by = None

        faculty = db.execute(
            """
            SELECT id FROM users
            WHERE role IN ('faculty','hod')
            AND department=?
            LIMIT 1
            """,
            (text(r["Department"]),)
        ).fetchone()

        if faculty:
            entered_by = faculty[0]

        db.execute(
            """
            INSERT INTO marks
            (
                student_id,
                subject,
                exam,
                mark,
                max_mark,
                entered_by
            )
            VALUES(?,?,?,?,?,?)
            ON CONFLICT(student_id,subject,exam)
            DO UPDATE SET
                mark=excluded.mark,
                max_mark=excluded.max_mark,
                entered_by=excluded.entered_by,
                updated_at=CURRENT_TIMESTAMP
            """,
            (
                student_id,
                text(r["Subject"]),
                f"Semester {text(r['Semester'])}",
                total,
                max_mark,
                entered_by,
            )
        )

        count += 1

    print(f"   Marks imported: {count}")


# ------------------------------------------------------------
# FEES
# ------------------------------------------------------------

def import_fees(db, student_users):

    print("\n[6/11] Importing Fees...")

    df = pd.read_excel(EXCEL_FILE, sheet_name="Fees")

    count = 0

    for _, r in df.iterrows():

        reg_no = text(r["Reg No"])

        student_id = student_users.get(reg_no)

        if not student_id:
            continue

        db.execute(
            """
            INSERT INTO fees
            (
                student_id,
                tuition_total,
                tuition_paid,
                bus_total,
                bus_paid,
                hostel_total,
                hostel_paid,
                placement_total,
                placement_paid
            )
            VALUES(?,?,?,?,?,?,?,?,?)
            ON CONFLICT(student_id)
            DO UPDATE SET
                tuition_total=excluded.tuition_total,
                tuition_paid=excluded.tuition_paid,
                bus_total=excluded.bus_total,
                bus_paid=excluded.bus_paid,
                hostel_total=excluded.hostel_total,
                hostel_paid=excluded.hostel_paid,
                placement_total=excluded.placement_total,
                placement_paid=excluded.placement_paid,
                updated_at=CURRENT_TIMESTAMP
            """,
            (
                student_id,
                number(r["Tuition Total"]),
                number(r["Tuition Paid"]),
                number(r["Bus Total"]),
                number(r["Bus Paid"]),
                number(r["Hostel Total"]),
                number(r["Hostel Paid"]),
                number(r["Placement Total"]),
                number(r["Placement Paid"]),
            )
        )

        count += 1

    print(f"   Fee records imported: {count}")


# ------------------------------------------------------------
# PLACEMENTS
# ------------------------------------------------------------

def import_placements(db, student_users):

    print("\n[7/11] Importing Placements...")

    df = pd.read_excel(EXCEL_FILE, sheet_name="Placements")

    count = 0

    for _, r in df.iterrows():

        company_name = text(r["Company"])

        visited = 1 if text(r["Visit Status"]).lower() == "visited" else 0

        existing_company = db.execute(
            """
            SELECT id
            FROM placement_companies
            WHERE company_name=?
            """,
            (company_name,)
        ).fetchone()

        if existing_company:

            company_id = existing_company[0]

        else:

            db.execute(
                """
                INSERT INTO placement_companies
                (
                    company_name,
                    location,
                    visited,
                    package_max
                )
                VALUES(?,?,?,?)
                """,
                (
                    company_name,
                    text(r["Location"]),
                    visited,
                    number(r["Package (LPA)"]),
                )
            )

            company_id = db.execute(
                """
                SELECT id
                FROM placement_companies
                WHERE company_name=?
                """,
                (company_name,)
            ).fetchone()[0]

        student_id = student_users.get(text(r["Reg No"]))

        if student_id:

            db.execute(
                """
                DELETE FROM placements
                WHERE company_id=? AND student_id=?
                """,
                (
                    company_id,
                    student_id,
                )
            )

            db.execute(
                """
                INSERT INTO placements
                (
                    company_id,
                    student_id,
                    package,
                    offer_status
                )
                VALUES(?,?,?,?)
                """,
                (
                    company_id,
                    student_id,
                    number(r["Package (LPA)"]),
                    text(r["Placement Status"], "placed").lower(),
                )
            )

        count += 1

    print(f"   Placement records imported: {count}")


# ------------------------------------------------------------
# TIMETABLE
# ------------------------------------------------------------

def import_timetable(db):

    print("\n[8/11] Importing Class Timetable...")

    df = pd.read_excel(EXCEL_FILE, sheet_name="Timetable")

    count = 0

    for _, r in df.iterrows():

        time_value = text(r["Time"])

        start_time = None
        end_time = None

        if "-" in time_value:

            parts = time_value.split("-", 1)

            start_time = parts[0].strip()
            end_time = parts[1].strip()

        db.execute(
            """
            INSERT INTO class_timetables
            (
                class_name,
                day,
                period,
                start_time,
                end_time,
                subject,
                faculty_name,
                room
            )
            VALUES(?,?,?,?,?,?,?,?)
            ON CONFLICT(class_name,day,period)
            DO UPDATE SET
                start_time=excluded.start_time,
                end_time=excluded.end_time,
                subject=excluded.subject,
                faculty_name=excluded.faculty_name,
                room=excluded.room
            """,
            (
                text(r["Class"]),
                text(r["Day"]),
                text(r["Period"]),
                start_time,
                end_time,
                text(r["Subject"]),
                text(r["Faculty"]),
                text(r["Room"]),
            )
        )

        count += 1

    print(f"   Timetable records imported: {count}")


# ------------------------------------------------------------
# LEAVE REQUESTS
# ------------------------------------------------------------

def import_leaves(db, student_users):

    print("\n[9/11] Importing Leave Requests...")

    df = pd.read_excel(EXCEL_FILE, sheet_name="Leave Requests")

    count = 0

    for _, r in df.iterrows():

        student_id = student_users.get(text(r["Reg No"]))

        if not student_id:
            continue

        leave_type = text(r["Leave Type"])

        hours = number(r["Hours"], 6)

        date_value = text(r["Date"])

        db.execute(
            """
            INSERT INTO leaves
            (
                student_id,
                leave_type,
                from_date,
                to_date,
                hours,
                reason,
                status
            )
            VALUES(?,?,?,?,?,?,?)
            """,
            (
                student_id,
                leave_type,
                date_value,
                date_value,
                hours,
                text(r["Reason"]),
                normalize_status(r["Status"]),
            )
        )

        count += 1

    print(f"   Leave requests imported: {count}")


# ------------------------------------------------------------
# FEEDBACK
# ------------------------------------------------------------

def import_feedback(db, student_users):

    print("\n[10/11] Importing Feedback...")

    df = pd.read_excel(EXCEL_FILE, sheet_name="Feedback")

    count = 0

    for _, r in df.iterrows():

        student_id = student_users.get(text(r["Reg No"]))

        if not student_id:
            continue

        category = text(r["Type"])

        if category.lower() == "subject":
            category = "subject"
        else:
            category = "general"

        recipient = text(
            r["Sent To"],
            "class_adviser"
        )

        db.execute(
            """
            INSERT INTO feedbacks
            (
                student_id,
                category,
                subject,
                rating,
                message,
                recipient,
                status
            )
            VALUES(?,?,?,?,?,?,?)
            """,
            (
                student_id,
                category,
                text(r["Subject"]),
                number(r["Rating"]),
                text(r["Feedback"]),
                recipient,
                "open"
                if text(r["Status"]).lower() != "viewed"
                else "viewed",
            )
        )

        count += 1

    print(f"   Feedback records imported: {count}")


# ------------------------------------------------------------
# ACHIEVEMENTS
# ------------------------------------------------------------

def import_achievements(db):

    print("\n[11/11] Importing Achievements...")

    df = pd.read_excel(EXCEL_FILE, sheet_name="Achievements")

    count = 0

    for _, r in df.iterrows():

        year = text(r["Year"])

        db.execute(
            """
            INSERT INTO achievements
            (
                department,
                title,
                description,
                achievement_date
            )
            VALUES(?,?,?,?)
            """,
            (
                text(r["Department"]),
                text(r["Achievement"]),
                (
                    f"Category: {text(r['Category'])}; "
                    f"For: {text(r['For'])}; "
                    f"{text(r['Description'])}"
                ),
                f"{year}-01-01"
                if year
                else None,
            )
        )

        count += 1

    print(f"   Achievements imported: {count}")


# ------------------------------------------------------------
# DATABASE SUMMARY
# ------------------------------------------------------------

def show_summary(db):

    print("\n" + "=" * 70)
    print("DATABASE IMPORT SUMMARY")
    print("=" * 70)

    tables = [
        "users",
        "student_profiles",
        "faculty_profiles",
        "departments",
        "classes",
        "marks",
        "fees",
        "placement_companies",
        "placements",
        "class_timetables",
        "leaves",
        "feedbacks",
        "achievements",
    ]

    for table in tables:

        try:
            count = db.execute(
                f"SELECT COUNT(*) FROM {table}"
            ).fetchone()[0]

            print(f"{table:<25} : {count}")

        except sqlite3.Error:
            pass

    print("=" * 70)


# ------------------------------------------------------------
# MAIN
# ------------------------------------------------------------

def main():

    check_files()

    load_excel()

    print("\nConnecting to SQLite...")

    db = sqlite3.connect(DB_FILE)

    db.execute("PRAGMA foreign_keys=ON")

    try:

        student_users = import_students(db)

        faculty_users = import_faculty(db)

        import_management(db)

        import_departments(db)

        import_marks(
            db,
            student_users,
            faculty_users
        )

        import_fees(
            db,
            student_users
        )

        import_placements(
            db,
            student_users
        )

        import_timetable(db)

        import_leaves(
            db,
            student_users
        )

        import_feedback(
            db,
            student_users
        )

        import_achievements(db)

        db.commit()

        show_summary(db)

        print("\nSUCCESS!")
        print("Excel data has been imported into SQLite.")
        print("\nDatabase:")
        print(DB_FILE)

    except Exception as e:

        db.rollback()

        print("\nIMPORT FAILED!")
        print("Error:", e)

        raise

    finally:

        db.close()


if __name__ == "__main__":
    main()