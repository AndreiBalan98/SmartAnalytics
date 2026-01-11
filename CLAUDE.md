# CLAUDE.md - Development Session Log

**Project:** SmartAnalytics (Smart Money - S&M)
**Date Started:** 2026-01-11
**Status:** Active Development - FAZA 0 (Technical Foundation)

---

## 📋 PROJECT OVERVIEW

SmartAnalytics is a multi-tenancy SaaS platform for agencies to manage and visualize advertising metrics for their clients across Meta Ads, Google Ads, and GA4.

**Key Principles:**
- Simplicity first - minimal code, maximum quality
- Production-ready from day one
- Step-by-step implementation following SSOT.md
- No feature creep - strictly follow the plan

---

## 🏗️ TECH STACK

- **Frontend:** Next.js 14 (App Router) → Deployed on Vercel
- **Backend:** Django + Django REST Framework → Deployed on Render
- **Database:** PostgreSQL → Hosted on Render
- **Background Jobs:** Render Background Worker + Cron Scheduler
- **Design:** 3-way responsive (Mobile/Tablet/Desktop), minimalist

---

## 📊 CURRENT STATE ANALYSIS

### Backend Status ✅❌

**Working:**
- ✅ Django 5.0.1 + DRF setup
- ✅ CORS headers configured
- ✅ Meta Ads OAuth basic integration
- ✅ Mock mode for development
- ✅ API endpoints: `/health/`, `/internal/meta/status/`, `/internal/meta/ad-accounts/`, `/internal/meta/insights/`
- ✅ MetaIntegration model (stores access tokens)
- ✅ Meta service layer for API calls

**Missing/Incorrect:**
- ❌ **CRITICAL:** Using SQLite instead of PostgreSQL
- ❌ **CRITICAL:** Monolithic structure - needs modular apps:
  - `users/` - Authentication & user profiles
  - `agencies/` - Agency management
  - `integrations/` - OAuth tokens (Meta/Google)
  - `campaigns/` - Campaign structure (campaigns, ad sets, ads)
  - `metrics/` - Daily performance data
  - `core/` - Shared utilities
- ❌ No authentication system (no User model, no sessions/JWT)
- ❌ No multi-tenancy architecture (Agency → AgencyUser → Client separation)
- ❌ No data persistence for metrics (only live API calls)
- ❌ No background workers or cron jobs
- ❌ No campaign/ad set/ad structure models
- ❌ No metrics storage models

### Frontend Status ✅❌

**Working:**
- ✅ Next.js 14 with App Router
- ✅ TypeScript configured
- ✅ Pages: Home (`/`), Settings (`/settings`), Dashboard (`/dashboard`)
- ✅ Meta OAuth connection flow
- ✅ Ad account selection via localStorage
- ✅ Basic metrics display (mock data working)

**Missing/Incorrect:**
- ❌ Landing page doesn't match SSOT spec (should show "Smart Money (S&M)" with "Connect as Client" / "Connect as Agency" buttons)
- ❌ No authentication UI (login/signup pages)
- ❌ No Agency vs Client role separation
- ❌ No Agency Dashboard (for managing clients)
- ❌ No Client management interface
- ❌ No permission system UI
- ❌ Dashboard pulls from localStorage, not authenticated API

---

## 🎯 DEVELOPMENT ROADMAP (from SSOT.md)

### **FAZA 0: Technical Foundation** 🔧 ← **WE ARE HERE**

**FAZA 0.1: PostgreSQL Migration**
- Install `psycopg2-binary` and `dj-database-url`
- Configure `.env` for dev/prod database URLs
- Set up local PostgreSQL database
- Update `settings.py` to use PostgreSQL
- Test migrations

**FAZA 0.2: Django App Restructuring**
- Create modular Django apps:
  - `users/` - Custom User model (email as login)
  - `agencies/` - Agency, AgencyUser models
  - `integrations/` - OAuth tokens for Meta/Google
  - `campaigns/` - Campaign, AdSet, Ad models
  - `metrics/` - DailyMetric model
  - `core/` - Shared utilities
- Define all models with proper relationships
- Set up Row-Level Security filtering
- Create initial migrations

---

### **FAZA 1: Landing Page** 🏠

