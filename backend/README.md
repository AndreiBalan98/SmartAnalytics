# Backend

Django 5 + Django REST Framework API for SmartAnalytics. Handles authentication, OAuth flows for three ad platforms, data sync, and serving the data to the frontend.

---

## Tech stack

- **Django 5.0.1** with Django REST Framework 3.14.0
- **SimpleJWT** for JWT-based authentication (60 min access tokens, 7 day refresh tokens)
- **PostgreSQL** via psycopg2
- **Gunicorn** for production serving, WhiteNoise for static files
- **python-dotenv** for environment configuration

---

## Django apps

| App | What it does |
|---|---|
| `users` | Custom user model, registration, client management, permissions |
| `oauth` | OAuth 2.0 flows for Meta, Google Ads, and GA4 |
| `meta` | Meta Ads data models, sync services, client-facing endpoints |
| `google_ads` | Google Ads data models, sync services, client-facing endpoints |
| `ga4` | Google Analytics 4 data models, sync services, client-facing endpoints |
| `core` | System logging handler and middleware |

---

## User model

The app uses a custom user model based on `AbstractBaseUser`. Authentication is email-based (no username). There are three user types:

- `agency` — an agency account. Can connect ad platforms, trigger syncs, and create client accounts. Has `is_staff=True`.
- `agency_client` — a client created by an agency. Can only view data they have been granted access to.
- `client` — standalone client (same permissions as agency_client, not tied to an agency).

### ClientPermissions

Each client has a `ClientPermissions` record (OneToOne) that stores which specific accounts and properties they can see:

- `meta_accounts_ids` — list of Meta ad account IDs
- `google_accounts_ids` — list of Google Ads account IDs
- `ga4_properties_ids` — list of GA4 property IDs
- `meta_form_ids` — list of Meta lead form IDs

Agencies update these via the `PATCH /api/clients/<id>/permissions/` endpoint.

---

## Authentication

JWT auth via SimpleJWT. Login returns `{access, refresh, user}`. The frontend stores these in localStorage and attaches the access token as a Bearer header on every request. On 401, the frontend tries to refresh; on failed refresh, the user is redirected to login.

Agency signup creates the account directly via `POST /api/auth/agency/signup/`.

---

## OAuth flows

All three platforms follow the same pattern:

1. Frontend calls the `start` endpoint to get an authorization URL
2. That URL opens in a popup
3. The user authorizes in the popup
4. The platform redirects to the backend callback endpoint
5. The backend verifies the state token, exchanges the auth code for an access token, fetches the user's profile and account data, and saves everything to the database
6. The backend responds with a small HTML page that calls `window.opener.postMessage` to notify the parent window
7. The popup closes and the dashboard refreshes

**Meta OAuth specifics:** The callback exchanges the code for a short-lived token, then immediately exchanges that for a long-lived token (valid 60 days). The callback also fetches and saves the user's businesses and all associated ad accounts.

**Google OAuth specifics:** Uses offline access to get a refresh token, which allows the backend to refresh access without user interaction.

---

## Data sync

Sync is triggered manually by the agency from the dashboard. There are two phases:

**Structural sync** — fetches the campaign hierarchy (campaigns → ad sets → ads) from the platform API and upserts it into the database. Also syncs ad creative data for Meta ads.

**Insights sync** — fetches daily performance metrics. Before fetching, the service checks which dates are already in the database for each account and level (account/campaign/adset/ad) and only requests the missing date ranges. This keeps syncs fast and avoids redundant API calls.

The Meta API client includes exponential backoff (up to 3 retries on 5xx errors), pagination through `paging.next` cursors, and a 30-second request timeout.

**Leads sync** — for Meta lead forms, there is a separate structural sync (fetches forms) and a leads sync (fetches individual lead submissions).

---

## API endpoints

