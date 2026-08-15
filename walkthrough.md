# SentinelExam — Run & Git Setup Guide

> [!NOTE]
> Everything below has been **verified and tested** on your machine. Both the backend API and frontend dev server are currently running.

---

## Part 1: Running Locally in VS Code

### Prerequisites (Already Verified)

| Tool | Version | Status |
|------|---------|--------|
| Python | 3.11.0 | ✅ |
| Node.js | installed | ✅ |
| PostgreSQL | 18 | ✅ |
| Git | 2.53.0 | ✅ |

---

### Step 1 — Open the Project

```
Open VS Code → File → Open Folder → Select f:\Programs\SentinelExam
```

---

### Step 2 — Set Up PostgreSQL Database (One-Time)

Open a **terminal** in VS Code (`Ctrl + ~`):

```powershell
# Set the postgres superuser password
$env:PGPASSWORD='@Shibam947'

# Create the database user and database
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE USER sentinel WITH PASSWORD 'sentinel_pass';"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE sentinelexam OWNER sentinel;"
```

> [!TIP]
> This is already done — skip this step unless you need to reset the database.

---

### Step 3 — Set Up Backend (Terminal 1)

Click the `+` icon in the terminal panel to open **Terminal 1**:

```powershell
# Navigate to backend
cd f:\Programs\SentinelExam\backend

# Create virtual environment (one-time)
python -m venv venv

# Activate the virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies (one-time)
pip install -r requirements.txt

# Run database migrations (one-time)
python -m alembic upgrade head

# Seed demo data (one-time)
python -m app.seed
```

> [!NOTE]
> If you get an execution policy error on `Activate.ps1`, first run:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

---

### Step 4 — Start Backend Server (Terminal 1)

```powershell
# Make sure venv is activated (you should see (venv) in your prompt)
.\venv\Scripts\Activate.ps1

# Start FastAPI server with hot-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

✅ **Verify:** Open [http://localhost:8000/docs](http://localhost:8000/docs) — you'll see the Swagger API docs.

---

### Step 5 — Start Frontend (Terminal 2)

Click `+` to open **Terminal 2**:

```powershell
# Navigate to frontend
cd f:\Programs\SentinelExam\frontend

# Install Node dependencies (one-time)
npm install

# Start the Vite dev server
npm run dev
```

✅ **Verify:** Open [http://localhost:5173](http://localhost:5173) — the SentinelExam landing page.

---

### Step 6 — Test the App

| Action | URL |
|--------|-----|
| Landing page | [http://localhost:5173](http://localhost:5173) |
| Login | [http://localhost:5173/login](http://localhost:5173/login) |
| API Swagger | [http://localhost:8000/docs](http://localhost:8000/docs) |

**Demo Credentials:**

| Role | Email | Password |
|------|-------|----------|
| Instructor | `instructor@sentinel.edu` | `sentinel123` |
| Student | `student@sentinel.edu` | `sentinel123` |

---

### Quick Reference: Day-to-Day Startup

Every time you want to work on the project, open two terminals:

| Terminal 1 (Backend) | Terminal 2 (Frontend) |
|---|---|
| `cd f:\Programs\SentinelExam\backend` | `cd f:\Programs\SentinelExam\frontend` |
| `.\venv\Scripts\Activate.ps1` | — |
| `uvicorn app.main:app --reload --port 8000` | `npm run dev` |
| [localhost:8000/docs](http://localhost:8000/docs) | [localhost:5173](http://localhost:5173) |

---

## Part 2: Git Setup & Push to GitHub

### Step 1 — Create a GitHub Repository

1. Go to [https://github.com/new](https://github.com/new)
2. **Repository name:** `SentinelExam`
3. **Description:** `Privacy-preserving behavioral-biometric exam integrity platform`
4. Set to **Private** (recommended for thesis)
5. **DO NOT** check "Add a README file" (we already have one)
6. **DO NOT** add .gitignore (we already have one)
7. Click **Create repository**

---

### Step 2 — Initialize Git & First Commit

Open a terminal in VS Code at the project root:

```powershell
cd f:\Programs\SentinelExam

# Initialize Git
git init

# Add all files (.gitignore will exclude node_modules, venv, .env, etc.)
git add .

# Check what will be committed (optional)
git status

# Make the initial commit
git commit -m "feat: complete SentinelExam platform - FastAPI backend with async SQLAlchemy, JWT auth, WebSocket - React/Vite frontend with behavioral biometric capture hooks - Pluggable scoring engine (keystroke, face, gaze fusion) - Instructor dashboard with real-time risk timeline - Docker Compose infrastructure"
```

---

### Step 3 — Link to GitHub & Push

Replace `YOUR_USERNAME` with your GitHub username:

```powershell
# Add the remote repository
git remote add origin https://github.com/YOUR_USERNAME/SentinelExam.git

# Rename default branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

> [!IMPORTANT]
> If prompted for a password, use a **Personal Access Token** (not your GitHub password):
> 1. Go to **GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)**
> 2. Click **Generate new token (classic)**
> 3. Check the **repo** scope
> 4. Copy the token and paste it as your password

---

### Step 4 — Verify

Open `https://github.com/YOUR_USERNAME/SentinelExam` — you should see all files with the README rendered.

---

### Future Commits

After making changes:

```powershell
git add .
git commit -m "description of changes"
git push
```

---

## Database Reset (If Needed)

If you ever need a fresh database:

```powershell
$env:PGPASSWORD='@Shibam947'
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "DROP DATABASE IF EXISTS sentinelexam;"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE sentinelexam OWNER sentinel;"

# Then re-run migrations and seed
cd f:\Programs\SentinelExam\backend
.\venv\Scripts\Activate.ps1
python -m alembic upgrade head
python -m app.seed
```
