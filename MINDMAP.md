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
│   │   ├── models.py           # Agency, AgencyUser, Client models
│   │   ├── views.py            # Agency CRUD, client management
│   │   └── permissions.py      # Row-level access control
│   ├── integrations/           # External service connections
│   │   ├── models.py           # MetaIntegration (OAuth tokens)
│   │   ├── views.py            # OAuth callback, token exchange
│   │   └── services/
│   │       └── meta_service.py # Meta API wrapper (sync logic)
│   ├── campaigns/              # Campaign data structures
│   │   ├── models.py           # AdAccount, Campaign, AdSet, Ad
│   │   └── views.py            # Campaign listing endpoints
│   ├── metrics/                # Performance metrics
│   │   ├── models.py           # DailyMetric model
│   │   └── views.py            # Metrics aggregation endpoints
│   └── core/                   # Shared utilities
│       └── logging_utils.py    # Database logging helper
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
[Backend: integrations/views.py → MetaCallbackView]
    │
    ├── Exchange code for access_token via Meta Graph API
    ├── Fetch user's ad accounts via /me/adaccounts
    ├── Create/Update MetaIntegration record
    ├── Create AdAccount records for each account
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

**Files Involved:**
- `frontend/src/app/agency/dashboard/page.tsx` - OAuth trigger
- `backend/integrations/views.py` - MetaCallbackView
- `backend/integrations/models.py` - MetaIntegration model
- `backend/campaigns/models.py` - AdAccount model

### 5.3 Sync Meta Data Flow

**User Action:** Click "Sync Data" button

```
[Frontend: /agency/dashboard/page.tsx]
    │
    ▼ POST /api/integrations/meta/sync/
    │ Headers: Authorization: Bearer <token>
    │
[Backend: integrations/views.py → MetaSyncView]
    │
    ├── Check rate limit (last_sync_at + 5 minutes)
    ├── Get MetaIntegration for agency
    ├── Call MetaService.sync_all_data()
    │
    ▼
[Backend: integrations/services/meta_service.py]
    │
    ├── For each AdAccount:
    │   │
    │   ├── GET /act_{id}/campaigns
    │   │   └── Upsert Campaign records
    │   │
    │   ├── GET /act_{id}/adsets
    │   │   └── Upsert AdSet records
    │   │
    │   ├── GET /act_{id}/ads
    │   │   └── Upsert Ad records
    │   │
    │   └── GET /act_{id}/insights
    │       └── Upsert DailyMetric records
    │
    ├── Update MetaIntegration.last_sync_at
    │
    ▼ Response: { status: "success", synced_accounts: N }
    │
[Frontend]
    │
    ├── Show success toast
    ├── Refresh dashboard data
    │
    ▼ Display updated metrics
```

**Key Implementation Details:**
- **Upsert Pattern:** Uses `update_or_create()` to prevent duplicates
- **Rate Limiting:** 5-minute cooldown between syncs
- **Pagination:** Meta API returns paginated results, service handles cursor
- **Date Range:** Fetches last 30 days of insights by default

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
└── date_joined

AgencyUser
├── user (FK → CustomUser)
├── agency (FK → Agency)
├── client (FK → Client, nullable)
├── user_type (choices: 'agency', 'client')
└── role (choices: 'owner', 'admin', 'member')
```

### 7.2 Multi-Tenancy Models

```
Agency
├── name
├── slug (URL-safe identifier)
└── created_at

