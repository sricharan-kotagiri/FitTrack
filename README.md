# 🔥 FitTrack Lite — Full Stack Fitness Tracker

A full-stack fitness tracking web application with multiple goals, daily check-ins, streak tracking, scheduled future goals, and email verification.

**Live Demo:** [Coming Soon]

---

## 🗂️ Project Structure

```
fittrack-lite/
├── frontend/                    ← React + TypeScript + Vite + Framer Motion
│   ├── src/
│   │   ├── components/          ← AppLayout
│   │   ├── hooks/               ← useAuth (Supabase auth context)
│   │   ├── lib/                 ← api.ts (Supabase client), supabase.ts
│   │   ├── pages/               ← Landing, Login, Signup, Dashboard, Goals, Checkin, Profile
│   │   ├── index.css            ← Premium dark theme
│   │   └── main.tsx             ← React Router setup
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── backend/                     ← Python + Flask (optional, not used in production)
│   ├── routes/                  ← Auth, Goals, Logs, Profile routes
│   ├── app.py
│   ├── config.py
│   ├── requirements.txt
│   └── supabase_schema.sql      ← Database schema
├── .gitignore
└── README.md
```

---

## ⚙️ Tech Stack

| Layer | Tech |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Framer Motion, React Router |
| **Backend** | Supabase (PostgreSQL) + Supabase Auth |
| **API** | Supabase JS Client (direct from browser) |
| **Styling** | Premium dark theme with glassmorphism |
| **Deployment** | Vercel / Netlify (frontend), Supabase (database) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account (free tier works)
- Git

### 1️⃣ Create Supabase Project

1. Go to **https://supabase.com** → Sign up → New Project
2. Note down:
   - **Project URL** → `https://xxxx.supabase.co`
   - **Anon Key** → from Settings > API
   - **Service Role Key** → from Settings > API (keep secret!)

3. Go to **SQL Editor** in Supabase dashboard
4. Open `backend/supabase_schema.sql` and **run the entire file**
5. This creates: `profiles`, `goals`, `daily_logs` tables with RLS policies

### Enable Email Verification in Supabase:
- Go to **Authentication > Email Templates** — verification email is on by default
- Go to **Authentication > URL Configuration** → set Site URL to your frontend URL

---

### 2️⃣ Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_NAME=FitTrack Lite
EOF

# Run development server
npm run dev
# → Frontend running at http://localhost:5173

# Build for production
npm run build
# → Output in dist/
```

---

### 3️⃣ Backend Setup (Optional - Not Used in Production)

The backend is included for reference but **not required** for the production app. The frontend calls Supabase directly.

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Mac/Linux
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cat > .env << EOF
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FLASK_ENV=development
FLASK_DEBUG=1
FLASK_SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
FRONTEND_URL=http://localhost:5173
EOF

# Run backend (for development/testing only)
python app.py
# → Backend running at http://localhost:5000
```

---

## 🌐 Frontend Pages

| Page | Route | Auth | Description |
|---|---|---|---|
| Landing | `/` | ❌ | Hero page with animations |
| Login | `/login` | ❌ | Email + password login |
| Signup | `/signup` | ❌ | Register new account |
| Dashboard | `/dashboard` | ✅ | Overview of all goals |
| Goals | `/goals` | ✅ | Create, edit, delete goals |
| Check-in | `/checkin` | ✅ | Log daily activity |
| Profile | `/profile` | ✅ | Account settings + stats |

---

## 🗄️ Database Schema

### profiles
```sql
id (UUID) → auth.users
name (TEXT)
email (TEXT, UNIQUE)
created_at (TIMESTAMPTZ)
```

### goals
```sql
id (UUID, PK)
user_id (UUID) → auth.users
title (TEXT)
duration_days (INTEGER)
start_date (DATE)
category (TEXT)
color (TEXT)
notes (TEXT)
created_at (TIMESTAMPTZ)
```

### daily_logs
```sql
id (UUID, PK)
user_id (UUID) → auth.users
goal_id (UUID) → goals
log_date (DATE)
status (TEXT: 'completed' | 'missed')
notes (TEXT)
created_at (TIMESTAMPTZ)
UNIQUE(user_id, goal_id, log_date) ← One log per goal per day
```

---

## 🚀 Deployment

### Deploy Frontend on Vercel

