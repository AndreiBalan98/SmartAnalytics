# 🧪 Testing Guide - Client Dashboard Issue Resolution

## Probleme Identificate și Rezolvate

### ❌ Probleme Găsite:
1. **Total metrics: 0** - Nu există date în DailyMetric
2. **Meta nu este conectat** - Nicio agenție nu a conectat Meta
3. **Clienții nu au permisiuni** - `meta_accounts` array este gol
4. **Lipsea `__init__.py`** în `backend/integrations/services/`
5. **Lipsea endpoint `/api/integrations/meta/start/`** pentru OAuth flow în MOCK mode

### ✅ Rezolvări Implementate:
1. ✅ Creat `__init__.py` în services package
2. ✅ Adăugat MOCK support în `exchange_meta_code`
3. ✅ Creat endpoint `start_meta_oauth` cu MOCK support
4. ✅ Django check trece fără erori

---

## 🧭 Workflow Corect pentru Testare

### Pasul 1: Pornește aplicația

```bash
# Terminal 1 - Backend Django
cd "D:\proiecte personale\SmartAnalytics\backend"
python manage.py runserver

# Terminal 2 - Frontend Next.js
cd "D:\proiecte personale\SmartAnalytics\frontend"
npm run dev
```

Verifică că:
- Backend rulează pe http://localhost:8000
- Frontend rulează pe http://localhost:3000
- MOCK_META=true în backend/.env

---

### Pasul 2: Loghează-te ca AGENȚIE

1. Deschide browser la http://localhost:3000
2. Click "Connect as Agency"
3. Loghează-te cu credențialele tale de agenție:
   - Dacă nu ai cont, creează unul nou la `/agency/signup`
   - Reține email-ul și parola

---

### Pasul 3: Conectează Meta (MOCK mode)

În Agency Dashboard:

1. Scroll down la secțiunea "**Platform Integrations**"
2. Găsește cardul "**Meta Ads**"
3. Ar trebui să vezi: **❌ Not Connected**
4. Click pe butonul **"Connect Meta"**

**Ce ar trebui să se întâmple:**
- În MOCK mode, se va crea automat un `MetaIntegration`
- Vei fi redirectat înapoi la dashboard cu `?meta_connected=true`
- Cardul Meta Ads ar trebui să arate: **✅ Connected**
- Business name: **"Mock Business (Your Agency Name)"**

**Verificare în terminal:**
```bash
cd "D:\proiecte personale\SmartAnalytics\backend"
python manage.py shell -c "from integrations.models import MetaIntegration; print('Meta integrations:', MetaIntegration.objects.count())"
```
Ar trebui să afișeze: `Meta integrations: 1`

---

### Pasul 4: Verifică Ad Accounts Mock

După conectarea Meta, în Agency Dashboard:

1. Refresh pagina (F5)
2. Dashboard-ul ar trebui să încarce **3 Mock Ad Accounts**:
   - act_123456789 - Mock Ad Account 1 (USD)
   - act_987654321 - Mock Ad Account 2 (EUR)
   - act_555555555 - Mock Ad Account 3 (RON)

**Verificare în browser console:**
```javascript
// Deschide DevTools (F12) → Console
// Ar trebui să vezi log: "Meta ad accounts loaded: 3"
```

---

### Pasul 5: Creează/Selectează un Client

**Opțiunea A: Creează un client nou**

1. În Agency Dashboard, click pe butonul **"+ Add Client"**
2. Completează formul:
   - Email: `client1@example.com`
   - First Name: `Test`
   - Last Name: `Client`
3. Click **"Create Client"**
4. **IMPORTANT:** Va apărea o parolă temporară - **copiază-o!**
5. Click "Close" după ce ai copiat parola

**Opțiunea B: Folosește un client existent**

Dacă ai deja clienți în listă, sari la Pasul 6.

---

### Pasul 6: Asignează Permisiuni Clientului

1. În lista de clienți, găsește clientul pe care vrei să-l testezi
2. Click pe butonul **"⚙️ Permissions"** pentru acel client
3. În modal, secțiunea **"📘 Meta Ad Accounts"**:
   - Ar trebui să vezi 3 checkboxes pentru ad accounts mock
4. **Selectează cel puțin UN ad account** (de exemplu, act_123456789)
5. Click **"Save Permissions"**

**Verificare:**
- După save, tag-ul clientului ar trebui să arate: **Meta: 1** (sau câte ai selectat)

