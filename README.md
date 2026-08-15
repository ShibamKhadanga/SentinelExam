# SentinelExam

**A Privacy-Preserving Behavioral-Biometric Exam Integrity Platform**

> Replace continuous webcam proctoring with lightweight behavioral signals — keystroke dynamics, mouse patterns, and periodic snapshots — fused into a per-window integrity risk score.

---

## Problem

Online exam platforms rely on **continuous video proctoring** which is:
- **Invasive** — constant surveillance of a student's home
- **Bandwidth-heavy** — ~2 GB/hr excludes students with poor connectivity
- **Error-prone** — flags normal behavior like looking away to think
- **Privacy-violating** — raw video of students is recorded and stored

## Solution

SentinelExam captures three **low-bandwidth signals** (~5 MB/hr) and fuses them into a composite risk score:

| Signal | What It Measures | Bandwidth |
|--------|-----------------|-----------|
| **Keystroke Dynamics** | Typing rhythm (dwell time, flight time, WPM) | ~2 KB/window |
| **Mouse Movement** | Velocity, distance, idle periods, click patterns | ~3 KB/window |
| **Periodic Snapshots** | Face match + gaze direction (every 45s, not continuous) | ~50 KB each |

Sessions crossing a threshold are **flagged with evidence** for human instructor review — **the system never auto-fails a student**.

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│                   Frontend                        │
│         React + Vite + Tailwind CSS v4            │
│                                                   │
│  ┌────────┐ ┌──────────┐ ┌────────────────────┐  │
│  │Landing │ │ Student  │ │  Instructor         │  │
│  │Login   │ │ Enroll   │ │  Dashboard          │  │
│  │Register│ │ Exam     │ │  Session Review     │  │
│  │        │ │ Sessions │ │  Exam Management    │  │
│  └────────┘ └──────────┘ │  Settings           │  │
│                          └────────────────────┘   │
│  Hooks: useKeystrokeDynamics, useMouseTracking,   │
│         useTabVisibility, useWebSocket            │
└───────────────────┬──────────────────────────────┘
                    │ REST API + WebSocket
┌───────────────────┴──────────────────────────────┐
│                   Backend                         │
│              FastAPI (async)                      │
│                                                   │
│  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ API Routes   │  │ Scoring Engine            │  │
│  │ Auth         │  │ ┌─────────────────────┐  │  │
│  │ Enrollment   │  │ │ ScoringModelInterface│  │  │
│  │ Exams        │  │ ├─────────────────────┤  │  │
│  │ Sessions     │  │ │ KeystrokeScorer     │  │  │
│  │ Telemetry    │  │ │ FaceScorer          │  │  │
│  │ Dashboard    │  │ │ GazeScorer          │  │  │
│  │ WebSocket    │  │ │ FusionService       │  │  │
│  └──────────────┘  │ └─────────────────────┘  │  │
│                    └──────────────────────────┘   │
│  SQLAlchemy (async) + Alembic + PostgreSQL        │
└──────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Tailwind CSS v4, Recharts, Lucide React |
| **Backend** | FastAPI, SQLAlchemy 2.0 (async), Pydantic v2, Alembic |
| **Database** | PostgreSQL 18 + asyncpg |
| **Auth** | JWT (access + refresh tokens), bcrypt password hashing |
| **Real-time** | WebSocket (FastAPI/Starlette) |
| **Scoring** | Pluggable interface — deterministic heuristic stubs (no real ML shipped) |
| **Infrastructure** | Docker Compose, Nginx reverse proxy |

---

## Project Structure

```
SentinelExam/
├── .env.example                 # Environment template
├── .gitignore
├── docker-compose.yml           # PostgreSQL + Backend + Frontend
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt         # Python dependencies
│   ├── alembic.ini
│   ├── alembic/                 # Database migrations
│   └── app/
│       ├── main.py              # FastAPI entry point
│       ├── config.py            # Pydantic settings
│       ├── database.py          # Async SQLAlchemy engine
│       ├── seed.py              # Demo data seeder
│       ├── models/              # 6 ORM models (User, Exam, Session, etc.)
│       ├── schemas/             # Pydantic request/response schemas
│       ├── scoring/             # Pluggable scoring engine
│       │   ├── base.py          # ScoringModelInterface (ABC)
│       │   ├── keystroke_scorer.py
│       │   ├── face_scorer.py
│       │   ├── gaze_scorer.py
│       │   └── fusion.py        # Weighted score fusion
│       ├── services/            # Auth service (JWT + bcrypt)
│       └── api/                 # Route modules
│           ├── auth.py          # Register, login, refresh, profile
│           ├── enrollment.py    # Consent, typing baseline, face capture
│           ├── exams.py         # CRUD + questions
│           ├── sessions.py      # Start, submit, answer
│           ├── telemetry.py     # Keystroke/mouse/snapshot ingestion
│           ├── dashboard.py     # Stats, sessions, timeline, review
│           └── websocket.py     # Real-time score broadcasting
│
└── frontend/
    ├── Dockerfile
    ├── nginx.conf               # Production proxy config
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx              # Router with 14 routes
        ├── index.css            # Complete design system
        ├── api/                 # Axios client with JWT refresh
        ├── contexts/            # AuthContext
        ├── hooks/               # 4 biometric capture hooks
        ├── components/layout/   # Navbar, ProtectedRoute
        └── pages/
            ├── LandingPage.jsx
            ├── LoginPage.jsx
            ├── RegisterPage.jsx
            ├── student/         # Enrollment, ExamList, Exam, Sessions
            └── instructor/      # Dashboard, SessionDetail, ExamManage, Settings
```

