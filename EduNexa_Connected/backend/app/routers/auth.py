from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models.models import Faculty, Student, User
from app.schemas.schemas import LoginIn, SignupIn, TokenOut, UserOut

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=TokenOut, status_code=201)
def signup(data: SignupIn, db: Session = Depends(get_db)):
    role = data.role.lower()
    if role not in {"student", "faculty"}:
        raise HTTPException(400, "Only student/faculty self-signup is allowed")

    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(409, "Email already registered")

    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=role,
    )
    db.add(user)
    db.flush()

    if role == "student":
        student_id = data.student_id or f"EDU-{user.id:05d}"
        if db.query(Student).filter(Student.student_id == student_id).first():
            raise HTTPException(409, "Student ID already exists")
        db.add(Student(
            user_id=user.id,
            student_id=student_id,
            parent_name=data.parent_name,
            parent_phone=data.parent_phone,
            batch=data.batch,
            class_name=data.class_name,
            attendance=0,
        ))
    else:
        faculty_id = data.faculty_id or f"FAC-{user.id:04d}"
        db.add(Faculty(
            user_id=user.id,
            faculty_id=faculty_id,
            department=data.department,
        ))

    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.role)
    return TokenOut(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(user),
    )


@router.post("/login", response_model=TokenOut)
def login(data: LoginIn, db: Session = Depends(get_db)):
    identifier = (data.identifier or (str(data.email) if data.email else "")).strip()
    user = db.query(User).filter(
        (User.email == identifier)
    ).first()

    if not user:
        student = db.query(Student).filter(Student.student_id == identifier).first()
        if student:
            user = db.get(User, student.user_id)

    if not user:
        faculty = db.query(Faculty).filter(Faculty.faculty_id == identifier).first()
        if faculty:
            user = db.get(User, faculty.user_id)

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if data.role and user.role != data.role.lower():
        raise HTTPException(401, "Invalid login role")

    token = create_access_token(user.id, user.role)
    return TokenOut(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(user),
    )
