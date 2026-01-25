# SmartAnalytics - Complete Project Mindmap

This document explains the SmartAnalytics project from zero, following a top-to-bottom approach from high-level concepts to concrete technical implementation details.

---

## 1. Technologies Overview

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Infrastructure** | Vercel | - | Frontend hosting (CDN, serverless) |
| | Render | - | Backend hosting + PostgreSQL |
| **Frontend** | Next.js | 14 | SSR React framework with App Router |
| | React | 18 | UI component library |
| | Recharts | 2.x | Data visualization charts |
| **Backend** | Django | 5.0.1 | Python web framework |
| | Django REST Framework | 3.14 | REST API toolkit |
| | Simple JWT | 5.3 | JWT authentication |
| **Database** | PostgreSQL | 15+ | Relational data storage |
| **External APIs** | Meta Marketing API | v21.0 | Facebook/Instagram advertising data |

---

## 2. Repository Structure

```
SmartAnalytics/
├── backend/                    # Django application
│   ├── config/                 # Project configuration
│   │   ├── settings.py         # Django settings (DB, CORS, JWT)
│   │   ├── urls.py             # Root URL routing
│   │   └── wsgi.py             # WSGI entry point
│   ├── users/                  # User authentication app
│   │   ├── models.py           # CustomUser model
│   │   ├── views.py            # Login, register, profile endpoints
│   │   └── serializers.py      # User data serialization
│   ├── agencies/               # Multi-tenancy app
│   │   ├── models.py           # Agency, AgencyUser models
│   │   ├── views.py            # Agency CRUD, client management
│   │   └── permissions.py      # Row-level access control
│   ├── integrations/           # External service connections
│   │   ├── models.py           # MetaIntegration (OAuth tokens)
│   │   ├── views.py            # OAuth callback endpoints
│   │   └── services/
│   │       └── meta_service.py # OAuth token exchange, auto-sync trigger
│   ├── meta_ads/               # Meta Ads data (PRIMARY app for Meta)
│   │   ├── models.py           # MetaUser, Business, AdAccount, Campaign, AdSet, Ad, AdCreative, Insight, SyncState
│   │   ├── views.py            # Sync endpoints, client data endpoints
│   │   ├── serializers.py      # Data serialization
│   │   ├── services/
│   │   │   └── sync_service.py # MetaSyncService (structural + insights sync logic)
│   │   └── admin.py            # Django admin customizations
│   ├── core/                   # Shared utilities
│   │   ├── models.py           # SystemLog model
│   │   └── logging_utils.py    # Database logging helper
│   ├── campaigns/              # ⚠️ DEPRECATED - Use meta_ads instead
│   └── metrics/                # ⚠️ DEPRECATED - Use meta_ads.Insight instead
│
├── frontend/                   # Next.js application
│   ├── src/
│   │   ├── app/                # App Router pages
│   │   │   ├── page.tsx        # Landing page (/)
│   │   │   ├── agency/
│   │   │   │   ├── login/      # Agency login page
│   │   │   │   └── dashboard/  # Agency dashboard
│   │   │   ├── client/
│   │   │   │   └── login/      # Client login page
│   │   │   └── dashboard/      # Client dashboard (3-panel layout)
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Navbar.tsx      # Navigation bar
│   │   │   └── ...             # Other components
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx # Authentication state management
│   │   └── lib/
│   │       └── api.ts          # Axios client with interceptors
│   └── next.config.js          # Next.js configuration
│
├── docs/                       # Documentation
│   ├── CLAUDE.md               # AI assistant context
│   └── BLUEPRINT.md            # Feature specifications
│
├── MINDMAP.md                  # This file
└── requirements.txt            # Python dependencies
```

---

## 3. Core Concepts

### 3.1 Multi-Tenancy Model

SmartAnalytics uses a hierarchical multi-tenancy structure:

```
Agency (top-level tenant)
    │
    ├── AgencyUser (agency employees)
    │       └── user_type: "agency"
    │
    └── Client (agency's customers)
            │
            └── AgencyUser (client access)
                    └── user_type: "client"
```

**Key Models:**
- `Agency`: Organization container (name, settings)
- `Client`: Belongs to an Agency, has assigned AdAccounts
- `AgencyUser`: Links a User to an Agency with a role (agency/client)
- `AdAccount`: Meta ad account, assigned to specific Clients

### 3.2 Authentication Model

JWT-based authentication with two token types:
- **Access Token**: Short-lived (60 minutes), used for API requests
- **Refresh Token**: Long-lived (7 days), used to get new access tokens

```
User Login
    │
    ▼
Backend validates credentials
    │
    ▼
Returns: { access_token, refresh_token, user_type, agency_id }
    │
    ▼
Frontend stores in localStorage
    │
    ▼
All API requests include: Authorization: Bearer <access_token>
```

---

