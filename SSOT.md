**Single Source of Truth (SSOT) – Document de Referință pentru Dezvoltare**

## 1. 🤖 IDENTITATEA ȘI ROLUL CLAUDE (Senior Guide)

Claude nu este doar un generator de cod, ci partenerul tău de engineering.

- **Rol:** Senior Web Developer & Ghid Personal.
- **Filozofie:**
    - **Simplitate:** Cât mai puține linii de cod, fără complexitate inutilă.
    - **Calitate:** Cod perfect funcțional, modular, scalabil și „production-ready”.
    - **Metodologie:** Software engineering corect, nu doar „feature-uri fancy”.
- **Interacțiune:**
    - Claude nu improvizează în afara acestui plan.
    - Claude explică fiecare pas pentru un nivel non-senior.
    - Claude ghidează procesul etapă cu etapă, asigurând o structură solidă.

## 2. 🔄 WORKFLOW DE DEZVOLTARE (STRICT)

Procesul este etapizat riguros. Nu se sare nicio etapă, nu se amestecă fluxurile.

1. **Propunere Etapă:** Claude propune următoarea etapă din plan.
2. **Consultare:** Claude întreabă: „Lipsesc informații? Sunt decizii de luat?”.
3. **Implementare:** După acord, Claude oferă codul; tu îl implementezi și îl testezi.
4. **Debug & Validare:** Se rezolvă erorile. Când totul e funcțional și testat, se confirmă etapa.
5. **Pasul următor:** Se trece la următoarea etapă din lista de mai jos.

## 3. 🛠️ STACK TEHNIC & INFRASTRUCTURĂ

- **Frontend:** Next.js (App Router) – Găzduit pe **Vercel**.
- **Backend:** Django + Django REST Framework (DRF) – Găzduit pe **Render**.
- **Bază de Date:** PostgreSQL – Găzduit pe **Render**.
- **Background Jobs:** Render Background Worker + Cron Scheduler (fără Celery/Redis).
- **Design:** 3-way responsive (Mobile/Tablet/Desktop), minimalist, ultra-rapid.

---

## 4. ETAPELE DE IMPLEMENTARE (DETALIATE)

### 🏗️ FAZA 0: Fundația Tehnică (Prerechizite)

*Înainte de UI, pregătim „motorul” conform detaliilor din Breakdown.*

- **0.1 Migrare Postgres:** Trecerea de la SQLite la Postgres pe Render. Configurare `dj-database-url`, `psycopg2-binary` și `.env` separate pentru dev/prod.
- **0.2 Restructurare Django Apps:** Organizare modulară:
    - `users/` (Auth & profile)
    - `agencies/` (Management agenții & clienți)
    - `integrations/` (OAuth Meta/Google & token-uri)
    - `campaigns/` (Structură: campanii, ad sets, ads)
    - `metrics/` (Date de performanță zilnice)
    - `core/` (Utilități shared)

### 🌐 FAZA 1: Landing Page

*Prima pagină accesată, statică și ultra-rapidă.*

- **Design:** Fundal curat, text mare centrat: **„Smart Money (S&M)”**.
- **Call to Action:** Două butoane simple: „Connect as Client” și „Connect as Agency”.
- **Obiectiv:** Simplitate maximă, încărcare instantanee.

### 🔐 FAZA 2: Pagini Login / Sign-up (Client & Agency)

*Implementarea sistemului de acces conform arhitecturii multi-tenancy.*

- **2.1 Modele de Date:**
    - Custom `User` (Email ca login).
    - `Agency` model (proprietarul agenției).
    - `AgencyUser` (tabel de legătură cu permisiuni JSON pentru acces la conturi specifice Meta/Google).
- **2.2 Fluxuri de Acces:**
    - **Agency:** Sign-up (cu email/pass sau Google OAuth) + Login.
    - **Client:** Creat exclusiv de către agenție (nu are sign-up propriu, doar Login).

### 🏢 FAZA 3: Dashboard Agency

*Centrul de control pentru administratorul agenției.*

- **Funcționalități:**
    - Management clienți (Adăugare/Invitare).
    - Interfață pentru conectarea platformelor (Meta Ads, Google Ads, GA4).
    - Gestionarea permisiunilor (ce client vede ce cont de ad-uri).

### 📊 FAZA 4: Dashboard Client

*Interfața finală unde se vizualizează performanța.*

- **Componente:**
    - Selector de perioadă (date range).
    - Carduri cu metrici cheie (Spend, Impr, Clicks, Conversions).
    - Grafice simple (Recharts) și tabele cu datele extrase din DB.
- **Sursă Date:** Interogări exclusive către baza de date internă (nu direct către API-uri externe în timpul încărcării paginii).

### ⏲️ FAZA 5: Implementare Cron Worker & Background Worker

*Sistemul automat de sincronizare a datelor pe Render.*

- **5.1 Cron Scheduler:** Programarea task-urilor (ex: „Sincronizează metricile în fiecare oră”).
- **5.2 Background Worker:** Procesul care execută logica de fetch:
    - **Meta Ads:** Refresh la long-lived tokens (valabilitate 60 zile), extragere structură (Campaigns -> Ad Sets -> Ads) și metrici zilnice.
    - **Google Ads & GA4:** Pregătirea structurii de fetch (OAuth 2.0 flow).
- **5.3 Strategie Sync:** * Update-or-Insert (Upsert) pentru a evita duplicatele.
    - Backfill pe ultimele 7–30 de zile pentru a corecta datele de conversie întârziate.

### ⚙️ FAZA 6: Backend-for-Frontend & Logică Internă

*Finalizarea proceselor de suport.*

- **Logica de Sign-in/Sign-up:** Validări stricte și managementul sesiunilor JWT/Session.
- **API Endpoints:** Optimizate pentru consumul din Next.js.
- **Currency Support:** Convertirea automată a metricilor într-o monedă unificată la nivel de dashboard.

---

## 5. REGULI CRITICE ȘI DISCIPLINĂ (Din Blueprint & Breakdown)

1. **Securitate:** Un client nu poate accesa sub nicio formă datele altui client (enforcing la nivel de Row Level Security sau Query Filtering).
2. **Integritatea Datelor:** Mapare clară între ID-urile externe (Meta/Google) și ID-urile interne.
3. **Performanță:** Toate dashboard-urile citesc din Postgres, niciodată live din API-uri externe (pentru a evita rate-limiting și lag).
4. **Mentenanță:** Logging clar pe procesul de Background Worker pentru a vedea când un token de acces a expirat sau un sync a eșuat.