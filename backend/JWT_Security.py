import jwt
import os 
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jwt.exceptions import InvalidTokenError
from Nudle_database import get_db
from Models import User

load_dotenv()

SECRET_KEY = os.environ["JWT_SECRET_KEY"]
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def create_access_token(user_id:int):
    expiration = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "exp": expiration
    }

    token = jwt.encode(
        payload, 
        SECRET_KEY,
        algorithm= ALGORITHM
    )

    return token

security = HTTPBearer()
def get_current_user(
  credentials: HTTPAuthorizationCredentials = Depends(security),
  db: Session = Depends(get_db)):
    token = credentials.credentials

    try: 
        paylaod = jwt.decode(
            token, SECRET_KEY, algorithms=ALGORITHM
        )
        user_id = int(paylaod["sub"])
    except (InvalidTokenError, KeyError, ValueError, TypeError):
        raise HTTPException(
            status_code= 401,
            detail = "invalid or expired token"
        )

    user = db.query(User).filter(User.user_id == user_id).first()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=401,
            detail="User not found or account inactive")

    return user 