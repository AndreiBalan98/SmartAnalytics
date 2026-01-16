# CLAUDE.md - Jurnal de Dezvoltare

**Proiect:** SmartAnalytics (SmartMoney - S&M)
**Data Start:** 2026-01-11
**Ultima Actualizare:** 2026-01-16
**Status:** Dezvoltare Activă - FAZA 3 (Agency Dashboard)

---

## 📋 PREZENTARE GENERALĂ

SmartAnalytics este o platformă SaaS multi-tenancy pentru agenții, care gestionează și vizualizează metrici publicitare pentru clienții lor din Meta Ads, Google Ads și GA4.

**Principii Cheie:**
- Simplitate pe primul loc - cod minimal, calitate maximă
- Production-ready din ziua 1
- Implementare pas cu pas conform BLUEPRINT.md și TASKS.md
- Fără feature creep - urmărim strict planul

---

## 🏗️ TECH STACK

- **Frontend:** Next.js 14 (App Router) → Deploy pe Vercel
- **Backend:** Django 5.0.1 + Django REST Framework → Deploy pe Render
- **Database:** PostgreSQL → Hosted pe Render
- **Autentificare:** JWT (djangorestframework-simplejwt)
- **Background Jobs:** Render Background Worker + Cron (FAZA 5)
- **Design:** 3-way responsive (Mobile/Tablet/Desktop), minimalist

---

## 📊 STAREA ACTUALĂ A PROIECTULUI

### Backend - Status Complet ✅

**Arhitectură Django:**
```
backend/
├── config/          # Settings și URL routing principal
├── users/           # Autentificare, User model custom
├── agencies/        # Agency și AgencyUser models
├── integrations/    # OAuth Meta/Google/GA4
├── campaigns/       # Campaign, AdSet, Ad models
├── metrics/         # DailyMetric & MetricSnapshot models
├── core/            # Utilități shared
└── api/             # Legacy endpoints (în tranziție)
```

**Modele Database (Migrații Complete):**
- ✅ `User` - Custom user model cu email ca login
- ✅ `Agency` - Entitate agenție (1:1 cu User agency owner)
- ✅ `AgencyUser` - Juncțiune agency-client cu permisiuni JSON
- ✅ `MetaIntegration` - OAuth tokens Meta Ads
- ✅ `GoogleAdsIntegration` - OAuth tokens Google Ads (pregătit)
- ✅ `GA4Integration` - OAuth tokens GA4 (pregătit)
- ✅ `Campaign` - Campanii publicitare
- ✅ `AdSet` - Ad sets/grupuri de reclame
- ✅ `Ad` - Reclame individuale
- ✅ `DailyMetric` - Metrici de performanță zilnice
- ✅ `MetricSnapshot` - Metrici agregate

**API Endpoints Implementate:**

*Autentificare (`/api/auth/`))*
- ✅ `POST /api/auth/agency/signup/` - Signup agenție + creare entitate Agency
- ✅ `POST /api/auth/login/` - Login universal (agency & client) → returnează JWT
- ✅ `POST /api/auth/refresh/` - Refresh JWT access token

*Management Clienți (`/api/clients/`)*
- ✅ `POST /api/clients/create/` - Agenția creează client (generează parolă temp)
- ✅ `GET /api/clients/` - Lista clienți agenție
- ✅ `PATCH /api/clients/{id}/permissions/` - Update permisiuni client
- ✅ `DELETE /api/clients/{id}/` - Șterge client

*User Info*
- ✅ `GET /api/me/` - Info user curent + agenție/membership

*Integrări (`/api/integrations/`)*
- ✅ `GET /api/integrations/status/` - Status toate integrările (Meta/Google/GA4)
- ✅ `POST /api/integrations/meta/exchange-code/` - Exchange Meta OAuth code
- ✅ `GET /api/integrations/meta/ad-accounts/` - Lista Meta ad accounts
- ✅ `GET /api/integrations/meta/insights/` - Metrici Meta (legacy)
- ✅ `POST /api/integrations/meta/sync/` - **NEW:** Sync all Meta data (campaigns, ad sets, ads, metrics)

