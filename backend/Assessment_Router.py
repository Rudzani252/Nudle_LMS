from fastapi import APIRouter, Depends, HTTPException
from Nudle_database import get_db, engine
from sqlalchemy.orm import Session
from Models import Assessment, User, Activity
from pydantic import BaseModel, ConfigDict
from JWT_Security import create_access_token, get_current_user

router = APIRouter()

class AddAssessment(BaseModel):
    title: str
    description: str
    is_active:bool= True
    


@router.post("/assessment/add")
def add_assessment(assessment:AddAssessment, db:Session=Depends(get_db),current_user: User=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to add an assessment")

    existing_assessment = db.query(Assessment).filter(Assessment.title == assessment.title).first()

    if existing_assessment:
        raise HTTPException(
            status_code= 404,
            detail= "Assessment with this title already exists"
        )
    else: 
        new_assessment = Assessment(title = assessment.title, description = assessment.description, is_active = assessment.is_active, created_by=current_user.user_id)
        try:
             
            db.add(new_assessment)
            db.commit()
            db.refresh(new_assessment)
        except Exception:
                    db.rollback()
                    raise HTTPException(
                        status_code=500,
                        detail="Failed to create an assessment")
    return new_assessment





class UpdateAssessment(BaseModel):
    title: str | None = None
    description: str | None = None
    is_active: bool | None = None

    model_config = ConfigDict(from_attributes=True) 

@router.patch("/assessment/update/{assessment_id}")
def update_assessment(assessment_id: int, assessment:UpdateAssessment, db:Session=Depends(get_db),current_user: User=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to update this assessment")
    
    existing_assessment = db.query(Assessment).filter(Assessment.assessment_id == assessment_id).first()
    if not existing_assessment:
            raise HTTPException(
                status_code= 404,
                detail= "Assessment not found")

    if assessment.title is not None and assessment.title.strip() !="":
        existing_title = db.query(Assessment).filter(Assessment.title == assessment.title,Assessment.assessment_id != assessment_id).first()
        if existing_title:
            raise HTTPException(
            status_code=400,
            detail="Assessment with that title already exists")
        
        existing_assessment.title = assessment.title

    if assessment.description is not None and assessment.description.strip() !="":    
        existing_assessment.description = assessment.description

    if assessment.is_active is not None :    
            existing_assessment.is_active = assessment.is_active
    try:
        db.commit()
        db.refresh(existing_assessment)
    except Exception:
                db.rollback()
                raise HTTPException(
                    status_code=500,
                    detail="Failed to update assessment")

    return existing_assessment



@router.get("/all_assessments")
def get_assessments(db:Session =Depends(get_db)):
    assessment = db.query(Assessment).all()
    return assessment




class ViewAssessment(BaseModel):
    assessment_id:int 
    title: str 
    is_active: bool

    model_config = ConfigDict(from_attributes=True) 

@router.get("/view_assessment/{assessment_id}")
def view_assessment(assessment_id: int,  db: Session= Depends(get_db)):
    existing_assessment = db.query(Assessment).filter(Assessment.assessment_id == assessment_id).first()
    if not existing_assessment:
        raise HTTPException(
             status_code= 400,
             detail="Assessment does not exist"
        )
    return existing_assessment





@router.delete("/delete_assessment/{assessment_id}")
def remove_assessment(assessment_id: int, db: Session= Depends(get_db),current_user: User=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to update this assessment")
    
    assessment = db.query(Assessment).filter(Assessment.assessment_id == assessment_id).first()
    if not assessment:
        raise HTTPException(
                status_code= 404,
                detail= "Assessment not found")
    
    linked_activity = db.query(Activity).filter(Activity.assessment_id == assessment_id).first()

    if linked_activity:
        raise HTTPException(
            status_code= 409,
            detail= "There is an activity still linked to this assessment")
    else:
        try:
            db.delete(assessment)
            db.commit()
        except Exception:
                    db.rollback()
                    raise HTTPException(
                        status_code=500,
                        detail="Failed to delete assessment")
        return{ "message": "Assessment removed successfully"}
    