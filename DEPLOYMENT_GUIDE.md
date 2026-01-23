# SmartAnalytics Deployment Guide

**Phase 7: Deployment Preparation**

This guide covers deploying SmartAnalytics to production (Render + Vercel).

---

## 📋 Pre-Deployment Checklist

### Backend Readiness:
- [ ] All migrations applied locally
- [ ] `python manage.py check --deploy` passes
- [ ] Environment variables documented
- [ ] Database backup created
- [ ] Static files collected
- [ ] CORS origins configured

### Frontend Readiness:
- [ ] `npm run build` succeeds
- [ ] Environment variables set
- [ ] API URL configured for production
- [ ] No TypeScript errors
- [ ] All pages render correctly

### Security:
- [ ] `DEBUG = False` in production
- [ ] `SECRET_KEY` is secure (not hardcoded)
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Rate limiting active

---

## 🔧 Part 1: Backend Deployment (Render)

### Step 1: Prepare Django for Production

**1.1 Update `backend/config/settings.py`:**

```python
# At the top of settings.py
import os
from pathlib import Path
from dotenv import load_dotenv
import dj_database_url

load_dotenv()

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY')
if not SECRET_KEY:
    raise ValueError('DJANGO_SECRET_KEY environment variable must be set')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DJANGO_DEBUG', 'False') == 'True'

# Allowed hosts
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '.onrender.com',
]

# Add your custom domain if you have one
RENDER_EXTERNAL_HOSTNAME = os.getenv('RENDER_EXTERNAL_HOSTNAME')
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

# CORS - Add your Vercel deployment URL
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'https://localhost:3000',
    os.getenv('FRONTEND_URL', ''),  # Your Vercel URL
]

# Remove empty strings
CORS_ALLOWED_ORIGINS = [url for url in CORS_ALLOWED_ORIGINS if url]

# Security settings for production
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
```

**1.2 Create `backend/requirements.txt`:**

```bash
cd backend
pip freeze > requirements.txt
```

Make sure it includes:
```
Django==5.0.1
djangorestframework==3.14.0
djangorestframework-simplejwt==5.3.1
django-cors-headers==4.3.1
psycopg2-binary==2.9.9
python-dotenv==1.0.0
dj-database-url==2.1.0
requests==2.31.0
whitenoise==6.6.0
gunicorn==21.2.0
```

**1.3 Create `backend/build.sh` (Render build script):**

```bash
#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate
```

Make it executable:
```bash
chmod +x backend/build.sh
```

**1.4 Create `backend/Procfile` (optional):**

```
web: gunicorn config.wsgi:application
```

### Step 2: Deploy to Render

**2.1 Create Render Account:**
- Go to https://render.com
- Sign up with GitHub

**2.2 Create PostgreSQL Database:**
1. Click "New +" → "PostgreSQL"
2. Name: `smartanalytics-db`
3. Region: Choose closest to your users
4. Plan: Free (or Starter for production)
5. Click "Create Database"
6. **Copy the Internal Database URL** (starts with `postgresql://`)

**2.3 Create Web Service:**
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name:** `smartanalytics-backend`
   - **Region:** Same as database
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Build Command:** `./build.sh`
   - **Start Command:** `gunicorn config.wsgi:application`
   - **Plan:** Free (or Starter)

**2.4 Add Environment Variables:**

In Render dashboard → Environment → Add:

```
DJANGO_SECRET_KEY=<generate-secure-key>
DJANGO_DEBUG=False
DATABASE_URL=<internal-database-url-from-step-2.2>
FRONTEND_URL=<your-vercel-url>
META_APP_ID=<your-meta-app-id>
META_APP_SECRET=<your-meta-app-secret>
RENDER_EXTERNAL_HOSTNAME=<your-render-url>.onrender.com
```

**Generate secure secret key:**
```python
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

**2.5 Deploy:**
- Click "Create Web Service"
- Wait for build to complete (~5 minutes)
- Check logs for errors

**2.6 Verify Deployment:**
```bash
# Health check
curl https://your-app.onrender.com/health/

# Should return: {"status": "ok"}
```

---

## 🎨 Part 2: Frontend Deployment (Vercel)

### Step 1: Prepare Next.js for Production

**1.1 Update `frontend/.env.production`:**

Create this file:
```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

**1.2 Verify Build:**
```bash
cd frontend
npm run build

# Should succeed with no errors
```

### Step 2: Deploy to Vercel

**2.1 Create Vercel Account:**
- Go to https://vercel.com
- Sign up with GitHub

**2.2 Import Project:**
1. Click "Add New" → "Project"
2. Import your GitHub repository
3. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

**2.3 Add Environment Variables:**

In Vercel dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

**2.4 Deploy:**
- Click "Deploy"
- Wait for build (~2 minutes)
- You'll get a URL like: `https://your-app.vercel.app`

**2.5 Update Backend CORS:**

Go back to Render and add your Vercel URL to environment variables:
```
FRONTEND_URL=https://your-app.vercel.app
```

Then redeploy backend.

**2.6 Configure Custom Domain (Optional):**
1. In Vercel → Settings → Domains
2. Add your domain
3. Update DNS records as shown

---

## 🔐 Part 3: Meta App Configuration

### Update Meta App Settings:

1. Go to https://developers.facebook.com/apps/
2. Select your app
3. Update **OAuth Redirect URIs:**
   ```
   https://your-frontend.vercel.app/agency/meta-callback
   ```

4. Update **App Domains:**
   ```
   your-frontend.vercel.app
   your-backend.onrender.com
   ```

5. Save changes

---

## ✅ Part 4: Post-Deployment Verification