## 4. Authentication Flow (Detailed)

### 4.1 Agency Login Flow

**User Action:** Navigate to `/agency/login`, enter email/password, click "Login"

```
[Frontend: /agency/login/page.tsx]
    │
    ▼ POST /api/auth/login/
    │ Body: { email, password }
    │
[Backend: users/views.py → LoginView]
    │
    ├── Validate credentials against CustomUser
    ├── Check user has AgencyUser with user_type="agency"
    ├── Generate JWT tokens via SimpleJWT
    │
    ▼ Response: { access, refresh, user_type, agency_id, agency_name }
    │
[Frontend: AuthContext.tsx]
    │
    ├── Store tokens in localStorage
    ├── Set user state in React Context
    │
    ▼ Redirect to /agency/dashboard
```

**Files Involved:**
- `frontend/src/app/agency/login/page.tsx` - Login form UI
- `frontend/src/contexts/AuthContext.tsx` - Token storage, user state
- `backend/users/views.py` - LoginView class
- `backend/users/serializers.py` - LoginSerializer

### 4.2 Client Login Flow

**User Action:** Navigate to `/client/login`, enter email/password, click "Login"

```
[Frontend: /client/login/page.tsx]
    │
    ▼ POST /api/auth/login/
    │ Body: { email, password }
    │
[Backend: users/views.py → LoginView]
    │
    ├── Validate credentials
    ├── Check user has AgencyUser with user_type="client"
    ├── Get associated Client record
    │
    ▼ Response: { access, refresh, user_type, client_id, agency_id }
    │
[Frontend: AuthContext.tsx]
    │
    ├── Store tokens in localStorage
    ├── Set user state (including client_id)
    │
    ▼ Redirect to /dashboard
```

### 4.3 Token Auto-Refresh

**Trigger:** API request returns 401 Unauthorized

```
[Frontend: lib/api.ts - Axios Interceptor]
    │
    ├── Catch 401 response
    ├── Check if refresh token exists
    │
    ▼ POST /api/auth/token/refresh/
    │ Body: { refresh: stored_refresh_token }
    │
[Backend: SimpleJWT TokenRefreshView]
    │
    ▼ Response: { access: new_access_token }
    │
[Frontend]
    │
    ├── Update stored access token
    ├── Retry original failed request
    │
    ▼ Continue normal operation
```

### 4.4 Route Protection

**Implementation:** Client-side guards in page components

```tsx
// Pattern used in dashboard pages
useEffect(() => {
  if (!user) {
    router.push('/agency/login');
  } else if (user.user_type !== 'agency') {
    router.push('/dashboard');
  }
}, [user]);
```

---

## 5. Agency Dashboard Flows

### 5.1 Dashboard Structure

```
/agency/dashboard
    │
    ├── Header (Agency name, logout button)
    │
    ├── Meta Integration Section
    │   ├── Connect to Meta (if not connected)
    │   └── Sync Data (if connected)
    │
    ├── Clients Section
    │   ├── Client list table
    │   └── Add Client button
    │
    └── Ad Accounts Section
        └── Account assignment interface
```

### 5.2 Connect Meta Account Flow

**User Action:** Click "Connect to Meta" button

```
[Frontend: /agency/dashboard/page.tsx]
    │
    ▼ Open popup window to Meta OAuth URL
    │ URL: https://www.facebook.com/v21.0/dialog/oauth
    │ Params: client_id, redirect_uri, scope, state
    │
[Meta OAuth Server]
    │
    ├── User logs into Facebook
    ├── User grants permissions (ads_read, ads_management, etc.)
    │
    ▼ Redirect to: /api/integrations/meta/callback/?code=XXX&state=YYY
    │
[Backend: integrations/services/meta_service.py → exchange_code_for_token()]
    │
    ├── Exchange code for access_token via Meta Graph API
    ├── Create/Update MetaIntegration record with token
    │
    ├── AUTOMATIC STRUCTURAL SYNC (NEW):
    │   ├── Call MetaSyncService.sync_structural_data()
    │   ├── Sync Meta User (ID, name, email)
    │   ├── Sync Businesses
    │   ├── Sync Ad Accounts only (campaigns/adsets synced separately via modal)
    │   └── Log all operations to SystemLog
    │
    ▼ Response: HTML page that calls window.opener.postMessage()
    │
[Frontend: Popup message handler]
    │
    ├── Receive success message
    ├── Close popup
    ├── Refresh dashboard data
    │
    ▼ Show "Connected" status with Sync button
```

**Key Implementation Details:**
- **Auto-sync at connect:** Structural data (user, businesses, ad accounts) synced immediately
- **Rate limiting:** 24h cooldown per entity type (user, business, ad_account, campaign, etc.)
- **SystemLog:** All operations logged to `core_systemlog` table
- **Token storage:** Access token stored in `meta_integrations` table

