from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class SignupIn(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)
    role: str = "student"
    student_id: str | None = None
    faculty_id: str | None = None
    department: str | None = None
    batch: str | None = None
    class_name: str | None = None
    parent_name: str | None = None
    parent_phone: str | None = None


class UserOut(ORMModel):
    id: int
    name: str
    email: EmailStr
    role: str
    is_active: bool


class TokenOut(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


class StudentOut(ORMModel):
    id: int
    student_id: str
    parent_name: str | None
    parent_phone: str | None
    batch: str | None
    class_name: str | None
    attendance: float
    user: UserOut
    department: "DepartmentOut | None" = None


class DepartmentOut(ORMModel):
    id: int
    name: str
    code: str
    description: str | None


class FacultyOut(ORMModel):
    id: int
    faculty_id: str
    department: str | None
    position: str | None
    designation: str | None
    qualification: str | None
    experience: str | None
    specialization: str | None
    office: str | None
    phone: str | None
    mentor: bool
    class_adviser: bool
    classes_handled: str | None
    basic_subjects: str | None
    extra_subjects: str | None
    extra_info: str | None
    user: UserOut


class MarkCreate(BaseModel):
    student_id: int
    subject: str
    m1: float = 0
    m2: float = 0
    m3: float = 0
    m4: float = 0


class MarkUpdate(BaseModel):
    m1: float | None = None
    m2: float | None = None
    m3: float | None = None
    m4: float | None = None


class MarkOut(ORMModel):
    id: int
    student_id: int
    subject: str
    m1: float
    m2: float
    m3: float
    m4: float
    average: float
    updated_at: datetime


class AttendanceCreate(BaseModel):
    student_id: int
    date: date
    subject: str | None = None
    status: str


class AttendanceOut(ORMModel):
    id: int
    student_id: int
    date: date
    subject: str | None
    status: str


class FeeCreate(BaseModel):
    student_id: int
    tuition_total: float = 0
    tuition_paid: float = 0
    bus_total: float = 0
    bus_paid: float = 0
    hostel_total: float = 0
    hostel_paid: float = 0
    placement_total: float = 0
    placement_paid: float = 0
    payment_method: str | None = None


class FeeOut(ORMModel):
    id: int
    student_id: int
    tuition_total: float
    tuition_paid: float
    bus_total: float
    bus_paid: float
    hostel_total: float
    hostel_paid: float
    placement_total: float
    placement_paid: float
    payment_method: str | None


class TestCreate(BaseModel):
    title: str
    subject: str
    test_date: date
    max_marks: float = 100
    description: str | None = None


class TestOut(ORMModel):
    id: int
    title: str
    subject: str
    test_date: date
    max_marks: float
    description: str | None
    created_by: int


class AssignmentCreate(BaseModel):
    title: str
    subject: str
    due_date: date
    description: str | None = None


class AssignmentOut(ORMModel):
    id: int
    title: str
    subject: str
    due_date: date
    description: str | None
    created_by: int


class SubmissionCreate(BaseModel):
    assignment_id: int
    file_url: str | None = None


class SubmissionOut(ORMModel):
    id: int
    assignment_id: int
    student_id: int
    submitted_at: datetime
    file_url: str | None
    score: float | None
    status: str


class LeaveCreate(BaseModel):
    leave_type: str
    from_date: date
    to_date: date
    reason: str


class LeaveReview(BaseModel):
    status: str
    reviewer_comment: str | None = None


class LeaveOut(ORMModel):
    id: int
    student_id: int
    leave_type: str
    from_date: date
    to_date: date
    reason: str
    status: str
    reviewed_by: int | None
    reviewer_comment: str | None


class SkillCreate(BaseModel):
    student_id: int
    skill_name: str
    score: float = 0


class SkillUpdate(BaseModel):
    score: float


class SkillOut(ORMModel):
    id: int
    student_id: int
    skill_name: str
    score: float


class FeedbackCreate(BaseModel):
    feedback_type: str
    subject: str | None = None
    rating: float = Field(ge=0, le=5)
    message: str


class FeedbackResponse(BaseModel):
    response: str


class FeedbackOut(ORMModel):
    id: int
    student_id: int
    feedback_type: str
    subject: str | None
    rating: float
    message: str
    response: str | None
    status: str
    created_at: datetime


class PlacementCreate(BaseModel):
    company_name: str
    visit_status: str = "Not Visited"
    visit_date: date | None = None
    package_lpa: float | None = None
    department: str | None = None
    placed_student_name: str | None = None
    placed_student_id: str | None = None
    job_role: str | None = None
    contact_info: str | None = None
    notes: str | None = None


class PlacementOut(ORMModel):
    id: int
    company_name: str
    visit_status: str
    visit_date: date | None
    package_lpa: float | None
    department: str | None
    placed_student_name: str | None
    placed_student_id: str | None
    job_role: str | None
    contact_info: str | None
    notes: str | None


class NotificationCreate(BaseModel):
    student_id: int | None = None
    recipient_role: str | None = None
    title: str
    message: str


class NotificationOut(ORMModel):
    id: int
    student_id: int | None
    recipient_role: str | None
    title: str
    message: str
    is_read: bool
    created_at: datetime

StudentOut.model_rebuild()
