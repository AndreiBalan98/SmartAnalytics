# 🔐 OAuth Refactoring Guide - Complete Implementation

Acest document descrie implementarea completă a sistemului de autentificare OAuth pentru Meta, Google Ads și GA4.

---

## 📋 Cuprins

1. [Structura Generală](#structura-generală)
2. [Setup Database](#setup-database)
3. [Setup Backend](#setup-backend)
4. [Setup Frontend](#setup-frontend)
5. [Testare Flow OAuth](#testare-flow-oauth)
6. [Troubleshooting](#troubleshooting)

---

## 🏗️ Structura Generală

### Arhitectura Noului Sistem OAuth

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Frontend      │         │   Backend       │         │   OAuth         │
│   (Next.js)     │◄───────►│   (Django)      │◄───────►│   Provider      │
│                 │         │                 │         │   (Meta/Google) │
└─────────────────┘         └─────────────────┘         └─────────────────┘
        │                           │
        │                           │
        ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│  oauth.ts       │         │ oauth_service.py│
│  - connectMeta  │         │ - generate_url  │
│  - connectGA    │         │ - exchange_code │
│  - connectGA4   │         │ - save_tokens   │
└─────────────────┘         └─────────────────┘
```

### Fluxul OAuth (Exemplu Meta)

```
1. User click "Connect Meta"
   ↓
2. Frontend: connectMeta() → GET /api/integrations/oauth/meta/start/
   ↓
3. Backend: generate_meta_oauth_url() → returneaza URL + state
   ↓
4. Frontend: deschide pop-up cu URL-ul OAuth
   ↓
5. User se autentifica pe Meta
   ↓
6. Meta redirecteaza la: /api/integrations/oauth/meta/callback/?code=XXX&state=YYY&user_id=ZZZ
   ↓
7. Backend: verify_state() → meta_exchange_code() → salveaza MetaToken
   ↓
8. Backend: returneaza HTML cu postMessage
   ↓
9. Frontend: primeste postMessage → inchide pop-up → refresh status
```

---

## 💾 Setup Database

### Pasul 1: Rulează Scriptul SQL

**Locație:** `backend/sql/create_oauth_tables.sql`

**Cum să rulezi:**

1. Deschide pgAdmin
2. Conectează-te la baza de date `smart_analytics` (sau numele bazei tale)
3. Click dreapta pe database → **Query Tool**
4. Deschide fișierul `create_oauth_tables.sql`
5. Rulează scriptul (F5 sau click pe ⚡ Execute)

**Rezultat:** Vor fi create următoarele tabele:
- `oauth_states` - Salvează state-uri OAuth pentru verificare
- `meta_tokens` - Token-uri Meta (user-based)
- `google_tokens` - Token-uri Google Ads (user-based)
- `ga4_tokens` - Token-uri GA4 (user-based)

### Pasul 2: Verifică Tabelele

```sql
-- Verifică că tabelele au fost create
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('oauth_states', 'meta_tokens', 'google_tokens', 'ga4_tokens');

-- Verifică structura
\d oauth_states
\d meta_tokens
\d google_tokens
\d ga4_tokens
```

---

## 🔧 Setup Backend

### Pasul 1: Rulează Django Migrations

```bash
cd backend

# Verifică că migration-ul există
python manage.py showmigrations integrations

# Rulează migration-ul
python manage.py migrate integrations 0004_add_oauth_models

# Verifică că toate migration-urile sunt aplicate
python manage.py showmigrations
```

### Pasul 2: Verifică Variabilele de Mediu

**Fișier:** `backend/.env`

```bash
# Meta OAuth
META_APP_ID=861380786625947
META_APP_SECRET=dac2f003f6d5a1f7d50f9f6d1c22577c
META_REDIRECT_URI=http://localhost:3000/oauth/meta/callback

# Google OAuth (completează cu valorile tale)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth/google-ads/callback

# Frontend URL (pentru CORS și postMessage)
FRONTEND_URL=http://localhost:3000
```

⚠️ **IMPORTANT:** Dacă nu ai `GOOGLE_CLIENT_ID` și `GOOGLE_CLIENT_SECRET`, obține-le din [Google Cloud Console](https://console.cloud.google.com/).

### Pasul 3: Configurează Redirect URIs în OAuth Apps

#### Meta (Facebook) App:
1. Mergi la [Facebook Developers](https://developers.facebook.com/apps/)
2. Selectează app-ul tău (App ID: 861380786625947)
3. Settings → Basic → Add Platform → Website
4. Adaugă Redirect URI:
   - `http://localhost:3000/oauth/meta/callback`
   - `https://app.conversion-driven.com/oauth/meta/callback` (production)

#### Google Cloud Console:
1. Mergi la [Google Cloud Console](https://console.cloud.google.com/)
2. Credentials → OAuth 2.0 Client IDs
3. Authorized redirect URIs:
   - `http://localhost:3000/oauth/google-ads/callback`
   - `http://localhost:3000/oauth/ga4/callback`
   - `https://app.conversion-driven.com/oauth/google-ads/callback` (production)
   - `https://app.conversion-driven.com/oauth/ga4/callback` (production)

### Pasul 4: Testează Endpoint-urile Backend

```bash
# Pornește server-ul Django
python manage.py runserver

# În alt terminal, testează endpoint-urile
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8000/api/integrations/oauth/status/

# Expected output:
# {
#   "user_id": 1,
#   "user_email": "user@example.com",
#   "oauth_connections": {
#     "meta": {"connected": false},
#     "google_ads": {"connected": false},
#     "ga4": {"connected": false}
#   }
# }
```

---

## 🎨 Setup Frontend

### Pasul 1: Verifică Variabilele de Mediu

**Fișier:** `frontend/.env.local`

```bash
# API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Meta OAuth (doar pentru referință, nu sunt folosite direct în frontend)
META_APP_ID=861380786625947
META_REDIRECT_URI=http://localhost:3000/api/meta/callback
```

### Pasul 2: Instalează Dependențele

```bash
cd frontend
npm install
```

### Pasul 3: Pornește Frontend-ul

```bash
npm run dev
```

### Pasul 4: Verifică că Fișierele Sunt În Locul Corect

```
frontend/src/
├── lib/
│   ├── oauth.ts            ✅ (NOU - funcții OAuth)
│   ├── auth.ts             ✅ (existent)
│   └── api.ts              ✅ (existent)
└── app/
    └── agency/
        └── dashboard/
            └── page.tsx    ✅ (actualizat cu noile funcții)
```

---

## 🧪 Testare Flow OAuth

### Test 1: Meta OAuth

1. **Login ca Agency User:**
   - Mergi la `http://localhost:3000/login`
   - Loghează-te cu un cont de tip "agency"

2. **Accesează Dashboard:**
   - Mergi la `http://localhost:3000/agency/dashboard`
   - Ar trebui să vezi cele 3 carduri: Meta, Google Ads, GA4

3. **Connect Meta:**
   - Click pe "Connect Meta"
   - Se deschide un pop-up cu Facebook OAuth
   - Loghează-te cu un cont Facebook care are access la Facebook Business Manager
   - Apasă "Continue" pentru a autoriza app-ul
   - Pop-up-ul se închide automat
   - Dashboard-ul se actualizează → cardul Meta afișează "✅ Connected" + numele tău

4. **Verifică în Database:**
   ```sql
   SELECT * FROM meta_tokens;
   -- Ar trebui să vezi un token salvat pentru user-ul tău
   ```

5. **Testează Reconnect:**
   - Click pe "Reconnect" pe cardul Meta
   - Flow-ul OAuth se repetă

### Test 2: Google Ads OAuth

1. **Connect Google Ads:**
   - Click pe "Connect Google Ads"
   - Se deschide un pop-up cu Google OAuth
   - Selectează contul Google
   - Acceptă permisiunile pentru Google Ads API
   - Pop-up-ul se închide automat
   - Dashboard-ul se actualizează → cardul Google Ads afișează "✅ Connected" + email-ul tău

2. **Verifică în Database:**
   ```sql
   SELECT * FROM google_tokens;
   -- Ar trebui să vezi access_token și refresh_token
   ```

### Test 3: GA4 OAuth

1. **Connect GA4:**
   - Click pe "Connect GA4"
   - Flow similar cu Google Ads, dar cu scope-uri diferite (analytics.readonly)

2. **Verifică în Database:**
   ```sql
   SELECT * FROM ga4_tokens;
   ```

### Test 4: OAuth Status Endpoint

**În Browser Console:**

```javascript
// Obține statusul OAuth
const response = await fetch('http://localhost:8000/api/integrations/oauth/status/', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  }
});

const data = await response.json();
console.log(data);

// Expected output:
// {
//   "user_id": 1,
//   "user_email": "agency@example.com",
//   "oauth_connections": {
//     "meta": {
//       "connected": true,
//       "name": "John Doe",
//       "meta_user_id": "123456789",
//       "expires_at": "2026-04-10T12:00:00Z",
//       "is_expired": false
//     },
//     "google_ads": {
//       "connected": true,
//       "name": "John Doe",
//       "user_openid": "1234567890",
//       "expires_at": "2026-02-09T13:00:00Z",
//       "is_expired": false
//     },
//     "ga4": {
//       "connected": false
//     }
//   }
// }
```

---

## 🔍 Troubleshooting

### Problema 1: Pop-up-ul nu se deschide

**Cauză:** Browser-ul blochează pop-up-urile.

**Soluție:**
1. Verifică că ai permis pop-up-uri pentru `localhost:3000`
2. În Chrome: Settings → Privacy and Security → Site Settings → Pop-ups and redirects → Allow

### Problema 2: "Invalid state" error

**Cauză:** State-ul OAuth a expirat (10 minute TTL).

**Soluție:**
1. Încearcă din nou flow-ul OAuth
2. Verifică în database:
   ```sql
   SELECT * FROM oauth_states WHERE expires_at > NOW();
   -- Șterge state-urile expirate:
   DELETE FROM oauth_states WHERE expires_at < NOW();
   ```

### Problema 3: "User not found" error

**Cauză:** `user_id` nu este transmis corect în callback URL.

**Soluție:**
1. Verifică că funcția `getUserIdFromToken()` din `oauth.ts` funcționează:
   ```javascript
   // În console:
   const token = localStorage.getItem('access_token');
   const payload = JSON.parse(atob(token.split('.')[1]));
   console.log('User ID:', payload.user_id || payload.sub);
   ```

### Problema 4: CORS errors

**Cauză:** Frontend URL nu este în `CORS_ALLOWED_ORIGINS`.

**Soluție:**
1. Verifică `backend/config/settings.py`:
   ```python
   CORS_ALLOWED_ORIGINS = [
       'http://localhost:3000',
       # Adaugă alte URL-uri aici
   ]
   CORS_ALLOW_CREDENTIALS = True
   ```

### Problema 5: Meta/Google returns "redirect_uri_mismatch"

**Cauză:** Redirect URI din cod nu se potrivește cu cel configurat în OAuth app.

**Soluție:**
1. **Meta:** Verifică că `META_REDIRECT_URI` din `.env` se potrivește cu cel din Facebook App Settings
2. **Google:** Verifică că redirect URI-urile din Google Cloud Console includ toate URL-urile folosite

### Problema 6: No refresh_token pentru Google

**Cauză:** User-ul a mai autorizat app-ul înainte, Google nu mai returnează refresh token.

**Soluție:**
1. Revocă accesul anterior: https://myaccount.google.com/permissions
2. Încearcă din nou flow-ul OAuth
3. Alternativ, forțează `prompt=consent` (deja implementat în cod)

### Problema 7: Token expiry issues

**Verifică token expiry:**
```sql
-- Meta tokens (60 zile)
SELECT user_id, name, expiry_date,
       expiry_date - NOW() as time_remaining
FROM meta_tokens;

-- Google tokens (1 oră access token, refresh token permanent)
SELECT user_id, name, expiry_date,
       expiry_date - NOW() as time_remaining
FROM google_tokens;
```

**Refresh token automat (TODO):**
- Pentru Meta: Exchange pentru long-lived token (deja implementat)
- Pentru Google: Implementează refresh token flow cu `refresh_token` stocat

---

## 📊 Monitoring și Logging

### Backend Logs

```bash
# În terminal Django, vei vedea log-uri detaliate:
🔐 META OAUTH: Starting token exchange for user@example.com
Step 1: Exchanging code for short-lived token...
✅ Short-lived token obtained
Step 2: Exchanging for long-lived token...
✅ Long-lived token obtained (expires in 60 days)
Step 3: Fetching user info...
✅ User info: John Doe (ID: 123456789)
Step 4: Saving token to database...
✅ Created MetaToken for user@example.com
```

### Frontend Logs

```javascript
// În Browser Console:
console.log('Connecting to Meta...');
// Meta OAuth error: ... (dacă există erori)
// Meta connected successfully! (dacă reușește)
```

### Database Audit

```sql
-- Verifică câți useri au token-uri active
SELECT
  (SELECT COUNT(*) FROM meta_tokens WHERE expiry_date > NOW()) as active_meta,
  (SELECT COUNT(*) FROM google_tokens WHERE expiry_date > NOW()) as active_google,
  (SELECT COUNT(*) FROM ga4_tokens WHERE expiry_date > NOW()) as active_ga4;

-- Verifică utilizatorii cu token-uri expirate
SELECT u.email, 'Meta' as platform, mt.expiry_date
FROM users_user u
JOIN meta_tokens mt ON u.id = mt.user_id
WHERE mt.expiry_date < NOW()
UNION ALL
SELECT u.email, 'Google Ads', gt.expiry_date
FROM users_user u
JOIN google_tokens gt ON u.id = gt.user_id
WHERE gt.expiry_date < NOW()
UNION ALL
SELECT u.email, 'GA4', g4t.expiry_date
FROM users_user u
JOIN ga4_tokens g4t ON u.id = g4t.user_id
WHERE g4t.expiry_date < NOW();
```

---

## ✅ Checklist Final

### Backend:
- [ ] Scriptul SQL rulat cu succes
- [ ] Migration Django aplicat
- [ ] Variabile de mediu configurate (`.env`)
- [ ] Redirect URIs configurate în Facebook/Google
- [ ] Server Django pornit pe `localhost:8000`
- [ ] Endpoint `/api/integrations/oauth/status/` funcționează

### Frontend:
- [ ] Dependențe instalate (`npm install`)
- [ ] Variabile de mediu configurate (`.env.local`)
- [ ] Fișierul `oauth.ts` creat
- [ ] Dashboard actualizat cu noile funcții
- [ ] Frontend pornit pe `localhost:3000`

### Funcționalitate:
- [ ] Meta OAuth funcționează (connect + reconnect)
- [ ] Google Ads OAuth funcționează (connect + reconnect)
- [ ] GA4 OAuth funcționează (connect + reconnect)
- [ ] Token-urile sunt salvate în database
- [ ] Dashboard afișează status corect (connected/disconnected)
- [ ] Pop-up-urile se închid automat după autentificare

---

## 🚀 Next Steps (Funcționalități Viitoare)

1. **Token Refresh Automat:**
   - Implementează cron job pentru refresh token-uri Google înainte de expirare
   - Implementează re-authentication pentru Meta (60 zile)

2. **Error Handling Îmbunătățit:**
   - Toast notifications în loc de `alert()`
   - Retry logic pentru request-uri failed

3. **Multi-Account Support:**
   - Permite utilizatorilor să conecteze multiple conturi Meta/Google
   - Selector de cont în dashboard

4. **Permissions Management:**
   - Verifică scope-urile acceptate de user (nu presupunem că toate sunt acceptate)
   - UI pentru re-authorization cu scope-uri noi

5. **Security Enhancements:**
   - Criptează token-urile în database (momentan sunt necriptate)
   - Implementează token rotation

---

## 📚 Referințe

- [Meta OAuth Documentation](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Ads API Documentation](https://developers.google.com/google-ads/api/docs/oauth/overview)
- [Google Analytics Data API](https://developers.google.com/analytics/devguides/reporting/data/v1)

---

**✨ Sistem OAuth complet implementat și gata de testare!**
