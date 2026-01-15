## 1. Prezentare generală

- Nume aplicație: **SmartMoney** (S și M legate)
- Tip: **Aplicație web**
- Domeniu: **va fi cumpărat în viitor, momentan irelevant**
- Stadiu: **development**
- Obiectiv: structură solidă, simplă, scalabilă, production-ready

---

## 2. Stack & infrastructură

- **Frontend**: Next.js
    - Hostare: Vercel
- **Backend**: Django + Django REST Framework
    - Hostare: Render
- **Database**: PostgreSQL
    - Hostare: Render
- **Integrări externe**:
    - Meta (Meta Ads) — **implementat**
    - Google Ads — **nefuncțional momentan**
    - Google Analytics 4 — **nefuncțional momentan**

---

## 3. Design & UI/UX

- **3-way responsive**:
    - Telefon
    - Tabletă
    - Laptop / calculator
- Interfață:
    - foarte simplă
    - minimală
    - rapidă
    - cât mai puține linii de cod
- Focus: structură funcțională, ușor de scalat

---

## 4. Landing Page

- Prima pagină accesată la deschiderea link-ului
- **Pagină statică**, încărcare foarte rapidă
- Conținut:
    - Text mare, centrat: **Smart Money**
    - Două butoane:
        - **Connect as Client**
        - **Connect as Agency**
- Nimic altceva
- Stil:
    - simplu
    - catchy
    - drăguț
    - minimal
- Butoanele redirecționează către:
    - paginile de login / sign-up corespunzătoare

---

## 5. Autentificare & conturi

### 5.1 Client

- **Doar login**
- Input-uri:
    - username
    - parolă
- Buton:
    - sign-in
- **Nu există sign-up**
- Contul este creat exclusiv de agenție

---

### 5.2 Agency

### Sign-up

- Opțiuni:
    - username + parolă + sign-up
    - conectare cu Google

### Login

- Opțiuni:
    - username + parolă + login
    - conectare cu Google
- Interfață:
    - input-uri și butoane simple
    - fără elemente inutile

---

## 6. Dashboard Agency

### Funcționalități generale

- Dashboard accesibil doar după autentificare
- Buton vizibil de **logout**

---

### Conectări platforme

- 3 butoane:
    - Meta Ads
    - Google Ads
    - Google Analytics 4
- Comportament:
    - redirecționare
    - autentificare
    - salvare token
- Stare actuală:
    - **doar Meta Ads este implementat**
    - Google Ads și GA4 sunt complet nefuncționale

---

### Management clienți

- Listă de conturi (clienți) create
- Buton: **Create account**
- Creare cont client:
    - username
    - parolă
    - permisiuni:
        - **doar ad accounts din Meta**
- Context:
    - agenția oferă acces doar la anumite ad accounts din Meta
    - Google Ads și GA4 nu sunt implicate aici

---

## 7. Dashboard Client

- Dashboard după login ca client
- Opțiuni vizibile:
    - Meta
    - Google Ads
    - Google Analytics
- Stare actuală:
    - **doar Meta este implementat**
    - celelalte sunt nefuncționale
- Funcționalitate:
    - cerere date din baza de date
    - afișare date pe ecran
- Obiectiv:
    - extragerea cât mai multor date
    - nu contează exact ce date
    - important este să funcționeze
    - validare că datele sunt corecte

---

## 8. Date & sincronizare

### Stare inițială

- Se extrag date din Meta
- Se salvează în baza de date
- Se afișează în dashboard

---

### Background worker / Pentru inceput se va implementa un buton in agency dashboard care sa faca sync data la cerere

- Rulare pe Render
- Cron scheduler
- Rol:
    - extrage constant date din:
        - Meta
        - Google (în viitor)
    - actualizează baza de date

---

## 9. Ordinea etapelor de lucru

1. Landing page
2. Pagini login / sign-up (client & agency)
3. Dashboard agency
4. Dashboard client
5. Implementare cron worker
6. Background worker
7. Backend:
    - backend-for-frontend
    - Django backend
    - apeluri:
        - sign-in
        - sign-up
        - connect (Meta / Google)
        - extragere date
        - conturi create
        - date din accounts

---

## 10. Cerințe de calitate

- Senior level
- Production ready
- Practici bune:
    - metrics
    - logging
    - error handling
    - convenții de sintaxă
    - modularizare
- Totul:
    - mega simplu
    - super scurt
    - pregătit pentru evoluție ulterioară0