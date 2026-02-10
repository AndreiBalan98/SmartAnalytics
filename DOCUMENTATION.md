# SmartAnalytics - Documentation

## Overview

SmartAnalytics is a marketing analytics platform that connects to Meta Ads (Facebook/Instagram), Google Ads, and Google Analytics 4 to provide agencies and their clients with unified marketing data and insights.

**Tech Stack:**
- **Backend:** Django 4.x + Django REST Framework + JWT (SimpleJWT)
- **Frontend:** Next.js 14 (App Router) + TypeScript
- **Database:** PostgreSQL
- **Deployment:** Render (backend) + Vercel (frontend)

---

## Architecture

### Backend Apps (4)

| App | Purpose |
|-----|---------|
| `users` | User model, auth, clients, permissions |
| `oauth` | OAuth flows for Meta, Google Ads, GA4 |
| `meta` | Meta Ads data models, sync, client data |
| `core` | System logging, middleware |

### Frontend Structure

```
frontend/src/
  app/
    page.tsx                    # Landing page
    login/page.tsx              # Login
    agency/signup/page.tsx      # Agency signup
    agency/dashboard/page.tsx   # Agency dashboard
    dashboard/page.tsx          # Client dashboard
    oauth/callback/page.tsx     # OAuth callback fallback
  components/
    dashboard/                  # Client dashboard panels
    ui/                         # Shared UI components
    DarkModeToggle.tsx
    landing/                    # Landing page components
  contexts/
    AuthContext.tsx              # Auth state provider
  lib/
    api.ts                      # API client
    auth.ts                     # Auth helpers (tokens, localStorage)
    oauth.ts                    # OAuth popup helpers
```

---

## Database Schema

### Users App

**User** (custom, extends AbstractBaseUser + PermissionsMixin)
- `id` (auto PK), `email` (unique), `first_name`, `last_name`
- `user_type`: `client` | `agency` | `agency_client`
- `dark_mode` (bool), `is_active`, `is_staff`, `is_superuser`
- `agency_name` (nullable - set for agency users)
- `agency` (self FK, nullable - points to the agency user for agency_client users)
- `date_joined`, `last_login`

**ClientPermissions** (OneToOne with User)
- `user` (OneToOne PK)
- `meta_accounts_ids` (JSON list of account IDs)
- `google_accounts_ids` (JSON list)
- `ga4_properties_ids` (JSON list)

### OAuth App

**OAuthState** - `state` (PK), `user` (FK), `service_type`, `created_at`, `expires_at`

**MetaToken** - `user` (OneToOne PK), `meta_user_id`, `name`, `token`, `scopes` (JSON), `created_at`, `expiry_date`

**GoogleToken** - `user` (OneToOne PK), `google_user_id`, `name`, `access_token`, `refresh_token`, `scopes` (JSON), `created_at`, `expires_at`

**GA4Token** - same structure as GoogleToken

**MetaUser** - `user` (OneToOne PK), `meta_user_id`, `name`, `email`, `created_at`

**GoogleUser** - `user` (OneToOne PK), `google_user_id`, `name`, `email`, `created_at`

**GA4User** - same structure as GoogleUser

### Meta App

**MetaBusiness** - `id` (auto PK), `user` (FK), `meta_user_id`, `business_id`, `name`, `created_at`. Unique: `(user, business_id)`

**MetaAccount** - `id` (auto PK), `user` (FK), `meta_user_id`, `business` (FK nullable), `account_id`, `status`, `name`, `currency`, `timezone_offset_hours_utc`. Unique: `(user, account_id)`

**MetaCampaign** - `id` (auto PK), `user` (FK), `meta_user_id`, `business` (FK nullable), `account` (FK), `campaign_id`, `name`, `status`, `objective`, `daily_budget`, `updated_time`. Unique: `(user, campaign_id)`

**MetaAdset** - `id` (auto PK), `user` (FK), `meta_user_id`, `business` (FK nullable), `account` (FK), `campaign` (FK), `adset_id`, `name`, `status`, `optimization_goal`, `daily_budget`, `updated_time`. Unique: `(user, adset_id)`

**MetaAd** - `id` (auto PK), `user` (FK), `meta_user_id`, `business` (FK nullable), `account` (FK), `campaign` (FK), `adset` (FK), `ad_id`, `name`, `status`, `creative` (JSON: id, name, status, body, title, image_url). Unique: `(user, ad_id)`

**MetaInsight** - `id` (auto PK), `date`, `level` (account/campaign/adset/ad), `object_id`, `user` (FK), `meta_user_id`, `spend`, `impressions`, `reach`, `clicks`, `cpc`, `cpm`, `ctr`, `actions` (JSON), `action_values` (JSON). Unique: `(date, level, object_id)`

### Core App

**SystemLog** - `id` (auto), `level`, `logger_name`, `message`, `pathname`, `lineno`, `funcname`, `exc_info`, `created_at`. Table: `system_log`

---

## Authentication Flow

