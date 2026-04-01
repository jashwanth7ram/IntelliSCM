# How to run IntelliSCM locally

This guide covers the **full stack**: React frontend (Vite), Node.js API (Express), FastAPI ML service, and MongoDB.

## Prerequisites

| Tool | Notes |
|------|--------|
| **Node.js** | v18+ (includes `npm`) |
| **Python** | 3.10+ (for the ML service) |
| **MongoDB** | Atlas URI or local MongoDB |
| **Git** | To clone the repo |

---

## 1. Clone and install dependencies

```bash
git clone https://github.com/jashwanth7ram/IntelliSCM.git
cd IntelliSCM
```

### Root (optional — used for one-command start)

```bash
npm install
```

### Backend

```bash
cd backend
npm install
cd ..
```

### Frontend

```bash
cd frontend
npm install
cd ..
```

### ML service (Python)

```bash
cd ml-service
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

If `model.pkl` is missing, train (or copy a model in):

```bash
cd ml-service
source venv/bin/activate
python train.py
cd ..
```

---

## 2. Environment variables

### Backend — `backend/.env`

Create `backend/.env` (do not commit secrets):

```env
PORT=5001
MONGODB_URI=mongodb+srv://USER:PASS@CLUSTER.mongodb.net/DATABASE?retryWrites=true&w=majority
JWT_SECRET=your_long_random_secret
```

Optional (email notifications):

```env
SMTP_USER=your.email@gmail.com
SMTP_PASS=your_app_password
```

### Frontend — `frontend/.env`

```env
VITE_API_URL=http://localhost:5001/api
VITE_ML_URL=http://localhost:8000
```

Use the **same API port** as `PORT` in the backend. After changing `.env`, restart the Vite dev server.

---

## 3. Run everything (recommended)

From the **repository root** (`IntelliSCM/`):

```bash
npm start
```

This starts, in parallel:

| Service | Command | Default URL |
|---------|---------|-------------|
| **API (Express)** | `npm run dev` in `backend/` | `http://localhost:5001` |
| **Frontend (Vite)** | `npm run dev` in `frontend/` | `http://localhost:5173` (or next free port) |
| **ML (Uvicorn)** | `scripts/run-ml.sh` | `http://127.0.0.1:8000` |

Open the **frontend** URL printed in the terminal (if 5173 is busy, Vite may use 5174 or 5175).

- **REST API base:** `http://localhost:5001/api`
- **Swagger UI:** `http://localhost:5001/api-docs`
- **ML docs:** `http://127.0.0.1:8000/docs`

Stop all processes with **Ctrl+C** in that terminal.

---

## 4. Run services separately (alternative)

### Terminal A — Backend

```bash
cd backend
npm run dev
```

### Terminal B — Frontend

```bash
cd frontend
npm run dev
```

### Terminal C — ML

```bash
cd ml-service
source venv/bin/activate   # Windows: venv\Scripts\activate
python3 -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

---

## 5. Demo data (optional)

With MongoDB connected and `backend/.env` set:

```bash
cd backend
npm run seed
```

To **replace** existing demo data:

```bash
SEED_FORCE=1 npm run seed
```

Demo users use the `intelliscm.demo` domain and password **`Demo123!`** (see seed script output).

---

## 6. Production / deployment notes

- **Vercel** (or similar) usually hosts only the **static frontend build** (`npm run build` in `frontend/`). Set `VITE_API_URL` and `VITE_ML_URL` to your **deployed** API and ML URLs at build time.
- Run the **Express API** and **ML service** on a host that supports long-running processes (e.g. Render, Railway, Fly.io, VPS).

---

## 7. Troubleshooting

| Issue | What to try |
|--------|-------------|
| `EADDRINUSE` on a port | Stop the other process or change `PORT` / Vite port. |
| MongoDB connection errors | Check `MONGODB_URI`, IP allowlist (Atlas), and network. |
| Frontend calls wrong API | Match `VITE_API_URL` to backend `PORT` and rebuild/restart Vite. |
| ML predict returns 503 | Ensure `model.pkl` exists or run `python train.py` in `ml-service`. |

For architecture and DevOps features, see `DEVOPS_EXTENSION.md`.
