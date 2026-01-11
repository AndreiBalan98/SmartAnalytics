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

## 🚀 NEXT IMMEDIATE STEPS

**Starting FAZA 0.1: PostgreSQL Migration**

**Tasks:**
1. Update `requirements.txt` with PostgreSQL dependencies
2. Create `.env.example` templates for dev/prod
3. Update `settings.py` to use `dj-database-url`
4. Document local PostgreSQL setup instructions
5. Test database connection
6. Run initial migrations

**Prerequisites Needed from You:**
- PostgreSQL installed locally OR willingness to set it up
- Render account ready for PostgreSQL database creation

---

## 📌 NOTES

- Current git branch: `main`
- Backend runs on: `http://localhost:8000`
- Frontend runs on: `http://localhost:3000`
- Mock mode is enabled (`MOCK_META=true`) for development
- No real Meta tokens stored yet

---

**Last Updated:** 2026-01-11
**Claude Role:** Senior Web Developer & Guide
**Philosophy:** Simplicity, Quality, Correct Engineering
