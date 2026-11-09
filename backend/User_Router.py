from fastapi import APIRouter, Depends, HTTPException
from Nudle_database import get_db, engine
from sqlalchemy.orm import Session
from Models import User
from pydantic import BaseModel, ConfigDict, EmailStr, Field
import bcrypt
from JWT_Security import create_access_token, get_current_user
from sqlalchemy.exc import IntegrityError

router = APIRouter()






class AddUser(BaseModel):
    full_name:str= Field(min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8)
    phone_no: str| None = None


@router.post("/user/register")
def add_user(user:AddUser, db: Session= Depends(get_db)):
    existing_email = db.query(User).filter(User.email == user.email).first()

    if existing_email:
        raise HTTPException(
            status_code= 400,
            detail= "Email already exists"
        )
    else:
        hashed_password = bcrypt.hashpw( user.password.encode("utf-8"),
        bcrypt.gensalt())
        new_user = User(full_name = user.full_name, email= user.email, password_hash =hashed_password.decode("utf-8"), phone_no =user.phone_no)
        try:
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
        except Exception:
                db.rollback()
                raise HTTPException(
                    status_code=500,
                    detail="Failed to add learner")
    return new_user



class UpdateUser(BaseModel):
    full_name: str | None  = Field( default=None, min_length=2, max_length=50) 
    email: EmailStr | None = None
    password: str  | None  = Field(default=None, min_length=8)
    phone_no: str| None = None

    model_config = ConfigDict(from_attributes=True)

@router.patch("/users/{user_id}")
def update_user( user_id:int, user:UpdateUser, db: Session= Depends(get_db), current_user: User=Depends(get_current_user)):
    if current_user.role != "admin" and current_user.user_id != user_id:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to update this user"
        )
    
    existing_user = db.query(User).filter(User.user_id == user_id).first()

    if not existing_user:
        raise HTTPException(
            status_code = 404,
            detail = "User  not found"
        )
    if user.full_name is not None and user.full_name.strip() !="":
        existing_user.full_name = user.full_name

    if user.email is not None and user.email.strip() !="":
            existing_email = db.query(User).filter(User.email == user.email, User.user_id != user_id).first()
            if existing_email:
                raise HTTPException(
                status_code=409,
                detail="Email already exists")
            
            existing_user.email = user.email
            
    if user.password is not None and user.password.strip() !="":
            existing_user.password_hash = bcrypt.hashpw(user.password.encode("utf-8"),
            bcrypt.gensalt()).decode("utf-8")

    if user.phone_no is not None and user.phone_no.strip() !="":
            existing_user.phone_no = user.phone_no

    try:
        db.commit()
        db.refresh(existing_user)
        return {
            "message": "User updated successfully",
            "user_id": existing_user.user_id,
            "full_name": existing_user.full_name,
            "email": existing_user.email,
            "phone_no": existing_user.phone_no}

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Email already exists")
    



class ViewDetails(BaseModel):
    full_name: str 
    email : str 
    role: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

@router.get("/user/{user_id}", response_model= ViewDetails)
def get_user_details(user_id:int,  db: Session= Depends(get_db), current_user: User=Depends(get_current_user)):
    if current_user.role != "admin" and current_user.user_id != user_id:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to view this user")
    
    user = db.query(User).filter(User.user_id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code = 404,
            detail = "User not found")
    
    return {
        "user_id": user.user_id,
        "full_name": user.full_name,
        "email": user.email,
        "phone_no": user.phone_no,
        "role": user.role,
        "is_active": user.is_active}



class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
def login_user(login:LoginRequest,db: Session= Depends(get_db)):
    user = db.query(User).filter(User.email == login.email).first()

    if not user: 
         raise HTTPException(
              status_code= 401,
              detail= "Invalid email or password"
         )
    stored_password = user.password_hash
    if isinstance(stored_password,str):
        stored_password = stored_password.encode("utf-8")

    password_corrent = bcrypt.checkpw(
         login.password.encode("utf-8"),
         stored_password)

    if not password_corrent:
         raise HTTPException(
              status_code=401,
              detail = "Invalid email or password"
         )
    if not user.is_active:
         raise HTTPException(
              status_code= 403,
              detail= "Account is deactived"

         )
    access_token = create_access_token(user.user_id)


    return {
        "status": "Successful",
        "message": "Logged in successfully",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "user_id": user.user_id,
            "email": user.email,
            "role": user.role
        }
    }



@router.get("/auth/user")
def get_logged_in_user(current_user: User = Depends(get_current_user)):
     return {
        "user_id": current_user.user_id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role
    }

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Administrator access required"
        )

    return current_user




@router.get("/admin/learners")
def get_all_learners(admin: User = Depends(require_admin),db: Session = Depends(get_db)):
    learners = db.query(User).filter(User.role == "learner").all()

    return [
        {
            "user_id": learner.user_id,
            "full_name": learner.full_name,
            "email": learner.email,
            "is_active": learner.is_active
        }
        for learner in learners
    ]




class CurrentUserResponse(BaseModel):
    user_id: int
    full_name: str
    email: str
    role: str

    model_config = ConfigDict(from_attributes=True)


@router.get("/users/me",response_model=CurrentUserResponse)
def get_logged_in_user(current_user: User = Depends(get_current_user)):
    return current_user

@router.delete("/delete_account/{user_id}")
def delete_account(user_id: int, db: Session= Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user: 
        raise HTTPException(
            status_code= 401,
            detail= "User account does not exist"
        )
    try:
        db.delete(user)
        db.commit()
    except Exception:
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail="Failed to delete learner ")

    return{ "message": "Account removed successfully"}




class UpdateLearnerStatus(BaseModel):
    is_active: bool


@router.patch("/admin/learners/{user_id}/status")
def update_learner_status(user_id: int,learner: UpdateLearnerStatus,db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to update learner status"
        )

    existing_learner = db.query(User).filter(User.user_id == user_id,User.role == "learner").first()
    existing_learner.is_active = learner.is_active
    try:
        db.commit()
        db.refresh(existing_learner)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to update learner status"
        )
    return {
        "message": (
            "Learner activated successfully"
            if existing_learner.is_active
            else "Learner deactivated successfully"),"learner":existing_learner}