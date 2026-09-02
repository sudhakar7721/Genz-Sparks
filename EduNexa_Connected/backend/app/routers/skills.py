from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.models.models import Skill, Student, User
from app.schemas.schemas import SkillCreate, SkillOut, SkillUpdate

router = APIRouter(prefix="/skills", tags=["Skills & Mentor"])


@router.get("/{student_id}", response_model=list[SkillOut])
def student_skills(
    student_id: int,
    _: User = Depends(require_roles("student", "faculty", "management")),
    db: Session = Depends(get_db),
):
    return db.query(Skill).filter(Skill.student_id == student_id).all()


@router.post("", response_model=SkillOut, status_code=201)
def add_skill(
    data: SkillCreate,
    _: User = Depends(require_roles("faculty", "management")),
    db: Session = Depends(get_db),
):
    if not db.get(Student, data.student_id):
        raise HTTPException(404, "Student not found")
    skill = Skill(**data.model_dump())
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill


@router.put("/{skill_id}", response_model=SkillOut)
def update_skill(
    skill_id: int,
    data: SkillUpdate,
    _: User = Depends(require_roles("faculty", "management")),
    db: Session = Depends(get_db),
):
    skill = db.get(Skill, skill_id)
    if not skill:
        raise HTTPException(404, "Skill not found")
    skill.score = data.score
    db.commit()
    db.refresh(skill)
    return skill


@router.get("/mentor/students", response_model=list[dict])
def mentor_students(
    _: User = Depends(require_roles("faculty")),
    db: Session = Depends(get_db),
):
    students = db.query(Student).all()
    result = []
    for student in students:
        skills = db.query(Skill).filter(Skill.student_id == student.id).all()
        avg = round(sum(s.score for s in skills) / len(skills), 2) if skills else 0
        result.append({
            "student_id": student.id,
            "registration_id": student.student_id,
            "name": student.user.name,
            "department": student.department.name if student.department else None,
            "skill_average": avg,
            "skills": [{"name": s.skill_name, "score": s.score} for s in skills],
        })
    return result
