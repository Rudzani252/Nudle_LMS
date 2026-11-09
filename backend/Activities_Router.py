from fastapi import APIRouter, Depends, HTTPException
from Nudle_database import get_db, engine
from sqlalchemy.orm import Session
from Models import Activity, User
from pydantic import BaseModel, ConfigDict
from JWT_Security import create_access_token, get_current_user
from sqlalchemy.exc import IntegrityError

router = APIRouter()

class AddActivity(BaseModel):
    assessment_id: int
    title: str
    description: str
    scenario_type: str
    is_active:bool= True


@router.post("/activity/add")
def add_activity(activity: AddActivity,db: Session = Depends(get_db),current_user: User=Depends(get_current_user)):
    if current_user.role != "admin":
                raise HTTPException(
                    status_code=403,
                    detail="You do not have permission to add an activity")
    existing_activity = db.query(Activity).filter(Activity.title == activity.title).first()

    if existing_activity:
        raise HTTPException(
            status_code = 400, 
            detail = "Activity with that title already exists"
        )
    else: 
        new_activity = Activity(assessment_id = activity.assessment_id,title = activity.title, description = activity.description, scenario_type = activity.scenario_type, is_active = activity.is_active)
        try:
            db.add(new_activity)
            db.commit()
            db.refresh(new_activity)
        except Exception:
                    db.rollback()
                    raise HTTPException(
                        status_code=500,
                        detail="Failed to add an activity")
    return new_activity






class UpdateActivity(BaseModel):
    title:str | None = None
    description: str | None = None
    scenario_type: str | None = None
    is_active: bool | None = None

    model_config = ConfigDict(from_attributes=True)

@router.patch("/activity/update/{activity_id}")
def update_activty (activity_id: int, activity: UpdateActivity,db: Session = Depends(get_db),current_user: User=Depends(get_current_user) ):
    if current_user.role != "admin":
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to update this activity")
    
    existing_activity = db.query(Activity).filter(Activity.activity_id == activity_id).first()
    if not existing_activity:
        raise HTTPException(
            status_code= 404,
            detail= "Activtiy not found"
        )

    if activity.title is not None and activity.title.strip() != "":
        existing_title = db.query(Activity).filter(Activity.title == activity.title,Activity.activity_id != activity_id).first()
        if existing_title:
            raise HTTPException(
            status_code=400,
            detail="Activity with that title already exists")

        existing_activity.title = activity.title

    if activity.description is not None and activity.description.strip() != "":
            existing_activity.description= activity.description

    if activity.scenario_type is not None and activity.scenario_type.strip() != "":
            existing_activity.scenario_type = activity.scenario_type

    if activity.is_active is not None:
                existing_activity.is_active = activity.is_active
    try:
          
        db.commit()
        db.refresh(existing_activity)
    except Exception:
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail="Failed to update activity")
    return existing_activity




@router.get("/all_activities")
def get_activities(db:Session =Depends(get_db)):
    activities = db.query(Activity).all()
    return activities




class ViewActivity(BaseModel):
     activity_id: int
     title: str
     scenario_type: str

     model_config = ConfigDict(from_attributes=True) 


@router.get("/view_activity/{activity_id}", response_model= ViewActivity)
def get_activity_details(activity_id: int,db: Session= Depends(get_db)):
    
    existing_activity = db.query(Activity).filter(Activity.activity_id == activity_id).first()
    if not existing_activity:
        raise HTTPException(
            status_code= 404,
            detail= "Activity not found")

    return existing_activity




@router.delete("/delete_activity/{activity_id}")
def remove_activity(activity_id: int,db: Session= Depends(get_db), current_user: User=Depends(get_current_user) ):
    if current_user.role != "admin":
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to delete")

    
    activity = (db.query(Activity).filter(Activity.activity_id == activity_id).first())
    if not activity:
            raise HTTPException(
                status_code= 404,
                detail= "Activity not found")
    try: 
        db.delete(activity)
        db.commit()
    except Exception:
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail="Failed to delete activity")