### Auth

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login/` | Login, returns JWT tokens |
| POST | `/api/auth/refresh/` | Refresh access token |
| POST | `/api/auth/agency/signup/` | Register agency account |
| GET | `/api/me/` | Current user info |
| PATCH | `/api/me/preferences/` | Update dark mode preference |

### Clients

| Method | Path | Description |
|---|---|---|
| POST | `/api/clients/create/` | Create client account |
| GET | `/api/clients/` | List agency's clients |
| PATCH | `/api/clients/<id>/permissions/` | Update client permissions |
| DELETE | `/api/clients/<id>/` | Deactivate client |

### OAuth

| Method | Path | Description |
|---|---|---|
| GET | `/api/oauth/status/` | Connected platform status |
| GET | `/api/oauth/meta/start/` | Get Meta OAuth URL |
| GET | `/api/oauth/meta/callback/` | Meta OAuth callback |
| GET | `/api/oauth/google/start/` | Get Google Ads OAuth URL |
| GET | `/api/oauth/google/callback/` | Google Ads OAuth callback |
| GET | `/api/oauth/ga4/start/` | Get GA4 OAuth URL |
| GET | `/api/oauth/ga4/callback/` | GA4 OAuth callback |

### Meta — agency

| Method | Path | Description |
|---|---|---|
| GET | `/api/meta/accounts/` | List connected ad accounts |
| POST | `/api/meta/sync/structural/` | Sync campaigns, ad sets, ads |
| POST | `/api/meta/sync/insights/` | Sync performance metrics |
| GET | `/api/meta/pages/` | List Meta pages |
| POST | `/api/meta/sync/leads-structural/` | Sync lead forms |
| POST | `/api/meta/sync/leads/` | Sync lead submissions |
| GET | `/api/meta/lead-forms/` | List lead forms |

### Meta — client

| Method | Path | Description |
|---|---|---|
| GET | `/api/meta/client/accounts/` | Permitted ad accounts |
| GET | `/api/meta/client/campaigns/` | Campaigns (`?account_id=`) |
| GET | `/api/meta/client/adsets/` | Ad sets (`?campaign_id=`) |
| GET | `/api/meta/client/ads/` | Ads (`?adset_id=`) |
| GET/POST | `/api/meta/client/insights/` | Query or aggregate insights |
| GET | `/api/meta/client/leads/` | Lead submissions with pagination |

Google Ads and GA4 follow the same structure under `/api/google-ads/` and `/api/ga4/`.

### System

| Method | Path | Description |
|---|---|---|
| GET | `/api/system/logs/` | View system logs |

Admin panel is at `/bigboss/`.

---

## Database models summary

### Meta app (11 models)
`MetaBusiness`, `MetaAccount`, `MetaCampaign`, `MetaAdset`, `MetaAd` — the campaign hierarchy. Each model has a unique constraint on `(user, <platform_id>)` to support upserts.

`MetaInsight` — daily metrics per level (account/campaign/adset/ad) and object ID. Fields include: `spend`, `impressions`, `reach`, `clicks`, `cpc`, `cpm`, `ctr`, `actions` (JSON), `action_values` (JSON). Unique on `(date, level, object_id)`.

`MetaPage`, `MetaLeadForm`, `MetaLead` — lead generation models.

### Google Ads app (5 models)
`GoogleAdsCustomer`, `GoogleAdsAccount`, `GoogleAdsCampaign`, `GoogleAdsAdGroup`, `GoogleAdsAd`, `GoogleAdsInsight` — mirrors the Meta structure.

### GA4 app (3 models)
`GA4Account`, `GA4Property`, `GA4Insight` — GA4 sessions, users, pageviews, bounce rate, conversions, revenue, source/medium breakdown.

### Core app
`SystemLog` — captures Django log records to the database: `level`, `message`, `pathname`, `lineno`, `created_at`.

---

## Environment variables

```
SECRET_KEY=
DJANGO_DEBUG=False
DATABASE_URL=postgresql://user:pass@host:5432/db
ALLOWED_HOSTS=your-backend.onrender.com
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
FRONTEND_URL=https://your-frontend.vercel.app
META_APP_ID=
META_APP_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GA4_CLIENT_ID=
GA4_CLIENT_SECRET=
```

---

## Running locally

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

---

## Deployment

Deployed on Render using the config in `render.yaml`.

- **Build:** `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
- **Start:** `gunicorn config.wsgi:application -c gunicorn.conf.py`
- Gunicorn is configured with 2 sync workers and a 600-second timeout (sync operations can take a while depending on data volume)
- Static files are served by WhiteNoise with compression