Client
├── agency (FK → Agency)
├── name
├── email
└── created_at
```

### 7.3 Integration Models

```
MetaIntegration
├── agency (OneToOne → Agency)
├── access_token (encrypted)
├── token_expires_at
├── meta_user_id
├── last_sync_at
└── created_at
```

### 7.4 Campaign Models

```
AdAccount
├── agency (FK → Agency)
├── client (FK → Client, nullable)
├── account_id (Meta's act_XXX ID)
├── name
└── currency

Campaign
├── ad_account (FK → AdAccount)
├── campaign_id (Meta's ID)
├── name
├── status (ACTIVE, PAUSED, etc.)
└── objective

AdSet
├── campaign (FK → Campaign)
├── adset_id (Meta's ID)
├── name
├── status
├── daily_budget
└── targeting (JSONField)

Ad
├── adset (FK → AdSet)
├── ad_id (Meta's ID)
├── name
├── status
└── creative (JSONField)
```

### 7.5 Metrics Models

```
DailyMetric
├── ad_account (FK → AdAccount)
├── campaign (FK → Campaign, nullable)
├── adset (FK → AdSet, nullable)
├── ad (FK → Ad, nullable)
├── date
├── impressions
├── clicks
├── spend (DecimalField)
├── conversions
├── reach
└── frequency

Indexes:
├── (ad_account, date) - primary query pattern
└── (campaign, date) - campaign breakdown queries
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

### 8.3 Integrations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/integrations/meta/status/` | Check Meta connection status |
| GET | `/api/integrations/meta/auth-url/` | Get OAuth URL |
| GET | `/api/integrations/meta/callback/` | OAuth callback handler |
| POST | `/api/integrations/meta/sync/` | Trigger data sync |

### 8.4 Campaigns

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/campaigns/accounts/` | List ad accounts |
| GET | `/api/campaigns/accounts/{id}/campaigns/` | List campaigns |
| GET | `/api/campaigns/accounts/{id}/adsets/` | List ad sets |
| GET | `/api/campaigns/accounts/{id}/ads/` | List ads |

### 8.5 Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/metrics/daily/` | Get daily metrics |
| GET | `/api/metrics/summary/` | Get aggregated summary |

---

## 9. Environment Configuration

### 9.1 Backend Environment Variables

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

### 9.2 Frontend Environment Variables

```bash
# API
NEXT_PUBLIC_API_URL=https://api.smartanalytics.com

# Meta OAuth
NEXT_PUBLIC_META_APP_ID=<facebook-app-id>
```

---

## 10. Critical Analysis

### 10.1 What's Working Well

| Aspect | Implementation | Benefit |
|--------|---------------|---------|
| **Separation of Concerns** | 8 modular Django apps | Easy to maintain, test independently |
| **Row-Level Security** | Permission checks in every ViewSet | Clients can't access other clients' data |
| **Upsert Pattern** | `update_or_create()` for sync | No duplicate records, idempotent syncs |
| **Rate Limiting** | 5-min cooldown on sync | Prevents Meta API abuse |
| **JWT Auth** | Access + Refresh tokens | Secure, stateless authentication |
| **Type Safety** | TypeScript in frontend | Fewer runtime errors |

### 10.2 Areas for Improvement

| Issue | Current State | Recommended Fix |
|-------|--------------|-----------------|
| **Inline CSS** | All styles are inline in JSX | Adopt Tailwind CSS or CSS Modules |
| **No Error Boundaries** | React errors crash entire page | Add error boundaries around panels |
| **Limited Validation** | Basic form validation only | Add Zod/Yup schemas for forms |
| **No Loading States** | Some actions lack feedback | Add skeleton loaders, spinners |
| **Meta Token Expiry** | 60-day token, manual reconnect | Implement long-lived token exchange |
| **No Automated Tests** | Manual testing only | Add pytest (backend), Jest (frontend) |
| **Coming Soon Features** | UI shows disabled features | Either implement or remove |

### 10.3 Security Considerations

| Risk | Current Mitigation | Enhancement Needed |
|------|-------------------|-------------------|
| JWT in localStorage | Standard approach | Consider httpOnly cookies |
| Meta token storage | Plain text in DB | Encrypt at rest |
| CORS | Explicit origin list | Good, no changes needed |
| SQL Injection | Django ORM | Good, no changes needed |
| XSS | React auto-escapes | Add CSP headers |

### 10.4 Scalability Notes

- **Database:** Consider read replicas for metrics queries at scale
- **Sync Jobs:** Move to background tasks (Celery) for large accounts
- **Caching:** Add Redis for frequently-accessed dashboard data
- **CDN:** Already using Vercel edge for frontend assets

---

## 11. Local Development Setup

### 11.1 Backend

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

### 11.2 Frontend

```bash
cd frontend
npm install
cp .env.example .env.local  # Edit with your values
npm run dev
```

### 11.3 Running Both

- Backend runs on: `http://localhost:8000`
- Frontend runs on: `http://localhost:3000`
- Frontend proxies API calls to backend

---

## 12. Deployment

### 12.1 Backend (Render)

1. Connect GitHub repository
2. Set environment variables in Render dashboard
3. Build command: `pip install -r requirements.txt`
4. Start command: `gunicorn config.wsgi:application`
5. Add PostgreSQL database addon

### 12.2 Frontend (Vercel)

1. Connect GitHub repository
2. Set environment variables in Vercel dashboard
3. Framework preset: Next.js (auto-detected)
4. Build command: `npm run build`
5. Output directory: `.next`

---

## 13. Glossary

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

*Last updated: January 2025*