**Files Involved:**
- `frontend/src/app/agency/dashboard/page.tsx` - OAuth trigger
- `backend/integrations/services/meta_service.py` - Token exchange + auto-sync trigger
- `backend/meta_ads/services/sync_service.py` - Structural sync logic
- `backend/integrations/models.py` - MetaIntegration model
- `backend/meta_ads/models.py` - AdAccount, Campaign, etc. models

### 5.3 Sync Meta Data Flow (Insights Modal)

**User Action:** Click "Sync Insights" button

```
[Frontend: /agency/dashboard/page.tsx]
    │
    ├── Open Sync Modal (SyncModal component)
    │   ├── Show list of all ad accounts (with checkboxes)
    │   ├── Date range pickers (default: 2026-01-01 to today)
    │   └── "Start Sync" button
    │
    ▼ User selects accounts + date range, clicks "Start Sync"
    │
    ▼ POST /api/meta/insights-sync/
    │ Headers: Authorization: Bearer <token>
    │ Body: { ad_account_ids: [...], start_date: "2026-01-01", end_date: "2026-01-25" }
    │
[Backend: meta_ads/views.py → trigger_insights_sync()]
    │
    ├── Check rate limit (24h cooldown per entity type)
    ├── Get MetaIntegration for agency
    │
    ├── STEP 1: Sync structural data for selected accounts
    │   ├── Call MetaSyncService.sync_structural_for_accounts(ad_account_ids)
    │   ├── For each selected account:
    │   │   ├── GET /act_{id}/campaigns → Upsert Campaign records
    │   │   ├── GET /act_{id}/adsets → Upsert AdSet records
    │   │   ├── GET /act_{id}/ads → Upsert Ad records
    │   │   └── GET /act_{id}/adcreatives → Upsert AdCreative records
    │   └── Log: NEW vs UPDATED entities
    │
    ├── STEP 2: Sync insights (INCREMENTAL)
    │   ├── Call MetaSyncService.sync_insights(ad_account_ids, start_date, end_date)
    │   ├── For each selected account:
    │   │   ├── Check last_insight_date in SyncState
    │   │   ├── Fetch only missing date gaps
    │   │   ├── For each level (account, campaign, adset, ad):
    │   │   │   ├── GET /act_{id}/insights?time_range={...}&level={level}
    │   │   │   └── Insert new Insight records (append-only)
    │   │   └── Update SyncState.last_insight_date
    │   └── Log: Total insights added
    │
    ▼ Response: {
        status: "success",
        structural: {...},
        insights: { total_created: N, accounts_synced: M }
      }
    │
[Frontend]
    │
    ├── Close modal
    ├── Show success toast with summary
    ├── Refresh dashboard data
    │
    ▼ Display updated metrics
```

**Key Implementation Details:**
- **Two-Phase Sync:** Structural data first, then insights
- **Incremental Insights:** Only fetches missing date ranges (checks `SyncState.last_insight_date`)
- **Rate Limiting:** 24h cooldown per entity type (user, business, ad_account, campaign, adset, ad)
- **Upsert Pattern:** Structural data uses `update_or_create()`, insights are append-only
- **Multi-level Insights:** Fetches at account, campaign, adset, and ad levels
- **Pagination:** Meta API pagination handled automatically
- **SystemLog:** Detailed logging for debugging (meta.sync.structural, meta.sync.insights)

**Files Involved:**
- `frontend/src/app/agency/dashboard/page.tsx` - Sync modal UI
- `backend/meta_ads/views.py` - trigger_insights_sync() endpoint
- `backend/meta_ads/services/sync_service.py` - Sync logic
- `backend/meta_ads/models.py` - Insight, SyncState models

### 5.4 Create Client Flow

**User Action:** Click "Add Client", fill form, submit

```
[Frontend: /agency/dashboard/page.tsx]
    │
    ├── Open modal with client form
    ├── User enters: name, email, (optional) ad account assignments
    │
    ▼ POST /api/agencies/{id}/clients/
    │ Body: { name, email, ad_account_ids }
    │
[Backend: agencies/views.py → ClientViewSet.create()]
    │
    ├── Create Client record
    ├── Generate random password
    ├── Create User record with generated password
    ├── Create AgencyUser linking User to Client
    ├── Assign selected AdAccounts to Client
    │
    ▼ Response: { id, name, email, temporary_password, ad_accounts }
    │
[Frontend]
    │
    ├── Show success with temporary password
    ├── Refresh client list
    │
    ▼ New client appears in table
```

**Security Note:** Temporary password is shown once; client should change it on first login.

---

## 6. Client Dashboard Flows

### 6.1 Dashboard Structure

