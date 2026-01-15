## ETAPELE DE IMPLEMENTARE (DETALIATE)

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

### ⏲️ FAZA 5: Implementare Cron Worker & Background Worker - Nu se face, momentan se implementeaza un buton in dashboard ul agentiei pentru sync data

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