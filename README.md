# 🔥 FitTrack Lite — Full Stack Fitness Tracker

A full-stack fitness tracking web application with multiple goals, daily check-ins, streak tracking, scheduled future goals, and email verification.

---

## 🗂️ Project Structure

```
fittrack/
├── frontend/          ← React + TypeScript + Vite + Framer Motion
├── backend/           ← Python + Flask + Supabase
└── README.md
```

---

## ⚙️ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite, Framer Motion |
| Backend | Python 3.11+, Flask, Flask-CORS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email verification built-in) |
| Deployment | Render / Railway |

---

## 🚀 STEP 1 — Create Supabase Project

1. Go to **https://supabase.com** → Sign up → New Project
2. Note down:
   - **Project URL** → `https://xxxx.supabase.co`
   - **anon/public key** → from Settings > API
   - **service_role key** → from Settings > API (keep secret!)

3. Go to **SQL Editor** in Supabase dashboard
4. Open `backend/supabase_schema.sql` and **run the entire file**
5. This creates: `profiles`, `goals`, `daily_logs` tables with RLS policies

### Enable Email Verification in Supabase:
- Go to **Authentication > Email Templates** — verification email is on by default
- Go to **Authentication > URL Configuration** → set Site URL to your frontend URL

---

## 🔧 STEP 2 — Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Mac/Linux
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env .env.local
# Edit .env and fill in your Supabase credentials:
#   SUPABASE_URL=https://xxxx.supabase.co
#   SUPABASE_ANON_KEY=your-anon-key
#   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
#   FLASK_SECRET_KEY=any-long-random-string
#   JWT_SECRET_KEY=another-long-random-string
#   FRONTEND_URL=http://localhost:5173

# Run backend
python app.py
# → Backend running at http://localhost:5000
```

---

## 🎨 STEP 3 — Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
# Edit .env and fill in:
#   VITE_API_URL=http://localhost:5000
#   VITE_SUPABASE_URL=https://xxxx.supabase.co
#   VITE_SUPABASE_ANON_KEY=your-anon-key

# Run frontend
npm run dev
# → Frontend running at http://localhost:5173
```

---

## 🌐 API Routes

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | /api/auth/signup | ❌ | Register new user |
| POST | /api/auth/login | ❌ | Login, get JWT |
| POST | /api/auth/logout | ✅ | Logout |
| GET | /api/auth/me | ✅ | Get current user |
| POST | /api/auth/resend-verification | ❌ | Resend verification email |
| POST | /api/auth/refresh | ❌ | Refresh JWT token |
| GET | /api/goals/ | ✅ | Get all goals with stats |
| POST | /api/goals/ | ✅ | Create a new goal |
| PUT | /api/goals/:id | ✅ | Update a goal |
| DELETE | /api/goals/:id | ✅ | Delete goal + logs |
| GET | /api/goals/:id/stats | ✅ | Detailed goal stats |
| GET | /api/logs/ | ✅ | Get logs (filterable) |
| POST | /api/logs/ | ✅ | Save/update a check-in |
| DELETE | /api/logs/:id | ✅ | Delete a log entry |
| GET | /api/logs/today | ✅ | Today's logs |
| GET | /api/profile/ | ✅ | Full profile + all stats |
| PUT | /api/profile/ | ✅ | Update name |
| DELETE | /api/profile/ | ✅ | Delete account |

---

## 🗄️ Database Schema

### profiles
| Column | Type | Notes |
|---|---|---|
| id | UUID | FK → auth.users |
| name | TEXT | |
| email | TEXT | UNIQUE |
| created_at | TIMESTAMPTZ | |

### goals
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → auth.users |
| title | TEXT | |
| duration_days | INTEGER | > 0 |
| start_date | DATE | Can be future date |
| category | TEXT | Enum |
| color | TEXT | Enum |
| notes | TEXT | |
| created_at | TIMESTAMPTZ | |

### daily_logs
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → auth.users |
| goal_id | UUID | FK → goals |
| log_date | DATE | |
| status | TEXT | 'completed' or 'missed' |
| notes | TEXT | |
| created_at | TIMESTAMPTZ | |
| **UNIQUE** | **(user_id, goal_id, log_date)** | ✅ One log per goal per day |

---

## 🚀 Deployment

### Deploy Backend on Render:
1. Push code to GitHub
2. New Web Service → connect repo → set Root Directory to `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `gunicorn "app:create_app()" --bind 0.0.0.0:$PORT`
5. Add all `.env` variables as Environment Variables in Render dashboard

### Deploy Frontend on Vercel / Netlify:
1. Push code to GitHub
2. Import project → set Root Directory to `frontend`
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add `.env` variables in dashboard

---

## ✅ Features

- 🔐 Email verification via Supabase Auth
- 🎯 **Multiple goals** — no artificial limit
- ⏰ **Scheduled future goals** — set start dates ahead of time
- 📅 **One check-in per goal per day** — enforced at DB level (UNIQUE constraint)
- 🔥 Streak tracking per goal
- 📊 Progress bars, completion rates, insights
- 👤 Profile with per-goal breakdown
- 🌊 Animated landing page (Framer Motion floating paths)

---

## 🔑 Key Notes

- The `SUPABASE_SERVICE_ROLE_KEY` is used **server-side only** (backend). Never expose it to the frontend.
- The UNIQUE constraint `(user_id, goal_id, log_date)` in `daily_logs` prevents duplicate check-ins at the database level — not just in code.
- Goals with `start_date > today` are automatically treated as "upcoming" and cannot be checked in until their start date arrives.