*Legacy (`/internal/` - în tranziție)*
- ✅ `GET /health/` - Health check
- ✅ Meta endpoints vechi (vor fi eliminate)

**Securitate & Autentificare:**
- ✅ JWT cu token rotation (60min access, 7 zile refresh)
- ✅ Protected endpoints cu IsAuthenticated
- ✅ User type enforcement (agency vs client)
- ✅ Auto-create Agency entity la signup
- ✅ Password validation Django validators
- ✅ CORS configurat pentru Next.js

---

### Frontend - Status Complet ✅

**Structură Pages:**
```
frontend/src/app/
├── page.tsx                      # ✅ Landing page
├── layout.tsx                    # ✅ Root layout cu AuthProvider
├── agency/
│   ├── signup/page.tsx          # ✅ Agency signup form
│   ├── login/page.tsx           # ✅ Agency login form
│   ├── dashboard/page.tsx       # ✅ Agency dashboard COMPLET
│   └── meta-callback/page.tsx   # ✅ Meta OAuth callback
├── client/
│   └── login/page.tsx           # ✅ Client login form
├── dashboard/page.tsx           # 🚧 Client dashboard (FAZA 4)
└── settings/page.tsx            # 🚧 Settings (legacy, de refactorizat)
```

**Infrastructură Autentificare:**
- ✅ `AuthContext` (React Context API)
- ✅ `AuthProvider` wraps întreaga aplicație
- ✅ Token storage în localStorage (access + refresh)
- ✅ Auto-refresh la 401 unauthorized
- ✅ Protected route logic cu redirects
- ✅ User data persistence

**Utilități (`/lib/`):**
- ✅ `api.ts` - Client API cu `fetchWithAuth()` și toate metodele
- ✅ `auth.ts` - Token management (get/set/remove/validate)

**Features Implementate:**
- ✅ Landing page cu butoane "Connect as Agency" / "Connect as Client"
- ✅ Agency signup cu validare (password match, length, required fields)
- ✅ Agency & Client login cu auto-redirect
- ✅ **Agency Dashboard COMPLET:**
  - Lista clienți cu status
  - Add client modal cu generare parolă
  - Permissions editor (assign Meta ad accounts)
  - Platform integrations (Meta/Google/GA4 status)
  - Connect/Reconnect Meta button
  - Remove client functionality
- ✅ Logout functionality
- ✅ Error handling și loading states
- ✅ TypeScript types complet definite

---

## ✅ FAZE COMPLETE

### **FAZA 0: Fundație Tehnică** ✅ COMPLET

**0.1 Migrare PostgreSQL** ✅
- ✅ Instalat `psycopg2-binary` și `dj-database-url`
- ✅ Creat `.env.example` cu template DATABASE_URL
- ✅ Actualizat `settings.py` pentru PostgreSQL
- ✅ Creat `SETUP.md` cu instrucțiuni complete setup
- ✅ Configurat pentru local dev și Render production
- ✅ Database conectat cu succes

**0.2 Restructurare Django Apps** ✅
- ✅ Creat 6 aplicații modulare Django
- ✅ Definit toate modelele cu relații corecte
- ✅ Custom User model (AUTH_USER_MODEL)
- ✅ Multi-tenancy architecture (Agency → AgencyUser → Client)
- ✅ JSON permissions în AgencyUser
- ✅ Database indexes pentru performanță
- ✅ Migrații rulate cu succes

---

### **FAZA 1: Landing Page** ✅ COMPLET

**Landing Page:**
- ✅ Pagină statică minimalistă la `/`
- ✅ Titlu centrat mare "SmartMoney" (responsive cu clamp)
- ✅ Două butoane proeminente:
  - "Connect as Agency" → `/agency/login`
  - "Connect as Client" → `/client/login`
- ✅ Design clean, ultra-rapid cu animații hover
- ✅ Full responsive (mobile/tablet/desktop)
- ✅ Footer tagline: "Smart advertising analytics..."

