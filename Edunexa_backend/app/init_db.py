from pathlib import Path
import sqlite3, json

from .config import DB_PATH, UPLOAD_DIR
from .security import hash_password

SCHEMA = Path(__file__).with_name("schema.sql").read_text(encoding="utf-8")
ACCOUNTS_FILE = DB_PATH.parent / "login_accounts.json"

# The PDF supplied with this project defines 77 accounts:
# 50 students + 20 faculty + 5 HODs + 2 management admins.
LEGACY_MAP = {
    "alexa@example.com": "arun.kumar@stu.com",
    "faculty@edunexa.com": "dr.priya@fac.com",
    "hod@edunexa.com": "dr.anand.kumar@hod.com",
    "admin@edunexa.com": "dr.ravi.chandran@admin.com",
}

def ensure_column(c, table, column, definition):
    cols = {r[1] for r in c.execute(f"PRAGMA table_info({table})").fetchall()}
    if column not in cols:
        c.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")

def migrate(c):
    ensure_column(c, "classes", "section", "TEXT")
    ensure_column(c, "classes", "class_adviser_id", "INTEGER")
    ensure_column(c, "feedbacks", "response", "TEXT")
    ensure_column(c, "feedbacks", "responded_by", "INTEGER")
    ensure_column(c, "feedbacks", "responded_at", "TEXT")

def load_accounts():
    if not ACCOUNTS_FILE.exists():
        raise FileNotFoundError(f"Missing login account seed file: {ACCOUNTS_FILE}")
    accounts = json.loads(ACCOUNTS_FILE.read_text(encoding="utf-8"))
    if len(accounts) != 77:
        raise RuntimeError(f"Expected 77 login accounts, found {len(accounts)}")
    return accounts

def upsert_accounts(c, accounts):
    # Upgrade the four old demo users in-place so existing sample records
    # continue to point at the same database rows.
    for old_email, new_email in LEGACY_MAP.items():
        old = c.execute("SELECT id FROM users WHERE email=?", (old_email,)).fetchone()
        new = c.execute("SELECT id FROM users WHERE email=?", (new_email,)).fetchone()
        if old and not new:
            c.execute("UPDATE users SET email=? WHERE id=?", (new_email, old[0]))

    for a in accounts:
        existing = c.execute("SELECT id FROM users WHERE email=?", (a["email"],)).fetchone()
        password_hash = hash_password(a["password"])
        if existing:
            c.execute("""UPDATE users SET
                name=?, password_hash=?, role=?, student_id=?, faculty_id=?, hod_id=?,
                department=?, batch=?, is_active=1
                WHERE id=?""",
                (a["name"], password_hash, a["role"], a.get("student_id"),
                 a.get("faculty_id"), a.get("hod_id"), a["department"],
                 a.get("batch"), existing[0]))
            uid = existing[0]
        else:
            cur = c.execute("""INSERT INTO users
                (name,email,password_hash,role,student_id,faculty_id,hod_id,
                 department,batch,designation,is_active)
                VALUES(?,?,?,?,?,?,?,?,?,?,1)""",
                (a["name"], a["email"], password_hash, a["role"],
                 a.get("student_id"), a.get("faculty_id"), a.get("hod_id"),
                 a["department"], a.get("batch"),
                 {"student":"Student","faculty":"Faculty",
                  "hod":"Head of Department","management":"Management Administrator"}[a["role"]]))
            uid = cur.lastrowid

        if a["role"] == "student":
            c.execute("INSERT OR IGNORE INTO student_profiles(user_id) VALUES(?)", (uid,))
        elif a["role"] == "faculty":
            c.execute("INSERT OR IGNORE INTO faculty_profiles(user_id) VALUES(?)", (uid,))

def seed_departments(c):
    academic = ["Data Analytics", "Computer Science", "Commerce",
                "Artificial Intelligence", "Information Technology"]
    for dept in academic:
        hod = c.execute(
            "SELECT id FROM users WHERE role='hod' AND department=? ORDER BY id LIMIT 1",
            (dept,)).fetchone()
        c.execute("""INSERT INTO departments(name,hod_user_id,description)
                     VALUES(?,?,?)
                     ON CONFLICT(name) DO UPDATE SET
                       hod_user_id=excluded.hod_user_id""",
                  (dept, hod[0] if hod else None, f"Department of {dept}"))

def seed_demo_data(c):
    # Keep the original useful demo data, but attach it to Arun / Dr. Priya /
    # Dr. Anand so it remains usable after replacing the four old demo accounts.
    st = c.execute("SELECT id FROM users WHERE email='arun.kumar@stu.com'").fetchone()[0]
    fc = c.execute("SELECT id FROM users WHERE email='dr.priya@fac.com'").fetchone()[0]
    hd = c.execute("SELECT id FROM users WHERE email='dr.anand.kumar@hod.com'").fetchone()[0]

    c.execute("""INSERT OR IGNORE INTO faculty_profiles
        (user_id,classes_handled,subjects_handled,is_class_adviser,extra_info)
        VALUES(?,?,?,?,?)""",
        (fc, json.dumps(["II B.Sc Data Analytics","I B.Sc Data Analytics"]),
         json.dumps(["Python","Data Analytics","SQL","Power BI"]), 1,
         "Class Adviser and academic coordinator"))

    dept = c.execute("SELECT id FROM departments WHERE name='Data Analytics'").fetchone()[0]
    c.execute("""INSERT OR IGNORE INTO classes
        (department_id,name,batch,semester,section,class_adviser_id)
        VALUES(?,?,?,?,?,?)""",
        (dept, "II B.Sc Data Analytics", "2025-2028", "III", "A", fc))

    for sub, ex, mark in [
        ("Python","Internal 1",86), ("SQL","Internal 1",82),
        ("Power BI","Internal 1",91), ("Data Analytics","Internal 1",88)
    ]:
        c.execute("""INSERT OR IGNORE INTO marks
            (student_id,subject,exam,mark,entered_by)
            VALUES(?,?,?,?,?)""", (st,sub,ex,mark,fc))

    c.execute("""INSERT OR IGNORE INTO fees
        (student_id,tuition_total,tuition_paid,bus_total,bus_paid,
         hostel_total,hostel_paid,placement_total,placement_paid)
        VALUES(?,?,?,?,?,?,?,?,?)""",
        (st,75000,50000,15000,10000,0,0,5000,2500))

    c.execute("""INSERT OR IGNORE INTO achievements
        (department,title,description,achievement_date,metric,created_by)
        VALUES(?,?,?,?,?,?)""",
        ("Data Analytics","Department Achievement",
         "Sample achievement for HOD dashboard","2026-08-20",92,hd))

    c.execute("""INSERT OR IGNORE INTO fee_structures
        (department,class_name,tuition,bus,hostel,placement)
        VALUES(?,?,?,?,?,?)""",
        ("Data Analytics","II B.Sc Data Analytics",75000,15000,0,5000))

def seed():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    c = sqlite3.connect(DB_PATH)
    c.row_factory = sqlite3.Row
    c.execute("PRAGMA foreign_keys=ON")
    c.executescript(SCHEMA)
    migrate(c)

    accounts = load_accounts()
    upsert_accounts(c, accounts)
    seed_departments(c)
    seed_demo_data(c)

    count = c.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    if count != 77:
        raise RuntimeError(f"Database account count is {count}; expected exactly 77")
    c.commit()
    c.close()

if __name__ == "__main__":
    seed()
    print("EduNexa initialized: 77 login accounts available.")
