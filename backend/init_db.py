from app.db.database import SessionLocal, engine, Base
from app.models.user import User
from app.core.auth import hash_password

def init_db():
    print("Initializing database...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    users = [
        {"name": "Admin User", "email": "admin@tms.com", "password": "admin123", "role": "admin"},
        {"name": "Employee One", "email": "emp1@tms.com", "password": "emp123", "role": "employee"},
        {"name": "Employee Two", "email": "emp2@tms.com", "password": "emp123", "role": "employee"},
        {"name": "Employee Three", "email": "emp3@tms.com", "password": "emp123", "role": "employee"},
        {"name": "Employee Four", "email": "emp4@tms.com", "password": "emp123", "role": "employee"},
        {"name": "Employee Five", "email": "emp5@tms.com", "password": "emp123", "role": "employee"},
    ]

    for u in users:
        existing_user = db.query(User).filter(User.email == u["email"]).first()
        if not existing_user:
            print(f"Creating user: {u['email']}")
            new_user = User(
                name=u["name"],
                email=u["email"],
                password=hash_password(u["password"]),
                role=u["role"]
            )
            db.add(new_user)
        else:
            print(f"User {u['email']} already exists skipping.")

    db.commit()
    db.close()
    print("Initialization complete.")

if __name__ == "__main__":
    init_db()