```
/dashboard (client dashboard)
    │
    ├── Left Panel: Ad Account Selector
    │   └── List of assigned accounts (filterable)
    │
    ├── Main Content Area
    │   ├── Summary Cards (spend, impressions, clicks, etc.)
    │   ├── Performance Chart (line/bar chart over time)
    │   └── Breakdown Tables (by campaign, by day)
    │
    └── Right Panel: Navigation / Settings
```

### 6.2 Initial Data Loading Flow

**Trigger:** Client navigates to `/dashboard`

```
[Frontend: /dashboard/page.tsx]
    │
    ├── useEffect on mount
    │
    ▼ GET /api/agencies/clients/me/ad-accounts/
    │ Headers: Authorization: Bearer <token>
    │
[Backend: agencies/views.py → ClientAdAccountsView]
    │
    ├── Get AgencyUser from JWT token
    ├── Get associated Client
    ├── Return only AdAccounts assigned to this Client
    │
    ▼ Response: [{ id, account_id, name }, ...]
    │
[Frontend]
    │
    ├── Store accounts in state
    ├── Auto-select first account
    │
    ▼ Trigger metrics fetch for selected account
```

### 6.3 Metrics Loading Flow

**Trigger:** User selects an ad account

```
[Frontend: /dashboard/page.tsx]
    │
    ▼ GET /api/metrics/daily/?ad_account_id={id}&date_from={}&date_to={}
    │
[Backend: metrics/views.py → DailyMetricViewSet]
    │
    ├── Verify user has permission for this ad_account
    │   └── Check: AdAccount.client.agencyuser_set contains request.user
    │
    ├── Query DailyMetric filtered by:
    │   ├── ad_account_id
    │   ├── date range
    │   └── (optional) campaign_id, adset_id
    │
    ├── Aggregate metrics:
    │   ├── SUM(spend)
    │   ├── SUM(impressions)
    │   ├── SUM(clicks)
    │   ├── Calculated: CTR = clicks/impressions
    │   └── Calculated: CPC = spend/clicks
    │
    ▼ Response: { summary: {...}, daily: [...], by_campaign: [...] }
    │
[Frontend]
    │
    ├── Update summary cards
    ├── Render Recharts LineChart with daily data
    ├── Populate breakdown tables
    │
    ▼ Dashboard fully loaded
```

### 6.4 Permission Filtering (Row-Level Security)

**Implementation:** Every query filters by user's allowed resources

```python
# Pattern in views.py
def get_queryset(self):
    user = self.request.user
    agency_user = AgencyUser.objects.get(user=user)

    if agency_user.user_type == 'client':
        # Client sees only their assigned accounts
        client = agency_user.client
        return AdAccount.objects.filter(client=client)
    else:
        # Agency sees all accounts in their agency
        return AdAccount.objects.filter(agency=agency_user.agency)
```

---

## 7. Data Models (Database Schema)

### 7.1 User & Auth Models

```
CustomUser (extends AbstractUser)
├── email (unique, used for login)
├── first_name
├── last_name
├── user_type (choices: 'agency', 'client')
└── date_joined

AgencyUser
├── user (FK → CustomUser)
├── agency (FK → Agency)
├── user_type (choices: 'agency', 'client')
├── permissions (JSONField) - format: { "meta_accounts": [account_ids...] }
└── created_at
```

### 7.2 Multi-Tenancy Models

```
Agency
├── name
├── created_at
└── owner (FK → CustomUser)
```

### 7.3 Integration Models

```
MetaIntegration (in integrations app)
├── agency (FK → Agency)
├── access_token (text)
├── meta_user_id
├── created_at
└── updated_at
```

### 7.4 Meta Ads Structural Models (meta_ads app)

**Important:** These are the PRIMARY tables for Meta data. Legacy tables (`campaigns`, `ad_sets`, `ads`) have been removed.

```
MetaUser (meta_ads_metauser)
├── agency (FK → Agency)
├── meta_user_id (unique, Meta's user ID)
├── name
├── email
└── created_at / updated_at

Business (meta_ads_business)
├── agency (FK → Agency)
├── business_id (unique, Meta's business ID)
├── name
└── created_at / updated_at

AdAccount (meta_ads_adaccount)
├── agency (FK → Agency)
├── account_id (unique, Meta's act_XXX ID)
├── name
├── currency
├── timezone_name
├── business (FK → Business, nullable)
└── created_at / updated_at

Campaign (meta_ads_campaign)
├── agency (FK → Agency)
├── ad_account (FK → AdAccount)
├── campaign_id (unique, Meta's campaign ID)
├── name
├── status (choices: ACTIVE, PAUSED, ARCHIVED, DELETED)
├── objective
├── daily_budget
├── lifetime_budget
└── created_at / updated_at

AdSet (meta_ads_adset)
├── agency (FK → Agency)
├── campaign (FK → Campaign)
├── adset_id (unique, Meta's adset ID)
├── name
├── status
├── daily_budget
├── lifetime_budget
├── targeting (JSONField)
└── created_at / updated_at

Ad (meta_ads_ad)
├── agency (FK → Agency)
├── adset (FK → AdSet)
├── ad_id (unique, Meta's ad ID)
├── name
├── status
├── creative (FK → AdCreative, nullable)
└── created_at / updated_at

AdCreative (meta_ads_adcreative)
├── agency (FK → Agency)
├── creative_id (unique, Meta's creative ID)
├── name
├── title
├── body
├── image_url
├── video_url
├── link_url
├── call_to_action
└── created_at / updated_at
```

