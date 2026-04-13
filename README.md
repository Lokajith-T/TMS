# Team Management System (TMS)

A complete full-stack Team Management System built with **React**, **FastAPI**, and **PostgreSQL**.

## 🚀 Features
- **JWT Authentication**: Secure login and protected routes.
- **Role-Based Access**: Distinguish between Admin and Employee roles.
- **FastAPI Backend**: High-performance API using SQLAlchemy ORM.
- **PostgreSQL Database**: Scalable database for storing team records.
- **Clean Frontend Architecture**: Organized into Pages, API, and Components.

## 📂 Project Structure
```text
TMS/
├── 📂 backend/         # FastAPI application
│   ├── 📂 app/         # Logic, Models, Schemas
│   ├── 📄 .env          # Secrets (Ignored)
│   ├── 📄 init_db.py    # Database setup script
│   └── 📄 requirements.txt
│
├── 📂 src/             # Frontend source
│   ├── 📂 api/         # Centralized API calls (api.js)
│   ├── 📂 pages/       # Application screens (Login, Dashboard)
│   ├── 📂 components/  # Reusable UI components
│   └── 📂 context/     # Auth/Global state
│
├── 📂 public/          # Static assets
├── 📄 .gitignore        # Environment & Cache exclusion
└── 📄 README.md         # Project documentation
```

## 🛠️ Setup Instructions

### 1. Backend Setup
1. `cd backend`
2. `pip install -r requirements.txt`
3. Update `.env` with your PostgreSQL credentials.
4. `python init_db.py` (to set up tables and dummy users)
5. `uvicorn app.main:app --reload`

### 2. Frontend Setup
1. `npm install`
2. `npm run dev`

## 🔐 Credentials (Dummy)
- **Admin**: `admin@tms.com` / `admin123`
- **Employee**: `emp1@tms.com` (through `emp5@tms.com`) / `emp123`