**Login Pages:**
- ✅ `/agency/login` - Working login
- ✅ `/client/login` - Working login
- ✅ Ambele cu redirects corecte după login

---

### **FAZA 2: Autentificare** ✅ COMPLET

**2.1 Backend Authentication** ✅
- ✅ JWT setup (djangorestframework-simplejwt)
- ✅ Token rotation și blacklisting
- ✅ Agency signup endpoint (auto-create Agency)
- ✅ Login universal endpoint (returnează user info + JWT)
- ✅ Client creation endpoint (agenția creează clienți)
- ✅ Protected endpoints cu IsAuthenticated
- ✅ Serializers pentru toate operațiunile

**2.2 Frontend Authentication** ✅
- ✅ AuthContext cu React Context API
- ✅ Token storage și management
- ✅ Auto-refresh token la 401
- ✅ Protected routes
- ✅ `/agency/signup` - Working signup form
- ✅ `/agency/login` - Working login form
- ✅ `/client/login` - Working login form
- ✅ Auto-redirect după login based pe user type

---

### **FAZA 3: Agency Dashboard** ✅ COMPLET

**Features Implementate:**

✅ **Client Management:**
- Lista completă clienți cu email, nume, status
- Add Client modal cu formular (email, first_name, last_name)
- Auto-generare parolă temporară (afișată o singură dată)
- Display permissions tags (Meta/Google counts)
- Remove client cu confirmare
- Loading states și error handling

✅ **Permissions Management:**
- Permissions modal pentru fiecare client
- Checkbox list pentru Meta ad accounts
- Toggle accounts on/off pentru client
- Save permissions cu update instant
- Placeholders pentru Google Ads și GA4 (FAZA 5)

✅ **Platform Integrations:**
- Status cards pentru Meta Ads, Google Ads, GA4
- Connected/Not Connected visual states
- Business name display pentru Meta când e conectat
- Connect Meta button (redirect către OAuth)
- Reconnect option pentru refresh token
- "Coming in FAZA 5" pentru Google și GA4

✅ **Data Sync (FAZA 3.5):**
- **Sync Data button** în Meta integration card
- Manual sync pentru ultimele 30 zile
- Fetch & store: Campaigns → Ad Sets → Ads → Daily Metrics
- Rate limiting: max 1 sync per minut
- Success message cu statistici detaliate:
  - Ad accounts synced
  - Campaigns (created/updated)
  - Ad Sets (created/updated)
  - Ads (created/updated)
  - Metrics (created/updated)
- Error handling: skip failed accounts, continue cu următoarele
- Loading states cu "Syncing..." indicator
- Mock mode support pentru development

✅ **UX & Design:**
- Responsive layout (mobile/tablet/desktop)
- Clean card-based design
- Loading skeleton la data fetch
- Error messages cu styling clar
- Success feedback după operații
- Logout button vizibil
- Agency name display în header

**Backend Support Complet:**
- ✅ Toate endpoint-urile funcționale
- ✅ Multi-tenancy enforcement (clienții văd doar datele lor)
- ✅ Permission filtering la nivel de query
- ✅ Meta OAuth flow complet
- ✅ Ad accounts fetch de la Meta API
- ✅ **NEW:** Sync endpoint cu rate limiting
- ✅ **NEW:** Meta service layer cu sync functions:
  - `sync_campaigns()` - Fetch și store campaigns
  - `sync_ad_sets()` - Fetch și store ad sets
  - `sync_ads()` - Fetch și store ads
  - `sync_insights_for_account()` - Fetch și store daily metrics
  - `sync_all_data()` - Orchestrator pentru sync complet
- ✅ **NEW:** Upsert logic pentru evitare duplicate
- ✅ **NEW:** Error handling cu logging

**Database Updates:**
- ✅ Added `last_synced_at` field la MetaIntegration (migration applied)

