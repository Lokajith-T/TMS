from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base
from app.routers import auth
from app.dependencies.auth import get_current_user

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

# Include Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])

@app.get("/")
def read_root():
    return {"status": "online", "message": "Team Management System API"}

@app.get("/api/user/me")
def get_me(user = Depends(get_current_user)):
    return user
