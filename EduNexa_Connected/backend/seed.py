from datetime import date

from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models.models import (
    Assignment, Attendance, Department, Faculty, Fee, Feedback,
    Mark, Notification, Placement, Skill, Student, Test, User
)

Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    if db.query(User).count() > 0:
        print("Database already contains data. Seed skipped.")
    else:
        dept = Department(
            name="Data Analytics",
            code="DA",
            description="B.Sc. Data Analytics",
        )
        db.add(dept)
        db.flush()

        student_user = User(
            name="Alexa",
            email="alexa@example.com",
            password_hash=hash_password("123456"),
            role="student",
        )
        faculty_user = User(
            name="Dr. Priya",
            email="faculty@edunexa.com",
            password_hash=hash_password("123456"),
            role="faculty",
        )
        admin_user = User(
            name="Management Admin",
            email="admin@edunexa.com",
            password_hash=hash_password("123456"),
            role="management",
        )
        db.add_all([student_user, faculty_user, admin_user])
        db.flush()

        student = Student(
            user_id=student_user.id,
            student_id="EDU2026-1048",
            parent_name="Alexa Parent",
            parent_phone="+91 90000 00001",
            department_id=dept.id,
            batch="2025-2028",
            class_name="II B.Sc Data Analytics",
            attendance=86,
        )

        faculty = Faculty(
            user_id=faculty_user.id,
            faculty_id="FAC-1001",
            department="Data Analytics",
            position="Assistant Professor",
            designation="Faculty Coordinator",
            qualification="Ph.D. in Computer Science",
            experience="8 Years",
            specialization="Data Analytics & Machine Learning",
            office="Block A - Room 204",
            phone="+91 90000 10001",
            mentor=True,
            class_adviser=True,
            classes_handled="II B.Sc Data Analytics, I B.Sc Data Analytics",
            basic_subjects="Python, Data Analytics",
            extra_subjects="SQL, Power BI",
            extra_info="Class Adviser for II B.Sc Data Analytics; Mentor for student skill dashboard.",
        )

        db.add_all([student, faculty])
        db.flush()

        db.add_all([
            Mark(student_id=student.id, subject="Python", m1=82, m2=88, m3=86, m4=90, average=86.5, updated_by=faculty_user.id),
            Mark(student_id=student.id, subject="SQL", m1=78, m2=84, m3=82, m4=86, average=82.5, updated_by=faculty_user.id),
            Skill(student_id=student.id, skill_name="Python", score=88),
            Skill(student_id=student.id, skill_name="SQL", score=82),
            Skill(student_id=student.id, skill_name="Power BI", score=91),
            Skill(student_id=student.id, skill_name="Excel", score=86),
            Skill(student_id=student.id, skill_name="Communication", score=76),
            Fee(
                student_id=student.id,
                tuition_total=60000,
                tuition_paid=50000,
                bus_total=12000,
                bus_paid=0,
                hostel_total=0,
                hostel_paid=0,
                placement_total=0,
                placement_paid=0,
                payment_method="UPI",
            ),
            Test(
                title="Python Internal Test 1",
                subject="Python",
                test_date=date.today(),
                max_marks=100,
                description="Basic Python and data analysis",
                questions=[
                    {"q":"Which keyword defines a function in Python?","opts":["func","def","function","define"],"ans":1},
                    {"q":"Which data type is immutable?","opts":["List","Dictionary","Tuple","Set"],"ans":2}
                ],
                created_by=faculty_user.id,
            ),
            Assignment(
                title="EDA Mini Project",
                subject="Data Analytics",
                due_date=date.today(),
                description="Perform exploratory data analysis on a student dataset.",
                created_by=faculty_user.id,
            ),
            Placement(
                company_name="Sample Analytics Pvt Ltd",
                visit_status="Visited",
                visit_date=date.today(),
                package_lpa=6.0,
                department="Data Analytics",
                placed_student_name="Sample Student",
                placed_student_id="EDU2026-1001",
                job_role="Data Analyst",
                notes="Demo placement record",
            ),
            Feedback(
                student_id=student.id,
                feedback_type="infrastructure",
                subject=None,
                rating=4,
                message="Classroom facilities are good.",
                status="Submitted",
            ),
            Notification(
                student_id=student.id,
                title="Welcome to EduNexa",
                message="Your EduNexa account has been created successfully.",
                recipient_role="student",
            ),
        ])

        db.commit()
        print("EduNexa demo database created successfully.")
        print("Student: alexa@example.com / 123456")
        print("Faculty: faculty@edunexa.com / 123456")
        print("Management: admin@edunexa.com / 123456")

finally:
    db.close()
