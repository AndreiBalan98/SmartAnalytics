# PLAN TEHNIC: Refactorizare Completă SmartAnalytics

> **Proiect:** SmartAnalytics (ConversionDriven)
> **Scop:** Implementare modificări complete UI/UX conform planului detaliat
> **Data start:** 2026-01-26

---

## 📋 CUPRINS

1. [Rezumat General](#rezumat-general)
2. [Etape de Implementare](#etape-de-implementare)
3. [Status Tracking](#status-tracking)
4. [Feedback & Issues](#feedback--issues)
5. [Finalizare](#finalizare)

---

## REZUMAT GENERAL

### Obiective Principale

**Landing Page:**
- Adăugare profunzime vizuală (linii, puncte, tranziții de culoare)
- Efect vizual în spatele textului "AI-powered conversion tracking"
- Modificări buton "Descoperă" + săgeată (poziție, dimensiuni)

**Dashboard - Layout:**
- Restructurare completă: Partea 1 (10%), Partea 2 (5%), Partea 3 (85%)
- Partea 3: stânga 12.5%, mijloc 75%, dreapta 12.5% (cu min/max pe laterale)
- Scroll fără bare vizibile
- Tot dashboard-ul să încapă pe o pagină

**Dashboard - Features:**
- Business selection cu dropdown + checkboxes
- Sistem de selecție cu checkboxes pentru campaigns/ad sets/ads
- Time zone pentru ad accounts
- Insights complet nou: 4 dropdowns, time range comparison, 7 metrici, 7 grafice

**Stil & Consistență:**
- Light/dark mode consistent (același stil, nu culoare)
- Limba română în interfață
- Responsive doar pentru landing + login (NU dashboard)

---

## ETAPE DE IMPLEMENTARE

---

### **ETAPA 1: Landing Page - Profunzime Vizuală**

**Scop:** Îmbunătățirea esteticii landing page-ului cu efecte vizuale care creează profunzime.

#### Task 1.1: Adăugare Elemente de Profunzime în Hero Section
- [ ] **Subtask 1.1.1:** Creare component `DepthBackground.tsx` în `frontend/src/components/landing/`
  - Grid de puncte animate (particle effect) cu opacity variabilă
  - Linii diagonale subtile cu gradient fade
  - Folosire Framer Motion pentru animații smooth
- [ ] **Subtask 1.1.2:** Adăugare tranziții de culoare
  - Gradient overlay peste background cu animație subtilă (navy → electric-blue → navy, 10s loop)
  - Blur effect pe margini pentru depth of field
- [ ] **Subtask 1.1.3:** Integrare în `HeroSection.tsx`
  - Import `DepthBackground` ca layer absolut (z-index: 0)
  - Content-ul peste background (z-index: 10)

**Fișiere modificate:**
- `frontend/src/components/landing/DepthBackground.tsx` (NOU)
- `frontend/src/components/landing/HeroSection.tsx`
- `frontend/src/app/globals.css` (eventual animații @keyframes)

#### Task 1.2: Efect Vizual în Spatele Textului
- [ ] **Subtask 1.2.1:** Creare efect glow în spatele badge-ului "AI-powered conversion tracking"
  - Box-shadow multi-layer cu electric-blue
  - Backdrop blur pentru efect de adâncime
- [ ] **Subtask 1.2.2:** Adăugare contur/outline subtil animat
  - Border animat cu gradient (electric-blue → electric-cyan)
  - Rotație lentă (360deg în 20s) pentru efect premium
- [ ] **Subtask 1.2.3:** Light rays din spate
  - Pseudo-element ::before cu linear-gradient radial
  - Opacity 0.1-0.2 pentru subtilitate

**Fișiere modificate:**
- `frontend/src/components/landing/HeroSection.tsx`
- `frontend/tailwind.config.ts` (eventual keyframes noi)

#### Task 1.3: Modificări Buton "Descoperă" și Săgeată
- [ ] **Subtask 1.3.1:** Ajustare poziționare
  - Mărire `pt-12` → `pt-16` (sau mai mult) pentru a muta butonul mai jos
- [ ] **Subtask 1.3.2:** Reducere dimensiuni
  - Text: `text-xs` → `text-[11px]` (puțin mai mic)
  - Săgeată: `text-4xl` → `text-3xl` (mai scurtă)
- [ ] **Subtask 1.3.3:** Ajustare animație bounce
  - Reducere amplitudine: `y: [0, 10, 0]` → `y: [0, 8, 0]`
  - Test pentru ca săgeata să nu pară prea agresivă

**Fișiere modificate:**
- `frontend/src/components/landing/HeroSection.tsx` (liniile 80-107)

#### Verificare Etapa 1
- [ ] Landing page arată cu mai multă profunzime vizuală (puncte, linii, tranziții)
- [ ] Badge-ul "AI-powered conversion tracking" are efect vizual în spate (glow, contur)
- [ ] Butonul "Descoperă" este poziționat mai jos cu text și săgeată puțin mai mici
- [ ] Animațiile sunt smooth și nu distrag de la conținut
- [ ] Performance: 60fps constant pe hero section

---

### **ETAPA 2: Responsive Design - Landing & Login**

**Scop:** Asigurarea că landing page-ul și login page-ul sunt responsive (mobile, tablet). Dashboard-ul rămâne doar pentru desktop.

#### Task 2.1: Responsive Landing Page
- [ ] **Subtask 2.1.1:** Audit toate componentele landing
  - Verificare breakpoints actuale (sm, md, lg, xl)
  - Identificare probleme pe mobile (<640px) și tablet (640px-1024px)
- [ ] **Subtask 2.1.2:** Ajustări HeroSection
  - Mobile: text-3xl pentru headline, padding redus, CTA vertical stack
  - Tablet: text-5xl, CTA side-by-side dacă încap
  - Test DepthBackground să nu încetinească pe mobile (disable particule pe sm?)
- [ ] **Subtask 2.1.3:** Ajustări KeyCapabilities
  - Grid: 1 col (mobile) → 2 col (md) → 3 col (lg)
  - Padding și spacing redus pe mobile
- [ ] **Subtask 2.1.4:** Ajustări ProductPreview
  - Mobile: vertical stack (1.png, 2.png, 3.png)
  - Tablet: overlapping layout similar desktop dar la scară mai mică
- [ ] **Subtask 2.1.5:** Ajustări HowItWorks
  - Mobile: 1 col grid
  - Tablet: 2x2 grid (ca desktop)
- [ ] **Subtask 2.1.6:** Ajustări FinalCTA
  - Mobile: padding redus, font size mai mic
  - Buton CTA 100% width pe mobile

**Fișiere modificate:**
- `frontend/src/components/landing/HeroSection.tsx`
- `frontend/src/components/landing/KeyCapabilities.tsx`
- `frontend/src/components/landing/ProductPreview.tsx`
- `frontend/src/components/landing/HowItWorks.tsx`
- `frontend/src/components/landing/FinalCTA.tsx`

#### Task 2.2: Responsive Login Page
- [ ] **Subtask 2.2.1:** Verificare layout login pe mobile
  - Form container: max-width și padding responsive
  - Input fields: 100% width pe mobile
- [ ] **Subtask 2.2.2:** Ajustări pentru tablet
  - Centrare form, max-width 500px
- [ ] **Subtask 2.2.3:** Test pe device-uri diferite
  - Chrome DevTools: iPhone 12, iPad, desktop

**Fișiere modificate:**
- `frontend/src/app/login/page.tsx`

#### Verificare Etapa 2
- [ ] Landing page arată perfect pe mobile (320px-640px), tablet (640px-1024px), desktop (>1024px)
- [ ] Login page responsive pe toate dimensiunile
- [ ] Nu există overflow orizontal
- [ ] Toate textele sunt lizibile (nu prea mici)
- [ ] CTA-urile sunt accesibile cu touchscreen
- [ ] Performance: 60fps pe mobile devices

---

### **ETAPA 3: Dashboard Layout - Restructurare Completă**

**Scop:** Restructurarea layout-ului dashboard-ului în 3 părți (Header 10%, Tabs 5%, Content 85%) cu panele laterale fixe și mijloc dinamic.

#### Task 3.1: Partea 1 - Header Dashboard (10% înălțime)
- [ ] **Subtask 3.1.1:** Calcul înălțime dinamică
  - Înălțime: `min(10vh, 80px)` și `max(10vh, 60px)`
  - Folosire CSS `clamp(60px, 10vh, 80px)` pentru auto-adjusting
- [ ] **Subtask 3.1.2:** Restructurare component Header
  - Wrapper cu height: clamp value
  - Flex layout: space-between, align-center
  - Overflow: hidden (nu se mărește niciodată)
- [ ] **Subtask 3.1.3:** Actualizare `page.tsx`
  - Înlocuire header actual cu noua structură
  - Test redimensionare fereastră

**Fișiere modificate:**
- `frontend/src/app/dashboard/page.tsx` (liniile 87-141)
- `frontend/src/components/dashboard/Header.tsx` (NOU, opțional - sau inline în page.tsx)

#### Task 3.2: Partea 2 - Platform Tabs (5% înălțime)
- [ ] **Subtask 3.2.1:** Calcul înălțime dinamică
  - Înălțime: `clamp(40px, 5vh, 60px)`
- [ ] **Subtask 3.2.2:** Creare component `PlatformTabs.tsx` (sau modificare existentă)
  - Tabs pentru Meta și Google Ads
  - Stilizare consistent cu design system
  - Height fix conform clamp
- [ ] **Subtask 3.2.3:** Ajustări de stil
  - Background, borders, padding optim pentru înălțimea redusă
  - Font size mai mic dacă e nevoie

**Fișiere modificate:**
- `frontend/src/app/dashboard/page.tsx`
- `frontend/src/components/dashboard/PlatformTabs.tsx` (NOU sau modificat)

#### Task 3.3: Partea 3 - Trei Panele (12.5% | 75% | 12.5%)
- [ ] **Subtask 3.3.1:** Container flex pentru Partea 3
  - Height: `calc(100vh - Header_height - Tabs_height)`
  - Display: flex, flex-direction: row
- [ ] **Subtask 3.3.2:** Left Panel - 12.5% cu min/max
  - Width: 12.5% cu `min-width: 220px` și `max-width: 300px`
  - Când fereastra e prea mică sau prea mare, width-ul rămâne între 220-300px
  - OverflowY: auto (scroll fără bară vizibilă - vezi Task 3.4)
- [ ] **Subtask 3.3.3:** Center Panel - 75% dinamic
  - Flex: 1 (ia tot spațiul rămas după left și right)
  - OverflowY: auto, overflowX: auto (fără bare vizibile)
- [ ] **Subtask 3.3.4:** Right Panel - 12.5% cu min/max
  - Width: 12.5% cu `min-width: 200px` și `max-width: 280px`
  - OverflowY: auto (fără bară vizibilă)
- [ ] **Subtask 3.3.5:** Test redimensionare
  - Fereastră mică (1200px): left și right la min-width, center comprimat
  - Fereastră mare (2000px): left și right la max-width, center extins

**Fișiere modificate:**
- `frontend/src/app/dashboard/page.tsx` (liniile 210-224, restructurare completă)
- `frontend/src/components/dashboard/LeftPanel.tsx`
- `frontend/src/components/dashboard/CenterPanel.tsx`
- `frontend/src/components/dashboard/RightPanel.tsx`

#### Task 3.4: Scroll fără Bare Vizibile
- [ ] **Subtask 3.4.1:** CSS pentru hidden scrollbars
  - Adăugare în `globals.css`:
    ```css
    .scrollbar-hidden {
      scrollbar-width: none; /* Firefox */
      -ms-overflow-style: none; /* IE/Edge */
    }
    .scrollbar-hidden::-webkit-scrollbar {
      display: none; /* Chrome/Safari */
    }
    ```
- [ ] **Subtask 3.4.2:** Aplicare clasa pe toate panelele cu scroll
  - LeftPanel, CenterPanel, RightPanel
  - Ad Accounts list, Campaigns table, etc.

**Fișiere modificate:**
- `frontend/src/app/globals.css`
- Toate componentele cu overflow: auto

#### Task 3.5: Reducere Grosime Zonă Titlu în Center Panel
- [ ] **Subtask 3.5.1:** Identificare zona de titlu
  - Header din CenterPanel unde scrie "Campaigns", "Ad Sets", etc.
- [ ] **Subtask 3.5.2:** Reducere padding vertical
  - Padding actual: `1.5rem` → `0.75rem`
  - Height implicit: auto → mai mic cu ~50%
- [ ] **Subtask 3.5.3:** Ajustare font size dacă e nevoie
  - Dacă textul pare prea mare pentru spațiul nou, reduce de la 1.25rem la 1.125rem

**Fișiere modificate:**
- `frontend/src/components/dashboard/CenterPanel.tsx` (header section)

#### Verificare Etapa 3
- [ ] Header-ul (Partea 1) are înălțime 10% cu limite min/max
- [ ] Tabs (Partea 2) au înălțime 5% cu limite min/max
- [ ] Partea 3 ocupă restul (85%) cu 3 panele: 12.5% | 75% | 12.5%
- [ ] Left și Right panel au min-width/max-width, Center panel se adaptează
- [ ] Scroll funcționează fără bare vizibile pe toate panelele
- [ ] Zona de titlu din Center Panel are înălțime redusă cu ~50%
- [ ] Tot dashboard-ul încape pe o pagină fără scroll global
- [ ] La redimensionare fereastră, comportamentul e corect

---

### **ETAPA 4: Header & Business Selection**

**Scop:** Actualizare header cu Meta ID/name și implementare business selection dropdown.

#### Task 4.1: Dreptunghi Meta ID/Name în Header
- [ ] **Subtask 4.1.1:** Fetch Meta User info
  - API call la `/api/meta/client/meta-user/` pentru Meta ID și name
  - State management în page.tsx sau context
- [ ] **Subtask 4.1.2:** Creare component `MetaUserBadge.tsx`
  - Layout: dreptunghi cu border, padding, background subtil
  - Afișare: "Meta ID: 123456" și "Name: John Doe" (sau doar ID dacă name lipsește)
  - Stilizare consistent cu design system (gray border, white bg)
- [ ] **Subtask 4.1.3:** Plasare în Header în dreapta user info
  - Flex layout: user info (stânga) | MetaUserBadge (mijloc) | Logout (dreapta)

**Fișiere modificate:**
- `frontend/src/app/dashboard/page.tsx` (header section)
- `frontend/src/components/dashboard/MetaUserBadge.tsx` (NOU)
- `frontend/src/lib/api.ts` (eventual endpoint nou)

**Backend (dacă e nevoie):**
- `backend/meta_ads/views.py` - endpoint pentru meta user info
- `backend/meta_ads/urls.py`

#### Task 4.2: Business Dropdown cu Checkboxes
- [ ] **Subtask 4.2.1:** Fetch businesses disponibile
  - API call la `/api/meta/client/businesses/`
  - State: `businesses`, `selectedBusinesses`
- [ ] **Subtask 4.2.2:** Creare component `BusinessDropdown.tsx`
  - Trigger: Click pe MetaUserBadge sau săgeată dedicată
  - Dropdown: lista de businesses cu checkbox fiecare
  - Selecție multiplă: onChange update selectedBusinesses array
  - Button "Apply" pentru a confirma selecția
- [ ] **Subtask 4.2.3:** Logică de afișare săgeată
  - Dacă `businesses.length > 0`, afișează săgeată în dreptunghiul Meta
  - Altfel, nu afișa săgeată
- [ ] **Subtask 4.2.4:** Stilizare dropdown
  - Position: absolute, sub MetaUserBadge
  - Background: white, shadow, border
  - Checkbox styling consistent
  - Max-height cu scroll dacă sunt multe businesses

**Fișiere modificate:**
- `frontend/src/components/dashboard/BusinessDropdown.tsx` (NOU)
- `frontend/src/components/dashboard/MetaUserBadge.tsx`
- `frontend/src/app/dashboard/page.tsx` (state management)

#### Task 4.3: Filtrare Ad Accounts pe Business
- [ ] **Subtask 4.3.1:** Actualizare API call pentru ad accounts
  - Parametru: `business_ids` în query string
  - Endpoint backend filtrează ad accounts care aparțin de businesses selectate
- [ ] **Subtask 4.3.2:** State management
  - Când se schimbă selectedBusinesses, refetch ad accounts
  - Reset selectedAccount dacă nu mai e în lista nouă
- [ ] **Subtask 4.3.3:** UI feedback
  - Loading state când se reîncarcă ad accounts
  - Message dacă nu sunt ad accounts pentru businesses selectate

**Fișiere modificate:**
- `frontend/src/app/dashboard/page.tsx`
- `frontend/src/lib/api.ts`

**Backend:**
- `backend/meta_ads/views.py` - actualizare endpoint ad accounts cu filtru business
- `backend/meta_ads/serializers.py` (eventual)

#### Verificare Etapa 4
- [ ] Header afișează Meta ID și Meta Name într-un dreptunghi stilizat
- [ ] Săgeată apare în dreptunghi doar dacă user-ul are businesses
- [ ] Click pe săgeată deschide dropdown cu lista de businesses
- [ ] Dropdown permite selecție multiplă cu checkboxes
- [ ] La aplicare selecție, ad accounts list se filtrează corect
- [ ] Dacă nu sunt businesses selectate, se afișează mesaj relevant
- [ ] UI este intuitiv și responsive la acțiuni

---

### **ETAPA 5: Ad Accounts - Time Zone & Text Wrapping**

**Scop:** Adăugare time zone pentru fiecare ad account și wrap text pentru titluri lungi.

#### Task 5.1: Adăugare Time Zone în Ad Account Display
- [ ] **Subtask 5.1.1:** Verificare dacă timezone e în model
  - Model `AdAccount` are câmp `timezone_name`? (da, conform MINDMAP)
  - Verificare serializer include timezone_name
- [ ] **Subtask 5.1.2:** Afișare timezone în LeftPanel
  - Sub account_id, adaugă linie nouă: `Timezone: America/New_York`
  - Font size mic: 0.75rem, color: gray-500
- [ ] **Subtask 5.1.3:** Formatare timezone friendly
  - Eventual funcție helper: `America/New_York` → `EST (UTC-5)` (opțional, doar dacă vrei)

**Fișiere modificate:**
- `frontend/src/components/dashboard/LeftPanel.tsx`
- `backend/meta_ads/serializers.py` (verificare includere timezone_name)

#### Task 5.2: Text Wrapping pentru Titluri Lungi
- [ ] **Subtask 5.2.1:** Identificare unde sunt titluri lungi
  - LeftPanel: account name
  - Alte locuri unde pot fi nume lungi
- [ ] **Subtask 5.2.2:** Aplicare CSS pentru wrapping
  - `white-space: normal` (nu nowrap)
  - `word-break: break-word` (pentru cuvinte foarte lungi)
  - `overflow-wrap: break-word`
- [ ] **Subtask 5.2.3:** Test cu nume foarte lung
  - Exemplu: "Super Mega Ultra Long Ad Account Name That Should Wrap to Next Line Automatically"
  - Verificare că se mută pe mai multe rânduri fără overflow

**Fișiere modificate:**
- `frontend/src/components/dashboard/LeftPanel.tsx`

#### Verificare Etapa 5
- [ ] Fiecare ad account afișează timezone-ul (ex: "America/New_York")
- [ ] Titlurile lungi de ad account se mută automat pe rândul următor
- [ ] Nu există overflow orizontal în LeftPanel
- [ ] Layout-ul rămâne curat și ușor de citit

---

### **ETAPA 6: Campaigns - Sistem de Selecție**

**Scop:** Implementare checkboxes pentru campaigns, afișare informații + hover, state management.

#### Task 6.1: Checkboxes pentru Campaigns
- [ ] **Subtask 6.1.1:** Adăugare coloană Checkbox în CampaignsTable
  - Thead: checkbox "Select All"
  - Tbody: checkbox per rând
- [ ] **Subtask 6.1.2:** State management
  - State: `selectedCampaigns` (array de campaign IDs)
  - Handler: toggleCampaign(id), selectAllCampaigns(), clearAllCampaigns()
- [ ] **Subtask 6.1.3:** Styling checkboxes
  - Custom checkbox styling sau folosire library (ex: headlessui)
  - Culoare accent: electric-blue când checked

**Fișiere modificate:**
- `frontend/src/components/dashboard/CampaignsTable.tsx`
- `frontend/src/app/dashboard/page.tsx` (state management)

#### Task 6.2: Informații Afișate + Hover
- [ ] **Subtask 6.2.1:** Coloane vizibile
  - Checkbox | Status | Name | Objective
- [ ] **Subtask 6.2.2:** Informații la hover
  - Buying Type + ID afișate în tooltip sau ca subtitle care apare la hover
  - Folosire `title` attribute simplu sau component Tooltip custom
- [ ] **Subtask 6.2.3:** Verificare date în API response
  - Asigură-te că backend trimite: status, name, objective, buying_type, id

**Fișiere modificate:**
- `frontend/src/components/dashboard/CampaignsTable.tsx`
- `backend/meta_ads/serializers.py` (verificare câmpuri)

#### Task 6.3: State Persistence
- [ ] **Subtask 6.3.1:** Persistare selecții în state global
  - Când user selectează campaigns, state-ul se păstrează chiar dacă schimbă view-ul
  - Folosire React Context sau state în page.tsx
- [ ] **Subtask 6.3.2:** Badge sau indicator în RightPanel
  - Lângă "Campaigns" în navigation, afișează numărul de selectate: "Campaigns (3)"

**Fișiere modificate:**
- `frontend/src/app/dashboard/page.tsx`
- `frontend/src/components/dashboard/RightPanel.tsx`

#### Verificare Etapa 6
- [ ] Fiecare campaign are checkbox funcțional
- [ ] "Select All" checkbox funcționează corect
- [ ] Informații afișate: Status, Name, Objective
- [ ] Buying Type și ID apar la hover peste rând
- [ ] Selecțiile se păstrează când navighezi între views
- [ ] Indicator vizual (badge) arată câte campaigns sunt selectate

---

### **ETAPA 7: Ad Sets - Sistem de Selecție**

**Scop:** Implementare checkboxes pentru ad sets, afișare informații (budgets, time), filtrare pe campaigns selectate.

#### Task 7.1: Checkboxes pentru Ad Sets
- [ ] **Subtask 7.1.1:** Adăugare coloană Checkbox în AdSetsTable
  - Thead: checkbox "Select All"
  - Tbody: checkbox per rând
- [ ] **Subtask 7.1.2:** State management
  - State: `selectedAdSets` (array de adset IDs)
  - Handlers similar cu campaigns

**Fișiere modificate:**
- `frontend/src/components/dashboard/AdSetsTable.tsx`
- `frontend/src/app/dashboard/page.tsx`

#### Task 7.2: Informații Afișate
- [ ] **Subtask 7.2.1:** Coloane vizibile
  - Checkbox | Status | Name | Daily Budget | Lifetime Budget | Start Time | End Time
- [ ] **Subtask 7.2.2:** Informații la hover
  - Optimization Goal + ID
- [ ] **Subtask 7.2.3:** Formatare budgets
  - Daily/Lifetime budget: formatare ca USD ($X.XX)
- [ ] **Subtask 7.2.4:** Formatare date
  - Start Time / End Time: format DD/MM/YYYY HH:mm sau locale string

**Fișiere modificate:**
- `frontend/src/components/dashboard/AdSetsTable.tsx`
- `backend/meta_ads/serializers.py` (verificare câmpuri: daily_budget, lifetime_budget, start_time, end_time, optimization_goal)

#### Task 7.3: Filtrare pe Campaigns Selectate
- [ ] **Subtask 7.3.1:** API call cu filtru
  - Când se deschide view "adsets", trimite `campaign_ids` în query
  - Backend filtrează doar ad sets din campaigns selectate
- [ ] **Subtask 7.3.2:** Verificare selecții
  - Dacă nu sunt campaigns selectate, afișează mesaj: "Te rog selectează cel puțin un campaign"
  - Disable butonul "Ad Sets" în RightPanel dacă selectedCampaigns.length === 0
- [ ] **Subtask 7.3.3:** Loading state
  - Spinner când se încarcă ad sets

**Fișiere modificate:**
- `frontend/src/components/dashboard/CenterPanel.tsx`
- `frontend/src/app/dashboard/page.tsx`
- `backend/meta_ads/views.py` - endpoint adsets cu filtru campaign_ids

#### Verificare Etapa 7
- [ ] Ad sets au checkboxes funcționale
- [ ] Informații afișate: Status, Name, Daily Budget, Lifetime Budget, Start/End Time
- [ ] Optimization Goal + ID apar la hover
- [ ] Se afișează DOAR ad sets din campaigns selectate
- [ ] Mesaj clar dacă nu sunt campaigns selectate
- [ ] Selecțiile ad sets se păstrează între views
- [ ] Budgets și date sunt formatate corect și lizibil

---

### **ETAPA 8: Ads - Sistem de Selecție**

**Scop:** Implementare checkboxes pentru ads, afișare informații + creative, filtrare pe ad sets selectate.

#### Task 8.1: Checkboxes pentru Ads
- [ ] **Subtask 8.1.1:** Adăugare coloană Checkbox în AdsTable
  - Similar cu campaigns și ad sets
- [ ] **Subtask 8.1.2:** State management
  - State: `selectedAds` (array de ad IDs)

**Fișiere modificate:**
- `frontend/src/components/dashboard/AdsTable.tsx`
- `frontend/src/app/dashboard/page.tsx`

#### Task 8.2: Informații Afișate
- [ ] **Subtask 8.2.1:** Coloane vizibile
  - Checkbox | Status | Name | Creative ID (sau Creative Name, de preferat)
- [ ] **Subtask 8.2.2:** Informații la hover
  - Effective Status + ID
- [ ] **Subtask 8.2.3:** Afișare Creative Name vs ID
  - Dacă creative_name există, afișează-l
  - Altfel, afișează creative_id
  - Backend trebuie să facă join cu AdCreative pentru a obține name

**Fișiere modificate:**
- `frontend/src/components/dashboard/AdsTable.tsx`
- `backend/meta_ads/serializers.py` - ad serializer cu creative name
- `backend/meta_ads/views.py` - endpoint ads cu select_related('creative')

#### Task 8.3: Filtrare pe Ad Sets Selectate
- [ ] **Subtask 8.3.1:** API call cu filtru
  - Query param: `adset_ids`
  - Backend filtrează ads din ad sets selectate
- [ ] **Subtask 8.3.2:** Verificare selecții
  - Disable "Ads" în navigation dacă nu sunt ad sets selectate
  - Mesaj de error dacă se încearcă accesare fără selecții

**Fișiere modificate:**
- `frontend/src/components/dashboard/CenterPanel.tsx`
- `frontend/src/app/dashboard/page.tsx`
- `backend/meta_ads/views.py`

#### Verificare Etapa 8
- [ ] Ads au checkboxes funcționale
- [ ] Informații afișate: Status, Name, Creative Name (sau ID)
- [ ] Effective Status + ID apar la hover
- [ ] Se afișează DOAR ads din ad sets selectate
- [ ] Mesaj clar dacă nu sunt ad sets selectate
- [ ] Selecțiile se păstrează între views

---

### **ETAPA 9: Creatives - Grid de Carduri**

**Scop:** Afișare creative-uri ca grid de carduri cu imagine din URL.

#### Task 9.1: Grid Layout pentru Creatives
- [ ] **Subtask 9.1.1:** Verificare component `CreativesGrid.tsx` existent
  - E deja implementat conform raportului de explorare
- [ ] **Subtask 9.1.2:** Ajustări dacă e nevoie
  - Grid: `repeat(auto-fill, minmax(300px, 1fr))`
  - Gap: 1.5rem
  - Padding: 1rem

**Fișiere verificate:**
- `frontend/src/components/dashboard/CreativesGrid.tsx`

#### Task 9.2: Afișare Imagine din URL
- [ ] **Subtask 9.2.1:** Verificare afișare imagine
  - Componentă deja afișează `creative.image_url` în tag <img>
- [ ] **Subtask 9.2.2:** Fallback pentru video/story
  - Emoji icons dacă nu e imagine: 🎥 (video), 📱 (story)
- [ ] **Subtask 9.2.3:** Lazy loading imagini
  - Adăugare `loading="lazy"` la tag-ul <img>
  - Eventual placeholder blur-up effect

**Fișiere modificate:**
- `frontend/src/components/dashboard/CreativesGrid.tsx`

#### Task 9.3: Filtrare Creatives
- [ ] **Subtask 9.3.1:** Afișare creatives pentru ads selectate
  - API call cu `ad_ids` filter
  - Sau afișare creative pentru fiecare ad selectat (câte unul per ad)
- [ ] **Subtask 9.3.2:** Backend query optimization
  - Select distinct creatives pentru ads selectate
  - Evitare duplicate dacă multiple ads folosesc același creative

**Fișiere modificate:**
- `frontend/src/components/dashboard/CenterPanel.tsx`
- `backend/meta_ads/views.py` - endpoint creatives cu filtru

#### Verificare Etapa 9
- [ ] Creatives se afișează ca grid de carduri (300px min-width)
- [ ] Fiecare card afișează: thumbnail imagine, name, ID, tip (badge)
- [ ] Imaginile se încarcă din URL-uri (lazy loading)
- [ ] Fallback icons pentru video/story
- [ ] Grid-ul este responsive (auto-fill)
- [ ] Se afișează câte un creative pentru fiecare ad selectat

---

### **ETAPA 10: Insights - Interfață Nouă Completă**

**Scop:** Implementare completă a noii interfețe de insights cu 4 dropdowns, time range comparison, 7 metrici, 7 grafice.

#### Task 10.1: Bară de Sus cu 4 Dropdowns
- [ ] **Subtask 10.1.1:** Creare component `InsightsFilters.tsx`
  - Layout: flex row, wrap pe mobile
  - 4 dropdowns: Ad Account, Campaign, Ad Set, Ad
  - 1 selector de time range (cel mai în dreapta)
- [ ] **Subtask 10.1.2:** Dropdown Ad Account
  - Multi-select dropdown (poate selecta multiple accounts)
  - Afișează doar accounts din businesses selectate
  - Folosire library (ex: react-select cu multi-select)
- [ ] **Subtask 10.1.3:** Dropdown Campaign
  - Multi-select
  - Afișează doar campaigns din accounts selectate
  - Disabled dacă nu e selectat niciun account
- [ ] **Subtask 10.1.4:** Dropdown Ad Set
  - Multi-select
  - Afișează doar ad sets din campaigns selectate
  - Disabled dacă nu e selectat campaign
- [ ] **Subtask 10.1.5:** Dropdown Ad
  - Multi-select
  - Afișează doar ads din ad sets selectate
  - Disabled dacă nu e selectat ad set
- [ ] **Subtask 10.1.6:** State management
  - State: `insightsFilters: { accounts: [], campaigns: [], adsets: [], ads: [], timeRange: {} }`

**Fișiere modificate:**
- `frontend/src/components/dashboard/InsightsFilters.tsx` (NOU)
- `frontend/src/components/dashboard/InsightsView.tsx`
- `frontend/src/app/dashboard/page.tsx` (state management)

**Dependencies:**
- Instalare `react-select` pentru multi-select dropdowns: `npm install react-select`

#### Task 10.2: Time Range Selector cu Comparare
- [ ] **Subtask 10.2.1:** Creare component `TimeRangeSelector.tsx`
  - 2 date pickers: Start Date, End Date
  - Button: "Compare with another period" (toggle)
  - Când e activ compare mode, afișează încă 2 date pickers
- [ ] **Subtask 10.2.2:** Validare period length
  - Compare period trebuie să aibă aceeași lungime (zile) ca period principal
  - Calculare automată: dacă alegi start date pentru compare, end date se calculează automat
- [ ] **Subtask 10.2.3:** State management
  - State: `{ mainPeriod: { start, end }, comparePeriod: { start, end } | null }`
- [ ] **Subtask 10.2.4:** UI feedback
  - Afișare diferență în zile: "14 days selected"
  - Disable end date picker în compare mode (auto-calculated)

**Fișiere modificate:**
- `frontend/src/components/dashboard/TimeRangeSelector.tsx` (NOU)
- `frontend/src/components/dashboard/InsightsFilters.tsx`

**Dependencies:**
- Date picker library: `npm install react-datepicker` sau folosire HTML5 `<input type="date">`

#### Task 10.3: Time Range Custom per Obiect
- [ ] **Subtask 10.3.1:** Adăugare buton "Custom Range" lângă fiecare dropdown
  - Mic icon (calendar) lângă fiecare account/campaign/ad set/ad selectat
- [ ] **Subtask 10.3.2:** Click pe icon deschide mini date picker
  - Permite selectare doar Start Date
  - End Date se calculează automat (aceeași lungime ca time range general)
  - Validare: nu permite range diferit de lungimea generală
- [ ] **Subtask 10.3.3:** State management
  - Extindere state: `insightsFilters.customRanges: { [entityId]: { start, end } }`
- [ ] **Subtask 10.3.4:** Visual indicator
  - Dacă un obiect are custom range, afișează badge/indicator lângă el

**Fișiere modificate:**
- `frontend/src/components/dashboard/InsightsFilters.tsx`
- Component nou: `CustomRangePicker.tsx` (mini modal/popover)

#### Task 10.4: 7 Carduri de Metrici cu Layout Specific
- [ ] **Subtask 10.4.1:** Creare component `MetricsCards.tsx`
  - Layout: 2 rânduri
    - Rând 1: 4 carduri (25% width fiecare)
    - Rând 2: 3 carduri (33.33% width fiecare, dar lățimea egală cu cele de pe rândul 1 - 25%)
  - CSS Grid: `grid-template-columns: repeat(4, 1fr)`
  - Rândul 2: primele 3 coloane ocupate, coloana 4 goală
- [ ] **Subtask 10.4.2:** Design card
  - Background: white, border, shadow
  - Icon (emoji), Label, Value
  - Hover effect: border color change
- [ ] **Subtask 10.4.3:** Cele 7 metrici
  1. Total Spend (💰)
  2. Impressions (👁️)
  3. Clicks (🖱️)
  4. Reach (📢)
  5. CTR (📈)
  6. CPC (💵)
  7. CPM (📊)
- [ ] **Subtask 10.4.4:** Calculare metrici din insights data
  - Agregare toate insights din selecțiile curente
  - Calculare: CTR = (clicks / impressions) * 100, CPC = spend / clicks, CPM = (spend / impressions) * 1000

**Fișiere modificate:**
- `frontend/src/components/dashboard/MetricsCards.tsx` (NOU)
- `frontend/src/components/dashboard/InsightsView.tsx`

#### Task 10.5: Info Buttons pentru Metrici
- [ ] **Subtask 10.5.1:** Adăugare buton "i" (info) pe fiecare card
  - Icon mic în colțul de sus-dreapta al cardului
  - Culoare subtilă, hover effect
- [ ] **Subtask 10.5.2:** Tooltip cu explicație
  - Hover sau click pe "i" afișează tooltip cu explicație metrică
  - Explicații:
    - Total Spend: "Suma totală cheltuită în perioada selectată"
    - Impressions: "De câte ori au fost afișate anunțurile"
    - Clicks: "Numărul total de click-uri pe anunțuri"
    - Reach: "Numărul de persoane unice care au văzut anunțurile"
    - CTR: "Click-Through Rate - procentul de impresii care au generat click-uri"
    - CPC: "Cost Per Click - costul mediu per click"
    - CPM: "Cost Per Mille - costul per 1000 de impresii"
- [ ] **Subtask 10.5.3:** Folosire library tooltip
  - Opțiuni: Headless UI Tooltip, react-tooltip, sau CSS custom tooltip

**Fișiere modificate:**
- `frontend/src/components/dashboard/MetricsCards.tsx`

**Dependencies (opțional):**
- `npm install react-tooltip`

#### Task 10.6: "Top" pentru Fiecare Metrică
- [ ] **Subtask 10.6.1:** Calculare top performer per metrică
  - Pentru fiecare metrică, găsește obiectul (account/campaign/ad set/ad) cu valoarea cea mai mare
  - Agregare pe baza selecțiilor și filtrelor
- [ ] **Subtask 10.6.2:** Afișare în card
  - Sub valoarea metrică, afișează:
    - Tip obiect (emoji icon: 📊 account, 🎯 campaign, 📢 ad set, 🎨 ad)
    - Nume obiect (truncated dacă e prea lung)
    - Valoare metrică pentru acel obiect
  - Exemplu: "🎯 Campaign: Summer Sale - $1,234.56"
- [ ] **Subtask 10.6.3:** Styling
  - Font size mic: 0.75rem
  - Color: gray-600
  - Badge cu background subtil pentru a evidenția "top performer"

**Fișiere modificate:**
- `frontend/src/components/dashboard/MetricsCards.tsx`
- Helper functions pentru calculare top performers

#### Task 10.7: 7 Grafice Comparative cu Recharts
- [ ] **Subtask 10.7.1:** Instalare Recharts
  - `npm install recharts`
- [ ] **Subtask 10.7.2:** Creare component `MetricsCharts.tsx`
  - Layout: vertical stack, fiecare grafic ocupă ~300-400px înălțime
  - 7 grafice (unul pentru fiecare metrică)
- [ ] **Subtask 10.7.3:** Configurare LineChart pentru fiecare metrică
  - X-axis: Date (zilele din time range)
  - Y-axis: Valoarea metrică
  - Multiple lines: câte o linie pentru fiecare obiect selectat (account/campaign/ad set/ad)
  - Legendă: culori diferite per linie, afișează numele obiectului
- [ ] **Subtask 10.7.4:** Date preparation
  - Group insights by date și entity
  - Pentru fiecare zi, calculează valoarea metrică pentru fiecare entity
  - Format: `[ { date: '2026-01-26', 'Campaign 1': 123, 'Campaign 2': 456 }, ... ]`
- [ ] **Subtask 10.7.5:** Suprapunere grafice (comparative mode)
  - Toate liniile pe același grafic (nu grafice separate per entity)
  - Color coding consistent cu legenda
- [ ] **Subtask 10.7.6:** Responsive charts
  - ResponsiveContainer pentru auto-resize
  - Tooltip cu informații detaliate la hover
- [ ] **Subtask 10.7.7:** Stilizare
  - Background: white
  - Grid lines: subtle gray
  - Culori linii: palette vibrant (blue, green, red, purple, orange, cyan, pink)

**Fișiere modificate:**
- `frontend/src/components/dashboard/MetricsCharts.tsx` (NOU)
- `frontend/src/components/dashboard/InsightsView.tsx`

#### Task 10.8: API Integration pentru Insights
- [ ] **Subtask 10.8.1:** Actualizare API call
  - Endpoint: `/api/meta/client/insights/`
  - Query params:
    - `account_ids[]`: array
    - `campaign_ids[]`: array
    - `adset_ids[]`: array
    - `ad_ids[]`: array
    - `start_date`, `end_date`
    - `compare_start_date`, `compare_end_date` (opțional)
    - `custom_ranges`: JSON object cu custom ranges per entity
- [ ] **Subtask 10.8.2:** Backend endpoint update
  - Acceptare parametri multiple
  - Filtrare insights pe baza selecțiilor
  - Return insights group by date și entity
- [ ] **Subtask 10.8.3:** Response processing
  - Agregare data pentru carduri de metrici
  - Prepare data pentru grafice (group by date)

**Fișiere modificate:**
- `frontend/src/lib/api.ts`
- `frontend/src/components/dashboard/InsightsView.tsx`

**Backend:**
- `backend/meta_ads/views.py` - endpoint `client_insights` cu filtru complex
- `backend/meta_ads/serializers.py`

#### Task 10.9: Layout Final Insights View
- [ ] **Subtask 10.9.1:** Structură completă
  ```
  InsightsView:
    ├── InsightsFilters (4 dropdowns + time range)
    ├── MetricsCards (7 carduri în 2 rânduri)
    └── MetricsCharts (7 grafice)
  ```
- [ ] **Subtask 10.9.2:** Spacing și padding
  - Gap între secțiuni: 2rem
  - Padding container: 1.5rem
- [ ] **Subtask 10.9.3:** Loading states
  - Skeleton loaders pentru carduri și grafice când se încarcă data
- [ ] **Subtask 10.9.4:** Error handling
  - Mesaj clar dacă API call eșuează
  - Empty state dacă nu sunt insights pentru selecțiile curente

**Fișiere modificate:**
- `frontend/src/components/dashboard/InsightsView.tsx` (restructurare completă)

#### Verificare Etapa 10
- [ ] Bară de sus cu 4 dropdowns (Account, Campaign, Ad Set, Ad) funcționează
- [ ] Fiecare dropdown permite selecție multiplă
- [ ] Time range selector cu comparare perioade funcționează
- [ ] Time range custom per obiect funcționează (aceeași lungime ca general)
- [ ] 7 carduri de metrici afișate: 4 pe rândul 1, 3 pe rândul 2 (lățimi egale)
- [ ] Fiecare card are buton info cu tooltip explicativ
- [ ] Fiecare card afișează "top performer" pentru acea metrică
- [ ] 7 grafice Recharts afișate, unul pentru fiecare metrică
- [ ] Graficele sunt comparative (multiple linii suprapuse pentru obiecte diferite)
- [ ] Legenda afișează corect numele obiectelor și culori
- [ ] API integration funcționează cu filtru complex
- [ ] Loading states și error handling implementate
- [ ] Layout-ul este responsive și curat

---

### **ETAPA 11: Stil & Polish - Consistență UI**

**Scop:** Asigurarea consistenței între light mode și dark mode, verificare limba română, spacing uniform.

#### Task 11.1: Consistență Light/Dark Mode
- [ ] **Subtask 11.1.1:** Audit complet UI în ambele mode-uri
  - Verificare toate componentele dashboard în light mode
  - Verificare toate componentele dashboard în dark mode (dacă există implementare)
- [ ] **Subtask 11.1.2:** Definire variabile CSS pentru culori
  - Creare CSS variables pentru culori principale
  - Aplicare variables în loc de hard-coded colors
  - Exemplu:
    ```css
    :root {
      --bg-primary: #ffffff;
      --bg-secondary: #f9fafb;
      --text-primary: #1f2937;
      --border-color: #e5e7eb;
    }
    [data-theme="dark"] {
      --bg-primary: #1f2937;
      --bg-secondary: #111827;
      --text-primary: #f9fafb;
      --border-color: #374151;
    }
    ```
- [ ] **Subtask 11.1.3:** Aplicare CSS variables
  - Înlocuire toate culorile hard-coded cu var(--color-name)
  - Test în ambele mode-uri
- [ ] **Subtask 11.1.4:** Theme toggle (opțional, dacă nu există)
  - Buton de switch între light/dark în header
  - Persistare preferință în localStorage

**Fișiere modificate:**
- `frontend/src/app/globals.css`
- Toate componentele dashboard (înlocuire inline styles cu clase Tailwind sau CSS variables)
- `frontend/tailwind.config.ts` (eventual dark mode config)

**Notă:** Conform MINDMAP, UI-ul actual este light mode only. Dacă dark mode nu e implementat, această task înseamnă:
- Asigurare că stilul e consistent în light mode (font, spacing, etc.)
- Pregătire arhitectură pentru dark mode (variables) dar fără implementare completă

#### Task 11.2: Verificare Limba Română
- [ ] **Subtask 11.2.1:** Audit toate textele din interfață
  - Verificare că toate label-urile, butoanele, mesajele sunt în română
  - Excepție: "ConversionDriven" (brand name)
- [ ] **Subtask 11.2.2:** Corectare eventuale texte în engleză
  - Exemple: "Loading..." → "Se încarcă..."
  - "No data available" → "Nu sunt date disponibile"
  - "Select an account" → "Selectează un cont"
- [ ] **Subtask 11.2.3:** Verificare consistență diacritice
  - Folosire corectă ă, â, î, ș, ț

**Fișiere modificate:**
- Toate componentele dashboard
- Toate componentele landing
- Login page

#### Task 11.3: Spacing și Alignment Uniform
- [ ] **Subtask 11.3.1:** Definire spacing scale
  - Folosire Tailwind spacing scale consistent (0.5rem increments)
  - Gap între carduri: 1rem sau 1.5rem
  - Padding container: 1rem sau 1.5rem
- [ ] **Subtask 11.3.2:** Verificare alignment
  - Text alignment: left pentru conținut, center pentru titluri dacă e cazul
  - Flex alignment: consistent în toate componentele
- [ ] **Subtask 11.3.3:** Verificare responsive spacing
  - Spacing mai mic pe mobile
  - Spacing normal pe desktop

**Fișiere modificate:**
- Toate componentele (verificare și ajustare)

#### Verificare Etapa 11
- [ ] Light mode și dark mode au același stil (font, spacing, layout) - doar culori diferite
- [ ] Toate textele din interfață sunt în limba română (excepție: ConversionDriven)
- [ ] Diacriticele sunt folosite corect
- [ ] Spacing-ul este uniform în toată aplicația
- [ ] Nu există diferențe vizuale neintenționat între secțiuni

---

### **ETAPA 12: Testing & Production Readiness**

**Scop:** Testing complet, bug fixes, actualizare documentație.

#### Task 12.1: Testing Complet End-to-End
- [ ] **Subtask 12.1.1:** Landing page testing
  - Desktop (1920px, 1366px, 1024px)
  - Tablet (768px)
  - Mobile (375px, 414px)
  - Verificare efecte vizuale (profunzime, animații)
  - Verificare performanță (60fps)
- [ ] **Subtask 12.1.2:** Login page testing
  - Responsive pe toate dimensiunile
  - Flow complet: login → redirect dashboard
- [ ] **Subtask 12.1.3:** Dashboard testing
  - Business selection → filtrare ad accounts
  - Ad account selection → campaigns load
  - Campaign selection → ad sets load (doar din campaigns selectate)
  - Ad set selection → ads load (doar din ad sets selectate)
  - Ad selection → creatives load
  - Insights:
    - 4 dropdowns funcționează
    - Time range selection
    - Time range comparison
    - Custom range per obiect
    - 7 carduri de metrici calculate corect
    - Top performers afișați corect
    - 7 grafice Recharts afișează date corecte
- [ ] **Subtask 12.1.4:** Cross-browser testing
  - Chrome, Firefox, Safari, Edge
  - Verificare compatibilitate CSS
- [ ] **Subtask 12.1.5:** Performance testing
  - Lighthouse score > 90 pentru landing
  - Dashboard load time < 2s
  - Smooth scrolling (60fps)

**Checklist de test:**
- [ ] Landing page: profunzime vizuală, buton Descoperă, responsive
- [ ] Login: responsive, redirect corect
- [ ] Dashboard layout: 10% + 5% + 85%, panele 12.5% + 75% + 12.5%
- [ ] Business dropdown: selecție multiplă, filtrare ad accounts
- [ ] Ad accounts: time zone, text wrapping
- [ ] Campaigns: checkboxes, hover info, selecție persistentă
- [ ] Ad sets: checkboxes, budgets, time, filtrare pe campaigns
- [ ] Ads: checkboxes, creative info, filtrare pe ad sets
- [ ] Creatives: grid, imagini din URL
- [ ] Insights: toate features (dropdowns, time range, metrici, grafice)
- [ ] Stil: consistent, română, spacing uniform
- [ ] Scroll: fără bare vizibile

#### Task 12.2: Bug Fixes
- [ ] **Subtask 12.2.1:** Crearea unei liste de bug-uri găsite în testing
  - Documentare în fișier `BUGS.md` temporar
- [ ] **Subtask 12.2.2:** Prioritizare bug-uri
  - Critical (blockers), High, Medium, Low
- [ ] **Subtask 12.2.3:** Rezolvare bug-uri Critical și High
  - Fix-uri cu test pentru fiecare
- [ ] **Subtask 12.2.4:** Verificare Medium și Low
  - Rezolvare dacă timpul permite
  - Defer pentru viitor dacă nu sunt critice

**Procesul de bug fixing:**
1. Reproducere bug
2. Identificare cauză
3. Implementare fix
4. Test fix
5. Mark ca rezolvat în listă

#### Task 12.3: Actualizare MINDMAP.md
- [ ] **Subtask 12.3.1:** Documentare landing page changes
  - Secțiune nouă sau actualizare secțiunea 5 (Landing Page Structure)
  - Descriere efecte vizuale noi
  - Screenshot-uri actualizate (opțional)
- [ ] **Subtask 12.3.2:** Documentare dashboard changes
  - Actualizare secțiunea 7 (Client Dashboard Flows)
  - Descriere layout nou (3 părți, 3 panele)
  - Descriere business selection
  - Descriere sistem de selecție campaigns/ad sets/ads
  - Documentare insights nou (4 dropdowns, time range, metrici, grafice)
- [ ] **Subtask 12.3.3:** Actualizare API endpoints (dacă sunt noi)
  - Secțiunea 9 (API Endpoints Reference)
  - Noi endpoints sau parametri pentru insights
- [ ] **Subtask 12.3.4:** Actualizare changelog
  - Adăugare secțiune nouă în Changelog cu data și modificări
  - Format similar cu "January 26, 2026 - ConversionDriven Landing & Login Redesign"

**Fișiere modificate:**
- `MINDMAP.md`

#### Task 12.4: Code Cleanup
- [ ] **Subtask 12.4.1:** Remove commented code
  - Ștergere cod comentat vechi
- [ ] **Subtask 12.4.2:** Remove console.logs
  - Ștergere console.log pentru debug (păstrare doar logging important)
- [ ] **Subtask 12.4.3:** Formatting
  - Prettier pass pe toate fișierele
- [ ] **Subtask 12.4.4:** Verificare dependencies
  - Remove unused dependencies din package.json

#### Verificare Etapa 12
- [ ] Toate feature-urile testate end-to-end funcționează corect
- [ ] Nu există bug-uri Critical sau High nerezolvate
- [ ] Cross-browser compatibility verificată
- [ ] Performance acceptabilă (Lighthouse > 90, load time < 2s)
- [ ] MINDMAP.md actualizat cu toate modificările
- [ ] Cod curat (no commented code, no console.logs)
- [ ] Ready for production deployment

---

## 📊 STATUS TRACKING

### Currently Working On

**Etapa actuală:** _Nicio etapă în lucru_
**Task actual:** _Niciun task în lucru_
**Status:** _Așteptare aprobare plan_

### Last Completed Task

**Task:** _Plan tehnic creat_
**Data:** 2026-01-26
**Note:** Plan detaliat pe 12 etape, 100+ task-uri

### Progress Overview

| Etapa | Status | Tasks Completate | Tasks Total | Note |
|-------|--------|------------------|-------------|------|
| 1. Landing Page Profunzime | ⏸️ Pending | 0 | 9 | - |
| 2. Responsive Landing/Login | ⏸️ Pending | 0 | 13 | - |
| 3. Dashboard Layout | ⏸️ Pending | 0 | 15 | - |
| 4. Header & Business | ⏸️ Pending | 0 | 9 | - |
| 5. Ad Accounts | ⏸️ Pending | 0 | 5 | - |
| 6. Campaigns Selecție | ⏸️ Pending | 0 | 9 | - |
| 7. Ad Sets Selecție | ⏸️ Pending | 0 | 9 | - |
| 8. Ads Selecție | ⏸️ Pending | 0 | 8 | - |
| 9. Creatives Grid | ⏸️ Pending | 0 | 6 | - |
| 10. Insights Nou | ⏸️ Pending | 0 | 27 | Cea mai complexă etapă |
| 11. Stil & Polish | ⏸️ Pending | 0 | 9 | - |
| 12. Testing & Prod | ⏸️ Pending | 0 | 13 | - |

**Total Progress:** 0 / 132 tasks (0%)

---

## 🐛 FEEDBACK & ISSUES

### Production Feedback

_Această secțiune se va completa după deployment în producție și testare de către utilizatori._

**Status:** ⏸️ Așteptare deployment

### Known Issues

_Listă de probleme cunoscute care nu blochează deployment-ul dar trebuie rezolvate._

| ID | Descriere | Prioritate | Status | Assigned To | Note |
|----|-----------|------------|--------|-------------|------|
| - | - | - | - | - | _No issues yet_ |

### Feedback Actions

_Acțiuni de luat pe baza feedback-ului din producție._

| Feedback | Acțiune | Status | Note |
|----------|---------|--------|------|
| - | - | - | _Waiting for feedback_ |

---

## ✅ FINALIZARE

### Checklist Final

- [ ] **Toate etapele 1-12 completate**
- [ ] **Toate verificările de etapă passed**
- [ ] **Testing complet efectuat**
- [ ] **Bug-uri critice rezolvate**
- [ ] **MINDMAP.md actualizat**
- [ ] **Code review efectuat**
- [ ] **Production deployment success**
- [ ] **User feedback pozitiv**

### Deployment

**Environment:** Production
**URL:** _TBD_
**Data deployment:** _TBD_
**Status:** ⏸️ Not deployed yet

### Sign-off

**Developer:** Claude Sonnet 4.5
**Product Owner:** Andrei Balan
**Approval Status:** ⏸️ Pending approval

---

## 📝 NOTIȚE TEHNICE

### Dependencies Noi Necesare

**Frontend:**
```bash
npm install react-select          # Multi-select dropdowns (Insights)
npm install recharts              # Grafice pentru metrici
npm install react-datepicker      # Date pickers pentru time range
npm install react-tooltip         # Tooltip-uri pentru info buttons (opțional)
```

**Backend:**
- Nicio dependență nouă necesară (folosim Django, DRF, PostgreSQL existent)

### Estimări de Timp (orientativ)

| Etapa | Complexitate | Timp Estimat | Note |
|-------|--------------|--------------|------|
| 1. Landing Profunzime | Medium | 4-6h | Animații, efecte vizuale |
| 2. Responsive | Low | 3-4h | CSS responsive standard |
| 3. Dashboard Layout | High | 6-8h | Restructurare complexă |
| 4. Business Selection | Medium | 4-5h | Dropdown + API integration |
| 5. Ad Accounts | Low | 2-3h | Display changes simplu |
| 6. Campaigns | Medium | 4-5h | Checkboxes + state management |
| 7. Ad Sets | Medium | 4-5h | Similar cu campaigns |
| 8. Ads | Medium | 3-4h | Similar cu ad sets |
| 9. Creatives | Low | 2-3h | Grid layout simplu |
| 10. Insights | Very High | 12-16h | Cea mai complexă (dropdowns, time range, metrici, grafice) |
| 11. Stil & Polish | Medium | 4-6h | Consistență UI |
| 12. Testing | High | 8-10h | Testing complet + bug fixes |
| **TOTAL** | - | **56-75h** | ~7-10 zile lucru full-time |

### Fișiere Cheie

**Frontend - Noi:**
- `frontend/src/components/landing/DepthBackground.tsx`
- `frontend/src/components/dashboard/MetaUserBadge.tsx`
- `frontend/src/components/dashboard/BusinessDropdown.tsx`
- `frontend/src/components/dashboard/InsightsFilters.tsx`
- `frontend/src/components/dashboard/TimeRangeSelector.tsx`
- `frontend/src/components/dashboard/CustomRangePicker.tsx`
- `frontend/src/components/dashboard/MetricsCards.tsx`
- `frontend/src/components/dashboard/MetricsCharts.tsx`

**Frontend - Modificări Majore:**
- `frontend/src/app/dashboard/page.tsx` (restructurare layout)
- `frontend/src/components/landing/HeroSection.tsx` (efecte vizuale)
- `frontend/src/components/dashboard/InsightsView.tsx` (restructurare completă)
- `frontend/src/components/dashboard/LeftPanel.tsx` (layout changes)
- `frontend/src/components/dashboard/CenterPanel.tsx` (layout changes)
- `frontend/src/components/dashboard/RightPanel.tsx` (layout changes)
- `frontend/src/components/dashboard/CampaignsTable.tsx` (checkboxes)
- `frontend/src/components/dashboard/AdSetsTable.tsx` (checkboxes, info)
- `frontend/src/components/dashboard/AdsTable.tsx` (checkboxes, creative info)

**Backend - Modificări:**
- `backend/meta_ads/views.py` (endpoints cu filtre complexe)
- `backend/meta_ads/serializers.py` (eventual noi câmpuri)

**Stiluri:**
- `frontend/src/app/globals.css` (animații, scrollbar hidden, CSS variables)
- `frontend/tailwind.config.ts` (eventual noi keyframes)

---

**IMPORTANT:** Acest plan este un document viu. Pe măsură ce implementăm, pot apărea:
- Modificări necesare (probleme tehnice, cerințe noi)
- Task-uri adiționale (edge cases descoperite)
- Optimizări (soluții mai bune găsite)

Fiecare modificare va fi documentată în secțiunea relevantă.

---

_Plan creat: 2026-01-26_
_Ultima actualizare: 2026-01-26_
_Versiune: 1.0_
