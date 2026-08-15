# 🛡️ SentinelExam

**A Privacy-Preserving Behavioral-Biometric Exam Integrity Platform**

SentinelExam replaces invasive continuous video proctoring with lightweight behavioral biometrics — keystroke dynamics, mouse movement patterns, and periodic webcam snapshots — to detect exam integrity anomalies while respecting student privacy.

## ✨ Key Features

- **Behavioral Fingerprinting** — Keystroke dwell/flight times + mouse path analysis
- **Periodic Snapshots, Not Video** — Low-bandwidth face-match & gaze checks every 30–60s
- **Per-Student Baselines** — Personalized enrollment reduces false positives
- **Multi-Modal Risk Scoring** — Three signals fused into one composite integrity score
- **Human-in-the-Loop** — Flags sessions for instructor review, never auto-fails students
- **Pluggable ML Architecture** — Swap in trained models without restructuring the app

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local frontend development)
- Python 3.11+ (for local backend development)

### Run with Docker
```bash
# 1. Clone and configure
cp .env.example .env
# Edit .env with your settings

# 2. Start all services
docker compose up --build

# 3. Access
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000/docs
# Database: localhost:5432
```

### Demo Accounts (after seeding)
| Role | Email | Password |
|------|-------|----------|
| Instructor | instructor@sentinel.edu | sentinel123 |
| Student | student@sentinel.edu | sentinel123 |

## 🏗️ Architecture

```
Frontend (React + Vite + Tailwind)
    ↕ REST + WebSocket
Backend (FastAPI + Python)
    ↕ Async SQLAlchemy
PostgreSQL 16
```

## 🔬 ML Integration Points

The scoring engine uses a pluggable interface pattern. Each scorer implements `ScoringModelInterface`:

| Module | Location | Stub | Replace With |
|--------|----------|------|-------------|
| Keystroke Dynamics | `backend/app/scoring/keystroke_scorer.py` | Euclidean distance | One-class SVM, Autoencoder |
| Face Matching | `backend/app/scoring/face_scorer.py` | Cosine similarity | FaceNet, ArcFace |
| Gaze Analysis | `backend/app/scoring/gaze_scorer.py` | Pupil-ratio heuristic | GazeNet, MPIIGaze |
| Score Fusion | `backend/app/scoring/fusion.py` | Weighted average | Logistic regression |

## 📁 Project Structure

```
SentinelExam/
├── frontend/          # React + Vite + Tailwind
│   └── src/
│       ├── components/    # UI components by feature
│       ├── hooks/         # Telemetry capture hooks
│       ├── pages/         # Route pages
│       └── contexts/      # Auth state
├── backend/           # FastAPI + Python
│   └── app/
│       ├── api/           # Route handlers
│       ├── models/        # SQLAlchemy ORM
│       ├── schemas/       # Pydantic validation
│       ├── scoring/       # ★ ML integration points
│       ├── services/      # Business logic
│       └── tasks/         # Background jobs
└── docker-compose.yml
```

## 📄 License

MIT — Built as a B.Tech final-year thesis project.