**Verificare în terminal:**
```bash
cd "D:\proiecte personale\SmartAnalytics\backend"
python manage.py shell -c "from agencies.models import AgencyUser; au = AgencyUser.objects.first(); print('Permissions:', au.permissions)"
```
Ar trebui să vezi:
```python
Permissions: {'meta_accounts': ['act_123456789'], 'google_accounts': [], 'ga4_properties': []}
```

---

### Pasul 7: Rulează "Sync Data"

**ACESTA ESTE PASUL CEL MAI IMPORTANT!**

În Agency Dashboard, secțiunea "Platform Integrations", cardul Meta Ads:

1. Găsește butonul **"🔄 Sync Data"** (sub business name)
2. Click pe buton
3. Așteptă ~5-10 secunde (în MOCK mode)

**Ce ar trebui să se întâmple:**
- Butonul devine **"Syncing..."**
- După finalizare, apare un mesaj de succes:
  ```
  ✅ Sync completed successfully!
  Ad accounts synced: 3
  Campaigns: created 15, updated 5
  Ad Sets: created 45, updated 10
  Ads: created 120, updated 30
  Metrics: created 90, updated 60
  ```

**Verificare în terminal:**
```bash
cd "D:\proiecte personale\SmartAnalytics\backend"
python manage.py shell -c "from metrics.models import DailyMetric; print('Total metrics:', DailyMetric.objects.count())"
```

**AȘTEPTAT:** `Total metrics: 90` (sau similar, în funcție de mock data)

**DACĂ VEZI 0, SYNC-UL NU A FUNCȚIONAT!** Verifică logs în terminal backend.

---

### Pasul 8: Logout și Login ca CLIENT

1. În Agency Dashboard, click **"Logout"** (sus-dreapta)
2. Mergi la http://localhost:3000
3. Click **"Connect as Client"**
4. Loghează-te cu:
   - Email: `client1@example.com` (sau email-ul clientului tău)
   - Password: parola temporară copiată la Pasul 5

---

### Pasul 9: Verifică Client Dashboard

După login ca client, ar trebui să vezi:

✅ **Header:**
- "Client Dashboard"
- Numele clientului (ex: "Test Client")
- Buton "Logout"

✅ **DEBUG Panel (galben):**
```
🔍 DEBUG INFO:
Your Permissions: {"meta_accounts": ["act_123456789"], "google_accounts": [], "ga4_properties": []}
Meta Accounts (from permissions): ["act_123456789"]
Accounts in Database: ["act_123456789", "act_987654321", "act_555555555"]
Total Metrics in DB: 90
Metrics per Account:
{
  "act_123456789": 30,
  "act_987654321": 30,
  "act_555555555": 30
}
```

✅ **Date Range Selector:**
- Last 7 Days / Last 30 Days / Last 90 Days (30 Days selectat implicit)

✅ **Metrics Cards (7 cards):**
- Total Spend: $X.XX
- Impressions: XXX
- Clicks: XXX
- Conversions: XXX
- Avg CTR: X.XX%
- Avg CPC: $X.XX
- Avg CPM: $X.XX

✅ **Performance Charts:**
- Spend Over Time (line chart albastru)
- Impressions & Clicks (multi-line chart verde/orange)
- Conversions (line chart purple)

✅ **Account Breakdown Table:**
- Tabel cu act_123456789 și toate metricile

---

## 🐛 Troubleshooting

### Problemă: "No Data Available" în Client Dashboard

**Cauze posibile:**

1. **Nu s-a rulat Sync Data**
   ```bash
   # Verificare:
   python manage.py shell -c "from metrics.models import DailyMetric; print(DailyMetric.objects.count())"
   # Dacă rezultat este 0 → Rulează Sync Data din Agency Dashboard
   ```

2. **Clientul nu are permisiuni**
   ```bash
   # Verificare:
   python manage.py shell -c "from agencies.models import AgencyUser; from django.contrib.auth import get_user_model; User = get_user_model(); client = User.objects.get(email='client1@example.com'); au = AgencyUser.objects.get(user=client); print('Permissions:', au.permissions)"
   # Ar trebui să vezi meta_accounts cu cel puțin un ID
   ```

3. **Permisiunile nu match-uiesc cu datele**
   - Client are `act_999999999` în permisiuni
   - Dar în DailyMetric există doar `act_123456789`, `act_987654321`, `act_555555555`
   - **Soluție:** Re-asignează permisiuni corect din Agency Dashboard

