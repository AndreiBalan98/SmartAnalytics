# 🚀 Deployment Fix - Quick Start Guide

**Data:** 2026-01-18
**Probleme Rezolvate:** CORS, Worker Timeout, Mock Data în Production

---

## ✅ Modificări Complete

### 1. **CORS Fixed** ✅
- Adăugat `https://smart-analytics-alpha.vercel.app` în `CORS_ALLOWED_ORIGINS`
- **Fișier:** `backend/config/settings.py`

### 2. **Gunicorn Timeout Crescut** ✅
- Timeout de la 30s → **60 secunde** (1 minut)
- **Fișiere noi:**
  - `backend/gunicorn.conf.py` - Configurare Gunicorn
- **Fișiere modificate:**
  - `backend/render.yaml` - Start command actualizat

### 3. **Cleanup Script pentru Mock Data** ✅
- Management command Django pentru ștergere mock tokens
- **Fișier:** `backend/integrations/management/commands/cleanup_mock_integrations.py`

---

## 📦 Deployment Steps pe Render

### Step 1: Push Changes to Git

```bash
# În root project folder
git add .
git commit -m "Fix CORS, increase timeout to 60s, add cleanup script"
git push origin main
```

### Step 2: Deploy pe Render

Render va auto-deploy când detectează push pe `main` branch.

**Verifică deployment:**
1. Du-te la https://dashboard.render.com
2. Selectează `meta-ads-backend` service
3. Așteaptă până la "Deploy live" (build + start)

### Step 3: Cleanup Mock Data din Database

După ce deployment e live, rulează cleanup command:

**Opțiune A: Via Render Shell**
1. În Render Dashboard → Service → tab "Shell"
2. Rulează:
   ```bash
   cd /opt/render/project/src
   python manage.py cleanup_mock_integrations
   ```
3. Confirmă cu `yes` când întreabă

**Opțiune B: Via Local cu Production DB** (dacă ai DATABASE_URL)
```bash
cd backend
python manage.py cleanup_mock_integrations
```

### Step 4: Reconectează Meta OAuth

1. Du-te la **Agency Dashboard** pe Vercel:
   https://smart-analytics-alpha.vercel.app/agency/dashboard

2. Click pe **"Connect Meta"** sau **"Reconnect"**

3. Autentifică-te cu contul Meta care are acces la ad accounts

4. După OAuth redirect, vei vedea:
   - ✅ Connected în Meta integration card
   - Business name real (nu "Mock Business")

5. Click pe **"Sync Data"** pentru primul sync real

---

## 🔍 Verificare Success

### Backend Logs (Render)

După reconectare Meta, vei vedea în logs:

```
================================================================================
🔐 META OAUTH: Starting token exchange for agency [YourAgency] (ID: X)
✅ Access token obtained successfully
Business Info: ID=[real_id], Name=[Your Business]
✅ Created MetaIntegration for agency [YourAgency]
Token expires at: 2026-03-20T...

Fetching ad accounts user has access to...
✅ User has access to 10 ad account(s):
  - 635349966501948 (ID: act_635349966501948, Currency: RON)
  - Sanco Grup - Ad Account (ID: act_2325507970827382, Currency: RON)
  ...
================================================================================
```

### Frontend Console (Browser)

După sync data, vei vedea:

```
🌐 API Request: POST /api/integrations/meta/sync/
✅ API Response: POST /api/integrations/meta/sync/ - 200
Status: 200
Data: {
  success: true,
  ad_accounts_synced: 10,
  ad_accounts: [
    {id: "act_635349966501948", name: "635349966501948"},
    {id: "act_2325507970827382", name: "Sanco Grup - Ad Account"},
    ...
  ],
  campaigns: {created: 46, updated: 0},
  ...
}
```

---

## ⚠️ Important Notes

### Timeout de 60s
- Sync-ul are **60 secunde** să se execute
- Pentru 10 ad accounts cu multe campaigns, s-ar putea să fie strâns
- Dacă vezi din nou timeout, alternative:
  1. Creștem timeout la 120s (2 min)
  2. Implementăm background jobs (Celery + Redis)

### Rate Limiting
- Sync-ul e rate-limited la **1 sync per minut**
- Dacă dai sync prea des, vei primi error 429

### CORS
- Dacă schimbi domain-ul Vercel, actualizează `CORS_ALLOWED_ORIGINS` în settings.py

---

## 🐛 Troubleshooting

### Dacă CORS error persistă
```bash
# Verifică că deployment e live cu noua configurație
curl https://smartanalytics-sfe7.onrender.com/health/
```

### Dacă timeout persistă
```bash
# Crește timeout în gunicorn.conf.py
timeout = 120  # 2 minute

# Apoi redeploy
git add backend/gunicorn.conf.py
git commit -m "Increase timeout to 120s"
git push origin main
```

### Dacă Mock Data rămâne
```bash
# Rulează cleanup manual via Django shell pe Render
python manage.py shell

# În shell:
from integrations.models import MetaIntegration
MetaIntegration.objects.filter(access_token__startswith='mock_').delete()
exit()
```

---

## 📝 Next Steps După Fix

1. ✅ Test OAuth flow complet
2. ✅ Test Sync Data cu real accounts
3. ✅ Verifică Client Dashboard cu real metrics
4. 🔄 (Optional) Implement background jobs pentru sync asincron

---

**Status:** Ready to Deploy 🚀