**Testing Status:**
```
✅ Agency signup flow
✅ Agency login și redirect
✅ Client creation cu temp password
✅ Client list display
✅ Permissions update
✅ Meta connection flow
✅ Ad accounts fetch
✅ Client removal
✅ Protected route enforcement
✅ Sync button rendering
✅ Django check passed
✅ Frontend build successful
✅ Python syntax validation passed
```

---

## 🚧 FAZĂ CURENTĂ: FAZA 4 - Client Dashboard

**Ce urmează:**

Conform BLUEPRINT.md și TASKS.md, următoarea fază este **FAZA 4: Client Dashboard**.

**Obiective FAZA 4:**
1. **Date Range Selector** - Client alege perioada pentru metrici
2. **Key Metrics Cards** - Display Spend, Impressions, Clicks, Conversions
3. **Charts** - Vizualizări grafice (Recharts library)
4. **Tables** - Tabele cu date detaliate
5. **Data Source** - Citire exclusiv din baza de date internă (nu live API calls)

**Considerații Importante:**
- Clienții văd **doar** ad accounts la care au permisiuni (filtrat prin AgencyUser.permissions)
- Datele sunt citite din `DailyMetric` model
- Metrici sunt pre-calculate și stocate (nu se face fetch la fiecare request)
- Multi-currency support (convertire automată la monedă unificată)
- Responsive design (mobile/tablet/desktop)

**Ce Lipsește pentru FAZA 4:**
- ❌ Client dashboard page nu este implementat
- ✅ **GATA:** Date în tabela `DailyMetric` (poate fi populate prin Sync Data button)
- ❌ Nu există endpoint pentru fetch metrici client
- ❌ Nu există logica de date range filtering
- ❌ Nu există componente charts (Recharts)
- ❌ Nu există currency conversion logic

**Pregătire Completă:**
1. ✅ **GATA:** Data sync de la Meta API → DailyMetric (buton "Sync Data" în Agency Dashboard)
2. ✅ **GATA:** Campaigns, AdSets, Ads structură sincronizată
3. Următorii pași:
   - Endpoint backend pentru client metrics cu filtering
   - Frontend client dashboard cu toate componentele

---

## 🔜 FAZE VIITOARE

### **FAZA 5: Background Workers (OPTIONAL)** ⏲️

**Status:** ✅ **Manual sync GATA** - Butonul "Sync Data" din Agency Dashboard este funcțional

**Ce este deja implementat:**
- ✅ Buton "Sync Data" în Agency Dashboard
- ✅ Fetch manual Meta campaign structure (Campaigns → Ad Sets → Ads)
- ✅ Fetch manual Meta metrics zilnice (ultimele 30 zile)
- ✅ Stocare în database cu upsert logic
- ✅ Logging pentru succese/eșecuri
- ✅ Rate limiting (1 sync per minut)

**Obiective Viitoare (OPTIONAL - nu critice pentru MVP):**
- ❌ Automatic cron scheduler pentru sync recurent
- ❌ Render Background Worker setup
- ❌ Automatic token refresh înainte de expirare (60 zile)
- ❌ Email notifications pentru sync failures
- ❌ Backfill logic pentru conversii delayed (7-30 zile)

**Notă:** Sync manual este suficient pentru MVP. Automatic sync poate fi adăugat mai târziu dacă e necesar.

---

### **FAZA 6: Backend-for-Frontend** ⚙️

**Obiective:**
- Logică completă sign-in/sign-up cu validări stricte
- API endpoints optimizate pentru Next.js
- Currency conversion support (unified currency în dashboard)
- Rate limiting protection
- Error handling robust

---

## 🔒 REGULI CRITICE

1. **Securitate:** Clienții nu pot accesa NICIODATĂ datele altor clienți (enforced la nivel de query cu filter pe AgencyUser)
2. **Data Integrity:** Mapping clar între ID-uri externe (Meta/Google) și ID-uri interne
3. **Performance:** Dashboard-urile citesc din PostgreSQL, NICIODATĂ live din API-uri externe
4. **Maintenance:** Logging clar pentru expirări token și sync failures

