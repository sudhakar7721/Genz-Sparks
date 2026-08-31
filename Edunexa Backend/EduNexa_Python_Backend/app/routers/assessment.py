from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.models.models import Assignment, Submission, Test, Student, User
from app.schemas.schemas import (
    AssignmentCreate, AssignmentOut, SubmissionCreate, SubmissionOut,
    TestCreate, TestOut
)

router = APIRouter(tags=["Tests & Assignments"])


@router.get("/tests", response_model=list[TestOut])
def list_tests(
    _: User = Depends(require_roles("student", "faculty", "management")),
    db: Session = Depends(get_db),
):
    return db.query(Test).order_by(Test.test_date.desc()).all()


@router.post("/tests", response_model=TestOut, status_code=201)
def create_test(
    data: TestCreate,
    user: User = Depends(require_roles("faculty")),
    db: Session = Depends(get_db),
):
    test = Test(**data.model_dump(), created_by=user.id)
    db.add(test)
    db.commit()
    db.refresh(test)
    return test


@router.get("/assignments", response_model=list[AssignmentOut])
def list_assignments(
    _: User = Depends(require_roles("student", "faculty", "management")),
    db: Session = Depends(get_db),
):
    return db.query(Assignment).order_by(Assignment.due_date.desc()).all()


@router.post("/assignments", response_model=AssignmentOut, status_code=201)
def create_assignment(
    data: AssignmentCreate,
    user: User = Depends(require_roles("faculty")),
    db: Session = Depends(get_db),
):
    assignment = Assignment(**data.model_dump(), created_by=user.id)
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


@router.post("/submissions", response_model=SubmissionOut, status_code=201)
def submit_assignment(
    data: SubmissionCreate,
    user: User = Depends(require_roles("student")),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.user_id == user.id).first()
    assignment = db.get(Assignment, data.assignment_id)

    if not student:
        raise HTTPException(404, "Student profile not found")
    if not assignment:
        raise HTTPException(404, "Assignment not found")

    submission = Submission(
        assignment_id=assignment.id,
        student_id=student.id,
        file_url=data.file_url,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


@router.get("/submissions/{student_id}", response_model=list[SubmissionOut])
def list_submissions(
    student_id: int,
    _: User = Depends(require_roles("student", "faculty", "management")),
    db: Session = Depends(get_db),
):
    return db.query(Submission).filter(Submission.student_id == student_id).all()
