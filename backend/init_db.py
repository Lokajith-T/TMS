from app.db.database import SessionLocal, engine, Base
from app.models.user import User
from app.core.auth import hash_password

def init_db():
    print("Initializing database...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    users = [
        # Main head (Admin)
        {"name": "admin", "email": "admin@tms.com", "password": "admin123", "role": "admin"},

        # Team leads
        {"name": "arun", "email": "arun@tms.com", "password": "arun123", "role": "lead"},
        {"name": "kavi", "email": "kavi@tms.com", "password": "kavi123", "role": "lead"},

        # Employees under Arun
        {"name": "sara", "email": "sara@tms.com", "password": "sara123", "role": "employee"},
        {"name": "mani", "email": "mani@tms.com", "password": "mani123", "role": "employee"},

        # Employees under Kavi
        {"name": "ravi", "email": "ravi@tms.com", "password": "ravi123", "role": "employee"},
        {"name": "vijay", "email": "vijay@tms.com", "password": "vijay123", "role": "employee"},

        # Extra employees
        {"name": "ajay", "email": "ajay@tms.com", "password": "ajay123", "role": "employee"},
        {"name": "deepa", "email": "deepa@tms.com", "password": "deepa123", "role": "employee"},
    ]

    for u in users:
        existing_user = db.query(User).filter(User.email == u["email"]).first()
        if not existing_user:
            print(f"Creating user: {u['email']}")
            hashed_password = hash_password(u["password"])
            new_user = User(
                name=u["name"],
                email=u["email"],
                password=hashed_password,
                role=u["role"]
            )
            db.add(new_user)
        else:
            print(f"Updating user password: {u['email']}")
            existing_user.password = hash_password(u["password"])
            db.add(existing_user)

    db.commit()
    db.close()
    print("Initialization complete.")

if __name__ == "__main__":
    init_db()
