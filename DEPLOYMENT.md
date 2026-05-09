# 🚀 FitTrack Lite — Deployment Guide

Complete step-by-step guide to deploy FitTrack Lite to production.

---

## ✅ Pre-Deployment Checklist

- [ ] All code committed and pushed to GitHub
- [ ] Frontend builds without errors: `npm run build`
- [ ] Environment variables configured
- [ ] Supabase project created and schema deployed
- [ ] Email verification enabled in Supabase
- [ ] RLS policies verified in Supabase

---

## 📋 Step 1: Prepare Supabase

### 1.1 Create Supabase Project
1. Go to https://supabase.com
2. Sign up or log in
3. Click "New Project"
4. Fill in project details
5. Wait for project to initialize

### 1.2 Get API Keys
1. Go to **Settings > API**
2. Copy:
   - **Project URL** (e.g., `https://xxxx.supabase.co`)
   - **Anon Key** (public key for frontend)
   - **Service Role Key** (secret key, keep safe!)

### 1.3 Deploy Database Schema
1. Go to **SQL Editor**
2. Click "New Query"
3. Copy entire contents of `backend/supabase_schema.sql`
4. Paste into SQL editor
5. Click "Run"
6. Verify tables created: `profiles`, `goals`, `daily_logs`

### 1.4 Enable Email Verification
1. Go to **Authentication > Email Templates**
2. Verify "Confirm signup" template is enabled
3. Go to **Authentication > URL Configuration**
4. Set **Site URL** to your frontend URL (e.g., `https://fittrack.vercel.app`)
5. Add **Redirect URLs** for your frontend domain

### 1.5 Configure RLS Policies
1. Go to **Authentication > Policies**
2. Verify all tables have RLS enabled
3. Check that policies restrict access to user's own data

---

## 🎨 Step 2: Deploy Frontend

### Option A: Deploy on Vercel (Recommended)

#### 2A.1 Prepare Repository
```bash
# Make sure all changes are committed
git status
git add .
git commit -m "Production ready"
git push origin main
```

#### 2A.2 Connect to Vercel
1. Go to https://vercel.com
2. Click "Add New..." → "Project"
3. Select your GitHub repository
4. Click "Import"

#### 2A.3 Configure Build Settings
1. **Framework Preset:** Vite
2. **Root Directory:** `frontend`
3. **Build Command:** `npm run build`
4. **Output Directory:** `dist`
5. **Install Command:** `npm install`

#### 2A.4 Add Environment Variables
1. Click "Environment Variables"
2. Add:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_APP_NAME=FitTrack Lite
   ```
3. Click "Deploy"

#### 2A.5 Verify Deployment
1. Wait for build to complete
2. Click "Visit" to open deployed site
3. Test login/signup flow
4. Verify Supabase connection works

---

### Option B: Deploy on Netlify

#### 2B.1 Prepare Repository
```bash
git status
git add .
git commit -m "Production ready"
git push origin main
```

#### 2B.2 Connect to Netlify
1. Go to https://netlify.com
2. Click "Add new site" → "Import an existing project"
3. Select GitHub
4. Choose your repository

#### 2B.3 Configure Build Settings
1. **Base directory:** `frontend`
2. **Build command:** `npm run build`
3. **Publish directory:** `dist`

#### 2B.4 Add Environment Variables
1. Go to **Site settings > Build & deploy > Environment**
2. Click "Edit variables"
3. Add:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_APP_NAME=FitTrack Lite
   ```
4. Trigger redeploy

#### 2B.5 Verify Deployment
1. Wait for build to complete
2. Click site URL to open deployed site
3. Test login/signup flow
4. Verify Supabase connection works

---

### Option C: Deploy on GitHub Pages

#### 2C.1 Update vite.config.ts
```typescript
export default defineConfig({
  base: '/FitTrack/',  // Replace with your repo name
  plugins: [react()],
})
```

#### 2C.2 Create GitHub Actions Workflow
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd frontend && npm install && npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./frontend/dist
```

#### 2C.3 Enable GitHub Pages
1. Go to repository **Settings > Pages**
2. Set **Source** to "Deploy from a branch"
3. Set **Branch** to `gh-pages`
4. Save

#### 2C.4 Verify Deployment
1. Wait for workflow to complete
2. Go to `https://sricharan-kotagiri.github.io/FitTrack/`
3. Test the application

---

## 🔧 Step 3: Deploy Backend (Optional)

The backend is **not required** for production. The frontend calls Supabase directly.

If you want to deploy it anyway:

### Option A: Deploy on Render

#### 3A.1 Prepare Repository
```bash
git push origin main
```