- Design clean landing page
- Large centered text: "Smart Money (S&M)"
- Two buttons:
  - "Connect as Client"
  - "Connect as Agency"
- Ultra-fast, static page

---

### **FAZA 2: Authentication** 🔐

**FAZA 2.1: Models**
- Custom User model (email as username)
- Agency model (agency owner)
- AgencyUser model (junction table with JSON permissions)

**FAZA 2.2: Access Flows**
- Agency: Sign-up (email/password OR Google OAuth) + Login
- Client: Created by agency only (no self sign-up), Login only

---

### **FAZA 3: Agency Dashboard** 🏢

- Client management (add/invite clients)
- Platform connection interface (Meta Ads, Google Ads, GA4)
- Permission management (which client sees which ad accounts)

---

### **FAZA 4: Client Dashboard** 📊

- Date range selector
- Key metrics cards (Spend, Impressions, Clicks, Conversions)
- Charts (Recharts library)
- Tables with stored data
- **Source:** Internal database only (no live API calls on page load)

---

### **FAZA 5: Background Workers** ⏲️

**FAZA 5.1: Cron Scheduler**
- Schedule hourly/daily sync tasks

**FAZA 5.2: Background Worker**
- Meta Ads: Refresh long-lived tokens (60-day validity)
- Meta Ads: Fetch campaign structure (Campaigns → Ad Sets → Ads)
- Meta Ads: Fetch daily metrics
- Google Ads & GA4: OAuth 2.0 setup and fetch logic

**FAZA 5.3: Sync Strategy**
- Upsert logic (update-or-insert) to avoid duplicates
- Backfill last 7-30 days for delayed conversion data
- Logging for token expiration and sync failures

---

### **FAZA 6: Backend-for-Frontend** ⚙️

- Complete sign-in/sign-up validation logic
- Optimized API endpoints for Next.js consumption
- Currency conversion support (unified currency in dashboard)

---

## 🔒 CRITICAL RULES

1. **Security:** Clients can NEVER access other clients' data (enforced at query level)
2. **Data Integrity:** Clear mapping between external IDs (Meta/Google) and internal IDs
3. **Performance:** Dashboards read from PostgreSQL, NEVER live from external APIs (prevents rate limiting and lag)
4. **Maintenance:** Clear logging on Background Worker (token expiration, sync failures)

---

## 📝 WORKFLOW PROTOCOL

1. **Proposal:** Claude proposes next step from plan
2. **Consultation:** Claude asks "Missing info? Decisions needed?"
3. **Implementation:** After agreement, Claude provides code; you implement and test
4. **Debug & Validation:** Resolve errors together; confirm when working
5. **Next Step:** Move to next phase only after current phase is validated

---

## ✅ COMPLETED PHASES

### **FAZA 0: Technical Foundation** ✅ COMPLETE

**FAZA 0.1: PostgreSQL Migration** ✅
- ✅ Updated `requirements.txt` with `psycopg2-binary` and `dj-database-url`
- ✅ Created `.env.example` with DATABASE_URL template
- ✅ Updated `settings.py` to use `dj-database-url`
- ✅ Created `SETUP.md` with comprehensive PostgreSQL setup instructions
- ✅ Configured for both local dev and Render production
- ✅ Database connected successfully

**FAZA 0.2: Django App Restructuring** ✅
- ✅ Created 6 modular Django apps:
  - `users/` - Custom User model with email login
  - `agencies/` - Agency & AgencyUser models
  - `integrations/` - MetaIntegration, GoogleAdsIntegration, GA4Integration
  - `campaigns/` - Campaign, AdSet, Ad models
  - `metrics/` - DailyMetric & MetricSnapshot models
  - `core/` - Shared utilities (placeholder for now)
- ✅ Implemented custom User model (AUTH_USER_MODEL)
- ✅ Created all data models with proper relationships
- ✅ Set up multi-tenancy architecture
- ✅ Added JSON permissions in AgencyUser
- ✅ Created database indexes for performance
- ✅ Ran migrations successfully

**Database Tables Created:**
```
✅ users                    (custom user with email login)
✅ agencies                 (agency entities)
✅ agency_users             (junction with permissions)
✅ campaigns                (ad campaigns)
✅ ad_sets                  (ad sets/groups)
✅ ads                      (individual ads)
✅ meta_integrations        (Meta OAuth tokens)
✅ google_ads_integrations  (Google Ads OAuth)
✅ ga4_integrations         (GA4 OAuth)
✅ daily_metrics            (performance data)
✅ metric_snapshots         (aggregated metrics)
```