### Backend Health Checks:

```bash
# 1. Health endpoint
curl https://your-backend.onrender.com/health/

# 2. API endpoints (without auth - should return 401)
curl https://your-backend.onrender.com/api/meta/sync/status/

# Expected: {"detail": "Authentication credentials were not provided."}
```

### Frontend Checks:

1. Open `https://your-frontend.vercel.app`
2. Verify landing page loads
3. Test agency signup
4. Test agency login
5. Test Meta OAuth (should open popup)
6. Test client login
7. Test dashboard loads

### End-to-End Test:

1. **Agency Flow:**
   - Sign up as agency
   - Connect Meta (OAuth popup)
   - Run structural sync
   - Create client
   - Assign permissions

2. **Client Flow:**
   - Login as client
   - View dashboard
   - See ad accounts
   - Browse campaigns/ads/insights

---

## 📊 Part 5: Monitoring & Maintenance

### Render Monitoring:

1. **Check Logs:**
   - Render Dashboard → Logs
   - Monitor for errors

2. **Database Usage:**
   - PostgreSQL Dashboard
   - Check storage & connections

3. **Set Up Alerts:**
   - Render → Notifications
   - Email alerts for errors

### Vercel Monitoring:

1. **Check Analytics:**
   - Vercel Dashboard → Analytics
   - Monitor page views & performance

2. **Check Logs:**
   - Functions → View Logs
   - Monitor API routes

### Application Monitoring:

1. **Database Backups:**
   - Render PostgreSQL → Backups
   - Enable automatic backups

2. **Sync Monitoring:**
   - Check `meta_ads_syncstate` table regularly
   - Monitor for failed syncs

3. **Error Tracking:**
   - Consider adding Sentry for error tracking

---

## 🔄 Part 6: Continuous Deployment

### Automatic Deployments:

**Backend (Render):**
- Auto-deploys on push to `main` branch
- Configure in: Settings → Build & Deploy

**Frontend (Vercel):**
- Auto-deploys on push to `main` branch
- Preview deployments for PRs

### Deployment Workflow:

```bash
# 1. Make changes locally
git add .
git commit -m "Your changes"

# 2. Push to GitHub
git push origin main

# 3. Automatic deployment triggers:
# - Vercel builds frontend
# - Render builds backend

# 4. Monitor deployments:
# - Check Vercel dashboard
# - Check Render logs
```

---

## 🚨 Troubleshooting

### Common Issues:

**Issue: "500 Internal Server Error" on Backend**
- Check Render logs: Dashboard → Logs
- Common causes:
  - Missing environment variables
  - Database connection failed
  - Migration not run

**Issue: "CORS Error" on Frontend**
- Verify `FRONTEND_URL` in backend env vars
- Check `CORS_ALLOWED_ORIGINS` in settings.py
- Ensure both URLs use HTTPS

**Issue: "Meta OAuth Fails"**
- Check redirect URI matches exactly
- Verify Meta app is in Live mode (not Development)
- Check app domains configured

**Issue: "Database Connection Failed"**
- Verify `DATABASE_URL` is correct
- Check database is running (Render dashboard)
- Verify database plan hasn't expired (Free tier)

**Issue: "Static Files Not Loading"**
- Run `python manage.py collectstatic` in build script
- Check `STATIC_ROOT` and `STATIC_URL` settings
- Verify WhiteNoise is installed

---

## 📝 Environment Variables Reference

### Backend (Render):

| Variable | Example | Required |
|----------|---------|----------|
| `DJANGO_SECRET_KEY` | `django-insecure-xyz...` | Yes |
| `DJANGO_DEBUG` | `False` | Yes |
| `DATABASE_URL` | `postgresql://user:pass@host/db` | Yes |
| `FRONTEND_URL` | `https://app.vercel.app` | Yes |
| `META_APP_ID` | `123456789` | Yes |
| `META_APP_SECRET` | `abc123...` | Yes |
| `RENDER_EXTERNAL_HOSTNAME` | `app.onrender.com` | No |

### Frontend (Vercel):

| Variable | Example | Required |
|----------|---------|----------|
| `NEXT_PUBLIC_API_URL` | `https://api.onrender.com` | Yes |

---

## 🎯 Production Checklist

Before going live:

- [ ] Backend deployed to Render
- [ ] Frontend deployed to Vercel
- [ ] PostgreSQL database created
- [ ] All environment variables set
- [ ] Meta app configured (redirect URIs)
- [ ] CORS configured correctly
- [ ] HTTPS enforced
- [ ] Health checks passing
- [ ] Test agency signup works
- [ ] Test Meta OAuth works
- [ ] Test client dashboard works
- [ ] Database backups enabled
- [ ] Monitoring configured
- [ ] Custom domain configured (optional)

---

## 🚀 Going Live

Once all checks pass:

1. **Update DNS** (if using custom domain)
2. **Test thoroughly** on production
3. **Monitor logs** for first few hours
4. **Create first real agency** account
5. **Connect real Meta** integration
6. **Run first sync**
7. **Create first client**
8. **Verify client** can access dashboard

---

## 📞 Support

**If deployment fails:**
1. Check logs (Render/Vercel dashboards)
2. Review this guide
3. Check environment variables
4. Verify database connection
5. Test locally first

**Useful Commands:**

```bash
# Backend logs (Render CLI)
render logs -s your-service-name

# Frontend logs (Vercel CLI)
vercel logs your-deployment-url

# Check database
python manage.py dbshell

# Verify migrations
python manage.py showmigrations
```

---

**Deployment Complete!** 🎉

Your SmartAnalytics app is now live and accessible worldwide.