### 7.5 Meta Ads Insights Models

```
Insight (meta_ads_insight) - APPEND-ONLY table
├── agency (FK → Agency)
├── ad_account (FK → AdAccount)
├── campaign (FK → Campaign, nullable)
├── adset (FK → AdSet, nullable)
├── ad (FK → Ad, nullable)
├── date (date field)
├── level (choices: 'account', 'campaign', 'adset', 'ad')
├── impressions (integer)
├── clicks (integer)
├── spend (decimal)
├── reach (integer)
├── frequency (decimal)
├── ctr (decimal)
├── cpc (decimal)
├── cpm (decimal)
├── conversions (integer)
├── created_at
└── updated_at

Indexes:
├── (agency, ad_account, date, level) - main query pattern
├── (campaign, date) - campaign breakdown
├── (adset, date) - adset breakdown
└── (ad, date) - ad breakdown

Constraints:
├── Unique: (ad_account, campaign, adset, ad, date, level) - prevents duplicates
```

### 7.6 Sync State Tracking

```
SyncState (meta_ads_syncstate)
├── agency (FK → Agency)
├── entity_type (choices: 'user', 'business', 'ad_account', 'campaign', 'adset', 'ad', 'creative')
├── entity_id (Meta's ID for this entity)
├── last_synced_at (timestamp)
├── last_insight_date (date, nullable) - for incremental insight sync
└── updated_at

Purpose:
├── Rate limiting: Check last_synced_at to enforce 24h cooldown
└── Incremental sync: Track last_insight_date to fetch only new data

Indexes:
└── (agency, entity_type, entity_id) - unique together
```

### 7.7 Agency-Client Ad Account Access

```
AgencyAdAccountAccess (meta_ads_agencyadaccountaccess)
├── agency (FK → Agency)
├── ad_account (FK → AdAccount)
├── granted_at (timestamp)
└── notes (text, nullable)

Purpose: Track which ad accounts the agency has access to
```

### 7.8 System Logging

```
SystemLog (core_systemlog)
├── level (choices: 'DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL')
├── logger_name (e.g., 'meta.connect', 'meta.sync.structural', 'meta.sync.insights')
├── message (text)
├── timestamp (auto_now_add)
└── extra_data (JSONField, nullable)

Purpose: Debugging and audit trail for all Meta operations

Common logger_name values:
├── meta.connect - OAuth connection events
├── meta.sync.structural - Structural data sync
├── meta.sync.insights - Insights sync
└── meta.client - Client permission/access events
```

---

## 8. API Endpoints Reference

### 8.1 Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login/` | Login, returns JWT tokens |
| POST | `/api/auth/register/` | Register new agency |
| POST | `/api/auth/token/refresh/` | Refresh access token |
| GET | `/api/auth/me/` | Get current user profile |

### 8.2 Agencies

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agencies/` | List user's agencies |
| GET | `/api/agencies/{id}/` | Get agency details |
| GET | `/api/agencies/{id}/clients/` | List agency's clients |
| POST | `/api/agencies/{id}/clients/` | Create new client |

### 8.3 Meta Integrations (OAuth & Connection)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/integrations/meta/status/` | Check Meta connection status |
| GET | `/api/integrations/meta/auth-url/` | Get OAuth URL |
| GET | `/api/integrations/meta/callback/` | OAuth callback (triggers auto-sync) |
| POST | `/api/integrations/meta/disconnect/` | Disconnect Meta account |

