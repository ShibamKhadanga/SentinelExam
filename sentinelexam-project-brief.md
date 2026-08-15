# SentinelExam — Behavioral-Biometric Exam Integrity System
### Project Brief + Genspark Build Prompt

---

## 1. Project Description (for thesis/synopsis use)

**Title:** SentinelExam — A Privacy-Preserving Behavioral-Biometric Exam Integrity Platform

**Problem Statement**
Online exam platforms overwhelmingly rely on continuous webcam/video proctoring to deter cheating. This approach is invasive (constant surveillance of a student's home), bandwidth-heavy (excludes students with poor connectivity), prone to false positives (flags normal behavior like looking away to think), and raises real privacy concerns since raw video of students is recorded and stored.

**Proposed Solution**
SentinelExam replaces continuous video with a lightweight behavioral-biometric fingerprint built from three low-bandwidth signals: typing rhythm (keystroke dynamics), mouse movement patterns, and periodic — not continuous — webcam snapshots for face-match and gaze-direction checks. These signals are fused into a per-time-window "integrity risk score." Sessions crossing a threshold are flagged with supporting evidence for **human instructor review** — the system never auto-fails a student.

**Key Differentiators**
- Behavioral fingerprint instead of continuous video → far lower bandwidth and storage footprint
- Per-student personalized baseline (built during enrollment), not a generic population model → fewer false positives
- Multi-modal fusion (keystroke + mouse + intermittent face/gaze), not single-signal detection
- "Flag for review," not automated punishment → ethically defensible and realistically deployable

**Target Users:** Universities and ed-tech platforms running online/remote assessments — including your own college, which gives you a real pilot-testing path.

**Thesis Novelty Angle:** Quantify the privacy-vs-accuracy tradeoff — benchmark SentinelExam's detection accuracy and false-positive rate against a simulated continuous-video baseline, and measure the bandwidth/storage reduction achieved. That comparison is a genuinely publishable empirical contribution, not just a build.

---

## 2. What Genspark Can and Can't Do Here

Genspark (and similar AI app-builders) is strong at scaffolding the **full-stack shell** — auth, database schema, API routes, the exam-taking UI, the instructor dashboard, telemetry capture wiring. It will **not** produce a properly trained keystroke-anomaly model, face-embedding model, or gaze heuristic out of the box — those need real data and training, which is exactly your ML/thesis contribution. The prompt below asks Genspark to build the full app with clean, pluggable interfaces where those three models slot in, so you can develop and validate them separately and swap them into a working product.

---

## 3. Genspark Build Prompt

Copy everything inside the box below directly into Genspark.

```
Build a full-stack web application called SentinelExam — a privacy-preserving,
behavioral-biometric exam integrity platform for online exams.

USER ROLES
- Student: enrolls, takes exams
- Instructor/Admin: creates exams, reviews flagged sessions, configures thresholds

CORE FEATURES

1. Consent & Enrollment Flow (Student)
   - Clear consent screen explaining exactly what is collected (typing rhythm,
     mouse movement, periodic webcam snapshots) and why, before anything is captured
   - Enrollment step: student types a short baseline passage (captures keystroke
     timing baseline) and captures one reference face photo

2. Exam-Taking Interface (Student)
   - Standard exam UI supporting MCQ and free-text answers
   - Background telemetry capture (silent, non-blocking):
     - Keystroke dynamics: dwell time and flight time between keypresses
     - Mouse movement: path, velocity, idle periods
     - Tab-switch / window-blur events, logged with timestamps
     - Periodic webcam snapshot every 30–60 seconds (NOT continuous video)
   - All telemetry batched and sent to backend at regular intervals

3. Risk Scoring Service (Backend)
   - Ingests telemetry per time window per session
   - Three scoring sources, each behind a clean pluggable interface/stub so a
     real trained model can be swapped in later:
     a. Keystroke-dynamics anomaly score (compares live typing to enrollment baseline)
     b. Face-match confidence score (compares snapshot to enrollment photo)
     c. Gaze/attention heuristic score (flags excessive off-screen looking)
   - A fusion service combines the three into one composite risk score per window
     (implement as a simple weighted-average stub, clearly marked as replaceable)

4. Instructor Dashboard
   - List of exam sessions with an overall risk score and a per-window risk timeline
   - Drill-down view: click a flagged window to see the exact evidence
     (snapshot + telemetry chart) that triggered it
   - Manual actions: confirm, dismiss, or escalate a flag — no automated failing
   - Exam and threshold configuration screen

5. Auth & Data Handling
   - JWT-based auth, separate student/instructor login
   - Store only aggregated per-window features and periodic snapshots — never
     continuous video
   - Configurable auto-delete/retention period for stored snapshots
   - Consent and data-usage disclosure must be shown and accepted before enrollment

TECH STACK
- Frontend: React (Vite) + Tailwind CSS
- Backend: FastAPI (Python)
- Database: PostgreSQL
- Auth: JWT
- Real-time/near-real-time dashboard updates (WebSocket or polling)
- Docker-based setup for local run and deployment

NON-FUNCTIONAL REQUIREMENTS
- Low-bandwidth friendly by design (snapshots, not video streaming)
- Consent-first, transparent UX
- Backend ML integration points must be clearly modular/pluggable, not hardcoded,
  so trained models can be dropped in without restructuring the app

DELIVERABLE
Along with the working app, output a complete recommended project file/folder
structure covering the frontend, backend, and where the three ML model
integration points live, so it can serve as the base for a full BTech final-year
project with pluggable ML components added afterward.
```

---

## 4. Recommended File Structure

If you want a structure to work from immediately (or to compare against whatever Genspark generates):

```
sentinelexam/
├── frontend/                          # React (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── student/
│   │   │   │   ├── ConsentScreen.jsx
│   │   │   │   ├── EnrollmentFlow.jsx
│   │   │   │   └── ExamInterface.jsx
│   │   │   ├── instructor/
│   │   │   │   ├── SessionList.jsx
│   │   │   │   ├── RiskTimeline.jsx
│   │   │   │   ├── EvidenceViewer.jsx
│   │   │   │   └── ReviewActions.jsx
│   │   │   └── shared/
│   │   │       ├── Navbar.jsx
│   │   │       └── AuthForms.jsx
│   │   ├── hooks/
│   │   │   ├── useKeystrokeCapture.js
│   │   │   ├── useMouseCapture.js
│   │   │   └── useWebcamSnapshot.js
│   │   ├── pages/
│   │   ├── api/                       # API client calls to backend
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   └── package.json
│
├── backend/                           # FastAPI
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   │   ├── auth.py
│   │   │   ├── enrollment.py
│   │   │   ├── exam_session.py
│   │   │   ├── telemetry.py           # ingest keystroke/mouse/snapshot data
│   │   │   ├── risk.py                # risk-scoring endpoints
│   │   │   └── dashboard.py           # instructor-facing endpoints
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── security.py            # JWT auth
│   │   ├── db/
│   │   │   ├── models.py              # SQLAlchemy models
│   │   │   ├── schemas.py             # Pydantic schemas
│   │   │   └── session.py
│   │   └── services/
│   │       ├── fusion_engine.py       # combines model outputs into risk score
│   │       └── storage.py             # snapshot capture + retention logic
│   ├── requirements.txt
│   └── Dockerfile
│
├── ml/                                 # trained/integrated separately — your thesis core
│   ├── keystroke_dynamics/
│   │   ├── train.py
│   │   ├── model.pkl
│   │   └── inference.py
│   ├── face_verification/
│   │   ├── embeddings.py
│   │   └── inference.py
│   ├── gaze_attention/
│   │   ├── landmarks.py
│   │   └── inference.py
│   └── notebooks/                     # experiments + evaluation for the thesis
│
├── docs/
│   ├── thesis/                        # proposal, chapters, evaluation results
│   └── architecture-diagram.png
│
├── docker-compose.yml
└── README.md
```