---

### Problemă: Panoul DEBUG nu apare

**Cauză:** Endpoint-ul `/api/debug/client-data/` returnează eroare

**Verificare:**
```bash
# Terminal backend - watch logs
# Ar trebui să vezi request-ul când se încarcă dashboard-ul
```

**Soluție:**
- Verifică că ești logat ca CLIENT (nu agency)
- Verifică că ai un AgencyUser activ
- Verifică logs pentru erori

---

### Problemă: "Sync Data" returnează eroare

**Cauze posibile:**

1. **Rate limiting** - Ai rulat sync de mai puțin de 1 minut
   - **Soluție:** Așteaptă 60 secunde și reîncearcă

2. **Meta nu este conectat**
   - **Verificare:** Cardul Meta Ads ar trebui să arate "✅ Connected"
   - **Soluție:** Rulează Pasul 3 din nou

3. **Eroare în backend**
   - **Verificare:** Citește logs din terminal backend
   - **Soluție:** Caută eroarea în logs și rezolvă

---

### Problemă: "Connect Meta" nu funcționează

**În MOCK mode:**
- Ar trebui să redirecteze instant înapoi la dashboard
- **Verificare:** URL ar trebui să conțină `?meta_connected=true`

**Dacă nu funcționează:**
```bash
# Verifică MOCK_META setting
cd "D:\proiecte personale\SmartAnalytics\backend"
python manage.py shell -c "from django.conf import settings; print('MOCK_META:', settings.MOCK_META)"
# Ar trebui să fie: MOCK_META: True
```

**Dacă este False:**
- Editează `backend/.env`
- Setează `MOCK_META=true`
- Restart backend server

---

## ✅ Checklist Final

Înainte de a declara că totul funcționează, verifică:

- [ ] Backend rulează fără erori
- [ ] Frontend rulează fără erori
- [ ] MOCK_META=true în backend
- [ ] Meta este conectat (✅ Connected în Agency Dashboard)
- [ ] Există 3 Mock Ad Accounts în Agency Dashboard
- [ ] Clientul există și are permisiuni (cel puțin 1 Meta ad account)
- [ ] "Sync Data" a fost rulat cu succes
- [ ] DailyMetric conține date (verificat cu shell command)
- [ ] Client Dashboard afișează panoul DEBUG galben
- [ ] Client Dashboard afișează 7 Metrics Cards
- [ ] Client Dashboard afișează 3 Charts
- [ ] Client Dashboard afișează Account Breakdown Table

---

## 📊 Comenzi Utile de Diagnosticare

```bash
# 1. Verifică total metrici
python manage.py shell -c "from metrics.models import DailyMetric; print('Total metrics:', DailyMetric.objects.count())"

# 2. Verifică Meta integration
python manage.py shell -c "from integrations.models import MetaIntegration; print('Meta integrations:', MetaIntegration.objects.count())"

# 3. Verifică clienți și permisiuni
python manage.py shell -c "from agencies.models import AgencyUser; from django.contrib.auth import get_user_model; User = get_user_model(); clients = User.objects.filter(user_type='client'); [print(f'{c.email}: {AgencyUser.objects.filter(user=c, is_active=True).first().permissions if AgencyUser.objects.filter(user=c, is_active=True).exists() else \"No membership\"}') for c in clients]"

# 4. Verifică account IDs în DailyMetric
python manage.py shell -c "from metrics.models import DailyMetric; accounts = list(DailyMetric.objects.values_list('account_id', flat=True).distinct()); print('Accounts:', accounts)"

# 5. Verifică MOCK mode
python manage.py shell -c "from django.conf import settings; print('MOCK_META:', settings.MOCK_META)"
```

---

## 🎯 Success Criteria

Dashboard-ul client funcționează corect când:

1. ✅ Panoul DEBUG galben apare
2. ✅ `Your Permissions` conține cel puțin un `meta_account`
3. ✅ `Total Metrics in DB` > 0
4. ✅ `Metrics per Account` arată metrici pentru ad accounts-urile permise
5. ✅ Toate Metrics Cards au valori > 0
6. ✅ Chart-urile au date și se afișează
7. ✅ Tabelul Account Breakdown are cel puțin un rând

---

**Ultima Actualizare:** 2026-01-16
**Status:** Guide complet pentru debugging și testare
