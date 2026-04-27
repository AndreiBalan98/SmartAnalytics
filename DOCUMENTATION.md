# SmartAnalytics — Technical Documentation

This document is a full reference for the SmartAnalytics platform. It covers architecture, database schema, API endpoints, auth, OAuth, sync internals, and deployment.

---

## Table of contents

1. [Architecture overview](#architecture-overview)
2. [Database schema](#database-schema)
3. [Authentication](#authentication)
4. [OAuth flows](#oauth-flows)
5. [Data sync](#data-sync)
6. [API reference](#api-reference)
7. [Frontend architecture](#frontend-architecture)
8. [Deployment](#deployment)
9. [Environment variables](#environment-variables)

---

## Architecture overview

SmartAnalytics is split into a Django REST API backend and a Next.js frontend. They are deployed separately — backend on Render, frontend on Vercel — and communicate over HTTP.

```
Browser
  └── Next.js (Vercel)
        └── REST API calls → Django (Render)
                                └── PostgreSQL (Render)
                                └── Meta Graph API
                                └── Google Ads API
                                └── GA4 Data API
```

The backend is organized into 6 Django apps:

- `users` — custom user model, JWT auth, client management
- `oauth` — OAuth 2.0 flows for Meta, Google Ads, GA4
- `meta` — Meta Ads models (campaigns, insights, leads) and sync services
- `google_ads` — Google Ads models and sync services
- `ga4` — GA4 models and sync services
- `core` — system logging middleware

All API routes are prefixed with `/api/`. The admin panel is at `/bigboss/`.

---

## Database schema

### users app

**User** (custom, extends `AbstractBaseUser` + `PermissionsMixin`)

| Field | Type | Notes |
|---|---|---|
| `id` | AutoField PK | |
| `email` | EmailField unique | Used as username |
| `first_name` | CharField | |
| `last_name` | CharField | |
| `user_type` | CharField | `agency` / `agency_client` / `client` |
| `agency_name` | CharField nullable | Set for agency users |
| `agency` | FK(self) nullable | Points to agency for agency_client users |
| `dark_mode` | BooleanField | User preference |
| `is_active` | BooleanField | |
| `is_staff` | BooleanField | True for agency users |
| `is_superuser` | BooleanField | |
| `date_joined` | DateTimeField | |
| `last_login` | DateTimeField nullable | |

**ClientPermissions** (OneToOne with User)

| Field | Type | Notes |
|---|---|---|
| `user` | OneToOne PK | |
| `meta_accounts_ids` | JSONField | List of permitted Meta account IDs |
| `google_accounts_ids` | JSONField | List of permitted Google Ads account IDs |
| `ga4_properties_ids` | JSONField | List of permitted GA4 property IDs |
| `meta_form_ids` | JSONField | List of permitted Meta lead form IDs |

---

### oauth app

**OAuthState** — short-lived state token for verifying OAuth callbacks

| Field | Type |
|---|---|
| `state` | CharField PK |
| `user` | FK(User) |
| `service_type` | CharField |
| `created_at` | DateTimeField |
| `expires_at` | DateTimeField |

**MetaToken**

| Field | Type |
|---|---|
| `user` | OneToOne PK |
| `meta_user_id` | CharField |
| `name` | CharField |
| `token` | TextField |
| `scopes` | JSONField |
| `created_at` | DateTimeField |
| `expiry_date` | DateTimeField nullable |

**GoogleToken** / **GA4Token** (same structure)

| Field | Type |
|---|---|
| `user` | OneToOne PK |
| `google_user_id` | CharField |
| `name` | CharField |
| `access_token` | TextField |
| `refresh_token` | TextField |
| `scopes` | JSONField |
| `created_at` | DateTimeField |
| `expires_at` | DateTimeField nullable |

**MetaUser**, **GoogleUser**, **GA4User** — profile info fetched from the provider during OAuth.

---

### meta app

**MetaBusiness**

| Field | Type | Notes |
|---|---|---|
| `id` | AutoField PK | |
| `user` | FK(User) | |
| `meta_user_id` | CharField | |
| `business_id` | CharField | |
| `name` | CharField | |
| `created_at` | DateTimeField | |

Unique constraint: `(user, business_id)`

**MetaAccount**

| Field | Type | Notes |
|---|---|---|
| `id` | AutoField PK | |
| `user` | FK(User) | |
| `meta_user_id` | CharField | |
| `business` | FK(MetaBusiness) nullable | |
| `account_id` | CharField | |
| `status` | CharField | |
| `name` | CharField | |
| `currency` | CharField | |
| `timezone_offset_hours_utc` | FloatField | |

Unique constraint: `(user, account_id)`

**MetaCampaign**

| Field | Notes |
|---|---|
| `campaign_id` | Unique with user |
| `account` | FK(MetaAccount) |
| `name`, `status`, `objective` | |
| `daily_budget` | DecimalField |
| `updated_time` | DateTimeField |

**MetaAdset**

| Field | Notes |
|---|---|
| `adset_id` | Unique with user |
| `account` | FK(MetaAccount) |
| `campaign` | FK(MetaCampaign) |
| `name`, `status`, `optimization_goal` | |
| `daily_budget` | DecimalField |

**MetaAd**

| Field | Notes |
|---|---|
| `ad_id` | Unique with user |
| `adset` | FK(MetaAdset) |
| `campaign` | FK(MetaCampaign) |
| `name`, `status` | |
| `creative` | JSONField: `{id, name, status, body, title, image_url}` |

**MetaInsight**

| Field | Type | Notes |
|---|---|---|
| `id` | AutoField PK | |
| `date` | DateField | |
| `level` | CharField | `account` / `campaign` / `adset` / `ad` |
| `object_id` | CharField | The ID of the entity at this level |
| `user` | FK(User) | |
| `spend` | DecimalField | |
| `impressions` | IntegerField | |
| `reach` | IntegerField | |
| `clicks` | IntegerField | |
| `cpc` | DecimalField | |
| `cpm` | DecimalField | |
| `ctr` | DecimalField | |
| `actions` | JSONField | Conversion actions |
| `action_values` | JSONField | Revenue per action |

Unique constraint: `(date, level, object_id)`

**MetaPage**, **MetaLeadForm**, **MetaLead** — lead generation models for syncing Meta form submissions.

---

### google_ads app

**GoogleAdsCustomer**, **GoogleAdsAccount**, **GoogleAdsCampaign**, **GoogleAdsAdGroup**, **GoogleAdsAd** — mirrors the Meta campaign hierarchy.

**GoogleAdsInsight** — same structure as MetaInsight plus `conversions` and `conversion_value` fields.

---

### ga4 app

**GA4Account**, **GA4Property** — account and property hierarchy.

**GA4Insight** — daily metrics per property: `sessions`, `users`, `new_users`, `pageviews`, `bounce_rate`, `avg_session_duration`, `conversions`, `revenue`, `source`, `medium`.

---

### core app

**SystemLog** — captures Django log records to the database.

| Field | Type |
|---|---|
| `id` | AutoField PK |
| `level` | CharField |
| `logger_name` | CharField |
| `message` | TextField |
| `pathname` | CharField |
| `lineno` | IntegerField |
| `funcname` | CharField |
| `exc_info` | TextField nullable |
| `created_at` | DateTimeField |

Table name: `system_log`

---

## Authentication

JWT auth via `djangorestframework-simplejwt`.

- Access token lifetime: 60 minutes
- Refresh token lifetime: 7 days
- Token rotation is not enabled — the refresh token is long-lived and reused

Agency signup (`POST /api/auth/agency/signup/`) creates a user with `user_type=agency` and `is_staff=True`. Client accounts are created by agencies via `POST /api/clients/create/`.

### Token refresh flow (frontend)

Every request goes through `fetchWithAuth()` in `lib/api.ts`:

1. Attaches `Authorization: Bearer <access_token>`
2. If response is 401 and a refresh token exists, calls `POST /api/auth/refresh/`
3. On success: stores the new access token, retries the original request
4. On failure: clears all tokens, redirects to `/login`

---

## OAuth flows

All three platforms use the authorization code flow. The state parameter is a server-generated token stored in the `OAuthState` model and verified on callback.

### Meta

1. `GET /api/oauth/meta/start/` — generates state, saves to DB, returns Meta OAuth URL with required scopes
2. Frontend opens the URL in a popup
3. User authorizes on Meta
4. Meta redirects to `GET /api/oauth/meta/callback/?code=...&state=...`
5. Backend verifies state, exchanges code for short-lived token
6. Exchanges short-lived token for long-lived token (60-day expiry) via Meta's exchange endpoint
7. Fetches `/me` — saves `MetaUser`
8. Fetches `/me/businesses` — saves `MetaBusiness` records
9. Fetches ad accounts per business — saves `MetaAccount` records
10. Saves `MetaToken`
11. Returns HTML: `<script>window.opener.postMessage({status: 'success'}, ...)</script>`
12. Frontend popup listener receives the message, closes popup, refreshes dashboard

### Google Ads / GA4

Same flow. Uses `access_type=offline` and `prompt=consent` to get a refresh token. On callback:
1. Exchanges code for `{access_token, refresh_token}`
2. Fetches Google user profile
3. Saves token and user
4. For Google Ads: also fetches customer accounts
5. For GA4: also fetches GA4 accounts and properties

---

## Data sync

### Structural sync

Fetches the campaign hierarchy from the platform API and upserts it to the database using Django's `update_or_create`. Called once to load the structure, then periodically to pick up new campaigns or status changes.

For Meta: syncs campaigns → ad sets → ads (with creative data inline).
For Google Ads: syncs customers → accounts → campaigns → ad groups → ads.
For GA4: syncs accounts → properties.

### Insights sync

Syncs daily performance metrics. The sync service:

1. Accepts a date range (start_date, end_date) and a list of account IDs
2. For each account, queries the database for which dates already have insights at each level
3. Calculates the missing date ranges
4. Fetches only the missing dates from the platform API
5. Upserts the results into the insights table

This means re-syncing a date range is safe — existing records are updated and only missing dates are fetched from the API.

### Meta API client

Located in `meta/services/`. Handles:
- Auth headers with the stored long-lived token
- Pagination via `paging.next` cursor
- Exponential backoff: retries up to 3 times on 5xx responses with increasing delays
- 30-second request timeout per call

### Leads sync

Two-step process:
1. Structural sync fetches Meta pages and lead forms, saves `MetaPage` and `MetaLeadForm`
2. Leads sync fetches individual lead submissions from each form, saves `MetaLead`

---

## API reference

### Auth

| Method | Path | Auth required | Description |
|---|---|---|---|
| POST | `/api/auth/login/` | No | Returns `{access, refresh, user}` |
| POST | `/api/auth/refresh/` | No | Returns new access token |
| POST | `/api/auth/agency/signup/` | No | Creates agency account |
| GET | `/api/me/` | Yes | Current user and permissions |
| PATCH | `/api/me/preferences/` | Yes | Update `dark_mode` |

### Clients

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/clients/create/` | Agency | Create client account |
| GET | `/api/clients/` | Agency | List agency's clients |
| PATCH | `/api/clients/<id>/permissions/` | Agency | Update client's account permissions |
| DELETE | `/api/clients/<id>/` | Agency | Deactivate client (`is_active=False`) |

### OAuth

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/oauth/status/` | Yes | Returns connection status per platform |
| GET | `/api/oauth/meta/start/` | Yes | Returns Meta OAuth URL |
| GET | `/api/oauth/meta/callback/` | No | Handles Meta redirect |
| GET | `/api/oauth/google/start/` | Yes | Returns Google Ads OAuth URL |
| GET | `/api/oauth/google/callback/` | No | Handles Google Ads redirect |
| GET | `/api/oauth/ga4/start/` | Yes | Returns GA4 OAuth URL |
| GET | `/api/oauth/ga4/callback/` | No | Handles GA4 redirect |

### Meta — agency

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/meta/accounts/` | Agency | List connected ad accounts |
| POST | `/api/meta/sync/structural/` | Agency | Sync campaigns, ad sets, ads |
| POST | `/api/meta/sync/insights/` | Agency | Sync daily metrics |
| GET | `/api/meta/pages/` | Agency | List Meta pages |
| POST | `/api/meta/sync/leads-structural/` | Agency | Sync lead forms |
| POST | `/api/meta/sync/leads/` | Agency | Sync lead submissions |
| GET | `/api/meta/lead-forms/` | Agency | List lead forms |

### Meta — client

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/meta/client/accounts/` | Client | Permitted ad accounts |
| GET | `/api/meta/client/campaigns/` | Client | Campaigns (`?account_id=`) |
| GET | `/api/meta/client/adsets/` | Client | Ad sets (`?campaign_id=`) |
| GET | `/api/meta/client/ads/` | Client | Ads (`?adset_id=`) |
| GET | `/api/meta/client/insights/` | Client | Query insights with filters |
| POST | `/api/meta/client/insights/` | Client | Aggregate insights |
| GET | `/api/meta/client/leads/` | Client | Lead submissions (paginated) |

### Google Ads — agency

Same structure as Meta agency endpoints, under `/api/google-ads/`.

### Google Ads — client

Same structure as Meta client endpoints, under `/api/google-ads/client/`.

### GA4 — agency

| Method | Path | Description |
|---|---|---|
| GET | `/api/ga4/accounts/` | List connected GA4 accounts |
| POST | `/api/ga4/sync/structural/` | Sync accounts and properties |
| POST | `/api/ga4/sync/insights/` | Sync daily metrics |

### GA4 — client

| Method | Path | Description |
|---|---|---|
| GET | `/api/ga4/client/properties/` | Permitted properties |
| GET/POST | `/api/ga4/client/insights/` | Query or aggregate GA4 metrics |

### System

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/system/logs/` | Staff | View system logs |

---

## Frontend architecture

### Pages

Built with Next.js 14 App Router. All pages are server components by default; interactive components use `'use client'` where needed.

```
src/app/
  layout.tsx                     Root layout, wraps with AuthProvider
  page.tsx                       Landing page
  login/page.tsx                 Unified login
  agency/
    signup/page.tsx              Agency registration
    dashboard/page.tsx           Agency dashboard (connections, sync, clients)
  dashboard/page.tsx             Client dashboard
  oauth/callback/page.tsx        Fallback for OAuth redirect (popup close)
```

### State management

Auth state is global via React Context (`AuthContext`). Everything else is local component state — there is no Redux or Zustand. The dashboard fetches data directly in components using the `api.ts` client.

### Key files

| File | Purpose |
|---|---|
| `src/lib/api.ts` | All API calls, typed, uses `fetchWithAuth` |
| `src/lib/auth.ts` | Token read/write from localStorage, JWT parse |
| `src/lib/oauth.ts` | OAuth popup helpers |
| `src/lib/currency.ts` | Currency formatting utilities |
| `src/contexts/AuthContext.tsx` | Global user and auth state |

---

## Deployment

### Backend (Render)

Config is in `backend/render.yaml`.

- Runtime: Python 3.11
- Build command: `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
- Start command: `gunicorn config.wsgi:application -c gunicorn.conf.py`
- Static files: WhiteNoise with `CompressedStaticFilesStorage`
- Gunicorn: 2 sync workers, 600s timeout

### Frontend (Vercel)

- Framework: Next.js (auto-detected)
- Build command: `npm run build`
- Output mode: `standalone`
- Required env var: `NEXT_PUBLIC_API_URL`

---

## Environment variables

### Backend

| Variable | Description |
|---|---|
| `SECRET_KEY` | Django secret key |
| `DJANGO_DEBUG` | `True` for dev, `False` for prod |
| `DATABASE_URL` | PostgreSQL connection string |
| `ALLOWED_HOSTS` | Comma-separated allowed hostnames |
| `CORS_ALLOWED_ORIGINS` | Frontend origins for CORS |
| `FRONTEND_URL` | Frontend base URL (used in OAuth callbacks) |
| `META_APP_ID` | Meta developer app ID |
| `META_APP_SECRET` | Meta developer app secret |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GA4_CLIENT_ID` | GA4 OAuth client ID |
| `GA4_CLIENT_SECRET` | GA4 OAuth client secret |
| `RENDER_EXTERNAL_HOSTNAME` | Auto-set by Render, used in ALLOWED_HOSTS |

### Frontend

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL |

---

## Local development

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env           # fill in values
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver     # http://localhost:8000

# Frontend (separate terminal)
cd frontend
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev                         # http://localhost:3000
```

For OAuth to work locally, you need to register `http://localhost:8000/api/oauth/meta/callback/` (and equivalents for Google/GA4) as valid redirect URIs in your developer app settings for each platform.
