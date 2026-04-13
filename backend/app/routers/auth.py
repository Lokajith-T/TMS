from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.schemas.user import LoginRequest, Token
from app.core.auth import verify_password
from app.core.jwt_handler import create_access_token

router = APIRouter()

@router.post("/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    # 1. Find user by email
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    # 2. Verify password
    if not verify_password(request.password, user.password):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    # 3. Generate JWT token
    access_token = create_access_token(
        data={"user_id": user.id, "email": user.email, "role": user.role}
    )
    
    return {"access_token": access_token, "token_type": "bearer"}