#### 3A.2 Connect to Render
1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Select your GitHub repository
4. Click "Connect"

#### 3A.3 Configure Service
1. **Name:** fittrack-backend
2. **Environment:** Python 3
3. **Region:** Choose closest to you
4. **Branch:** main
5. **Root Directory:** backend
6. **Build Command:** `pip install -r requirements.txt`
7. **Start Command:** `gunicorn "app:create_app()" --bind 0.0.0.0:$PORT`

#### 3A.4 Add Environment Variables
1. Click "Environment"
2. Add all variables from `backend/.env`:
   ```
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   FLASK_ENV=production
   FLASK_SECRET_KEY=your-secret-key
   JWT_SECRET_KEY=your-jwt-secret
   FRONTEND_URL=https://your-frontend-url.com
   ```
3. Click "Deploy"

#### 3A.5 Verify Deployment
1. Wait for build to complete
2. Test health endpoint: `https://your-backend-url.onrender.com/api/health`
3. Should return: `{"status": "ok"}`

---

### Option B: Deploy on Railway

#### 3B.1 Prepare Repository
```bash
git push origin main
```

#### 3B.2 Connect to Railway
1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository

#### 3B.3 Configure Service
1. Click "Add Service" → "GitHub Repo"
2. Select your repo
3. Set **Root Directory:** backend

#### 3B.4 Add Environment Variables
1. Go to **Variables**
2. Add all from `backend/.env`

#### 3B.5 Verify Deployment
1. Wait for build to complete
2. Get deployment URL from Railway dashboard
3. Test: `https://your-url/api/health`

---

## 🧪 Step 4: Post-Deployment Testing

### 4.1 Frontend Tests
- [ ] Landing page loads
- [ ] Can navigate to login
- [ ] Can create new account
- [ ] Email verification works
- [ ] Can log in with credentials
- [ ] Dashboard loads with no errors
- [ ] Can create a new goal
- [ ] Can log a check-in
- [ ] Profile page shows stats
- [ ] Can log out

### 4.2 Backend Tests (if deployed)
- [ ] Health endpoint returns 200
- [ ] Can call auth endpoints
- [ ] Can call goals endpoints
- [ ] Can call logs endpoints
- [ ] Can call profile endpoints

### 4.3 Database Tests
- [ ] New users appear in `profiles` table
- [ ] New goals appear in `goals` table
- [ ] Check-ins appear in `daily_logs` table
- [ ] RLS policies prevent cross-user access

---

## 🔒 Security Checklist

- [ ] Never commit `.env` files
- [ ] `.gitignore` includes `.env`
- [ ] Supabase Anon Key is public (safe to expose)
- [ ] Supabase Service Role Key is secret (never expose)
- [ ] RLS policies enabled on all tables
- [ ] Email verification required for signup
- [ ] CORS configured correctly
- [ ] No sensitive data in frontend code
- [ ] No API keys hardcoded

---

## 📊 Monitoring

### Vercel/Netlify
- Go to dashboard
- Check "Deployments" for build status
- Check "Analytics" for traffic
- Check "Logs" for errors

### Supabase
- Go to dashboard
- Check "Database" for query performance
- Check "Auth" for user signups
- Check "Logs" for errors

### Render/Railway
- Go to dashboard
- Check "Logs" for application errors
- Check "Metrics" for CPU/memory usage
- Check "Deployments" for build history

---

## 🚨 Troubleshooting

### Frontend won't build
```bash
cd frontend
npm install
npm run build
```

### Environment variables not loading
- Verify variable names match exactly
- Restart deployment after adding variables
- Check that variables are in correct environment

### Supabase connection fails
- Verify URL and Anon Key are correct
- Check that RLS policies allow access
- Verify user is authenticated

### Email verification not working
- Check Supabase Email Templates
- Verify Site URL is set correctly
- Check spam folder for verification email

---

## 📝 Deployment Checklist

After deployment, verify:

- [ ] Frontend is live and accessible
- [ ] Backend is live (if deployed)
- [ ] Database is connected
- [ ] Email verification works
- [ ] Users can sign up
- [ ] Users can log in
- [ ] Goals can be created
- [ ] Check-ins can be logged
- [ ] Profile page works
- [ ] All pages are responsive
- [ ] No console errors
- [ ] No network errors

---

## 🎉 You're Live!

Congratulations! FitTrack Lite is now deployed to production.

Share your deployment URL and start tracking fitness goals!

---

## 📞 Support

For issues or questions:
1. Check the main README.md
2. Review Supabase documentation
3. Check deployment platform logs
4. Open an issue on GitHub