### 8.4 Meta Ads Sync (Agency Endpoints)

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/api/meta/sync-status/` | Get current sync status | - |
| POST | `/api/meta/structural-sync/` | Trigger full structural sync | - |
| POST | `/api/meta/insights-sync/` | Trigger insights sync for selected accounts | `{ ad_account_ids: [], start_date: "YYYY-MM-DD", end_date: "YYYY-MM-DD" }` |
| GET | `/api/meta/ad-accounts/` | List all ad accounts (for sync modal) | - |

**Response Example for `/api/meta/insights-sync/`:**
```json
{
  "status": "success",
  "message": "Structural + Insights synced for 2 account(s)",
  "structural": {
    "campaigns": { "new": 5, "updated": 3 },
    "adsets": { "new": 12, "updated": 8 },
    "ads": { "new": 24, "updated": 15 },
    "creatives": { "new": 18, "updated": 6 }
  },
  "insights": {
    "total_created": 1250,
    "accounts_synced": 2
  }
}
```

### 8.5 Meta Ads Client Endpoints

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | `/api/meta/client/ad-accounts/` | Get client's allowed ad accounts | - |
| GET | `/api/meta/client/campaigns/` | Get campaigns (filtered by permissions) | `account_id` |
| GET | `/api/meta/client/adsets/` | Get adsets (filtered by permissions) | `account_id`, `campaign_id` (optional) |
| GET | `/api/meta/client/ads/` | Get ads (filtered by permissions) | `account_id`, `adset_id` (optional) |
| GET | `/api/meta/client/insights/` | Get insights (filtered by permissions) | `account_id`, `start_date`, `end_date`, `level` |

**Permission Filtering:** All client endpoints check `AgencyUser.permissions['meta_accounts']` to ensure row-level security.

### 8.6 Legacy Endpoints (Deprecated)

These endpoints may still exist but should be migrated to use meta_ads models:

| Method | Endpoint | Status |
|--------|----------|--------|
| GET | `/api/campaigns/accounts/` | ⚠️ Deprecated - Use `/api/meta/ad-accounts/` |
| GET | `/api/metrics/daily/` | ⚠️ Deprecated - Use `/api/meta/client/insights/` |

---

## 9. System Logging & Debugging

### 9.1 SystemLog Model

All Meta operations are logged to the `core_systemlog` table for debugging and audit purposes.

**Log Levels:**
- `DEBUG` - Detailed diagnostic information
- `INFO` - General informational messages
- `WARNING` - Warning messages (non-critical issues)
- `ERROR` - Error messages (operation failed)
- `CRITICAL` - Critical issues (system-level failures)

### 9.2 Logger Name Convention

Logs are categorized by `logger_name` for easy filtering:

| Logger Name | Purpose | Example Messages |
|-------------|---------|------------------|
| `meta.connect` | OAuth connection events | `[CONNECT] Token obtained for agency X` |
| `meta.sync.structural` | Structural data sync | `[SYNC] Campaign 123: NEW` / `[SYNC] Campaign 123: UPDATED` |
| `meta.sync.insights` | Insights sync | `[INSIGHTS] Account act_123 - Level campaign: 45 records` |
| `meta.client` | Client permission/access | `[CLIENT] Permissions meta_accounts: [1, 2, 3]` |
| `meta.rate_limit` | Rate limiting events | `[RATE_LIMIT] campaign level: Last synced 2h ago, can sync` |

### 9.3 Querying Logs in pgAdmin

**Example queries:**

```sql
-- Get all Meta connection logs
SELECT * FROM core_systemlog
WHERE logger_name = 'meta.connect'
ORDER BY timestamp DESC LIMIT 50;

-- Get all sync errors
SELECT * FROM core_systemlog
WHERE logger_name LIKE 'meta.sync%' AND level = 'ERROR'
ORDER BY timestamp DESC;

-- Get sync summary for a specific date
SELECT logger_name, level, COUNT(*)
FROM core_systemlog
WHERE timestamp::date = '2026-01-25'
GROUP BY logger_name, level;

-- Get detailed insights sync logs
SELECT * FROM core_systemlog
WHERE logger_name = 'meta.sync.insights'
  AND message LIKE '%INSIGHTS%'
ORDER BY timestamp DESC LIMIT 100;
```

### 9.4 Common Debugging Scenarios

**Scenario 1: Client can't see ad accounts**
```sql
-- Check client permissions
SELECT u.email, au.permissions
FROM users_customuser u
JOIN agencies_agencyuser au ON au.user_id = u.id
WHERE u.email = 'client@example.com';

-- Check what ad accounts exist
SELECT id, account_id, name FROM meta_ads_adaccount;

-- Check client logs
SELECT * FROM core_systemlog
WHERE logger_name = 'meta.client'
ORDER BY timestamp DESC LIMIT 20;
```

**Scenario 2: Insights not syncing**
```sql
-- Check sync state
SELECT * FROM meta_ads_syncstate
WHERE entity_type IN ('ad_account', 'campaign', 'adset', 'ad')
ORDER BY last_synced_at DESC;

-- Check insights sync logs
SELECT * FROM core_systemlog
WHERE logger_name = 'meta.sync.insights'
  AND timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC;

-- Check actual insights data
SELECT ad_account_id, level, date, COUNT(*) as insights_count
FROM meta_ads_insight
GROUP BY ad_account_id, level, date
ORDER BY date DESC LIMIT 50;
```

**Scenario 3: Rate limiting issues**
```sql
-- Check rate limit state for all entity types
SELECT entity_type, entity_id, last_synced_at,
  NOW() - last_synced_at as time_since_sync
FROM meta_ads_syncstate
WHERE agency_id = 1
ORDER BY last_synced_at DESC;

