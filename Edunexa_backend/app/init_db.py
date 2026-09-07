from pathlib import Path
import sqlite3, json
from .config import DB_PATH, UPLOAD_DIR
from .security import hash_password

SCHEMA = Path(__file__).with_name("schema.sql").read_text(encoding="utf-8")

DEMO_USERS = [
    ("Alexa","alexa@example.com","student","EDU2026-1048",None,None,"Data Analytics","2025-2028","Student","+91 90000 00001"),
    ("Dr. Priya","faculty@edunexa.com","faculty",None,"FAC-1001",None,"Data Analytics",None,"Assistant Professor","+91 90000 10001"),
    ("Dr. HOD Admin","hod@edunexa.com","hod",None,None,"HOD-1001","Data Analytics",None,"Head of Department","+91 90000 20001"),
    ("Management Admin","admin@edunexa.com","management",None,None,None,"Management",None,"Management Administrator","+91 90000 30001"),
]

def ensure_column(c, table, column, definition):
    cols={r[1] for r in c.execute(f"PRAGMA table_info({table})").fetchall()}
    if column not in cols:
        c.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")

def migrate(c):
    # Safe upgrades for databases created by earlier EduNexa V12 builds.
    ensure_column(c,"classes","section","TEXT")
    ensure_column(c,"classes","class_adviser_id","INTEGER")
    ensure_column(c,"feedbacks","response","TEXT")
    ensure_column(c,"feedbacks","responded_by","INTEGER")
    ensure_column(c,"feedbacks","responded_at","TEXT")

def seed():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    c=sqlite3.connect(DB_PATH)
    c.row_factory=sqlite3.Row
    c.execute("PRAGMA foreign_keys=ON")
    c.executescript(SCHEMA)
    migrate(c)

    if c.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0:
        for n,e,r,s,f,h,d,b,des,p in DEMO_USERS:
            c.execute("""INSERT INTO users
                (name,email,password_hash,role,student_id,faculty_id,hod_id,
                 department,batch,designation,phone)
                VALUES(?,?,?,?,?,?,?,?,?,?,?)""",
                (n,e,hash_password("123456"),r,s,f,h,d,b,des,p))

        st=c.execute("SELECT id FROM users WHERE email='alexa@example.com'").fetchone()[0]
        fc=c.execute("SELECT id FROM users WHERE email='faculty@edunexa.com'").fetchone()[0]
        hd=c.execute("SELECT id FROM users WHERE email='hod@edunexa.com'").fetchone()[0]

        c.execute("""INSERT INTO student_profiles
            (user_id,age,sex,region,address,parent_name,parent_phone,blood_group,
             school_name,tenth_mark,twelfth_mark,additional_details)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?)""",
            (st,20,"Female","Tamil Nadu","Sample Address","Alexa Parent",
             "+91 90000 00001","O+","Sample Higher Secondary School",91,89,
             "Sample student profile"))

        c.execute("""INSERT INTO faculty_profiles
            (user_id,classes_handled,subjects_handled,is_class_adviser,extra_info)
            VALUES(?,?,?,?,?)""",
            (fc,json.dumps(["II B.Sc Data Analytics","I B.Sc Data Analytics"]),
             json.dumps(["Python","Data Analytics","SQL","Power BI"]),1,
             "Class Adviser and academic coordinator"))

        c.execute("""INSERT INTO departments(name,hod_user_id,description)
                     VALUES(?,?,?)""",
                  ("Data Analytics",hd,"Department of Data Analytics"))
        dept=c.execute("SELECT id FROM departments WHERE name='Data Analytics'").fetchone()[0]

        c.execute("""INSERT INTO classes(department_id,name,batch,semester,section,class_adviser_id)
                     VALUES(?,?,?,?,?,?)""",
                  (dept,"II B.Sc Data Analytics","2025-2028","III","A",fc))

        for sub,ex,m in [
            ("Python","Internal 1",86),("SQL","Internal 1",82),
            ("Power BI","Internal 1",91),("Data Analytics","Internal 1",88)
        ]:
            c.execute("""INSERT INTO marks(student_id,subject,exam,mark,entered_by)
                         VALUES(?,?,?,?,?)""",(st,sub,ex,m,fc))

        c.execute("""INSERT INTO fees
            (student_id,tuition_total,tuition_paid,bus_total,bus_paid,
             hostel_total,hostel_paid,placement_total,placement_paid)
            VALUES(?,?,?,?,?,?,?,?,?)""",
            (st,75000,50000,15000,10000,0,0,5000,2500))

        c.execute("""INSERT INTO achievements
            (department,title,description,achievement_date,metric,created_by)
            VALUES(?,?,?,?,?,?)""",
            ("Data Analytics","Department Achievement",
             "Sample achievement for HOD dashboard","2026-08-20",92,hd))

        c.execute("""INSERT INTO fee_structures
            (department,class_name,tuition,bus,hostel,placement)
            VALUES(?,?,?,?,?,?)""",
            ("Data Analytics","II B.Sc Data Analytics",75000,15000,0,5000))

    c.commit()
    c.close()

if __name__=="__main__":
    seed()
