<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0a0a0f,30:0d1117,60:0f3460,100:00D9FF&height=240&section=header&text=SentinelExam&fontSize=60&fontColor=00D9FF&fontAlignY=38&desc=Privacy-Preserving%20Behavioral-Biometric%20Exam%20Integrity%20Platform&descAlignY=60&descSize=18&descColor=a0c4ff&animation=fadeIn" width="100%"/>

<br/>

🛡️ **Replace invasive video proctoring with lightweight behavioral signals** &nbsp;|&nbsp; 🔒 **Privacy-First by Design**

🎓 **B.Tech Final-Year Project** &nbsp;|&nbsp; 📍 **Kalinga University, Raipur** &nbsp;|&nbsp; 👨‍💻 **Shibam Khadanga**

<br/>

![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Python](https://img.shields.io/badge/Python_3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

<br/>

[![GitHub](https://img.shields.io/badge/GitHub-ShibamKhadanga-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/ShibamKhadanga)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Shibam_Khadanga-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/shibam-khadanga-b91436286)

</div>

---

## 🧠 Problem Statement

Online exam platforms rely on **continuous video proctoring** — an approach that is:

| ❌ Problem | Impact |
|:---|:---|
| **Invasive** | Constant surveillance of a student's home environment |
| **Bandwidth-heavy** | ~2 GB/hr excludes students with poor connectivity |
| **Error-prone** | Flags normal behavior like looking away to think |
| **Privacy-violating** | Raw video of students is recorded and stored |

## ✅ Our Solution

SentinelExam captures **three low-bandwidth signals (~5 MB/hr)** and fuses them into a composite risk score:

| Signal | What It Measures | Bandwidth |
|:---:|:---|:---:|
| ⌨️ **Keystroke Dynamics** | Typing rhythm — dwell time, flight time, WPM | ~2 KB/window |
| 🖱️ **Mouse Movement** | Velocity, distance, idle periods, click patterns | ~3 KB/window |
| 📸 **Periodic Snapshots** | Face match + gaze direction (every 45s, not continuous) | ~50 KB each |

> **The system never auto-fails a student.** Flagged sessions are sent to instructors for human review with supporting evidence.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────┐
│                   Frontend                       │
│         React + Vite + Tailwind CSS v4           │
│                                                  │
│  ┌────────┐ ┌──────────┐ ┌────────────────────┐ │
│  │Landing │ │ Student  │ │  Instructor        │ │
│  │Login   │ │ Enroll   │ │  Dashboard         │ │
│  │Register│ │ Exam     │ │  Session Review    │ │
│  │        │ │ Sessions │ │  Exam Management   │ │
│  └────────┘ └──────────┘ │  Settings          │ │
│                          └────────────────────┘ │
│  Hooks: useKeystrokeDynamics, useMouseTracking, │
│         useTabVisibility, useWebSocket          │
└───────────────────┬─────────────────────────────┘
                    │ REST API + WebSocket
┌───────────────────┴─────────────────────────────┐
│                   Backend                        │
│              FastAPI (async)                     │
│                                                  │
│  ┌──────────────┐  ┌────────────────────────┐   │
│  │ API Routes   │  │ Scoring Engine         │   │
│  │ Auth         │  │ ┌────────────────────┐ │   │
│  │ Enrollment   │  │ │ScoringModelInterface│ │   │
│  │ Exams        │  │ ├────────────────────┤ │   │
│  │ Sessions     │  │ │ KeystrokeScorer    │ │   │
│  │ Telemetry    │  │ │ FaceScorer         │ │   │
│  │ Dashboard    │  │ │ GazeScorer         │ │   │
│  │ WebSocket    │  │ │ FusionService      │ │   │
│  └──────────────┘  │ └────────────────────┘ │   │
│                    └────────────────────────┘   │
│  SQLAlchemy (async) + Alembic + PostgreSQL      │
└─────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

<div align="center">

**⚡ Backend**

![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy_2.0-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white)
![Pydantic](https://img.shields.io/badge/Pydantic_v2-E92063?style=for-the-badge&logo=pydantic&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT_Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

**🎨 Frontend**

![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-22B5BF?style=for-the-badge&logo=recharts&logoColor=white)

**🔧 Infrastructure**

![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white)
![Alembic](https://img.shields.io/badge/Alembic-6BA81E?style=for-the-badge&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-010101?style=for-the-badge&logo=websocket&logoColor=white)

</div>

---

## 📂 Project Structure

```
SentinelExam/
├── .env.example                 # Environment template
├── .gitignore
├── docker-compose.yml           # PostgreSQL + Backend + Frontend
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/                 # Database migrations
│   └── app/
│       ├── main.py              # FastAPI entry point
│       ├── config.py            # Pydantic settings
│       ├── database.py          # Async SQLAlchemy engine
│       ├── seed.py              # Demo data seeder
│       ├── models/              # 6 ORM models
│       ├── schemas/             # Pydantic request/response schemas
│       ├── scoring/             # Pluggable scoring engine
│       │   ├── base.py          # ScoringModelInterface (ABC)
│       │   ├── keystroke_scorer.py
│       │   ├── face_scorer.py
│       │   ├── gaze_scorer.py
│       │   └── fusion.py        # Weighted score fusion
│       ├── services/            # Auth service (JWT + bcrypt)
│       └── api/                 # Route modules
│           ├── auth.py
│           ├── enrollment.py
│           ├── exams.py
│           ├── sessions.py
│           ├── telemetry.py
│           ├── dashboard.py
│           └── websocket.py
│
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    └── src/
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

## 🚀 Quick Start

### Prerequisites

| Tool | Version |
|:---:|:---:|
| ![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white) | 3.11+ |
| ![Node](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs&logoColor=white) | 18+ |
| ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-316192?style=flat-square&logo=postgresql&logoColor=white) | 15+ |

### 1️⃣ Clone & Configure

```bash
git clone https://github.com/ShibamKhadanga/SentinelExam.git
cd SentinelExam
cp .env.example .env
```

### 2️⃣ Database Setup

```sql
CREATE USER sentinel WITH PASSWORD 'sentinel_pass';
CREATE DATABASE sentinelexam OWNER sentinel;
```

### 3️⃣ Backend

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

> 📖 API docs at [http://localhost:8000/docs](http://localhost:8000/docs)

### 4️⃣ Frontend

```bash
cd frontend
npm install
npm run dev
```

> 🌐 App at [http://localhost:5173](http://localhost:5173)

### 🐳 Docker (Alternative)

```bash
cp .env.example .env
docker-compose up --build
```

> Frontend at `http://localhost:3000` &nbsp;|&nbsp; API at `http://localhost:8000`

---

## 🔑 Demo Credentials

| Role | Email | Password |
|:---:|:---|:---:|
| 👩‍🏫 **Instructor** | `instructor@sentinel.edu` | `sentinel123` |
| 🎓 **Student** | `student@sentinel.edu` | `sentinel123` |

---

## 🔌 API Endpoints

<details>
<summary><b>📋 Click to expand full API reference (21 endpoints)</b></summary>

<br/>

| Method | Endpoint | Auth | Description |
|:---:|:---|:---:|:---|
| `POST` | `/api/auth/register` | — | Register new user |
| `POST` | `/api/auth/login` | — | Login, returns JWT |
| `POST` | `/api/auth/refresh` | 🔒 | Refresh access token |
| `GET` | `/api/auth/profile` | 🔒 | Current user profile |
| `GET` | `/api/enrollment/status` | 🎓 | Enrollment status |
| `POST` | `/api/enrollment/consent` | 🎓 | Accept privacy consent |
| `POST` | `/api/enrollment/keystroke-baseline` | 🎓 | Submit typing baseline |
| `POST` | `/api/enrollment/face` | 🎓 | Upload face photo |
| `GET` | `/api/exams/` | 🔒 | List exams |
| `POST` | `/api/exams/` | 👩‍🏫 | Create exam |
| `GET` | `/api/sessions/` | 🔒 | List sessions |
| `POST` | `/api/sessions/start` | 🎓 | Start exam session |
| `POST` | `/api/sessions/{id}/submit` | 🎓 | Submit exam |
| `POST` | `/api/telemetry/window` | 🎓 | Submit telemetry window |
| `POST` | `/api/telemetry/snapshot` | 🎓 | Upload webcam snapshot |
| `GET` | `/api/dashboard/stats` | 👩‍🏫 | Dashboard statistics |
| `GET` | `/api/dashboard/sessions` | 👩‍🏫 | Session list with filters |
| `GET` | `/api/dashboard/sessions/{id}` | 👩‍🏫 | Session detail + evidence |
| `GET` | `/api/dashboard/sessions/{id}/timeline` | 👩‍🏫 | Risk score timeline |
| `POST` | `/api/dashboard/sessions/{id}/review` | 👩‍🏫 | Review flagged session |
| `WS` | `/ws/dashboard` | — | Real-time score updates |

> 🔒 = Any authenticated user &nbsp;|&nbsp; 🎓 = Student only &nbsp;|&nbsp; 👩‍🏫 = Instructor only

</details>

---

## 🎯 Key Design Decisions

### 🔒 Privacy-First Architecture
- **No continuous video** — periodic snapshots every 45 seconds
- **Local processing** — face embeddings compared on-server, not sent to cloud
- **Auto-delete** — snapshots purged after configurable retention period
- **Human-in-the-loop** — system flags, never auto-fails students

### 🧩 Pluggable Scoring Engine
The scoring system follows a `ScoringModelInterface` (abstract base class). Current implementation uses **deterministic heuristics** as stubs — real ML models can be swapped in:

```python
class ScoringModelInterface(ABC):
    @abstractmethod
    async def score(self, features: dict, baseline: dict | None) -> ScoringResult:
        """Score a telemetry window and return risk score + evidence."""
```

### ⚖️ Configurable Weights & Thresholds

| Parameter | Default |
|:---|:---:|
| Keystroke Weight | 35% |
| Face Match Weight | 40% |
| Gaze Direction Weight | 25% |
| Low Risk | < 30% |
| Medium Risk | < 60% |
| High Risk | < 80% |
| Critical Risk | ≥ 80% |

---

## 📊 Bandwidth Comparison

<div align="center">

| Metric | 🎥 Video Proctoring | 🛡️ SentinelExam |
|:---|:---:|:---:|
| **Bandwidth** | ~2 GB/hr | **~5 MB/hr** |
| **Signals** | Raw video stream | Keystroke + Mouse + Snapshots |
| **Processing** | Cloud GPU required | CPU heuristics (pluggable) |
| **Privacy** | Continuous recording | Periodic snapshots, auto-deleted |
| **False Positives** | High | Low (human review required) |

</div>

---

## 👨‍💻 Author

<div align="center">

**Shibam Khadanga**

*B.Tech Computer Science — Kalinga University, Raipur*

[![GitHub](https://img.shields.io/badge/GitHub-ShibamKhadanga-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/ShibamKhadanga)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Shibam_Khadanga-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/shibam-khadanga-b91436286)
[![Gmail](https://img.shields.io/badge/Gmail-shibamkhadanga947-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:shibamkhadanga947@gmail.com)

</div>

---

## 📝 License

This project is developed as part of academic research for B.Tech Final-Year Project at Kalinga University. All rights reserved.

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:00D9FF,50:0f3460,100:0a0a0f&height=120&section=footer&animation=fadeIn" width="100%"/>

**⭐ Star this repo if you find it useful — it really motivates me!**

*"Privacy is not about having something to hide. It's about having something to protect."*

</div>