-- Check rate limit logs
SELECT * FROM core_systemlog
WHERE logger_name = 'meta.rate_limit'
ORDER BY timestamp DESC LIMIT 30;
```

---

## 10. Environment Configuration

### 10.1 Backend Environment Variables

```bash
# Django
SECRET_KEY=<django-secret-key>
DEBUG=False
ALLOWED_HOSTS=api.smartanalytics.com,localhost

# Database
DATABASE_URL=postgres://user:pass@host:5432/dbname

# CORS
CORS_ALLOWED_ORIGINS=https://smartanalytics.com,http://localhost:3000

# Meta API
META_APP_ID=<facebook-app-id>
META_APP_SECRET=<facebook-app-secret>
META_REDIRECT_URI=https://api.smartanalytics.com/api/integrations/meta/callback/

# JWT
JWT_ACCESS_TOKEN_LIFETIME=60  # minutes
JWT_REFRESH_TOKEN_LIFETIME=10080  # 7 days in minutes
```

### 10.2 Frontend Environment Variables

```bash
# API
NEXT_PUBLIC_API_URL=https://api.smartanalytics.com

# Meta OAuth
NEXT_PUBLIC_META_APP_ID=<facebook-app-id>
```

---

## 11. Performance Optimizations

### 11.1 Rate Limiting (24h Cooldown)

**Problem:** Meta API has rate limits. Syncing the same data repeatedly wastes quota and slows down operations.

**Solution:** Granular 24h cooldown per entity type stored in `SyncState`:

```python
# In MetaSyncService.check_rate_limit()
last_sync = SyncState.objects.filter(
    agency=self.agency,
    entity_type='campaign',  # or 'adset', 'ad', etc.
).order_by('-last_synced_at').first()

if last_sync and (timezone.now() - last_sync.last_synced_at) < timedelta(hours=24):
    raise Exception(f"Rate limit: Can sync campaigns again at {last_sync.last_synced_at + timedelta(hours=24)}")
```

**Benefits:**
- Prevents unnecessary API calls
- Respects Meta API quotas
- Per-entity granularity (can sync ads even if campaigns were recently synced)

### 11.2 Incremental Insights Sync

**Problem:** Re-fetching all historical insights on every sync is slow and wasteful.

**Solution:** Track `last_insight_date` in `SyncState` and only fetch new data:

```python
# In MetaSyncService.sync_insights()
sync_state = SyncState.objects.get(entity_type='ad_account', entity_id=account_id)

if sync_state.last_insight_date:
    # Only fetch from last sync date to end_date
    actual_start = sync_state.last_insight_date + timedelta(days=1)
else:
    # First sync: fetch from requested start_date
    actual_start = start_date

# Fetch insights from actual_start to end_date
insights = fetch_from_meta(actual_start, end_date)

# Update last_insight_date
sync_state.last_insight_date = end_date
sync_state.save()
```

**Benefits:**
- Significantly faster subsequent syncs
- Reduces Meta API usage
- Append-only pattern ensures data integrity

### 11.3 Selective Structural Sync

**Problem:** At Meta Connect, syncing all campaigns/adsets/ads for all accounts takes too long.

**Solution:** Two-tier sync strategy:

1. **Meta Connect:** Sync only up to ad_accounts level
   - User, Businesses, Ad Accounts
   - Fast connection experience

2. **Insights Modal Sync:** Sync campaigns/adsets/ads for selected accounts only
   - User selects which accounts need insights
   - Structural sync happens just-in-time for those accounts

**Benefits:**
- Faster OAuth connection
- User controls what data to sync
- Reduces unnecessary API calls

### 11.4 Append-Only Insights Table

**Problem:** Updating existing insight records can cause race conditions and data inconsistencies.

**Solution:** `meta_ads_insight` is append-only with unique constraint:

```python
# Unique constraint on (ad_account, campaign, adset, ad, date, level)
# Database prevents duplicates automatically

