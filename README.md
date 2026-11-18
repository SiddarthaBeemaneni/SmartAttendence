# SmartAttend AI

**AI-Powered Attendance Monitoring and Automated Parent Calling System**

A full-stack web application for college attendance management with AI-powered automated parent calling when students are absent.

## Features

- **Role-based access**: Admin, Faculty, Student, Parent dashboards
- **Attendance management**: Mark, draft, finalize attendance
- **AI parent calling**: Automated calls to parents when students are absent
- **6-language support**: Tamil, English, Telugu, Hindi, Malayalam, Kannada
- **Call analytics**: Logs, transcripts, and reports
- **Responsive UI**: Works on desktop, tablet, and mobile

## Tech Stack

- **Frontend**: React 18 + Vite, Tailwind CSS, React Router, Axios
- **Backend**: Python FastAPI, SQLAlchemy, Alembic
- **Database**: PostgreSQL
- **AI**: Sarvam AI (speech), LLM (conversation), Exotel (telephony)

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 15+

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Project Structure

```
├── frontend/          # React + Vite app
├── backend/           # FastAPI Python app
├── .gitignore
└── README.md
```
