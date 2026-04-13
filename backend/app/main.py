from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import engine, Base, get_db
from .models import User
from .schemas import LoginRequest, Token
from .auth import verify_password
from .jwt_handler import create_access_token
from .dependencies import get_current_user

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(title="TMS Backend")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "online", "message": "Team Management System API"}

@app.post("/api/auth/login", response_model=Token)
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

@app.get("/api/user/me")
def get_me(user = Depends(get_current_user)):
    return user
