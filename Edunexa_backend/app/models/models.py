from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(180), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(30), index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    student: Mapped["Student | None"] = relationship(back_populates="user", uselist=False)
    faculty: Mapped["Faculty | None"] = relationship(back_populates="user", uselist=False)


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    code: Mapped[str] = mapped_column(String(30), unique=True)
    description: Mapped[str | None] = mapped_column(Text)

    students: Mapped[list["Student"]] = relationship(back_populates="department")


class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    student_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    parent_name: Mapped[str | None] = mapped_column(String(120))
    parent_phone: Mapped[str | None] = mapped_column(String(30))
    department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id"))
    batch: Mapped[str | None] = mapped_column(String(30))
    class_name: Mapped[str | None] = mapped_column(String(100))
    attendance: Mapped[float] = mapped_column(Float, default=0)

    user: Mapped[User] = relationship(back_populates="student")
    department: Mapped["Department | None"] = relationship(back_populates="students")
    marks: Mapped[list["Mark"]] = relationship(back_populates="student")
    attendance_records: Mapped[list["Attendance"]] = relationship(back_populates="student")
    fees: Mapped[list["Fee"]] = relationship(back_populates="student")
    leaves: Mapped[list["LeaveRequest"]] = relationship(back_populates="student")
    submissions: Mapped[list["Submission"]] = relationship(back_populates="student")
    skills: Mapped[list["Skill"]] = relationship(back_populates="student")
    feedbacks: Mapped[list["Feedback"]] = relationship(back_populates="student")
    notifications: Mapped[list["Notification"]] = relationship(back_populates="student")


class Faculty(Base):
    __tablename__ = "faculty"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    faculty_id: Mapped[str] = mapped_column(String(50), unique=True)
    department: Mapped[str | None] = mapped_column(String(120))
    position: Mapped[str | None] = mapped_column(String(120))
    designation: Mapped[str | None] = mapped_column(String(120))
    qualification: Mapped[str | None] = mapped_column(String(255))
    experience: Mapped[str | None] = mapped_column(String(80))
    specialization: Mapped[str | None] = mapped_column(String(255))
    office: Mapped[str | None] = mapped_column(String(120))
    phone: Mapped[str | None] = mapped_column(String(30))
    mentor: Mapped[bool] = mapped_column(Boolean, default=False)
    class_adviser: Mapped[bool] = mapped_column(Boolean, default=False)
    classes_handled: Mapped[str | None] = mapped_column(Text)
    basic_subjects: Mapped[str | None] = mapped_column(Text)
    extra_subjects: Mapped[str | None] = mapped_column(Text)
    extra_info: Mapped[str | None] = mapped_column(Text)

    user: Mapped[User] = relationship(back_populates="faculty")


class Mark(Base):
    __tablename__ = "marks"

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"))
    subject: Mapped[str] = mapped_column(String(120))
    m1: Mapped[float] = mapped_column(Float, default=0)
    m2: Mapped[float] = mapped_column(Float, default=0)
    m3: Mapped[float] = mapped_column(Float, default=0)
    m4: Mapped[float] = mapped_column(Float, default=0)
    average: Mapped[float] = mapped_column(Float, default=0)
    updated_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student: Mapped[Student] = relationship(back_populates="marks")


class Attendance(Base):
    __tablename__ = "attendance"

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"))
    date: Mapped[date] = mapped_column(Date)
    subject: Mapped[str | None] = mapped_column(String(120))
    status: Mapped[str] = mapped_column(String(30))

    student: Mapped[Student] = relationship(back_populates="attendance_records")


class Fee(Base):
    __tablename__ = "fees"

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"))
    tuition_total: Mapped[float] = mapped_column(Float, default=0)
    tuition_paid: Mapped[float] = mapped_column(Float, default=0)
    bus_total: Mapped[float] = mapped_column(Float, default=0)
    bus_paid: Mapped[float] = mapped_column(Float, default=0)
    hostel_total: Mapped[float] = mapped_column(Float, default=0)
    hostel_paid: Mapped[float] = mapped_column(Float, default=0)
    placement_total: Mapped[float] = mapped_column(Float, default=0)
    placement_paid: Mapped[float] = mapped_column(Float, default=0)
    payment_method: Mapped[str | None] = mapped_column(String(40))

    student: Mapped[Student] = relationship(back_populates="fees")


class Test(Base):
    __tablename__ = "tests"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(160))
    subject: Mapped[str] = mapped_column(String(120))
    test_date: Mapped[date] = mapped_column(Date)
    max_marks: Mapped[float] = mapped_column(Float, default=100)
    description: Mapped[str | None] = mapped_column(Text)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"))


class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(160))
    subject: Mapped[str] = mapped_column(String(120))
    due_date: Mapped[date] = mapped_column(Date)
    description: Mapped[str | None] = mapped_column(Text)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"))


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[int] = mapped_column(primary_key=True)
    assignment_id: Mapped[int] = mapped_column(ForeignKey("assignments.id"))
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"))
    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    file_url: Mapped[str | None] = mapped_column(String(500))
    score: Mapped[float | None] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(30), default="Submitted")

    student: Mapped[Student] = relationship(back_populates="submissions")


class LeaveRequest(Base):
    __tablename__ = "leaves"

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"))
    leave_type: Mapped[str] = mapped_column(String(50))
    from_date: Mapped[date] = mapped_column(Date)
    to_date: Mapped[date] = mapped_column(Date)
    reason: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(30), default="Pending")
    reviewed_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    reviewer_comment: Mapped[str | None] = mapped_column(Text)

    student: Mapped[Student] = relationship(back_populates="leaves")


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"))
    skill_name: Mapped[str] = mapped_column(String(100))
    score: Mapped[float] = mapped_column(Float, default=0)

    student: Mapped[Student] = relationship(back_populates="skills")


class Feedback(Base):
    __tablename__ = "feedback"

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"))
    feedback_type: Mapped[str] = mapped_column(String(50))
    subject: Mapped[str | None] = mapped_column(String(120))
    rating: Mapped[float] = mapped_column(Float, default=0)
    message: Mapped[str] = mapped_column(Text)
    response: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(30), default="Submitted")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    student: Mapped[Student] = relationship(back_populates="feedbacks")


class Placement(Base):
    __tablename__ = "placements"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_name: Mapped[str] = mapped_column(String(160))
    visit_status: Mapped[str] = mapped_column(String(50), default="Not Visited")
    visit_date: Mapped[date | None] = mapped_column(Date)
    package_lpa: Mapped[float | None] = mapped_column(Float)
    department: Mapped[str | None] = mapped_column(String(120))
    placed_student_name: Mapped[str | None] = mapped_column(String(160))
    placed_student_id: Mapped[str | None] = mapped_column(String(50))
    job_role: Mapped[str | None] = mapped_column(String(120))
    contact_info: Mapped[str | None] = mapped_column(String(255))
    notes: Mapped[str | None] = mapped_column(Text)


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int | None] = mapped_column(ForeignKey("students.id"))
    recipient_role: Mapped[str | None] = mapped_column(String(50))
    title: Mapped[str] = mapped_column(String(180))
    message: Mapped[str] = mapped_column(Text)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    student: Mapped[Student | None] = relationship(back_populates="notifications")
