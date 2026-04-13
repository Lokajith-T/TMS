# Team Management System (TMS)

A complete full-stack Team Management System built with **React**, **FastAPI**, and **PostgreSQL**.

## 🚀 Features
- **JWT Authentication**: Secure login and protected routes.
- **Role-Based Access**: Distinguish between Admin and Employee roles.
- **FastAPI Backend**: High-performance API using SQLAlchemy ORM.
- **PostgreSQL Database**: Scalable database for storing team records.
- **Modern Dashboard**: Clean React dashboard for overseeing team activities.

## 📂 Project Structure
- `backend/`: FastAPI application, database configuration, and models.
- `frontend/`: React application using Vite and Tailwind CSS.

## 🛠️ Setup Instructions

### Backend
1. `cd backend`
2. `pip install -r requirements.txt`
3. Update `.env` with your PostgreSQL credentials.
4. `python init_db.py` (to set up tables and dummy users)
5. `uvicorn app.main:app --reload`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## 🔐 Credentials (Dummy)
- **Admin**: `admin@tms.com` / `admin123`
- **Employee**: `emp1@tms.com` (through `emp5@tms.com`) / `emp123`