---

## Quick Start

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **PostgreSQL 15+**

### 1. Clone & Configure

```bash
git clone https://github.com/YOUR_USERNAME/SentinelExam.git
cd SentinelExam
cp .env.example .env
```

### 2. Database Setup

```sql
CREATE USER sentinel WITH PASSWORD 'sentinel_pass';
CREATE DATABASE sentinelexam OWNER sentinel;
```

### 3. Backend

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\Activate.ps1
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
python -m alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload --port 8000
```

→ API docs at [http://localhost:8000/docs](http://localhost:8000/docs)

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

→ App at [http://localhost:5173](http://localhost:5173)

### 5. Docker (Alternative)

```bash
cp .env.example .env
docker-compose up --build
```

→ Frontend at `http://localhost:3000`, API at `http://localhost:8000`

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Instructor | `instructor@sentinel.edu` | `sentinel123` |
| Student | `student@sentinel.edu` | `sentinel123` |

---

## Key Design Decisions

### Privacy-First Architecture
- **No continuous video** — periodic snapshots every 45 seconds
- **Local processing** — face embeddings compared on-server, not sent to cloud
- **Auto-delete** — snapshots purged after configurable retention period
- **Human-in-the-loop** — system flags, never auto-fails students

### Pluggable Scoring Engine
The scoring system follows a `ScoringModelInterface` (abstract base class). Current implementation uses **deterministic heuristics** as stubs. Real ML models can be swapped in by implementing the interface:

```python
class ScoringModelInterface(ABC):
    @abstractmethod
    async def score(self, features: dict, baseline: dict | None) -> ScoringResult:
        """Score a telemetry window and return risk score + evidence."""
```

### Configurable Weights & Thresholds
- Scoring weights: Keystroke (35%), Face (40%), Gaze (25%)
- Risk thresholds: Low (<30%), Medium (<60%), High (<80%), Critical (≥80%)
- All configurable via environment variables or the Settings UI

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login, returns JWT |
| POST | `/api/auth/refresh` | JWT | Refresh access token |
| GET | `/api/auth/profile` | JWT | Current user profile |
| GET | `/api/enrollment/status` | Student | Enrollment status |
| POST | `/api/enrollment/consent` | Student | Accept privacy consent |
| POST | `/api/enrollment/keystroke-baseline` | Student | Submit typing baseline |
| POST | `/api/enrollment/face` | Student | Upload face photo |
| GET | `/api/exams/` | JWT | List exams |
| POST | `/api/exams/` | Instructor | Create exam |
| GET | `/api/sessions/` | JWT | List sessions |
| POST | `/api/sessions/start` | Student | Start exam session |
| POST | `/api/sessions/{id}/submit` | Student | Submit exam |
| POST | `/api/telemetry/window` | Student | Submit telemetry window |
| POST | `/api/telemetry/snapshot` | Student | Upload webcam snapshot |
| GET | `/api/dashboard/stats` | Instructor | Dashboard statistics |
| GET | `/api/dashboard/sessions` | Instructor | Session list with filters |
| GET | `/api/dashboard/sessions/{id}` | Instructor | Session detail + evidence |
| GET | `/api/dashboard/sessions/{id}/timeline` | Instructor | Risk score timeline |
| POST | `/api/dashboard/sessions/{id}/review` | Instructor | Review flagged session |
| WS | `/ws/dashboard` | — | Real-time score updates |

---

## Bandwidth Comparison

| Metric | Video Proctoring | SentinelExam |
|--------|-----------------|--------------|
| Bandwidth | ~2 GB/hr | ~5 MB/hr |
| Signals | Raw video stream | Keystroke + Mouse + Snapshots |
| Processing | Cloud GPU required | CPU heuristics (pluggable) |
| Privacy | Continuous recording | Periodic snapshots, auto-deleted |
| False positives | High | Low (human review required) |

---

## License

This project is developed as part of academic research. All rights reserved.

---

## Author

Built with FastAPI, React, and PostgreSQL.
