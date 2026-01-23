# SmartAnalytics - Quick Start After Implementation

## 🚀 Start Servers

```bash
# Terminal 1 - Backend
cd backend
python manage.py runserver

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**URLs:**
- Backend: http://localhost:8000
- Frontend: http://localhost:3000

---

## ✅ What's Working Now

### Backend (100% Complete):
- ✅ 10 new database tables with Meta IDs as PKs
- ✅ Complete sync system (structural + insights)
- ✅ 10 new API endpoints
- ✅ Permission filtering for clients
- ✅ Request + sync logging
- ✅ Rate limiting

### Frontend (Partial):
- ✅ OAuth popup window (no redirect)
- ✅ 8 new API client methods
- ❌ Client dashboard UI (still old version)

---

## 🧪 Quick Test Flow

### 1. Test Agency Flow:
```
1. Login at /agency/login
2. Dashboard → Click "Connect Meta"
3. Popup opens → Complete OAuth → Popup closes
4. Run test: curl http://localhost:8000/api/meta/sync/status/
5. Trigger structural sync (via agency dashboard or API)
6. Trigger insights sync (via agency dashboard or API)
```

### 2. Test Client Flow:
```
1. Agency assigns ad account permissions to client
2. Client logs in at /client/login
3. Dashboard shows metrics (OLD UI - Phase 5 not done)
4. Test: curl http://localhost:8000/api/meta/client/ad-accounts/
```

### 3. Verify Database:
```sql
SELECT COUNT(*) FROM meta_ads_adaccount;  -- Should have data after structural sync
SELECT COUNT(*) FROM meta_ads_campaign;   -- Should have campaigns
SELECT COUNT(*) FROM meta_ads_insight;    -- Should have metrics after insights sync
SELECT * FROM meta_ads_syncstate;         -- Check sync status
```

---

## 📊 Test Results

**Automated Tests:** 7/7 PASSED ✅
```bash
cd backend
python test_meta_ads.py
```

**Build Tests:**
- Backend: Django check passes ✅
- Frontend: Next.js build succeeds ✅

---

## 🔍 Key Endpoints to Test

### Agency (requires JWT):
```bash
# Get your token from localStorage after login
TOKEN="your_jwt_here"

# Check sync status
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:8000/api/meta/sync/status/

# Trigger structural sync
curl -X POST -H "Authorization: Bearer $TOKEN" \
     http://localhost:8000/api/meta/sync/structural/

# Get ad accounts
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:8000/api/meta/ad-accounts/
```

### Client (requires JWT):
```bash
CLIENT_TOKEN="client_jwt_here"

# Get permitted ad accounts
curl -H "Authorization: Bearer $CLIENT_TOKEN" \
     http://localhost:8000/api/meta/client/ad-accounts/

# Get campaigns for account
curl -H "Authorization: Bearer $CLIENT_TOKEN" \
     "http://localhost:8000/api/meta/client/campaigns/?account_id=act_123"
```

---

## 📁 Documentation Files

- **IMPLEMENTATION_STATUS.md** - Complete implementation details
- **TESTING_GUIDE.md** - Full testing checklist
- **QUICK_START.md** - This file
- **backend/test_meta_ads.py** - Automated test suite

---

## 🔜 Next Steps

### Option A: Test Everything First
1. Follow TESTING_GUIDE.md
2. Verify all 10 endpoints work
3. Test sync flows end-to-end
4. Check permission filtering

### Option B: Complete Phase 5 (Dashboard UI)
1. Delete old dashboard (608 lines)
2. Create 11 new component files
3. Build 3-panel layout (Left: accounts, Center: data, Right: navigation)
4. Wire up new API methods

### Option C: Deploy to Staging
1. Backend → Render
2. Frontend → Vercel
3. Test in production

---

## ⚡ Common Commands

```bash
# Backend
python manage.py check                    # Verify config
python manage.py showmigrations           # Check migrations
python manage.py shell                    # Django shell
python test_meta_ads.py                   # Run tests

# Frontend
npm run dev                               # Development server
npm run build                             # Production build
npm run lint                              # Linting

# Database
python manage.py dbshell                  # PostgreSQL shell
```

---

## 🎯 What Changed vs. Old System

| Aspect | Old System | New System |
|--------|-----------|------------|
| **IDs** | Django AutoField | Meta IDs (CharField) |
| **Campaign Table** | `campaigns` | `meta_ads_campaign` |
| **Metrics Table** | `daily_metrics` | `meta_ads_insight` |
| **Sync Tracking** | `last_synced_at` field | `SyncState` table |
| **Insights Levels** | Account only | Account/Campaign/AdSet/Ad |
| **Client Dashboard** | Old UI (working) | New UI (Phase 5 - not done) |

---

## ✨ Key Features

1. **Meta IDs as PKs** - Direct mapping, no external_id fields
2. **SyncState Tracking** - Every sync operation logged
3. **Multi-Level Insights** - Account, campaign, adset, ad levels
4. **Append-Only Metrics** - No overwrites, preserves history
5. **Permission Filtering** - Row-level security enforced
6. **Structured Logging** - Request + sync channels
7. **Rate Limiting** - 1 sync per minute

---

## 🚨 Known Issues

- ❌ Client dashboard uses old UI (Phase 5 pending)
- ⚠️ Old sync endpoints exist but deprecated
- ⚠️ Insights table will grow large (no archiving yet)

---

## 💬 Need Help?

See full docs:
- Implementation details → IMPLEMENTATION_STATUS.md
- Testing guide → TESTING_GUIDE.md
- Original plan → (in chat transcript)
