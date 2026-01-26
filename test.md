         1 +# PLAN TEHNIC: Refactorizare Completă SmartAnalytics
         2 +
         3 +> **Proiect:** SmartAnalytics (ConversionDriven)
         4 +> **Scop:** Implementare modificări complete UI/UX conform planului detaliat
         5 +> **Data start:** 2026-01-26
         6 +
         7 +---
         8 +
         9 +## 📋 CUPRINS
        10 +
        11 +1. [Rezumat General](#rezumat-general)
        12 +2. [Etape de Implementare](#etape-de-implementare)
        13 +3. [Status Tracking](#status-tracking)
        14 +4. [Feedback & Issues](#feedback--issues)
        15 +5. [Finalizare](#finalizare)
        16 +
        17 +---
        18 +
        19 +## REZUMAT GENERAL
        20 +
        21 +### Obiective Principale
        22 +
        23 +**Landing Page:**
        24 +- Adăugare profunzime vizuală (linii, puncte, tranziții de culoare)
        25 +- Efect vizual în spatele textului "AI-powered conversion tracking"
        26 +- Modificări buton "Descoperă" + săgeată (poziție, dimensiuni)
        27 +
        28 +**Dashboard - Layout:**
        29 +- Restructurare completă: Partea 1 (10%), Partea 2 (5%), Partea 3 (85%)
        30 +- Partea 3: stânga 12.5%, mijloc 75%, dreapta 12.5% (cu min/max pe laterale)
        31 +- Scroll fără bare vizibile
        32 +- Tot dashboard-ul să încapă pe o pagină
        33 +
        34 +**Dashboard - Features:**
        35 +- Business selection cu dropdown + checkboxes
        36 +- Sistem de selecție cu checkboxes pentru campaigns/ad sets/ads
        37 +- Time zone pentru ad accounts
        38 +- Insights complet nou: 4 dropdowns, time range comparison, 7 metrici, 7 grafice
        39 +
        40 +**Stil & Consistență:**
        41 +- Light/dark mode consistent (același stil, nu culoare)
        42 +- Limba română în interfață
        43 +- Responsive doar pentru landing + login (NU dashboard)
        44 +
        45 +---
        46 +
        47 +## ETAPE DE IMPLEMENTARE
        48 +
        49 +---
        50 +
        51 +### **ETAPA 1: Landing Page - Profunzime Vizuală**
        52 +
        53 +**Scop:** Îmbunătățirea esteticii landing page-ului cu efecte vizuale care creează profunzime.
        54 +
        55 +#### Task 1.1: Adăugare Elemente de Profunzime în Hero Section
        56 +- [ ] **Subtask 1.1.1:** Creare component `DepthBackground.tsx` în `frontend/src/components/landing/`
        57 +  - Grid de puncte animate (particle effect) cu opacity variabilă
        58 +  - Linii diagonale subtile cu gradient fade
        59 +  - Folosire Framer Motion pentru animații smooth
        60 +- [ ] **Subtask 1.1.2:** Adăugare tranziții de culoare
        61 +  - Gradient overlay peste background cu animație subtilă (navy → electric-blue → navy, 10s loop)
        62 +  - Blur effect pe margini pentru depth of field
        63 +- [ ] **Subtask 1.1.3:** Integrare în `HeroSection.tsx`
        64 +  - Import `DepthBackground` ca layer absolut (z-index: 0)
        65 +  - Content-ul peste background (z-index: 10)
        66 +
        67 +**Fișiere modificate:**
        68 +- `frontend/src/components/landing/DepthBackground.tsx` (NOU)
        69 +- `frontend/src/components/landing/HeroSection.tsx`
        70 +- `frontend/src/app/globals.css` (eventual animații @keyframes)
        71 +
        72 +#### Task 1.2: Efect Vizual în Spatele Textului
        73 +- [ ] **Subtask 1.2.1:** Creare efect glow în spatele badge-ului "AI-powered conversion tracking"
        74 +  - Box-shadow multi-layer cu electric-blue
        75 +  - Backdrop blur pentru efect de adâncime
        76 +- [ ] **Subtask 1.2.2:** Adăugare contur/outline subtil animat
        77 +  - Border animat cu gradient (electric-blue → electric-cyan)
        78 +  - Rotație lentă (360deg în 20s) pentru efect premium
        79 +- [ ] **Subtask 1.2.3:** Light rays din spate
        80 +  - Pseudo-element ::before cu linear-gradient radial
        81 +  - Opacity 0.1-0.2 pentru subtilitate
        82 +
        83 +**Fișiere modificate:**
        84 +- `frontend/src/components/landing/HeroSection.tsx`
        85 +- `frontend/tailwind.config.ts` (eventual keyframes noi)
        86 +
        87 +#### Task 1.3: Modificări Buton "Descoperă" și Săgeată
        88 +- [ ] **Subtask 1.3.1:** Ajustare poziționare
        89 +  - Mărire `pt-12` → `pt-16` (sau mai mult) pentru a muta butonul mai jos
        90 +- [ ] **Subtask 1.3.2:** Reducere dimensiuni
        91 +  - Text: `text-xs` → `text-[11px]` (puțin mai mic)
        92 +  - Săgeată: `text-4xl` → `text-3xl` (mai scurtă)
        93 +- [ ] **Subtask 1.3.3:** Ajustare animație bounce
        94 +  - Reducere amplitudine: `y: [0, 10, 0]` → `y: [0, 8, 0]`
        95 +  - Test pentru ca săgeata să nu pară prea agresivă
        96 +
        97 +**Fișiere modificate:**
        98 +- `frontend/src/components/landing/HeroSection.tsx` (liniile 80-107)
        99 +
       100 +#### Verificare Etapa 1
       101 +- [ ] Landing page arată cu mai multă profunzime vizuală (puncte, linii, tranziții)
       102 +- [ ] Badge-ul "AI-powered conversion tracking" are efect vizual în spate (glow, contur)
       103 +- [ ] Butonul "Descoperă" este poziționat mai jos cu text și săgeată puțin mai mici
       104 +- [ ] Animațiile sunt smooth și nu distrag de la conținut
       105 +- [ ] Performance: 60fps constant pe hero section
       106 +
       107 +---
       108 +
       109 +### **ETAPA 2: Responsive Design - Landing & Login**
       110 +
       111 +**Scop:** Asigurarea că landing page-ul și login page-ul sunt responsive (mobile, tablet). Dashboard-
           +ul rămâne doar pentru desktop.
       112 +
       113 +#### Task 2.1: Responsive Landing Page
       114 +- [ ] **Subtask 2.1.1:** Audit toate componentele landing
       115 +  - Verificare breakpoints actuale (sm, md, lg, xl)
       116 +  - Identificare probleme pe mobile (<640px) și tablet (640px-1024px)
       117 +- [ ] **Subtask 2.1.2:** Ajustări HeroSection
       118 +  - Mobile: text-3xl pentru headline, padding redus, CTA vertical stack
       119 +  - Tablet: text-5xl, CTA side-by-side dacă încap
       120 +  - Test DepthBackground să nu încetinească pe mobile (disable particule pe sm?)
       121 +- [ ] **Subtask 2.1.3:** Ajustări KeyCapabilities
       122 +  - Grid: 1 col (mobile) → 2 col (md) → 3 col (lg)
       123 +  - Padding și spacing redus pe mobile
       124 +- [ ] **Subtask 2.1.4:** Ajustări ProductPreview
       125 +  - Mobile: vertical stack (1.png, 2.png, 3.png)
       126 +  - Tablet: overlapping layout similar desktop dar la scară mai mică
       127 +- [ ] **Subtask 2.1.5:** Ajustări HowItWorks
       128 +  - Mobile: 1 col grid
       129 +  - Tablet: 2x2 grid (ca desktop)
       130 +- [ ] **Subtask 2.1.6:** Ajustări FinalCTA
       131 +  - Mobile: padding redus, font size mai mic
       132 +  - Buton CTA 100% width pe mobile
       133 +
       134 +**Fișiere modificate:**
       135 +- `frontend/src/components/landing/HeroSection.tsx`
       136 +- `frontend/src/components/landing/KeyCapabilities.tsx`
       137 +- `frontend/src/components/landing/ProductPreview.tsx`
       138 +- `frontend/src/components/landing/HowItWorks.tsx`
       139 +- `frontend/src/components/landing/FinalCTA.tsx`
       140 +
       141 +#### Task 2.2: Responsive Login Page
       142 +- [ ] **Subtask 2.2.1:** Verificare layout login pe mobile
       143 +  - Form container: max-width și padding responsive
       144 +  - Input fields: 100% width pe mobile
       145 +- [ ] **Subtask 2.2.2:** Ajustări pentru tablet
       146 +  - Centrare form, max-width 500px
       147 +- [ ] **Subtask 2.2.3:** Test pe device-uri diferite
       148 +  - Chrome DevTools: iPhone 12, iPad, desktop
       149 +
       150 +**Fișiere modificate:**
       151 +- `frontend/src/app/login/page.tsx`
       152 +
       153 +#### Verificare Etapa 2
       154 +- [ ] Landing page arată perfect pe mobile (320px-640px), tablet (640px-1024px), desktop (>1024px)
       155 +- [ ] Login page responsive pe toate dimensiunile
       156 +- [ ] Nu există overflow orizontal
       157 +- [ ] Toate textele sunt lizibile (nu prea mici)
       158 +- [ ] CTA-urile sunt accesibile cu touchscreen
       159 +- [ ] Performance: 60fps pe mobile devices
       160 +
       161 +---
       162 +
       163 +### **ETAPA 3: Dashboard Layout - Restructurare Completă**
       164 +
       165 +**Scop:** Restructurarea layout-ului dashboard-ului în 3 părți (Header 10%, Tabs 5%, Content 85%) cu
           +panele laterale fixe și mijloc dinamic.
       166 +
       167 +#### Task 3.1: Partea 1 - Header Dashboard (10% înălțime)
       168 +- [ ] **Subtask 3.1.1:** Calcul înălțime dinamică
       169 +  - Înălțime: `min(10vh, 80px)` și `max(10vh, 60px)`
       170 +  - Folosire CSS `clamp(60px, 10vh, 80px)` pentru auto-adjusting
       171 +- [ ] **Subtask 3.1.2:** Restructurare component Header
       172 +  - Wrapper cu height: clamp value
       173 +  - Flex layout: space-between, align-center
       174 +  - Overflow: hidden (nu se mărește niciodată)
       175 +- [ ] **Subtask 3.1.3:** Actualizare `page.tsx`
       176 +  - Înlocuire header actual cu noua structură
       177 +  - Test redimensionare fereastră
       178 +
       179 +**Fișiere modificate:**
       180 +- `frontend/src/app/dashboard/page.tsx` (liniile 87-141)
       181 +- `frontend/src/components/dashboard/Header.tsx` (NOU, opțional - sau inline în page.tsx)
       182 +
       183 +#### Task 3.2: Partea 2 - Platform Tabs (5% înălțime)
       184 +- [ ] **Subtask 3.2.1:** Calcul înălțime dinamică
       185 +  - Înălțime: `clamp(40px, 5vh, 60px)`
       186 +- [ ] **Subtask 3.2.2:** Creare component `PlatformTabs.tsx` (sau modificare existentă)
       187 +  - Tabs pentru Meta și Google Ads
       188 +  - Stilizare consistent cu design system
       189 +  - Height fix conform clamp
       190 +- [ ] **Subtask 3.2.3:** Ajustări de stil
       191 +  - Background, borders, padding optim pentru înălțimea redusă
       192 +  - Font size mai mic dacă e nevoie
       193 +
       194 +**Fișiere modificate:**
       195 +- `frontend/src/app/dashboard/page.tsx`
       196 +- `frontend/src/components/dashboard/PlatformTabs.tsx` (NOU sau modificat)
       197 +
       198 +#### Task 3.3: Partea 3 - Trei Panele (12.5% | 75% | 12.5%)
       199 +- [ ] **Subtask 3.3.1:** Container flex pentru Partea 3
       200 +  - Height: `calc(100vh - Header_height - Tabs_height)`
       201 +  - Display: flex, flex-direction: row
       202 +- [ ] **Subtask 3.3.2:** Left Panel - 12.5% cu min/max
       203 +  - Width: 12.5% cu `min-width: 220px` și `max-width: 300px`
       204 +  - Când fereastra e prea mică sau prea mare, width-ul rămâne între 220-300px
       205 +  - OverflowY: auto (scroll fără bară vizibilă - vezi Task 3.4)
       206 +- [ ] **Subtask 3.3.3:** Center Panel - 75% dinamic
       207 +  - Flex: 1 (ia tot spațiul rămas după left și right)
       208 +  - OverflowY: auto, overflowX: auto (fără bare vizibile)
       209 +- [ ] **Subtask 3.3.4:** Right Panel - 12.5% cu min/max
       210 +  - Width: 12.5% cu `min-width: 200px` și `max-width: 280px`
       211 +  - OverflowY: auto (fără bară vizibilă)
       212 +- [ ] **Subtask 3.3.5:** Test redimensionare
       213 +  - Fereastră mică (1200px): left și right la min-width, center comprimat
       214 +  - Fereastră mare (2000px): left și right la max-width, center extins
       215 +
       216 +**Fișiere modificate:**
       217 +- `frontend/src/app/dashboard/page.tsx` (liniile 210-224, restructurare completă)
       218 +- `frontend/src/components/dashboard/LeftPanel.tsx`
       219 +- `frontend/src/components/dashboard/CenterPanel.tsx`
       220 +- `frontend/src/components/dashboard/RightPanel.tsx`
       221 +
       222 +#### Task 3.4: Scroll fără Bare Vizibile
       223 +- [ ] **Subtask 3.4.1:** CSS pentru hidden scrollbars
       224 +  - Adăugare în `globals.css`:
       225 +    ```css
       226 +    .scrollbar-hidden {
       227 +      scrollbar-width: none; /* Firefox */
       228 +      -ms-overflow-style: none; /* IE/Edge */
       229 +    }
       230 +    .scrollbar-hidden::-webkit-scrollbar {
       231 +      display: none; /* Chrome/Safari */
       232 +    }
       233 +    ```
       234 +- [ ] **Subtask 3.4.2:** Aplicare clasa pe toate panelele cu scroll
       235 +  - LeftPanel, CenterPanel, RightPanel
       236 +  - Ad Accounts list, Campaigns table, etc.
       237 +
       238 +**Fișiere modificate:**
       239 +- `frontend/src/app/globals.css`
       240 +- Toate componentele cu overflow: auto
       241 +
       242 +#### Task 3.5: Reducere Grosime Zonă Titlu în Center Panel
       243 +- [ ] **Subtask 3.5.1:** Identificare zona de titlu
       244 +  - Header din CenterPanel unde scrie "Campaigns", "Ad Sets", etc.
       245 +- [ ] **Subtask 3.5.2:** Reducere padding vertical
       246 +  - Padding actual: `1.5rem` → `0.75rem`
       247 +  - Height implicit: auto → mai mic cu ~50%
       248 +- [ ] **Subtask 3.5.3:** Ajustare font size dacă e nevoie
       249 +  - Dacă textul pare prea mare pentru spațiul nou, reduce de la 1.25rem la 1.125rem
       250 +
       251 +**Fișiere modificate:**
       252 +- `frontend/src/components/dashboard/CenterPanel.tsx` (header section)
       253 +
       254 +#### Verificare Etapa 3
       255 +- [ ] Header-ul (Partea 1) are înălțime 10% cu limite min/max
       256 +- [ ] Tabs (Partea 2) au înălțime 5% cu limite min/max
       257 +- [ ] Partea 3 ocupă restul (85%) cu 3 panele: 12.5% | 75% | 12.5%
       258 +- [ ] Left și Right panel au min-width/max-width, Center panel se adaptează
       259 +- [ ] Scroll funcționează fără bare vizibile pe toate panelele
       260 +- [ ] Zona de titlu din Center Panel are înălțime redusă cu ~50%
       261 +- [ ] Tot dashboard-ul încape pe o pagină fără scroll global
       262 +- [ ] La redimensionare fereastră, comportamentul e corect
       263 +
       264 +---
       265 +
       266 +### **ETAPA 4: Header & Business Selection**
       267 +
       268 +**Scop:** Actualizare header cu Meta ID/name și implementare business selection dropdown.
       269 +
       270 +#### Task 4.1: Dreptunghi Meta ID/Name în Header
       271 +- [ ] **Subtask 4.1.1:** Fetch Meta User info
       272 +  - API call la `/api/meta/client/meta-user/` pentru Meta ID și name
       273 +  - State management în page.tsx sau context
       274 +- [ ] **Subtask 4.1.2:** Creare component `MetaUserBadge.tsx`
       275 +  - Layout: dreptunghi cu border, padding, background subtil
       276 +  - Afișare: "Meta ID: 123456" și "Name: John Doe" (sau doar ID dacă name lipsește)
       277 +  - Stilizare consistent cu design system (gray border, white bg)
       278 +- [ ] **Subtask 4.1.3:** Plasare în Header în dreapta user info
       279 +  - Flex layout: user info (stânga) | MetaUserBadge (mijloc) | Logout (dreapta)
       280 +
       281 +**Fișiere modificate:**
       282 +- `frontend/src/app/dashboard/page.tsx` (header section)
       283 +- `frontend/src/components/dashboard/MetaUserBadge.tsx` (NOU)
       284 +- `frontend/src/lib/api.ts` (eventual endpoint nou)
       285 +
       286 +**Backend (dacă e nevoie):**
       287 +- `backend/meta_ads/views.py` - endpoint pentru meta user info
       288 +- `backend/meta_ads/urls.py`
       289 +
       290 +#### Task 4.2: Business Dropdown cu Checkboxes
       291 +- [ ] **Subtask 4.2.1:** Fetch businesses disponibile
       292 +  - API call la `/api/meta/client/businesses/`
       293 +  - State: `businesses`, `selectedBusinesses`
       294 +- [ ] **Subtask 4.2.2:** Creare component `BusinessDropdown.tsx`
       295 +  - Trigger: Click pe MetaUserBadge sau săgeată dedicată
       296 +  - Dropdown: lista de businesses cu checkbox fiecare
       297 +  - Selecție multiplă: onChange update selectedBusinesses array
       298 +  - Button "Apply" pentru a confirma selecția
       299 +- [ ] **Subtask 4.2.3:** Logică de afișare săgeată
       300 +  - Dacă `businesses.length > 0`, afișează săgeată în dreptunghiul Meta
       301 +  - Altfel, nu afișa săgeată
       302 +- [ ] **Subtask 4.2.4:** Stilizare dropdown
       303 +  - Position: absolute, sub MetaUserBadge
       304 +  - Background: white, shadow, border
       305 +  - Checkbox styling consistent
       306 +  - Max-height cu scroll dacă sunt multe businesses
       307 +
       308 +**Fișiere modificate:**
       309 +- `frontend/src/components/dashboard/BusinessDropdown.tsx` (NOU)
       310 +- `frontend/src/components/dashboard/MetaUserBadge.tsx`
       311 +- `frontend/src/app/dashboard/page.tsx` (state management)
       312 +
       313 +#### Task 4.3: Filtrare Ad Accounts pe Business
       314 +- [ ] **Subtask 4.3.1:** Actualizare API call pentru ad accounts
       315 +  - Parametru: `business_ids` în query string
       316 +  - Endpoint backend filtrează ad accounts care aparțin de businesses selectate
       317 +- [ ] **Subtask 4.3.2:** State management
       318 +  - Când se schimbă selectedBusinesses, refetch ad accounts
       319 +  - Reset selectedAccount dacă nu mai e în lista nouă
       320 +- [ ] **Subtask 4.3.3:** UI feedback
       321 +  - Loading state când se reîncarcă ad accounts
       322 +  - Message dacă nu sunt ad accounts pentru businesses selectate
       323 +
       324 +**Fișiere modificate:**
       325 +- `frontend/src/app/dashboard/page.tsx`
       326 +- `frontend/src/lib/api.ts`
       327 +
       328 +**Backend:**
       329 +- `backend/meta_ads/views.py` - actualizare endpoint ad accounts cu filtru business
       330 +- `backend/meta_ads/serializers.py` (eventual)
       331 +
       332 +#### Verificare Etapa 4
       333 +- [ ] Header afișează Meta ID și Meta Name într-un dreptunghi stilizat
       334 +- [ ] Săgeată apare în dreptunghi doar dacă user-ul are businesses
       335 +- [ ] Click pe săgeată deschide dropdown cu lista de businesses
       336 +- [ ] Dropdown permite selecție multiplă cu checkboxes
       337 +- [ ] La aplicare selecție, ad accounts list se filtrează corect
       338 +- [ ] Dacă nu sunt businesses selectate, se afișează mesaj relevant
       339 +- [ ] UI este intuitiv și responsive la acțiuni
       340 +
       341 +---
       342 +
       343 +### **ETAPA 5: Ad Accounts - Time Zone & Text Wrapping**
       344 +
       345 +**Scop:** Adăugare time zone pentru fiecare ad account și wrap text pentru titluri lungi.
       346 +
       347 +#### Task 5.1: Adăugare Time Zone în Ad Account Display
       348 +- [ ] **Subtask 5.1.1:** Verificare dacă timezone e în model
       349 +  - Model `AdAccount` are câmp `timezone_name`? (da, conform MINDMAP)
       350 +  - Verificare serializer include timezone_name
       351 +- [ ] **Subtask 5.1.2:** Afișare timezone în LeftPanel
       352 +  - Sub account_id, adaugă linie nouă: `Timezone: America/New_York`
       353 +  - Font size mic: 0.75rem, color: gray-500
       354 +- [ ] **Subtask 5.1.3:** Formatare timezone friendly
       355 +  - Eventual funcție helper: `America/New_York` → `EST (UTC-5)` (opțional, doar dacă vrei)
       356 +
       357 +**Fișiere modificate:**
       358 +- `frontend/src/components/dashboard/LeftPanel.tsx`
       359 +- `backend/meta_ads/serializers.py` (verificare includere timezone_name)
       360 +
       361 +#### Task 5.2: Text Wrapping pentru Titluri Lungi
       362 +- [ ] **Subtask 5.2.1:** Identificare unde sunt titluri lungi
       363 +  - LeftPanel: account name
       364 +  - Alte locuri unde pot fi nume lungi
       365 +- [ ] **Subtask 5.2.2:** Aplicare CSS pentru wrapping
       366 +  - `white-space: normal` (nu nowrap)
       367 +  - `word-break: break-word` (pentru cuvinte foarte lungi)
       368 +  - `overflow-wrap: break-word`
       369 +- [ ] **Subtask 5.2.3:** Test cu nume foarte lung
       370 +  - Exemplu: "Super Mega Ultra Long Ad Account Name That Should Wrap to Next Line Automatically"
       371 +  - Verificare că se mută pe mai multe rânduri fără overflow
       372 +
       373 +**Fișiere modificate:**
       374 +- `frontend/src/components/dashboard/LeftPanel.tsx`
       375 +
       376 +#### Verificare Etapa 5
       377 +- [ ] Fiecare ad account afișează timezone-ul (ex: "America/New_York")
       378 +- [ ] Titlurile lungi de ad account se mută automat pe rândul următor
       379 +- [ ] Nu există overflow orizontal în LeftPanel
       380 +- [ ] Layout-ul rămâne curat și ușor de citit
       381 +
       382 +---
       383 +
       384 +### **ETAPA 6: Campaigns - Sistem de Selecție**
       385 +
       386 +**Scop:** Implementare checkboxes pentru campaigns, afișare informații + hover, state management.
       387 +
       388 +#### Task 6.1: Checkboxes pentru Campaigns
       389 +- [ ] **Subtask 6.1.1:** Adăugare coloană Checkbox în CampaignsTable
       390 +  - Thead: checkbox "Select All"
       391 +  - Tbody: checkbox per rând
       392 +- [ ] **Subtask 6.1.2:** State management
       393 +  - State: `selectedCampaigns` (array de campaign IDs)
       394 +  - Handler: toggleCampaign(id), selectAllCampaigns(), clearAllCampaigns()
       395 +- [ ] **Subtask 6.1.3:** Styling checkboxes
       396 +  - Custom checkbox styling sau folosire library (ex: headlessui)
       397 +  - Culoare accent: electric-blue când checked
       398 +
       399 +**Fișiere modificate:**
       400 +- `frontend/src/components/dashboard/CampaignsTable.tsx`
       401 +- `frontend/src/app/dashboard/page.tsx` (state management)
       402 +
       403 +#### Task 6.2: Informații Afișate + Hover
       404 +- [ ] **Subtask 6.2.1:** Coloane vizibile
       405 +  - Checkbox | Status | Name | Objective
       406 +- [ ] **Subtask 6.2.2:** Informații la hover
       407 +  - Buying Type + ID afișate în tooltip sau ca subtitle care apare la hover
       408 +  - Folosire `title` attribute simplu sau component Tooltip custom
       409 +- [ ] **Subtask 6.2.3:** Verificare date în API response
       410 +  - Asigură-te că backend trimite: status, name, objective, buying_type, id
       411 +
       412 +**Fișiere modificate:**
       413 +- `frontend/src/components/dashboard/CampaignsTable.tsx`
       414 +- `backend/meta_ads/serializers.py` (verificare câmpuri)
       415 +
       416 +#### Task 6.3: State Persistence
       417 +- [ ] **Subtask 6.3.1:** Persistare selecții în state global
       418 +  - Când user selectează campaigns, state-ul se păstrează chiar dacă schimbă view-ul
       419 +  - Folosire React Context sau state în page.tsx
       420 +- [ ] **Subtask 6.3.2:** Badge sau indicator în RightPanel
       421 +  - Lângă "Campaigns" în navigation, afișează numărul de selectate: "Campaigns (3)"
       422 +
       423 +**Fișiere modificate:**
       424 +- `frontend/src/app/dashboard/page.tsx`
       425 +- `frontend/src/components/dashboard/RightPanel.tsx`
       426 +
       427 +#### Verificare Etapa 6
       428 +- [ ] Fiecare campaign are checkbox funcțional
       429 +- [ ] "Select All" checkbox funcționează corect
       430 +- [ ] Informații afișate: Status, Name, Objective
       431 +- [ ] Buying Type și ID apar la hover peste rând
       432 +- [ ] Selecțiile se păstrează când navighezi între views
       433 +- [ ] Indicator vizual (badge) arată câte campaigns sunt selectate
       434 +
       435 +---
       436 +
       437 +### **ETAPA 7: Ad Sets - Sistem de Selecție**
       438 +
       439 +**Scop:** Implementare checkboxes pentru ad sets, afișare informații (budgets, time), filtrare pe cam
           +paigns selectate.
       440 +
       441 +#### Task 7.1: Checkboxes pentru Ad Sets
       442 +- [ ] **Subtask 7.1.1:** Adăugare coloană Checkbox în AdSetsTable
       443 +  - Thead: checkbox "Select All"
       444 +  - Tbody: checkbox per rând
       445 +- [ ] **Subtask 7.1.2:** State management
       446 +  - State: `selectedAdSets` (array de adset IDs)
       447 +  - Handlers similar cu campaigns
       448 +
       449 +**Fișiere modificate:**
       450 +- `frontend/src/components/dashboard/AdSetsTable.tsx`
       451 +- `frontend/src/app/dashboard/page.tsx`
       452 +
       453 +#### Task 7.2: Informații Afișate
       454 +- [ ] **Subtask 7.2.1:** Coloane vizibile
       455 +  - Checkbox | Status | Name | Daily Budget | Lifetime Budget | Start Time | End Time
       456 +- [ ] **Subtask 7.2.2:** Informații la hover
       457 +  - Optimization Goal + ID
       458 +- [ ] **Subtask 7.2.3:** Formatare budgets
       459 +  - Daily/Lifetime budget: formatare ca USD ($X.XX)
       460 +- [ ] **Subtask 7.2.4:** Formatare date
       461 +  - Start Time / End Time: format DD/MM/YYYY HH:mm sau locale string
       462 +
       463 +**Fișiere modificate:**
       464 +- `frontend/src/components/dashboard/AdSetsTable.tsx`
       465 +- `backend/meta_ads/serializers.py` (verificare câmpuri: daily_budget, lifetime_budget, start_time, e
           +nd_time, optimization_goal)
       466 +
       467 +#### Task 7.3: Filtrare pe Campaigns Selectate
       468 +- [ ] **Subtask 7.3.1:** API call cu filtru
       469 +  - Când se deschide view "adsets", trimite `campaign_ids` în query
       470 +  - Backend filtrează doar ad sets din campaigns selectate
       471 +- [ ] **Subtask 7.3.2:** Verificare selecții
       472 +  - Dacă nu sunt campaigns selectate, afișează mesaj: "Te rog selectează cel puțin un campaign"
       473 +  - Disable butonul "Ad Sets" în RightPanel dacă selectedCampaigns.length === 0
       474 +- [ ] **Subtask 7.3.3:** Loading state
       475 +  - Spinner când se încarcă ad sets
       476 +
       477 +**Fișiere modificate:**
       478 +- `frontend/src/components/dashboard/CenterPanel.tsx`
       479 +- `frontend/src/app/dashboard/page.tsx`
       480 +- `backend/meta_ads/views.py` - endpoint adsets cu filtru campaign_ids
       481 +
       482 +#### Verificare Etapa 7
       483 +- [ ] Ad sets au checkboxes funcționale
       484 +- [ ] Informații afișate: Status, Name, Daily Budget, Lifetime Budget, Start/End Time
       485 +- [ ] Optimization Goal + ID apar la hover
       486 +- [ ] Se afișează DOAR ad sets din campaigns selectate
       487 +- [ ] Mesaj clar dacă nu sunt campaigns selectate
       488 +- [ ] Selecțiile ad sets se păstrează între views
       489 +- [ ] Budgets și date sunt formatate corect și lizibil
       490 +
       491 +---
       492 +
       493 +### **ETAPA 8: Ads - Sistem de Selecție**
       494 +
       495 +**Scop:** Implementare checkboxes pentru ads, afișare informații + creative, filtrare pe ad sets sele
           +ctate.
       496 +
       497 +#### Task 8.1: Checkboxes pentru Ads
       498 +- [ ] **Subtask 8.1.1:** Adăugare coloană Checkbox în AdsTable
       499 +  - Similar cu campaigns și ad sets
       500 +- [ ] **Subtask 8.1.2:** State management
       501 +  - State: `selectedAds` (array de ad IDs)
       502 +
       503 +**Fișiere modificate:**
       504 +- `frontend/src/components/dashboard/AdsTable.tsx`
       505 +- `frontend/src/app/dashboard/page.tsx`
       506 +
       507 +#### Task 8.2: Informații Afișate
       508 +- [ ] **Subtask 8.2.1:** Coloane vizibile
       509 +  - Checkbox | Status | Name | Creative ID (sau Creative Name, de preferat)
       510 +- [ ] **Subtask 8.2.2:** Informații la hover
       511 +  - Effective Status + ID
       512 +- [ ] **Subtask 8.2.3:** Afișare Creative Name vs ID
       513 +  - Dacă creative_name există, afișează-l
       514 +  - Altfel, afișează creative_id
       515 +  - Backend trebuie să facă join cu AdCreative pentru a obține name
       516 +
       517 +**Fișiere modificate:**
       518 +- `frontend/src/components/dashboard/AdsTable.tsx`
       519 +- `backend/meta_ads/serializers.py` - ad serializer cu creative name
       520 +- `backend/meta_ads/views.py` - endpoint ads cu select_related('creative')
       521 +
       522 +#### Task 8.3: Filtrare pe Ad Sets Selectate
       523 +- [ ] **Subtask 8.3.1:** API call cu filtru
       524 +  - Query param: `adset_ids`
       525 +  - Backend filtrează ads din ad sets selectate
       526 +- [ ] **Subtask 8.3.2:** Verificare selecții
       527 +  - Disable "Ads" în navigation dacă nu sunt ad sets selectate
       528 +  - Mesaj de error dacă se încearcă accesare fără selecții
       529 +
       530 +**Fișiere modificate:**
       531 +- `frontend/src/components/dashboard/CenterPanel.tsx`
       532 +- `frontend/src/app/dashboard/page.tsx`
       533 +- `backend/meta_ads/views.py`
       534 +
       535 +#### Verificare Etapa 8
       536 +- [ ] Ads au checkboxes funcționale
       537 +- [ ] Informații afișate: Status, Name, Creative Name (sau ID)
       538 +- [ ] Effective Status + ID apar la hover
       539 +- [ ] Se afișează DOAR ads din ad sets selectate
       540 +- [ ] Mesaj clar dacă nu sunt ad sets selectate
       541 +- [ ] Selecțiile se păstrează între views
       542 +
       543 +---
       544 +
       545 +### **ETAPA 9: Creatives - Grid de Carduri**
       546 +
       547 +**Scop:** Afișare creative-uri ca grid de carduri cu imagine din URL.
       548 +
       549 +#### Task 9.1: Grid Layout pentru Creatives
       550 +- [ ] **Subtask 9.1.1:** Verificare component `CreativesGrid.tsx` existent
       551 +  - E deja implementat conform raportului de explorare
       552 +- [ ] **Subtask 9.1.2:** Ajustări dacă e nevoie
       553 +  - Grid: `repeat(auto-fill, minmax(300px, 1fr))`
       554 +  - Gap: 1.5rem
       555 +  - Padding: 1rem
       556 +
       557 +**Fișiere verificate:**
       558 +- `frontend/src/components/dashboard/CreativesGrid.tsx`
       559 +
       560 +#### Task 9.2: Afișare Imagine din URL
       561 +- [ ] **Subtask 9.2.1:** Verificare afișare imagine
       562 +  - Componentă deja afișează `creative.image_url` în tag <img>
       563 +- [ ] **Subtask 9.2.2:** Fallback pentru video/story
       564 +  - Emoji icons dacă nu e imagine: 🎥 (video), 📱 (story)
       565 +- [ ] **Subtask 9.2.3:** Lazy loading imagini
       566 +  - Adăugare `loading="lazy"` la tag-ul <img>
       567 +  - Eventual placeholder blur-up effect
       568 +
       569 +**Fișiere modificate:**
       570 +- `frontend/src/components/dashboard/CreativesGrid.tsx`
       571 +
       572 +#### Task 9.3: Filtrare Creatives
       573 +- [ ] **Subtask 9.3.1:** Afișare creatives pentru ads selectate
       574 +  - API call cu `ad_ids` filter
       575 +  - Sau afișare creative pentru fiecare ad selectat (câte unul per ad)
       576 +- [ ] **Subtask 9.3.2:** Backend query optimization
       577 +  - Select distinct creatives pentru ads selectate
       578 +  - Evitare duplicate dacă multiple ads folosesc același creative
       579 +
       580 +**Fișiere modificate:**
       581 +- `frontend/src/components/dashboard/CenterPanel.tsx`
       582 +- `backend/meta_ads/views.py` - endpoint creatives cu filtru
       583 +
       584 +#### Verificare Etapa 9
       585 +- [ ] Creatives se afișează ca grid de carduri (300px min-width)
       586 +- [ ] Fiecare card afișează: thumbnail imagine, name, ID, tip (badge)
       587 +- [ ] Imaginile se încarcă din URL-uri (lazy loading)
       588 +- [ ] Fallback icons pentru video/story
       589 +- [ ] Grid-ul este responsive (auto-fill)
       590 +- [ ] Se afișează câte un creative pentru fiecare ad selectat
       591 +
       592 +---
       593 +
       594 +### **ETAPA 10: Insights - Interfață Nouă Completă**
       595 +
       596 +**Scop:** Implementare completă a noii interfețe de insights cu 4 dropdowns, time range comparison, 7
           + metrici, 7 grafice.
       597 +
       598 +#### Task 10.1: Bară de Sus cu 4 Dropdowns
       599 +- [ ] **Subtask 10.1.1:** Creare component `InsightsFilters.tsx`
       600 +  - Layout: flex row, wrap pe mobile
       601 +  - 4 dropdowns: Ad Account, Campaign, Ad Set, Ad
       602 +  - 1 selector de time range (cel mai în dreapta)
       603 +- [ ] **Subtask 10.1.2:** Dropdown Ad Account
       604 +  - Multi-select dropdown (poate selecta multiple accounts)
       605 +  - Afișează doar accounts din businesses selectate
       606 +  - Folosire library (ex: react-select cu multi-select)
       607 +- [ ] **Subtask 10.1.3:** Dropdown Campaign
       608 +  - Multi-select
       609 +  - Afișează doar campaigns din accounts selectate
       610 +  - Disabled dacă nu e selectat niciun account
       611 +- [ ] **Subtask 10.1.4:** Dropdown Ad Set
       612 +  - Multi-select
       613 +  - Afișează doar ad sets din campaigns selectate
       614 +  - Disabled dacă nu e selectat campaign
       615 +- [ ] **Subtask 10.1.5:** Dropdown Ad
       616 +  - Multi-select
       617 +  - Afișează doar ads din ad sets selectate
       618 +  - Disabled dacă nu e selectat ad set
       619 +- [ ] **Subtask 10.1.6:** State management
       620 +  - State: `insightsFilters: { accounts: [], campaigns: [], adsets: [], ads: [], timeRange: {} }`
       621 +
       622 +**Fișiere modificate:**
       623 +- `frontend/src/components/dashboard/InsightsFilters.tsx` (NOU)
       624 +- `frontend/src/components/dashboard/InsightsView.tsx`
       625 +- `frontend/src/app/dashboard/page.tsx` (state management)
       626 +
       627 +**Dependencies:**
       628 +- Instalare `react-select` pentru multi-select dropdowns: `npm install react-select`
       629 +
       630 +#### Task 10.2: Time Range Selector cu Comparare
       631 +- [ ] **Subtask 10.2.1:** Creare component `TimeRangeSelector.tsx`
       632 +  - 2 date pickers: Start Date, End Date
       633 +  - Button: "Compare with another period" (toggle)
       634 +  - Când e activ compare mode, afișează încă 2 date pickers
       635 +- [ ] **Subtask 10.2.2:** Validare period length
       636 +  - Compare period trebuie să aibă aceeași lungime (zile) ca period principal
       637 +  - Calculare automată: dacă alegi start date pentru compare, end date se calculează automat
       638 +- [ ] **Subtask 10.2.3:** State management
       639 +  - State: `{ mainPeriod: { start, end }, comparePeriod: { start, end } | null }`
       640 +- [ ] **Subtask 10.2.4:** UI feedback
       641 +  - Afișare diferență în zile: "14 days selected"
       642 +  - Disable end date picker în compare mode (auto-calculated)
       643 +
       644 +**Fișiere modificate:**
       645 +- `frontend/src/components/dashboard/TimeRangeSelector.tsx` (NOU)
       646 +- `frontend/src/components/dashboard/InsightsFilters.tsx`
       647 +
       648 +**Dependencies:**
       649 +- Date picker library: `npm install react-datepicker` sau folosire HTML5 `<input type="date">`
       650 +
       651 +#### Task 10.3: Time Range Custom per Obiect
       652 +- [ ] **Subtask 10.3.1:** Adăugare buton "Custom Range" lângă fiecare dropdown
       653 +  - Mic icon (calendar) lângă fiecare account/campaign/ad set/ad selectat
       654 +- [ ] **Subtask 10.3.2:** Click pe icon deschide mini date picker
       655 +  - Permite selectare doar Start Date
       656 +  - End Date se calculează automat (aceeași lungime ca time range general)
       657 +  - Validare: nu permite range diferit de lungimea generală
       658 +- [ ] **Subtask 10.3.3:** State management
       659 +  - Extindere state: `insightsFilters.customRanges: { [entityId]: { start, end } }`
       660 +- [ ] **Subtask 10.3.4:** Visual indicator
       661 +  - Dacă un obiect are custom range, afișează badge/indicator lângă el
       662 +
       663 +**Fișiere modificate:**
       664 +- `frontend/src/components/dashboard/InsightsFilters.tsx`
       665 +- Component nou: `CustomRangePicker.tsx` (mini modal/popover)
       666 +
       667 +#### Task 10.4: 7 Carduri de Metrici cu Layout Specific
       668 +- [ ] **Subtask 10.4.1:** Creare component `MetricsCards.tsx`
       669 +  - Layout: 2 rânduri
       670 +    - Rând 1: 4 carduri (25% width fiecare)
       671 +    - Rând 2: 3 carduri (33.33% width fiecare, dar lățimea egală cu cele de pe rândul 1 - 25%)
       672 +  - CSS Grid: `grid-template-columns: repeat(4, 1fr)`
       673 +  - Rândul 2: primele 3 coloane ocupate, coloana 4 goală
       674 +- [ ] **Subtask 10.4.2:** Design card
       675 +  - Background: white, border, shadow
       676 +  - Icon (emoji), Label, Value
       677 +  - Hover effect: border color change
       678 +- [ ] **Subtask 10.4.3:** Cele 7 metrici
       679 +  1. Total Spend (💰)
       680 +  2. Impressions (👁️)
       681 +  3. Clicks (🖱️)
       682 +  4. Reach (📢)
       683 +  5. CTR (📈)
       684 +  6. CPC (💵)
       685 +  7. CPM (📊)
       686 +- [ ] **Subtask 10.4.4:** Calculare metrici din insights data
       687 +  - Agregare toate insights din selecțiile curente
       688 +  - Calculare: CTR = (clicks / impressions) * 100, CPC = spend / clicks, CPM = (spend / impressions)
           +* 1000
       689 +
       690 +**Fișiere modificate:**
       691 +- `frontend/src/components/dashboard/MetricsCards.tsx` (NOU)
       692 +- `frontend/src/components/dashboard/InsightsView.tsx`
       693 +
       694 +#### Task 10.5: Info Buttons pentru Metrici
       695 +- [ ] **Subtask 10.5.1:** Adăugare buton "i" (info) pe fiecare card
       696 +  - Icon mic în colțul de sus-dreapta al cardului
       697 +  - Culoare subtilă, hover effect
       698 +- [ ] **Subtask 10.5.2:** Tooltip cu explicație
       699 +  - Hover sau click pe "i" afișează tooltip cu explicație metrică
       700 +  - Explicații:
       701 +    - Total Spend: "Suma totală cheltuită în perioada selectată"
       702 +    - Impressions: "De câte ori au fost afișate anunțurile"
       703 +    - Clicks: "Numărul total de click-uri pe anunțuri"
       704 +    - Reach: "Numărul de persoane unice care au văzut anunțurile"
       705 +    - CTR: "Click-Through Rate - procentul de impresii care au generat click-uri"
       706 +    - CPC: "Cost Per Click - costul mediu per click"
       707 +    - CPM: "Cost Per Mille - costul per 1000 de impresii"
       708 +- [ ] **Subtask 10.5.3:** Folosire library tooltip
       709 +  - Opțiuni: Headless UI Tooltip, react-tooltip, sau CSS custom tooltip
       710 +
       711 +**Fișiere modificate:**
       712 +- `frontend/src/components/dashboard/MetricsCards.tsx`
       713 +
       714 +**Dependencies (opțional):**
       715 +- `npm install react-tooltip`
       716 +
       717 +#### Task 10.6: "Top" pentru Fiecare Metrică
       718 +- [ ] **Subtask 10.6.1:** Calculare top performer per metrică
       719 +  - Pentru fiecare metrică, găsește obiectul (account/campaign/ad set/ad) cu valoarea cea mai mare
       720 +  - Agregare pe baza selecțiilor și filtrelor
       721 +- [ ] **Subtask 10.6.2:** Afișare în card
       722 +  - Sub valoarea metrică, afișează:
       723 +    - Tip obiect (emoji icon: 📊 account, 🎯 campaign, 📢 ad set, 🎨 ad)
       724 +    - Nume obiect (truncated dacă e prea lung)
       725 +    - Valoare metrică pentru acel obiect
       726 +  - Exemplu: "🎯 Campaign: Summer Sale - $1,234.56"
       727 +- [ ] **Subtask 10.6.3:** Styling
       728 +  - Font size mic: 0.75rem
       729 +  - Color: gray-600
       730 +  - Badge cu background subtil pentru a evidenția "top performer"
       731 +
       732 +**Fișiere modificate:**
       733 +- `frontend/src/components/dashboard/MetricsCards.tsx`
       734 +- Helper functions pentru calculare top performers
       735 +
       736 +#### Task 10.7: 7 Grafice Comparative cu Recharts
       737 +- [ ] **Subtask 10.7.1:** Instalare Recharts
       738 +  - `npm install recharts`
       739 +- [ ] **Subtask 10.7.2:** Creare component `MetricsCharts.tsx`
       740 +  - Layout: vertical stack, fiecare grafic ocupă ~300-400px înălțime
       741 +  - 7 grafice (unul pentru fiecare metrică)
       742 +- [ ] **Subtask 10.7.3:** Configurare LineChart pentru fiecare metrică
       743 +  - X-axis: Date (zilele din time range)
       744 +  - Y-axis: Valoarea metrică
       745 +  - Multiple lines: câte o linie pentru fiecare obiect selectat (account/campaign/ad set/ad)
       746 +  - Legendă: culori diferite per linie, afișează numele obiectului
       747 +- [ ] **Subtask 10.7.4:** Date preparation
       748 +  - Group insights by date și entity
       749 +  - Pentru fiecare zi, calculează valoarea metrică pentru fiecare entity
       750 +  - Format: `[ { date: '2026-01-26', 'Campaign 1': 123, 'Campaign 2': 456 }, ... ]`
       751 +- [ ] **Subtask 10.7.5:** Suprapunere grafice (comparative mode)
       752 +  - Toate liniile pe același grafic (nu grafice separate per entity)
       753 +  - Color coding consistent cu legenda
       754 +- [ ] **Subtask 10.7.6:** Responsive charts
       755 +  - ResponsiveContainer pentru auto-resize
       756 +  - Tooltip cu informații detaliate la hover
       757 +- [ ] **Subtask 10.7.7:** Stilizare
       758 +  - Background: white
       759 +  - Grid lines: subtle gray
       760 +  - Culori linii: palette vibrant (blue, green, red, purple, orange, cyan, pink)
       761 +
       762 +**Fișiere modificate:**
       763 +- `frontend/src/components/dashboard/MetricsCharts.tsx` (NOU)
       764 +- `frontend/src/components/dashboard/InsightsView.tsx`
       765 +
       766 +#### Task 10.8: API Integration pentru Insights
       767 +- [ ] **Subtask 10.8.1:** Actualizare API call
       768 +  - Endpoint: `/api/meta/client/insights/`
       769 +  - Query params:
       770 +    - `account_ids[]`: array
       771 +    - `campaign_ids[]`: array
       772 +    - `adset_ids[]`: array
       773 +    - `ad_ids[]`: array
       774 +    - `start_date`, `end_date`
       775 +    - `compare_start_date`, `compare_end_date` (opțional)
       776 +    - `custom_ranges`: JSON object cu custom ranges per entity
       777 +- [ ] **Subtask 10.8.2:** Backend endpoint update
       778 +  - Acceptare parametri multiple
       779 +  - Filtrare insights pe baza selecțiilor
       780 +  - Return insights group by date și entity
       781 +- [ ] **Subtask 10.8.3:** Response processing
       782 +  - Agregare data pentru carduri de metrici
       783 +  - Prepare data pentru grafice (group by date)
       784 +
       785 +**Fișiere modificate:**
       786 +- `frontend/src/lib/api.ts`
       787 +- `frontend/src/components/dashboard/InsightsView.tsx`
       788 +
       789 +**Backend:**
       790 +- `backend/meta_ads/views.py` - endpoint `client_insights` cu filtru complex
       791 +- `backend/meta_ads/serializers.py`
       792 +
       793 +#### Task 10.9: Layout Final Insights View
       794 +- [ ] **Subtask 10.9.1:** Structură completă
       795 +  ```
       796 +  InsightsView:
       797 +    ├── InsightsFilters (4 dropdowns + time range)
       798 +    ├── MetricsCards (7 carduri în 2 rânduri)
       799 +    └── MetricsCharts (7 grafice)
       800 +  ```
       801 +- [ ] **Subtask 10.9.2:** Spacing și padding
       802 +  - Gap între secțiuni: 2rem
       803 +  - Padding container: 1.5rem
       804 +- [ ] **Subtask 10.9.3:** Loading states
       805 +  - Skeleton loaders pentru carduri și grafice când se încarcă data
       806 +- [ ] **Subtask 10.9.4:** Error handling
       807 +  - Mesaj clar dacă API call eșuează
       808 +  - Empty state dacă nu sunt insights pentru selecțiile curente
       809 +
       810 +**Fișiere modificate:**
       811 +- `frontend/src/components/dashboard/InsightsView.tsx` (restructurare completă)
       812 +
       813 +#### Verificare Etapa 10
       814 +- [ ] Bară de sus cu 4 dropdowns (Account, Campaign, Ad Set, Ad) funcționează
       815 +- [ ] Fiecare dropdown permite selecție multiplă
       816 +- [ ] Time range selector cu comparare perioade funcționează
       817 +- [ ] Time range custom per obiect funcționează (aceeași lungime ca general)
       818 +- [ ] 7 carduri de metrici afișate: 4 pe rândul 1, 3 pe rândul 2 (lățimi egale)
       819 +- [ ] Fiecare card are buton info cu tooltip explicativ
       820 +- [ ] Fiecare card afișează "top performer" pentru acea metrică
       821 +- [ ] 7 grafice Recharts afișate, unul pentru fiecare metrică
       822 +- [ ] Graficele sunt comparative (multiple linii suprapuse pentru obiecte diferite)
       823 +- [ ] Legenda afișează corect numele obiectelor și culori
       824 +- [ ] API integration funcționează cu filtru complex
       825 +- [ ] Loading states și error handling implementate
       826 +- [ ] Layout-ul este responsive și curat
       827 +
       828 +---
       829 +
       830 +### **ETAPA 11: Stil & Polish - Consistență UI**
       831 +
       832 +**Scop:** Asigurarea consistenței între light mode și dark mode, verificare limba română, spacing uni
           +form.
       833 +
       834 +#### Task 11.1: Consistență Light/Dark Mode
       835 +- [ ] **Subtask 11.1.1:** Audit complet UI în ambele mode-uri
       836 +  - Verificare toate componentele dashboard în light mode
       837 +  - Verificare toate componentele dashboard în dark mode (dacă există implementare)
       838 +- [ ] **Subtask 11.1.2:** Definire variabile CSS pentru culori
       839 +  - Creare CSS variables pentru culori principale
       840 +  - Aplicare variables în loc de hard-coded colors
       841 +  - Exemplu:
       842 +    ```css
       843 +    :root {
       844 +      --bg-primary: #ffffff;
       845 +      --bg-secondary: #f9fafb;
       846 +      --text-primary: #1f2937;
       847 +      --border-color: #e5e7eb;
       848 +    }
       849 +    [data-theme="dark"] {
       850 +      --bg-primary: #1f2937;
       851 +      --bg-secondary: #111827;
       852 +      --text-primary: #f9fafb;
       853 +      --border-color: #374151;
       854 +    }
       855 +    ```
       856 +- [ ] **Subtask 11.1.3:** Aplicare CSS variables
       857 +  - Înlocuire toate culorile hard-coded cu var(--color-name)
       858 +  - Test în ambele mode-uri
       859 +- [ ] **Subtask 11.1.4:** Theme toggle (opțional, dacă nu există)
       860 +  - Buton de switch între light/dark în header
       861 +  - Persistare preferință în localStorage
       862 +
       863 +**Fișiere modificate:**
       864 +- `frontend/src/app/globals.css`
       865 +- Toate componentele dashboard (înlocuire inline styles cu clase Tailwind sau CSS variables)
       866 +- `frontend/tailwind.config.ts` (eventual dark mode config)
       867 +
       868 +**Notă:** Conform MINDMAP, UI-ul actual este light mode only. Dacă dark mode nu e implementat, aceast
           +ă task înseamnă:
       869 +- Asigurare că stilul e consistent în light mode (font, spacing, etc.)
       870 +- Pregătire arhitectură pentru dark mode (variables) dar fără implementare completă
       871 +
       872 +#### Task 11.2: Verificare Limba Română
       873 +- [ ] **Subtask 11.2.1:** Audit toate textele din interfață
       874 +  - Verificare că toate label-urile, butoanele, mesajele sunt în română
       875 +  - Excepție: "ConversionDriven" (brand name)
       876 +- [ ] **Subtask 11.2.2:** Corectare eventuale texte în engleză
       877 +  - Exemple: "Loading..." → "Se încarcă..."
       878 +  - "No data available" → "Nu sunt date disponibile"
       879 +  - "Select an account" → "Selectează un cont"
       880 +- [ ] **Subtask 11.2.3:** Verificare consistență diacritice
       881 +  - Folosire corectă ă, â, î, ș, ț
       882 +
       883 +**Fișiere modificate:**
       884 +- Toate componentele dashboard
       885 +- Toate componentele landing
       886 +- Login page
       887 +
       888 +#### Task 11.3: Spacing și Alignment Uniform
       889 +- [ ] **Subtask 11.3.1:** Definire spacing scale
       890 +  - Folosire Tailwind spacing scale consistent (0.5rem increments)
       891 +  - Gap între carduri: 1rem sau 1.5rem
       892 +  - Padding container: 1rem sau 1.5rem
       893 +- [ ] **Subtask 11.3.2:** Verificare alignment
       894 +  - Text alignment: left pentru conținut, center pentru titluri dacă e cazul
       895 +  - Flex alignment: consistent în toate componentele
       896 +- [ ] **Subtask 11.3.3:** Verificare responsive spacing
       897 +  - Spacing mai mic pe mobile
       898 +  - Spacing normal pe desktop
       899 +
       900 +**Fișiere modificate:**
       901 +- Toate componentele (verificare și ajustare)
       902 +
       903 +#### Verificare Etapa 11
       904 +- [ ] Light mode și dark mode au același stil (font, spacing, layout) - doar culori diferite
       905 +- [ ] Toate textele din interfață sunt în limba română (excepție: ConversionDriven)
       906 +- [ ] Diacriticele sunt folosite corect
       907 +- [ ] Spacing-ul este uniform în toată aplicația
       908 +- [ ] Nu există diferențe vizuale neintenționat între secțiuni
       909 +
       910 +---
       911 +
       912 +### **ETAPA 12: Testing & Production Readiness**
       913 +
       914 +**Scop:** Testing complet, bug fixes, actualizare documentație.
       915 +
       916 +#### Task 12.1: Testing Complet End-to-End
       917 +- [ ] **Subtask 12.1.1:** Landing page testing
       918 +  - Desktop (1920px, 1366px, 1024px)
       919 +  - Tablet (768px)
       920 +  - Mobile (375px, 414px)
       921 +  - Verificare efecte vizuale (profunzime, animații)
       922 +  - Verificare performanță (60fps)
       923 +- [ ] **Subtask 12.1.2:** Login page testing
       924 +  - Responsive pe toate dimensiunile
       925 +  - Flow complet: login → redirect dashboard
       926 +- [ ] **Subtask 12.1.3:** Dashboard testing
       927 +  - Business selection → filtrare ad accounts
       928 +  - Ad account selection → campaigns load
       929 +  - Campaign selection → ad sets load (doar din campaigns selectate)
       930 +  - Ad set selection → ads load (doar din ad sets selectate)
       931 +  - Ad selection → creatives load
       932 +  - Insights:
       933 +    - 4 dropdowns funcționează
       934 +    - Time range selection
       935 +    - Time range comparison
       936 +    - Custom range per obiect
       937 +    - 7 carduri de metrici calculate corect
       938 +    - Top performers afișați corect
       939 +    - 7 grafice Recharts afișează date corecte
       940 +- [ ] **Subtask 12.1.4:** Cross-browser testing
       941 +  - Chrome, Firefox, Safari, Edge
       942 +  - Verificare compatibilitate CSS
       943 +- [ ] **Subtask 12.1.5:** Performance testing
       944 +  - Lighthouse score > 90 pentru landing
       945 +  - Dashboard load time < 2s
       946 +  - Smooth scrolling (60fps)
       947 +
       948 +**Checklist de test:**
       949 +- [ ] Landing page: profunzime vizuală, buton Descoperă, responsive
       950 +- [ ] Login: responsive, redirect corect
       951 +- [ ] Dashboard layout: 10% + 5% + 85%, panele 12.5% + 75% + 12.5%
       952 +- [ ] Business dropdown: selecție multiplă, filtrare ad accounts
       953 +- [ ] Ad accounts: time zone, text wrapping
       954 +- [ ] Campaigns: checkboxes, hover info, selecție persistentă
       955 +- [ ] Ad sets: checkboxes, budgets, time, filtrare pe campaigns
       956 +- [ ] Ads: checkboxes, creative info, filtrare pe ad sets
       957 +- [ ] Creatives: grid, imagini din URL
       958 +- [ ] Insights: toate features (dropdowns, time range, metrici, grafice)
       959 +- [ ] Stil: consistent, română, spacing uniform
       960 +- [ ] Scroll: fără bare vizibile
       961 +
       962 +#### Task 12.2: Bug Fixes
       963 +- [ ] **Subtask 12.2.1:** Crearea unei liste de bug-uri găsite în testing
       964 +  - Documentare în fișier `BUGS.md` temporar
       965 +- [ ] **Subtask 12.2.2:** Prioritizare bug-uri
       966 +  - Critical (blockers), High, Medium, Low
       967 +- [ ] **Subtask 12.2.3:** Rezolvare bug-uri Critical și High
       968 +  - Fix-uri cu test pentru fiecare
       969 +- [ ] **Subtask 12.2.4:** Verificare Medium și Low
       970 +  - Rezolvare dacă timpul permite
       971 +  - Defer pentru viitor dacă nu sunt critice
       972 +
       973 +**Procesul de bug fixing:**
       974 +1. Reproducere bug
       975 +2. Identificare cauză
       976 +3. Implementare fix
       977 +4. Test fix
       978 +5. Mark ca rezolvat în listă
       979 +
       980 +#### Task 12.3: Actualizare MINDMAP.md
       981 +- [ ] **Subtask 12.3.1:** Documentare landing page changes
       982 +  - Secțiune nouă sau actualizare secțiunea 5 (Landing Page Structure)
       983 +  - Descriere efecte vizuale noi
       984 +  - Screenshot-uri actualizate (opțional)
       985 +- [ ] **Subtask 12.3.2:** Documentare dashboard changes
       986 +  - Actualizare secțiunea 7 (Client Dashboard Flows)
       987 +  - Descriere layout nou (3 părți, 3 panele)
       988 +  - Descriere business selection
       989 +  - Descriere sistem de selecție campaigns/ad sets/ads
       990 +  - Documentare insights nou (4 dropdowns, time range, metrici, grafice)
       991 +- [ ] **Subtask 12.3.3:** Actualizare API endpoints (dacă sunt noi)
       992 +  - Secțiunea 9 (API Endpoints Reference)
       993 +  - Noi endpoints sau parametri pentru insights
       994 +- [ ] **Subtask 12.3.4:** Actualizare changelog
       995 +  - Adăugare secțiune nouă în Changelog cu data și modificări
       996 +  - Format similar cu "January 26, 2026 - ConversionDriven Landing & Login Redesign"
       997 +
       998 +**Fișiere modificate:**
       999 +- `MINDMAP.md`
      1000 +
      1001 +#### Task 12.4: Code Cleanup
      1002 +- [ ] **Subtask 12.4.1:** Remove commented code
      1003 +  - Ștergere cod comentat vechi
      1004 +- [ ] **Subtask 12.4.2:** Remove console.logs
      1005 +  - Ștergere console.log pentru debug (păstrare doar logging important)
      1006 +- [ ] **Subtask 12.4.3:** Formatting
      1007 +  - Prettier pass pe toate fișierele
      1008 +- [ ] **Subtask 12.4.4:** Verificare dependencies
      1009 +  - Remove unused dependencies din package.json
      1010 +
      1011 +#### Verificare Etapa 12
      1012 +- [ ] Toate feature-urile testate end-to-end funcționează corect
      1013 +- [ ] Nu există bug-uri Critical sau High nerezolvate
      1014 +- [ ] Cross-browser compatibility verificată
      1015 +- [ ] Performance acceptabilă (Lighthouse > 90, load time < 2s)
      1016 +- [ ] MINDMAP.md actualizat cu toate modificările
      1017 +- [ ] Cod curat (no commented code, no console.logs)
      1018 +- [ ] Ready for production deployment
      1019 +
      1020 +---
      1021 +
      1022 +## 📊 STATUS TRACKING
      1023 +
      1024 +### Currently Working On
      1025 +
      1026 +**Etapa actuală:** _Nicio etapă în lucru_
      1027 +**Task actual:** _Niciun task în lucru_
      1028 +**Status:** _Așteptare aprobare plan_
      1029 +
      1030 +### Last Completed Task
      1031 +
      1032 +**Task:** _Plan tehnic creat_
      1033 +**Data:** 2026-01-26
      1034 +**Note:** Plan detaliat pe 12 etape, 100+ task-uri
      1035 +
      1036 +### Progress Overview
      1037 +
      1038 +| Etapa | Status | Tasks Completate | Tasks Total | Note |
      1039 +|-------|--------|------------------|-------------|------|
      1040 +| 1. Landing Page Profunzime | ⏸️ Pending | 0 | 9 | - |
      1041 +| 2. Responsive Landing/Login | ⏸️ Pending | 0 | 13 | - |
      1042 +| 3. Dashboard Layout | ⏸️ Pending | 0 | 15 | - |
      1043 +| 4. Header & Business | ⏸️ Pending | 0 | 9 | - |
      1044 +| 5. Ad Accounts | ⏸️ Pending | 0 | 5 | - |
      1045 +| 6. Campaigns Selecție | ⏸️ Pending | 0 | 9 | - |
      1046 +| 7. Ad Sets Selecție | ⏸️ Pending | 0 | 9 | - |
      1047 +| 8. Ads Selecție | ⏸️ Pending | 0 | 8 | - |
      1048 +| 9. Creatives Grid | ⏸️ Pending | 0 | 6 | - |
      1049 +| 10. Insights Nou | ⏸️ Pending | 0 | 27 | Cea mai complexă etapă |
      1050 +| 11. Stil & Polish | ⏸️ Pending | 0 | 9 | - |
      1051 +| 12. Testing & Prod | ⏸️ Pending | 0 | 13 | - |
      1052 +
      1053 +**Total Progress:** 0 / 132 tasks (0%)
      1054 +
      1055 +---
      1056 +
      1057 +## 🐛 FEEDBACK & ISSUES
      1058 +
      1059 +### Production Feedback
      1060 +
      1061 +_Această secțiune se va completa după deployment în producție și testare de către utilizatori._
      1062 +
      1063 +**Status:** ⏸️ Așteptare deployment
      1064 +
      1065 +### Known Issues
      1066 +
      1067 +_Listă de probleme cunoscute care nu blochează deployment-ul dar trebuie rezolvate._
      1068 +
      1069 +| ID | Descriere | Prioritate | Status | Assigned To | Note |
      1070 +|----|-----------|------------|--------|-------------|------|
      1071 +| - | - | - | - | - | _No issues yet_ |
      1072 +
      1073 +### Feedback Actions
      1074 +
      1075 +_Acțiuni de luat pe baza feedback-ului din producție._
      1076 +
      1077 +| Feedback | Acțiune | Status | Note |
      1078 +|----------|---------|--------|------|
      1079 +| - | - | - | _Waiting for feedback_ |
      1080 +
      1081 +---
      1082 +
      1083 +## ✅ FINALIZARE
      1084 +
      1085 +### Checklist Final
      1086 +
      1087 +- [ ] **Toate etapele 1-12 completate**
      1088 +- [ ] **Toate verificările de etapă passed**
      1089 +- [ ] **Testing complet efectuat**
      1090 +- [ ] **Bug-uri critice rezolvate**
      1091 +- [ ] **MINDMAP.md actualizat**
      1092 +- [ ] **Code review efectuat**
      1093 +- [ ] **Production deployment success**
      1094 +- [ ] **User feedback pozitiv**
      1095 +
      1096 +### Deployment
      1097 +
      1098 +**Environment:** Production
      1099 +**URL:** _TBD_
      1100 +**Data deployment:** _TBD_
      1101 +**Status:** ⏸️ Not deployed yet
      1102 +
      1103 +### Sign-off
      1104 +
      1105 +**Developer:** Claude Sonnet 4.5
      1106 +**Product Owner:** Andrei Balan
      1107 +**Approval Status:** ⏸️ Pending approval
      1108 +
      1109 +---
      1110 +
      1111 +## 📝 NOTIȚE TEHNICE
      1112 +
      1113 +### Dependencies Noi Necesare
      1114 +
      1115 +**Frontend:**
      1116 +```bash
      1117 +npm install react-select          # Multi-select dropdowns (Insights)
      1118 +npm install recharts              # Grafice pentru metrici
      1119 +npm install react-datepicker      # Date pickers pentru time range
      1120 +npm install react-tooltip         # Tooltip-uri pentru info buttons (opțional)
      1121 +```
      1122 +
      1123 +**Backend:**
      1124 +- Nicio dependență nouă necesară (folosim Django, DRF, PostgreSQL existent)
      1125 +
      1126 +### Estimări de Timp (orientativ)
      1127 +
      1128 +| Etapa | Complexitate | Timp Estimat | Note |
      1129 +|-------|--------------|--------------|------|
      1130 +| 1. Landing Profunzime | Medium | 4-6h | Animații, efecte vizuale |
      1131 +| 2. Responsive | Low | 3-4h | CSS responsive standard |
      1132 +| 3. Dashboard Layout | High | 6-8h | Restructurare complexă |
      1133 +| 4. Business Selection | Medium | 4-5h | Dropdown + API integration |
      1134 +| 5. Ad Accounts | Low | 2-3h | Display changes simplu |
      1135 +| 6. Campaigns | Medium | 4-5h | Checkboxes + state management |
      1136 +| 7. Ad Sets | Medium | 4-5h | Similar cu campaigns |
      1137 +| 8. Ads | Medium | 3-4h | Similar cu ad sets |
      1138 +| 9. Creatives | Low | 2-3h | Grid layout simplu |
      1139 +| 10. Insights | Very High | 12-16h | Cea mai complexă (dropdowns, time range, metrici, grafice) |
      1140 +| 11. Stil & Polish | Medium | 4-6h | Consistență UI |
      1141 +| 12. Testing | High | 8-10h | Testing complet + bug fixes |
      1142 +| **TOTAL** | - | **56-75h** | ~7-10 zile lucru full-time |
      1143 +
      1144 +### Fișiere Cheie
      1145 +
      1146 +**Frontend - Noi:**
      1147 +- `frontend/src/components/landing/DepthBackground.tsx`
      1148 +- `frontend/src/components/dashboard/MetaUserBadge.tsx`
      1149 +- `frontend/src/components/dashboard/BusinessDropdown.tsx`
      1150 +- `frontend/src/components/dashboard/InsightsFilters.tsx`
      1151 +- `frontend/src/components/dashboard/TimeRangeSelector.tsx`
      1152 +- `frontend/src/components/dashboard/CustomRangePicker.tsx`
      1153 +- `frontend/src/components/dashboard/MetricsCards.tsx`
      1154 +- `frontend/src/components/dashboard/MetricsCharts.tsx`
      1155 +
      1156 +**Frontend - Modificări Majore:**
      1157 +- `frontend/src/app/dashboard/page.tsx` (restructurare layout)
      1158 +- `frontend/src/components/landing/HeroSection.tsx` (efecte vizuale)
      1159 +- `frontend/src/components/dashboard/InsightsView.tsx` (restructurare completă)
      1160 +- `frontend/src/components/dashboard/LeftPanel.tsx` (layout changes)
      1161 +- `frontend/src/components/dashboard/CenterPanel.tsx` (layout changes)
      1162 +- `frontend/src/components/dashboard/RightPanel.tsx` (layout changes)
      1163 +- `frontend/src/components/dashboard/CampaignsTable.tsx` (checkboxes)
      1164 +- `frontend/src/components/dashboard/AdSetsTable.tsx` (checkboxes, info)
      1165 +- `frontend/src/components/dashboard/AdsTable.tsx` (checkboxes, creative info)
      1166 +
      1167 +**Backend - Modificări:**
      1168 +- `backend/meta_ads/views.py` (endpoints cu filtre complexe)
      1169 +- `backend/meta_ads/serializers.py` (eventual noi câmpuri)
      1170 +
      1171 +**Stiluri:**
      1172 +- `frontend/src/app/globals.css` (animații, scrollbar hidden, CSS variables)
      1173 +- `frontend/tailwind.config.ts` (eventual noi keyframes)
      1174 +
      1175 +---
      1176 +
      1177 +**IMPORTANT:** Acest plan este un document viu. Pe măsură ce implementăm, pot apărea:
      1178 +- Modificări necesare (probleme tehnice, cerințe noi)
      1179 +- Task-uri adiționale (edge cases descoperite)
      1180 +- Optimizări (soluții mai bune găsite)
      1181 +
      1182 +Fiecare modificare va fi documentată în secțiunea relevantă.
      1183 +
      1184 +---
      1185 +
      1186 +_Plan creat: 2026-01-26_
      1187 +_Ultima actualizare: 2026-01-26_
      1188 +_Versiune: 1.0_