---

### **FAZA 1: Landing Page** ✅ COMPLETE

**Landing Page Design:**
- ✅ Created minimalist landing page at `/`
- ✅ Large centered "SmartMoney" title (responsive with clamp)
- ✅ Two prominent buttons:
  - "Connect as Agency" → `/agency/login`
  - "Connect as Client" → `/client/login`
- ✅ Clean, ultra-fast design with hover animations
- ✅ Fully responsive (mobile/tablet/desktop)
- ✅ Footer tagline: "Smart advertising analytics for agencies and their clients"

**Login Pages Created:**
- ✅ `/agency/login` - Agency login placeholder with "Coming in FAZA 2" notice
- ✅ `/client/login` - Client login placeholder with agency creation note
- ✅ Both pages include:
  - SmartMoney branding
  - Disabled form fields (email, password)
  - "Back to Home" navigation
  - Clear messaging about upcoming authentication

**Build Status:**
- ✅ Next.js build successful
- ✅ All routes working: `/`, `/agency/login`, `/client/login`
- ✅ Static optimization enabled
- ✅ No TypeScript errors

---

### **FAZA 2.1: Backend Authentication** ✅ COMPLETE

**JWT Authentication Setup:**
- ✅ Installed `djangorestframework-simplejwt`
- ✅ Configured JWT settings (60min access, 7day refresh)
- ✅ Token rotation and blacklisting enabled
- ✅ Updated REST Framework to use JWT by default

**Authentication Endpoints Created:**
- ✅ `POST /api/auth/agency/signup/` - Agency signup with auto-agency creation
- ✅ `POST /api/auth/login/` - Login for both agency & client (returns JWT + user info)
- ✅ `POST /api/auth/refresh/` - Token refresh endpoint
- ✅ `POST /api/clients/create/` - Agency creates client (protected, generates temp password)
- ✅ `GET /api/clients/` - List all clients for agency (protected)
- ✅ `GET /api/me/` - Get current user info with agency/membership data (protected)

**Serializers Created:**
- ✅ `AgencySignupSerializer` - Agency registration with password validation
- ✅ `ClientCreationSerializer` - Client creation (auto-generates password if not provided)
- ✅ `CustomTokenObtainPairSerializer` - JWT with user info in response
- ✅ `UserSerializer` - Basic user data serialization

**Security Features:**
- ✅ Password validation with Django validators
- ✅ User type enforcement (agency vs client)
- ✅ Automatic Agency entity creation on signup
- ✅ AgencyUser relationship created when client is added
- ✅ Protected endpoints require JWT authentication
- ✅ Public health check endpoint maintained

**Testing Results:**
```
✅ Agency Signup: Creates user + agency successfully
✅ Login: Returns access + refresh tokens + user info
✅ Client Creation: Agency can create clients with auto-password
✅ Protected Routes: JWT authentication working
✅ User Info: /api/me/ returns user + agency/membership data
```

---

## 🚀 NEXT IMMEDIATE STEPS

**Starting FAZA 2.2: Frontend Authentication**

**Tasks:**
1. Create authentication context provider
2. Implement Agency signup form (`/agency/signup`)
3. Implement Agency login form (update `/agency/login`)
4. Implement Client login form (update `/client/login`)
5. Add token storage (localStorage/cookies)
6. Implement token refresh logic
7. Add protected route middleware
8. Create authentication utilities

---

## 📌 NOTES

- Current git branch: `main`
- Backend runs on: `http://localhost:8000`
- Frontend runs on: `http://localhost:3000`
- Mock mode is enabled (`MOCK_META=true`) for development
- PostgreSQL database: `smartanalytics_dev`
- All FAZA 0 models created and migrated successfully
- FAZA 1 landing page deployed
- FAZA 2.1 backend authentication complete and tested

---

**Last Updated:** 2026-01-12
**Claude Role:** Senior Web Developer & Guide
**Philosophy:** Simplicity, Quality, Correct Engineering
**Current Phase:** FAZA 2.2 - Frontend Authentication