```bash
# 1. Push to GitHub
git push origin main

# 2. Go to https://vercel.com → Import Project
# 3. Select your GitHub repo
# 4. Configure:
#    - Root Directory: frontend
#    - Build Command: npm run build
#    - Output Directory: dist
# 5. Add Environment Variables:
#    - VITE_SUPABASE_URL
#    - VITE_SUPABASE_ANON_KEY
# 6. Deploy!
```

### Deploy Frontend on Netlify

```bash
# 1. Push to GitHub
git push origin main

# 2. Go to https://netlify.com → New site from Git
# 3. Select your GitHub repo
# 4. Configure:
#    - Base directory: frontend
#    - Build command: npm run build
#    - Publish directory: dist
# 5. Add Environment Variables:
#    - VITE_SUPABASE_URL
#    - VITE_SUPABASE_ANON_KEY
# 6. Deploy!
```

### Deploy Backend on Render (Optional)

```bash
# 1. Push to GitHub
git push origin main

# 2. Go to https://render.com → New Web Service
# 3. Connect your GitHub repo
# 4. Configure:
#    - Root Directory: backend
#    - Build Command: pip install -r requirements.txt
#    - Start Command: gunicorn "app:create_app()" --bind 0.0.0.0:$PORT
# 5. Add Environment Variables (all from .env)
# 6. Deploy!
```

---

## ✅ Features

- 🔐 **Email verification** via Supabase Auth
- 🎯 **Multiple goals** — unlimited goals per user
- ⏰ **Scheduled future goals** — set start dates ahead of time
- 📅 **One check-in per goal per day** — enforced at DB level
- 🔥 **Streak tracking** per goal
- 📊 **Progress bars** and completion rates
- 👤 **Profile dashboard** with per-goal breakdown
- 🌊 **Animated landing page** with Framer Motion
- 🎨 **Premium dark theme** with glassmorphism effects
- 📱 **Responsive design** — works on mobile, tablet, desktop

---

## 🔑 Key Architecture Decisions

### Frontend-Only Supabase Client
- The frontend calls Supabase directly using the **Supabase JS client**
- No Flask backend needed for production
- Faster, simpler, fewer moving parts
- Supabase handles auth, database, and RLS policies

### Row-Level Security (RLS)
- All tables have RLS policies enabled
- Users can only see/modify their own data
- Enforced at the database level, not in code

### One Log Per Goal Per Day
- `UNIQUE(user_id, goal_id, log_date)` constraint in `daily_logs`
- Prevents duplicate check-ins at the database level
- Upsert operation updates existing log if present

### Timezone-Aware Date Calculations
- All dates stored as `DATE` type (no timezone)
- Frontend parses dates with explicit time: `new Date(dateStr + 'T00:00:00')`
- Prevents timezone offset issues

---

## 🛠️ Development

### Build Frontend
```bash
cd frontend
npm run build
```

### Run Frontend Dev Server
```bash
cd frontend
npm run dev
```

### Run Backend (Optional)
```bash
cd backend
python app.py
```

### Type Checking
```bash
cd frontend
npx tsc --noEmit
```

---

## 📝 Environment Variables

### Frontend (.env)
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_NAME=FitTrack Lite
```

### Backend (.env) - Optional
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FLASK_ENV=development
FLASK_DEBUG=1
FLASK_SECRET_KEY=your-secret
JWT_SECRET_KEY=your-jwt-secret
FRONTEND_URL=http://localhost:5173
```

---

## 🐛 Troubleshooting

### "Cannot read properties of undefined (reading 'pct')"
- This happens when a goal is "upcoming" and stats haven't been computed yet
- **Fix:** Use nullish coalescing: `const s = g.stats ?? { completed: 0, missed: 0, pct: 0, streak: 0, days_left: 0, tracked_days: 0 }`

### "406 RLS error" on Profile page
- This happens when querying a profile that doesn't exist yet
- **Fix:** Use `.maybeSingle()` instead of `.single()` and auto-create profile if missing

### "No active goals" on Check-in page
- This happens when `goalStatus()` returns 'finished' incorrectly
- **Fix:** Parse dates with explicit time: `new Date(dateStr + 'T00:00:00')`

### Supabase blocks localhost requests
- Supabase blocks server-side requests from localhost
- **Solution:** Use frontend-only Supabase JS client (already implemented)

---

## 📄 License

MIT

---

## 👤 Author

Created with ❤️ for fitness enthusiasts

---

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a PR.


