# Frontend

Next.js 14 (App Router) + TypeScript frontend for SmartAnalytics. The app has a landing page, authentication, an agency-facing dashboard for managing connections and clients, and a client-facing dashboard for viewing ad data.

---

## Tech stack

- **Next.js 14** with App Router
- **TypeScript 5** + React 18
- **Tailwind CSS** for styling, with a custom dark navy theme
- **Framer Motion** for animations
- **Recharts** for charts and data visualizations

---

## Pages

| Route | File | What it is |
|---|---|---|
| `/` | `app/page.tsx` | Landing page |
| `/login` | `app/login/page.tsx` | Login for both agencies and clients |
| `/agency/signup` | `app/agency/signup/page.tsx` | Agency registration |
| `/agency/dashboard` | `app/agency/dashboard/page.tsx` | Agency dashboard |
| `/dashboard` | `app/dashboard/page.tsx` | Client dashboard |
| `/oauth/callback` | `app/oauth/callback/page.tsx` | OAuth popup fallback handler |

---

## Client dashboard

The client dashboard is the most complex part of the app. It uses a three-panel layout:

- **Left panel** (`LeftPanel.tsx`) — platform selector and account/campaign/adset navigation tree
- **Center panel** (`CenterPanel.tsx`) — main data display area (tables, insights charts, lead forms)
- **Right panel** (`RightPanel.tsx`) — view mode controls and filters

The center panel renders different views depending on what the user has selected:

- `OverviewView.tsx` — summary of connected platforms and top-level metrics
- `InsightsView.tsx` — Meta Ads analytics with date range filters and charts
- `GoogleAdsInsightsView.tsx` — Google Ads analytics
- `GA4InsightsView.tsx` — GA4 analytics (sessions, users, conversions, revenue)
- `CampaignsTable.tsx`, `AdSetsTable.tsx`, `AdsTable.tsx` — hierarchical tables for browsing campaigns
- `CreativesGrid.tsx` — grid view of Meta ad creatives with images
- `LeadsTable.tsx` — lead form submissions with pagination and `LeadDetailModal.tsx` for full lead details

### Insights components

The analytics views are broken into sub-components under `components/dashboard/insights/`:

- `InsightsFilters.tsx` — date range pickers and entity-level filters
- `MetricsCards.tsx` — KPI cards (spend, impressions, clicks, CPM, CPC, CTR)
- `MetricsCharts.tsx` — Recharts line/bar charts for trend visualization

---

## Agency dashboard

The agency dashboard handles platform connections, data sync, and client management:

- OAuth connect buttons for Meta Ads, Google Ads, and GA4
- Structural sync and insights sync triggers per connected account
- Client list with the ability to create clients, edit their permissions, and deactivate them

---

## Landing page

Built from separate components in `components/landing/`:

- `HeroSection.tsx` — headline and primary CTA
- `KeyCapabilities.tsx` — feature overview
- `ProductPreview.tsx` — screenshot/preview of the dashboard
- `HowItWorks.tsx` — step-by-step flow
- `FinalCTA.tsx` — bottom call to action
- `DepthBackground.tsx` — subtle 3D background effect
- `Footer.tsx`

---

## Auth

Global auth state lives in `contexts/AuthContext.tsx`. It holds the current user object and token management functions (login, logout, refreshUser). On app load it reads tokens from localStorage and hydrates the session.

Token logic is in `lib/auth.ts`:
- Reads/writes access and refresh tokens to localStorage
- Parses JWT payload for expiry checks

All API calls go through `fetchWithAuth()` in `lib/api.ts`, which:
1. Attaches `Authorization: Bearer <token>` header
2. On 401 response, attempts to refresh the access token
3. On successful refresh, retries the original request
4. On failed refresh, clears tokens and redirects to login

---

## API client

`lib/api.ts` is a typed wrapper around all backend endpoints — over 50 functions. Each function calls `fetchWithAuth` with the right method, path, and body, and returns typed responses.

Examples:
```ts
api.login(email, password)
api.getMetaAccounts()
api.triggerInsightsSync(accountIds, dateRange)
api.getClientCampaigns(accountId)
api.getClientInsights(params)
api.updateClientPermissions(clientId, permissions)
```

The base URL is set via `NEXT_PUBLIC_API_URL` environment variable.

---

## OAuth in the frontend

`lib/oauth.ts` handles the OAuth popup flow:

1. Calls the backend `start` endpoint to get the authorization URL
2. Opens that URL in a popup (`window.open`)
3. Listens for a `message` event from the popup (`window.addEventListener('message', ...)`)
4. When the backend callback page fires `postMessage` on successful auth, the popup listener resolves the promise and the dashboard refreshes

This approach keeps the OAuth redirect URL pointing at the backend while giving the frontend a clean async callback.

---

## Styling

Tailwind with a custom config in `tailwind.config.ts`:

- Base colors: dark navy (`#0a1628`, `#1a2332`)
- Accent: electric blue (`#00d4ff`, `#06b6d4`)
- Custom shadows, gradients, and keyframe animations defined as Tailwind extensions
- Dark mode is user-toggled and stored via `PATCH /api/me/preferences/`

---

## UI components

Shared components in `components/ui/`:

- `LoadingSpinner.tsx`
- `StatusBadge.tsx` — colored badge for active/paused/error states
- `DarkModeToggle.tsx`

---

## Environment variables

```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

---

## Running locally

```bash
npm install
npm run dev      # dev server on localhost:3000
npm run build    # production build
npm run start    # serve production build locally
```

The Next.js config (`next.config.js`) sets `output: 'standalone'` for Docker-compatible builds and adds the `Cross-Origin-Opener-Policy` header required for OAuth popups to work correctly.

---

## Deployment

Deployed on Vercel. Set `NEXT_PUBLIC_API_URL` to the Render backend URL in the Vercel project environment settings. No other config needed — Vercel auto-detects Next.js.
