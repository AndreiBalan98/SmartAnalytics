# SmartAnalytics - Setup Guide

Complete setup instructions for local development and deployment.

---

## 📋 Prerequisites

- **Python 3.11+** installed
- **Node.js 18+** and npm installed
- **PostgreSQL 14+** installed locally
- **Git** installed

---

## 🗄️ PostgreSQL Setup

### Windows

1. **Download PostgreSQL:**
   - Visit: https://www.postgresql.org/download/windows/
   - Download and run the installer
   - During installation, remember the password you set for the `postgres` user

2. **Add PostgreSQL to PATH:**
   - Default location: `C:\Program Files\PostgreSQL\16\bin`
   - Add to system PATH if not done automatically

3. **Create Database:**
   ```bash
   # Open Command Prompt or PowerShell
   psql -U postgres
   # Enter your postgres password when prompted

   # In PostgreSQL shell:
   CREATE DATABASE smartanalytics_dev;
   CREATE USER smartanalytics WITH PASSWORD 'your_secure_password';
   ALTER DATABASE smartanalytics_dev OWNER TO smartanalytics;
   GRANT ALL PRIVILEGES ON DATABASE smartanalytics_dev TO smartanalytics;
   \q
   ```

### macOS

1. **Install PostgreSQL via Homebrew:**
   ```bash
   brew install postgresql@16
   brew services start postgresql@16
   ```

2. **Create Database:**
   ```bash
   psql postgres

   # In PostgreSQL shell:
   CREATE DATABASE smartanalytics_dev;
   CREATE USER smartanalytics WITH PASSWORD 'your_secure_password';
   ALTER DATABASE smartanalytics_dev OWNER TO smartanalytics;
   GRANT ALL PRIVILEGES ON DATABASE smartanalytics_dev TO smartanalytics;
   \q
   ```

### Linux (Ubuntu/Debian)

1. **Install PostgreSQL:**
   ```bash
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

2. **Create Database:**
   ```bash
   sudo -u postgres psql

   # In PostgreSQL shell:
   CREATE DATABASE smartanalytics_dev;
   CREATE USER smartanalytics WITH PASSWORD 'your_secure_password';
   ALTER DATABASE smartanalytics_dev OWNER TO smartanalytics;
   GRANT ALL PRIVILEGES ON DATABASE smartanalytics_dev TO smartanalytics;
   \q
   ```

---

## 🔧 Backend Setup (Django)

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment:**
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Configure environment variables:**
   ```bash
   # Copy the example file
   cp .env.example .env

   # Edit .env with your settings
   ```

6. **Update `.env` file:**
   ```env
   DJANGO_SECRET_KEY=your-secret-key-here-generate-a-new-one
   DJANGO_DEBUG=True
   INTERNAL_API_KEY=dev-internal-key-123
   MOCK_META=true

   # Database Configuration - UPDATE WITH YOUR CREDENTIALS
   DATABASE_URL=postgresql://smartanalytics:your_secure_password@localhost:5432/smartanalytics_dev

   # Meta credentials (get from Meta for Developers)
   META_APP_ID=
   META_APP_SECRET=
   META_REDIRECT_URI=http://localhost:3000/api/meta/callback

   # Frontend URL
   FRONTEND_URL=http://localhost:3000
   ```

7. **Run database migrations:**
   ```bash
   python manage.py migrate
   ```

8. **Start development server:**
   ```bash
   python manage.py runserver
   ```

   Backend should now be running at: **http://localhost:8000**

---

## 🎨 Frontend Setup (Next.js)

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   # Copy the example file
   cp .env.local.example .env.local

   # Edit .env.local with your settings
   ```

4. **Update `.env.local` file:**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_API_KEY=dev-internal-key-123
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

   Frontend should now be running at: **http://localhost:3000**

---

## ✅ Verify Setup

1. **Check Backend Health:**
   - Visit: http://localhost:3000/api/health
   - Should return: `{"status":"ok","service":"meta-ads-backend","mock_mode":true}`

2. **Check Frontend:**
   - Visit: http://localhost:3000
   - Should see the homepage with backend health check

3. **Check Database Connection:**
   ```bash
   cd backend
   python manage.py dbshell
   # Should connect to PostgreSQL
   \dt  # List tables
   \q   # Quit
   ```

---

## 🚀 Production Deployment (Render)

### Backend Deployment

1. **Create PostgreSQL Database on Render:**
   - Go to: https://dashboard.render.com/
   - Click "New +" → "PostgreSQL"
   - Name: `smartanalytics-db`
   - Region: Choose closest to your users
   - Plan: Free tier for development
   - Copy the **Internal Database URL** (starts with `postgresql://`)

2. **Create Web Service on Render:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Settings:
     - **Name:** `smartanalytics-backend`
     - **Region:** Same as database
     - **Branch:** `main`
     - **Root Directory:** `backend`
     - **Runtime:** Python 3
     - **Build Command:** `pip install -r requirements.txt && python manage.py migrate`
     - **Start Command:** `gunicorn config.wsgi:application`

3. **Add Environment Variables on Render:**
   ```
   DJANGO_SECRET_KEY=generate-a-new-secure-key-here
   DJANGO_DEBUG=False
   INTERNAL_API_KEY=generate-secure-api-key
   DATABASE_URL=<paste-internal-database-url-from-render>
   MOCK_META=false
   META_APP_ID=<your-meta-app-id>
   META_APP_SECRET=<your-meta-app-secret>
   META_REDIRECT_URI=<your-vercel-url>/api/meta/callback
   FRONTEND_URL=<your-vercel-url>
   RENDER_EXTERNAL_HOSTNAME=<your-render-url>.onrender.com
   ```

### Frontend Deployment (Vercel)

1. **Deploy to Vercel:**
   - Visit: https://vercel.com/
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Framework: Next.js (auto-detected)
   - Root Directory: `frontend`

2. **Add Environment Variables:**
   ```
   NEXT_PUBLIC_API_URL=https://smartanalytics-backend.onrender.com
   NEXT_PUBLIC_API_KEY=<same-as-backend-internal-api-key>
   ```

3. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete

4. **Update Backend CORS:**
   - Copy your Vercel URL
   - Add it to backend's `FRONTEND_URL` environment variable on Render

---

## 🔍 Troubleshooting

### Backend Issues

**Error: `django.db.utils.OperationalError: connection to server failed`**
- PostgreSQL is not running. Start PostgreSQL service.
- Check DATABASE_URL is correct in `.env`
- Verify database exists: `psql -U smartanalytics -d smartanalytics_dev`

**Error: `ModuleNotFoundError: No module named 'psycopg2'`**
- Install dependencies: `pip install -r requirements.txt`

### Frontend Issues

**Error: `ECONNREFUSED` when calling API**
- Backend is not running. Start Django: `python manage.py runserver`
- Check `NEXT_PUBLIC_API_URL` in `.env.local`

### Database Issues

**Can't connect to PostgreSQL:**
- Windows: Check if PostgreSQL service is running in Services
- macOS: `brew services list` and `brew services start postgresql@16`
- Linux: `sudo systemctl status postgresql`

---

## 📚 Next Steps

After successful setup:
1. Review SSOT.md for development roadmap
2. Review CLAUDE.md for current development status
3. Start with FAZA 0.2 (Django app restructuring)

---

**Need Help?**
- Check CLAUDE.md for development context
- Review SSOT.md for architecture details
- Ensure PostgreSQL is running and credentials are correct