---

## 📝 PROTOCOL WORKFLOW

1. **Propunere:** Claude propune următorul pas din plan
2. **Consultare:** Claude întreabă: "Lipsesc informații? Sunt decizii de luat?"
3. **Implementare:** După acord, Claude oferă codul; tu implementezi și testezi
4. **Debug & Validare:** Rezolvăm erorile împreună; confirmăm când totul funcționează
5. **Pasul Următor:** Trecem la următoarea fază doar după validare completă

---

## 📌 NOTE TEHNICE

**Environment:**
- Current git branch: `main`
- Backend URL local: `http://localhost:8000`
- Frontend URL local: `http://localhost:3000`
- Mock mode: `MOCK_META=true` (pentru development fără API real)
- PostgreSQL database: `smartanalytics_dev`

**Configuration Files:**
- `backend/.env` - Database URL, Django secret, Meta API keys
- `frontend/.env.local` - NEXT_PUBLIC_API_URL
- `BLUEPRINT.md` - MVP blueprint cu etape high-level
- `TASKS.md` - Task-uri detaliate bazate pe blueprint
- `CLAUDE_GUIDE.md` - Ghid comportament Claude
- `SETUP.md` - Instrucțiuni setup PostgreSQL

**Meta Integration Status:**
- ✅ OAuth flow complet implementat
- ✅ Long-lived tokens (60 zile)
- ✅ Ad accounts fetch funcțional
- ✅ **GATA:** Insights/metrics fetch și stocare în DailyMetric
- ✅ **GATA:** Campaign structure sync (Campaigns → Ad Sets → Ads)
- ✅ **GATA:** Manual sync prin buton în Agency Dashboard
- ✅ **GATA:** Rate limiting (1 sync per minut)
- ✅ **GATA:** Upsert logic pentru evitare duplicate
- ❌ Background refresh tokens (FAZA 5 - optional)
- ❌ Automatic cron sync (FAZA 5 - optional)

**Google Ads & GA4:**
- ❌ Complet nefuncțional
- ❌ Models există, dar fără OAuth flow
- ⏳ Implementare în FAZA 5

---

## 🎯 URMĂTORII PAȘI IMEDIATI

**Prioritate 1: Completare FAZA 4 - Client Dashboard**

**Status:** ✅ Data sync is ready - Agency poate face sync cu "Sync Data" button

1. **Backend:**
   - Endpoint nou: `GET /api/clients/metrics/` (filtered by client permissions)
   - Date range filtering (start_date, end_date params)
   - Aggregation logic pentru key metrics
   - (Optional) Currency conversion helper - SKIP pentru acum

2. **Frontend:**
   - Refactorizare `/dashboard/page.tsx` pentru client dashboard
   - Date range picker component
   - Metrics cards component (Spend/Impressions/Clicks/Conversions)
   - Charts component cu Recharts (line chart pentru Spend/Clicks/Impressions)
   - Tables component cu date detaliate
   - Integration cu API endpoint nou

**Nota:** Nu mai e nevoie de data population - Agency poate face sync direct cu butonul din dashboard!

---

**Ultima Actualizare:** 2026-01-16 (20:00)
**Claude Role:** Senior Web Developer & Guide
**Filosofie:** Simplitate, Calitate, Engineering Corect
**Fază Curentă:** FAZA 3 Complete (cu Sync Data) → Începem FAZA 4

---

## 📚 REFERINȚE RAPIDE

**Documentație Proiect:**
- `BLUEPRINT.md` - Viziune MVP și etape high-level
- `TASKS.md` - Task-uri detaliate per fază
- `CLAUDE_GUIDE.md` - Cum lucrează Claude pe proiect
- `SETUP.md` - Setup PostgreSQL și environment

**External Docs:**
- [Meta Marketing API](https://developers.facebook.com/docs/marketing-apis/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Next.js 14 App Router](https://nextjs.org/docs/app)
- [djangorestframework-simplejwt](https://django-rest-framework-simplejwt.readthedocs.io/)
