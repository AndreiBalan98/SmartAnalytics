## 1. DATABASE RESET & SCHEMA

### Goal

Completely reset and rebuild the database in a clean, scalable, and future-proof way.

### Requirements

- Full database reset:
    - erase all existing data
    - recreate all tables from scratch
- Tables:
    - keep the existing tables that are required
    - improve their structure where needed
    - add new tables specifically for meta data
- The database must support:
    - Meta hierarchy:
    user → business → ad account → campaign → ad set → ad → creative
    - insights stored by day
    - a clear sync state (source of truth)

---

## 2. SOURCE OF TRUTH & DATA SYNC

### Source of Truth

- Implement a single source of truth for synchronization
- Create a dedicated `sync_state` table that tracks:
    - which entities are synced
    - sync status (idle / syncing / completed / error)
    - last synced date
    - missing or pending data

---

### Sync Button – Full Reimplementation

### Step 1: Meta Account Connection

- User connects their Meta account
- Meta access token is securely stored in the backend

### Step 2: Initial Sync (Structural Data)

- When the Sync button is pressed:
    - Backend requests all available structural data from Meta (no insights yet):
        - user info
        - businesses info
        - ad accounts
        - campaigns
        - ad sets
        - ads
        - creatives
    - Extract everything that Meta allows (complete structural data)
    - Store all data in the database
    - Update `sync_state`

### Step 3: Ad Account Selection

- After the initial structural sync:
    - A new window opens
    - User selects which ad accounts they want to sync
- For selected ad accounts:
    - request any missing structural data
    - store it in the database
    - update `sync_state`

### Step 4: Insights Sync

- Insights requirements:
    - insights must be stored by day
    - start from yesterday (last fully completed day)
    - store all historical insights starting January 1st, 2026 at 00:00
- Open question / idea (not decided):
    - Is it possible to extract only ad-level or creative-level insights
    - Then calculate higher-level insights (ad set, campaign, account) from them?
    - This is just an idea and needs validation

---

## 3. CLIENT DASHBOARD (FULL REDESIGN)

### Goal

- Completely remove the existing client dashboard
- Rebuild it from scratch

### Style

- clean
- professional
- modern
- Triple Whale inspired
- visually attractive but simple and minimal

### Core Features

- Display:
    - user info
    - businesses info (if available)
    - ad accounts
    - campaigns
    - ad sets
    - ads
    - creatives
    - insights:
        - by hierarchy level
        - by time range
- Platform tabs:
    - Meta (active)
    - Google Ads (not implemented yet, placeholder code only)

---

## 4. FIGMA DESIGN SPECIFICATION

### Layout Overview

- Header:
    - Large “Dashboard” title
    - User info (example: Sarah Johnson – Admin)
    - Business selector dropdown
- Platform Tabs:
    - Meta → active
    - Google → disabled with “Coming Soon” badge
- Three-panel layout with smooth navigation and clear hierarchy

---

### Left Panel – Ad Accounts

- List of ad accounts
- Status indicators:
    - active
    - paused
    - ended
- Display:
    - account balance
    - currency
- Visual indicators:
    - green checkmark (active)
    - yellow pause
    - red X (ended)
- Clickable cards:
    - hover effects
    - selected state styling

---

### Right Panel – Object Navigation

- Navigation options:
    - Campaigns
    - Ad Sets
    - Ads
    - Creatives
    - Insights
- Each item includes:
    - custom icon
    - short description
- States:
    - disabled when no ad account is selected
    - active state with blue accent highlight

---

### Center Panel – Data Display

### Campaigns Table

- Objective
- Budget
- Spend
- Impressions
- Clicks
- Conversions
- CTR
- CPC
- Performance indicators

### Ad Sets Table

- Targeting info
- Performance metrics
- Budget utilization

### Ads Table

- Individual ad performance metrics

### Creatives Grid

- Card-based layout
- Thumbnail images
- Type badges:
    - image
    - video
    - carousel
- Status indicators

### Insights View

- Performance overview cards
- Trend indicators
- Top-performing campaigns
- AI-powered recommendations

---

### Design System

- Light mode
- Clean, professional, neutral color palette
- Blue accent color for active elements
- Rounded corners
- Subtle shadows
- Smooth hover transitions
- Clear visual hierarchy
- Status badges and metric highlights
- Responsive tables
- Proper formatting for currency, numbers, and percentages

---

## 5. BACKEND LOGGING

### Goal

Clear, concise, and informative backend logs.

### Logging Requirements

- Log events for:
    - landing page access
    - login page access
    - dashboard access
    - new client account creation
    - Meta account connection
    - Sync button pressed
- Sync-related logs must clearly show:
    - structural data fetched
    - ad accounts selected for sync
    - what is currently syncing:
        - businesses
        - ad accounts
        - campaigns
        - ad sets
        - ads
        - creatives
    - insights requests
- Logs must be:
    - compact
    - readable
    - chronological
    - easy to scan in the backend console

---

## 6. OTHERS

- Meta account connection:
    - must open in a new window / new tab
    - not a redirect in the same tab
    - smaller popup-style window for Meta authentication

---

## 7. OBSERVATIONS & REFERENCES

- Current database tables:
    ad_sets
    ads
    agencies
    agency_users
    auth_group
    auth_group_permissions
    auth_permission
    auth_user
    auth_user_groups
    auth_user_user_permissions
    campaigns
    daily_metrics
    django_content_type
    django_migrations
    ga4_integrations
    google_ads_integrations
    meta_integration
    meta_integrations
    metric_snapshots
    users
    users_groups
    users_user_permissions
- Read the documentation related to the database schema - DB_AND_SYNC_GUIDE.md

---

## 8. EXTRA NOTES / OBSERVATIONS (NOT MANDATORY YET)

- Consider separating sync types: structural, insights, historical backfill
- Idempotency is required for all sync operations (safe re-runs)
- Meta API failures and rate limits must be expected
- Storing raw Meta responses (JSON) alongside processed tables may be useful
- Soft deletes may be required for Meta entities
- Insights aggregation should be pre-calculated, not computed live in the dashboard
- Display data freshness in the UI (last synced, data coverage)
- Empty states in the dashboard are important for UX
- Token expiration and refresh logic will be needed
- Feature flags may be useful for future platform expansions (e.g. Google Ads)