1. **JWT-based auth** using `djangorestframework-simplejwt`
2. Agency signup creates user with `user_type=agency`, `is_staff=True`
3. Login returns `{access, refresh, user}` tokens
4. Frontend stores tokens in `localStorage`
5. `fetchWithAuth()` auto-refreshes expired access tokens using refresh token
6. On 401 with failed refresh, redirects to login

### User Types

| Type | Description | Can Do |
|------|-------------|--------|
| `agency` | Agency owner | Connect platforms, sync data, manage clients |
| `agency_client` | Client created by agency | View permitted data only |
| `client` | Standalone client | View permitted data only |

---

## OAuth Flows

### Meta OAuth
1. Frontend calls `GET /api/oauth/meta/start/` → gets OAuth URL
2. Opens popup with Meta OAuth URL
3. User authorizes → Meta redirects to `GET /api/oauth/meta/callback/`
4. Backend: verify state → exchange code → short-lived token → long-lived token (60 days)
5. Backend: fetch `/me` → save MetaUser, fetch businesses → save MetaBusiness, fetch ad accounts → save MetaAccount
6. Backend returns HTML with `postMessage` to close popup
7. Frontend receives success message, refreshes dashboard

### Google Ads / GA4 OAuth
Same pattern, adapted for Google OAuth2 endpoints.

---

## Meta Sync

### Structural Sync (`POST /api/meta/sync/structural/`)
Per selected account:
1. Fetch campaigns from Meta API → `update_or_create` MetaCampaign
2. Fetch adsets → `update_or_create` MetaAdset
3. Fetch ads with inline creatives → `update_or_create` MetaAd

### Insights Sync (`POST /api/meta/sync/insights/`)
Per account, per level (account/campaign/adset/ad):
1. Check existing insights in DB for date range
2. Identify missing dates (gap detection)
3. Fetch only missing dates from Meta API
4. `update_or_create` MetaInsight per row

### MetaAPIClient
- Exponential backoff (max 3 retries on 5xx errors)
- Pagination via `paging.next`
- Rate limiting in test mode (max 200 requests/hour)
- Timeout: 30s per request

---

## API Endpoints

### Auth (`/api/`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login/` | JWT login |
| POST | `/api/auth/refresh/` | Refresh access token |
| POST | `/api/auth/agency/signup/` | Agency registration |
| GET | `/api/me/` | Current user info |
| PATCH | `/api/me/preferences/` | Update dark_mode |

### Clients (`/api/`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/clients/create/` | Create agency_client |
| GET | `/api/clients/` | List agency's clients |
| PATCH | `/api/clients/<id>/permissions/` | Update permissions |
| DELETE | `/api/clients/<id>/` | Deactivate client |

### OAuth (`/api/oauth/`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/oauth/status/` | Connection status |
| GET | `/api/oauth/meta/start/` | Start Meta OAuth |
| GET | `/api/oauth/meta/callback/` | Meta callback |
| GET | `/api/oauth/google/start/` | Start Google OAuth |
| GET | `/api/oauth/google/callback/` | Google callback |
| GET | `/api/oauth/ga4/start/` | Start GA4 OAuth |
| GET | `/api/oauth/ga4/callback/` | GA4 callback |

### Meta - Agency (`/api/meta/`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/meta/accounts/` | List ad accounts |
| POST | `/api/meta/sync/structural/` | Trigger structural sync |
| POST | `/api/meta/sync/insights/` | Trigger insights sync |

### Meta - Client (`/api/meta/client/`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/meta/client/accounts/` | Client's permitted accounts |
| GET | `/api/meta/client/campaigns/` | Campaigns (filter: `?account_id=X`) |
| GET | `/api/meta/client/adsets/` | Adsets (filter: `?campaign_id=X`) |
| GET | `/api/meta/client/ads/` | Ads (filter: `?adset_id=X`) |
| GET/POST | `/api/meta/client/insights/` | Insights (GET: query, POST: aggregate) |

### System (`/api/system/`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/system/logs/` | System logs |

### Admin
| Path | Description |
|------|-------------|
| `/bigboss/` | Django admin panel |

---

## Deployment

### Backend (Render)
- **Runtime:** Python 3.11
- **Build:** `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
- **Start:** `gunicorn config.wsgi:application -c gunicorn.conf.py`
- **Static files:** WhiteNoise (CompressedStaticFilesStorage)

### Frontend (Vercel)
- **Framework:** Next.js 14
- **Build:** `npm run build`
- **Env:** `NEXT_PUBLIC_API_URL` points to Render backend URL

### Environment Variables (Backend)
| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Django secret key |
| `DJANGO_DEBUG` | Debug mode (False in prod) |
| `DATABASE_URL` | PostgreSQL connection string |
| `ALLOWED_HOSTS` | Comma-separated allowed hosts |
| `CORS_ALLOWED_ORIGINS` | Frontend URLs |
| `FRONTEND_URL` | Frontend base URL |
| `META_APP_ID` | Meta app ID |
| `META_APP_SECRET` | Meta app secret |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GA4_CLIENT_ID` | GA4 OAuth client ID |
| `GA4_CLIENT_SECRET` | GA4 OAuth client secret |

---

## Development Setup

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

# Frontend
cd frontend
npm install
npm run dev
```