insight = Insight(
    agency=agency,
    ad_account=account,
    date=insight_date,
    level='campaign',
    impressions=data['impressions'],
    # ... other fields
)
insight.save()  # Fails silently if duplicate (already exists)
```

**Benefits:**
- No update race conditions
- Historical data preserved
- Simple conflict resolution (duplicates are just skipped)

---

## 12. Critical Analysis

### 12.1 What's Working Well

| Aspect | Implementation | Benefit |
|--------|---------------|---------|
| **Separation of Concerns** | Modular Django apps (users, agencies, integrations, meta_ads, core) | Easy to maintain, test independently |
| **Row-Level Security** | Permission checks via `AgencyUser.permissions['meta_accounts']` | Clients can't access other clients' data |
| **Upsert Pattern** | `update_or_create()` for structural sync | No duplicate records, idempotent syncs |
| **Granular Rate Limiting** | 24h cooldown per entity type (campaign, adset, ad, etc.) | Efficient API usage, respects Meta quotas |
| **Incremental Insights** | Track `last_insight_date` per account | Only fetch new data, significantly faster |
| **Append-Only Insights** | Unique constraint prevents duplicates | Data integrity, no race conditions |
| **Auto-Sync at Connect** | Structural sync on OAuth callback | Immediate data availability |
| **Selective Sync** | User chooses accounts + date range | Control over what data to sync |
| **SystemLog Audit Trail** | All operations logged to `core_systemlog` | Easy debugging, compliance |
| **JWT Auth** | Access + Refresh tokens | Secure, stateless authentication |
| **Type Safety** | TypeScript in frontend | Fewer runtime errors |

### 12.2 Areas for Improvement

| Issue | Current State | Recommended Fix |
|-------|--------------|-----------------|
| **Inline CSS** | All styles are inline in JSX | Adopt Tailwind CSS or CSS Modules |
| **No Error Boundaries** | React errors crash entire page | Add error boundaries around panels |
| **Limited Validation** | Basic form validation only | Add Zod/Yup schemas for forms |
| **No Loading States** | Some actions lack feedback | Add skeleton loaders, spinners |
| **Meta Token Expiry** | 60-day token, manual reconnect | Implement long-lived token exchange |
| **No Automated Tests** | Manual testing only | Add pytest (backend), Jest (frontend) |
| **Coming Soon Features** | UI shows disabled features | Either implement or remove |

### 12.3 Security Considerations

| Risk | Current Mitigation | Enhancement Needed |
|------|-------------------|-------------------|
| JWT in localStorage | Standard approach | Consider httpOnly cookies |
| Meta token storage | Plain text in DB | Encrypt at rest |
| CORS | Explicit origin list | Good, no changes needed |
| SQL Injection | Django ORM | Good, no changes needed |
| XSS | React auto-escapes | Add CSP headers |

### 12.4 Scalability Notes

- **Database:** Consider read replicas for metrics queries at scale
- **Sync Jobs:** Move to background tasks (Celery) for large accounts
- **Caching:** Add Redis for frequently-accessed dashboard data
- **CDN:** Already using Vercel edge for frontend assets

---

## 13. Local Development Setup

### 13.1 Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Edit with your values
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### 13.2 Frontend

```bash
cd frontend
npm install
cp .env.example .env.local  # Edit with your values
npm run dev
```

### 13.3 Running Both

- Backend runs on: `http://localhost:8000`
- Frontend runs on: `http://localhost:3000`
- Frontend proxies API calls to backend

---

## 14. Deployment

### 14.1 Backend (Render)

1. Connect GitHub repository
2. Set environment variables in Render dashboard
3. Build command: `pip install -r requirements.txt`
4. Start command: `gunicorn config.wsgi:application`
5. Add PostgreSQL database addon

### 14.2 Frontend (Vercel)

1. Connect GitHub repository
2. Set environment variables in Vercel dashboard
3. Framework preset: Next.js (auto-detected)
4. Build command: `npm run build`
5. Output directory: `.next`

---

## 15. Glossary

| Term | Definition |
|------|------------|
| **Agency** | A marketing agency using SmartAnalytics to manage multiple clients |
| **Client** | An advertiser whose ad accounts are managed by an agency |
| **Ad Account** | A Meta advertising account (prefixed with `act_`) |
| **Campaign** | Top-level advertising objective container |
| **Ad Set** | Targeting and budget configuration within a campaign |
| **Ad** | Individual creative/ad unit within an ad set |
| **Impression** | Single display of an ad to a user |
| **Click** | User interaction with an ad |
| **CTR** | Click-Through Rate = Clicks / Impressions |
| **CPC** | Cost Per Click = Spend / Clicks |
| **JWT** | JSON Web Token, used for stateless authentication |

---

*Last updated: January 25, 2026*

---

## Changelog

### January 25, 2026 - Major Meta Ads Refactor
- **New Data Models:** Complete migration to `meta_ads_*` tables (removed legacy `campaigns`, `ad_sets`, `ads`)
- **Auto-Sync on Connect:** OAuth callback now triggers automatic structural sync (user, businesses, ad accounts)
- **Insights Modal:** New UI for selecting accounts + date range for insights sync
- **Granular Rate Limiting:** 24h cooldown per entity type instead of global 5-min cooldown
- **Incremental Insights:** Only fetch missing date ranges, dramatically faster subsequent syncs
- **Two-Phase Sync:** Structural data synced first, then insights (ensures referential integrity)
- **SystemLog:** Comprehensive logging for all Meta operations (connect, sync.structural, sync.insights, client)
- **Client Permissions:** JSONField-based permissions for fine-grained ad account access control
- **Requirements Cleanup:** Reduced dependencies from 100+ to 25 essential packages
