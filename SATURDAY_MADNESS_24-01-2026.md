# SATURDAY_MADNESS_24-01-2026 - Plan de Executie

## Currently Working / Last Completed Task
**Status:** ETAPA 1 COMPLETATA - Tabele legacy sterse cu succes
**Ultima actualizare:** 25.01.2026
**Next:** ETAPA 2 - Meta Connect cu Sync Automat

---

## Rezumat Obiective

1. Curatare baza de date (tabele si date legacy)
2. Meta Connect: la conectare, salvare token + sincronizare automata toate datele structurale
3. Sync Modal: fereastra pentru selectare ad accounts si sincronizare insights de la 01.01.2026
4. Logging clar in backend si baza de date pentru toate operatiunile
5. Verificare creare conturi client
6. Fix problema client-ului care nu vede ad accounts

---

## ETAPA 1: Curatare Baza de Date

### 1.1 Analiza Tabele Existente

**Tabele de PASTRAT (implementare curenta):**
- `users` - Autentificare custom
- `agencies` - Agentii
- `agency_users` - Multi-tenancy (link agency-client cu permissions JSON)
- `meta_integrations` - Token OAuth Meta per agency (CURENT)
- `google_ads_integrations`, `ga4_integrations` - Alte platforme
- `daily_metrics`, `metric_snapshots` - Metrici unificate
- `meta_ads_metauser`, `meta_ads_business`, `meta_ads_adaccount` - Date structurale Meta
- `meta_ads_campaign`, `meta_ads_adset`, `meta_ads_ad`, `meta_ads_adcreative` - Ierarhie Meta
- `meta_ads_insight` - Insights (append-only)
- `meta_ads_syncstate` - Tracking sincronizare
- `meta_ads_agencyadaccountaccess` - Acces agency la ad accounts
- `core_systemlog` - Logging backend
- Tabele Django default (`auth_*`, `django_*`)

**Tabele de STERS (legacy/neutilizate):**
- `meta_integration` (singular, din api app) - Token global vechi
- `campaigns` - Abstractizare legacy
- `ad_sets` - Abstractizare legacy
- `ads` - Abstractizare legacy

### 1.2 Instructiuni pentru Stergere in pgAdmin

```sql
-- PASUL 1: Verifica datele existente (DOAR CITIRE)
SELECT 'meta_integration' as tabel, COUNT(*) as records FROM meta_integration;
SELECT 'campaigns' as tabel, COUNT(*) as records FROM campaigns;
SELECT 'ad_sets' as tabel, COUNT(*) as records FROM ad_sets;
SELECT 'ads' as tabel, COUNT(*) as records FROM ads;

-- PASUL 2: Sterge tabelele (in ordinea corecta pt FK)
DROP TABLE IF EXISTS ads CASCADE;
DROP TABLE IF EXISTS ad_sets CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS meta_integration CASCADE;

-- PASUL 3: Verifica stergerea
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Tasks Etapa 1
- [x] 1.1 Verificare date in tabelele legacy (SKIPPED - sters direct)
- [x] 1.2 Stergere tabele din pgAdmin (COMPLETAT - ads, ad_sets, campaigns, meta_integration)
- [ ] 1.3 Stergere fisiere backend nefolosite (optional, dupa testare finala)

---

## ETAPA 2: Meta Connect - Sincronizare Automata la Conectare

### 2.1 Problema Curenta
La conectare Meta:
- Se obtine token
- Se salveaza in `meta_integrations`
- Se citesc ad accounts de la Meta API
- **NU se salveaza nimic in `meta_ads_*` tables**

### 2.2 Solutia
Dupa exchange token, apelam automat `sync_structural_data()` pentru a popula toate tabelele.

### 2.3 Fisiere de Modificat

**Fisier Principal:** `backend/integrations/services/meta_service.py`

**Modificari in `exchange_code_for_token()`:**

```python
# La sfarsitul functiei, dupa salvarea MetaIntegration:

# Import sync service
from meta_ads.services.sync_service import MetaSyncService
from core.models import SystemLog

# Log conectare
SystemLog.objects.create(
level='INFO',
logger_name='meta.connect',
message=f'[CONNECT] Token obtinut pentru agency {agency.name} (ID: {agency.id})'
)

# Sincronizare automata structurala
try:
sync_service = MetaSyncService(agency, access_token)
result = sync_service.sync_structural_data()

SystemLog.objects.create(
level='INFO',
logger_name='meta.connect',
message=f'[CONNECT] Sync structural completat: {result}'
)
except Exception as e:
SystemLog.objects.create(
level='ERROR',
logger_name='meta.connect',
message=f'[CONNECT] Sync structural ESUAT: {str(e)}'
)
```

### 2.4 Imbunatatire Logging in Sync Service

**Fisier:** `backend/meta_ads/services/sync_service.py`

Adaugam logging la `SystemLog` in fiecare pas:

```python
from core.models import SystemLog

# In sync_structural_data():
SystemLog.objects.create(
level='INFO',
logger_name='meta.sync.structural',
message=f'[SYNC] START - Agency {self.agency.name}'
)

# Dupa fiecare pas:
SystemLog.objects.create(
level='INFO',
logger_name='meta.sync.structural',
message=f'[SYNC] User synced: {user_id}'
)
# ... similar pentru businesses, ad_accounts, campaigns, etc.
```

### Tasks Etapa 2
- [ ] 2.1 Modificare `exchange_code_for_token()` pentru a apela sync structural
- [ ] 2.2 Adaugare logging SystemLog in `MetaSyncService.sync_structural_data()`
- [ ] 2.3 Testare: Disconnect si reconectare Meta
- [ ] 2.4 Verificare in pgAdmin ca `meta_ads_*` tables au date
- [ ] 2.5 Verificare in `core_systemlog` ca logurile apar

---

## ETAPA 3: Sync Modal pentru Insights

### 3.1 Functionalitate Dorita
- Buton "Sync" deschide modal
- In modal: lista ad accounts cu checkboxes
- Date picker: start (default: 01.01.2026), end (default: azi)
- Buton "Start Sync" porneste sincronizarea
- Progress/status in timp real

### 3.2 Backend - Endpoint Existent

Endpoint-ul exista deja: `POST /api/meta/sync/insights/`

**Fisier:** `backend/meta_ads/views.py:trigger_insights_sync()`

**Parametri acceptati:**
- `ad_account_ids`: lista de account IDs
- `start_date`: data start (default: -30 zile)
- `end_date`: data sfarsit (default: azi)

### 3.3 Imbunatatire Backend Logging

**Fisier:** `backend/meta_ads/services/sync_service.py`

In `sync_insights()` si `_sync_insights_for_account()`:

```python
# La inceputul sync_insights():
SystemLog.objects.create(
level='INFO',
logger_name='meta.sync.insights',
message=f'[INSIGHTS] START - Accounts: {ad_account_ids}, Range: {start_date} to {end_date}'
)

# La inceputul fiecarui account:
SystemLog.objects.create(
level='INFO',
logger_name='meta.sync.insights',
message=f'[INSIGHTS] Syncing account {account_id}...'
)

# La fiecare nivel:
SystemLog.objects.create(
level='DEBUG',
logger_name='meta.sync.insights',
message=f'[INSIGHTS] Account {account_id} - Level {level}: {count} records'
)

# La final:
SystemLog.objects.create(
level='INFO',
logger_name='meta.sync.insights',
message=f'[INSIGHTS] COMPLETED - Total: {total_created} insights'
)
```

### 3.4 Frontend - Modal Component

**Fisier:** `frontend/src/app/agency/dashboard/page.tsx`

**State nou:**
```typescript
const [showSyncModal, setShowSyncModal] = useState(false)
const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([])
const [syncStartDate, setSyncStartDate] = useState('2026-01-01')
const [syncEndDate, setSyncEndDate] = useState(new Date().toISOString().split('T')[0])
const [syncLoading, setSyncLoading] = useState(false)
const [syncResult, setSyncResult] = useState<any>(null)
```

**Handler:**
```typescript
async function handleInsightsSync() {
setSyncLoading(true)
try {
const result = await api.triggerInsightsSync({
ad_account_ids: selectedAccountIds,
start_date: syncStartDate,
end_date: syncEndDate,
})
setSyncResult(result)
} catch (err: any) {
setError(err.message)
} finally {
setSyncLoading(false)
}
}
```

**Modal UI:**
- Lista ad accounts (din `metaAdAccounts` state)
- Checkbox pentru fiecare
- Date inputs pentru start/end
- Buton "Start Sync"

### Tasks Etapa 3
- [ ] 3.1 Adaugare logging detaliat in `sync_insights()`
- [ ] 3.2 Creare modal component in agency dashboard
- [ ] 3.3 Conectare modal la endpoint
- [ ] 3.4 Testare: selectare accounts, sync insights
- [ ] 3.5 Verificare in `meta_ads_insight` ca datele apar
- [ ] 3.6 Verificare in `core_systemlog` ca logurile apar

---

## ETAPA 4: Verificare contra SyncState

### 4.1 Logica Existenta

`SyncState` table are:
- `entity_type`: 'user', 'business', 'ad_account', 'campaign', etc.
- `entity_id`: ID-ul Meta
- `last_synced_at`: timestamp
- `last_insight_date`: pentru insights incremental

### 4.2 Ce Face Deja Codul

In `sync_service.py`:
- `_update_sync_state()` - actualizeaza/creeaza SyncState pentru fiecare entitate
- `_get_sync_state()` - citeste starea pentru a determina ce e nou
- `sync_insights()` - verifica `last_insight_date` pentru sync incremental

### 4.3 Imbunatatire - Logging Diferente

La sync structural, logam ce e nou vs existent:

```python
# In _sync_ad_accounts():
for acc in accounts:
existing_state = self._get_sync_state('ad_account', acc['id'])
is_new = existing_state is None

# ... upsert ...

SystemLog.objects.create(
level='INFO',
logger_name='meta.sync.structural',
message=f'[SYNC] AdAccount {acc["id"]}: {"NEW" if is_new else "UPDATED"}'
)
```

### Tasks Etapa 4
- [ ] 4.1 Adaugare logging pentru new vs updated in sync structural
- [ ] 4.2 Testare: reconectare si verificare loguri
- [ ] 4.3 Verificare in pgAdmin ca SyncState e corect populat

---

## ETAPA 5: Verificare Creare Conturi Client

### 5.1 Flow-ul Actual

**Endpoint:** `POST /api/clients/create/`
**Fisier:** `backend/users/views.py:create_client()`

1. Creeaza `User` cu `user_type='client'`
2. Creeaza `AgencyUser` cu `permissions={}`
3. Returneaza parola temporara

### 5.2 Problema Potentiala

`permissions` e gol la creare. Trebuie setat ulterior prin `PermissionsEditor`.

### 5.3 Testare Manuala

1. Login ca agency
2. Click "Add Client"
3. Fill form, submit
4. Verificare:
- User creat in `users` table
- AgencyUser creat in `agency_users` table
- Permissions JSON e `{}`

### Tasks Etapa 5
- [ ] 5.1 Testare creare client din UI
- [ ] 5.2 Verificare in pgAdmin ca User si AgencyUser sunt create
- [ ] 5.3 Testare setare permissions prin PermissionsEditor
- [ ] 5.4 Verificare ca permissions JSON contine ad account IDs

---

## ETAPA 6: Fix Client Nu Vede Ad Accounts

### 6.1 Analiza Root Cause

**Endpoint:** `GET /api/meta/client/ad-accounts/`
**Fisier:** `backend/meta_ads/views.py:client_ad_accounts()`

**Flow:**
1. Get `AgencyUser` pentru user logat
2. Get `allowed_accounts = agency_user.permissions.get('meta_accounts', [])`
3. Query `AdAccount.objects.filter(id__in=allowed_accounts)`
4. Return accounts

**Posibile cauze pentru rezultat gol:**
1. `permissions['meta_accounts']` e gol (nu s-au setat permisiunile)
2. `meta_ads_adaccount` table e goala (sync structural nu a rulat)
3. ID-urile din permissions nu corespund cu cele din DB

### 6.2 Solutii

**A. Adaugare logging debug:**

```python
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def client_ad_accounts(request):
from core.models import SystemLog

user = request.user

SystemLog.objects.create(
level='DEBUG',
logger_name='meta.client',
message=f'[CLIENT] Request ad accounts for user {user.email}'
)

# ... existing code ...

allowed_accounts = agency_user.permissions.get('meta_accounts', [])

SystemLog.objects.create(
level='DEBUG',
logger_name='meta.client',
message=f'[CLIENT] Permissions meta_accounts: {allowed_accounts}'
)

# Check what's in DB
all_db_accounts = list(AdAccount.objects.values_list('id', flat=True))

SystemLog.objects.create(
level='DEBUG',
logger_name='meta.client',
message=f'[CLIENT] DB accounts: {all_db_accounts}'
)

accounts = AdAccount.objects.filter(id__in=allowed_accounts)

SystemLog.objects.create(
level='INFO',
logger_name='meta.client',
message=f'[CLIENT] Returning {accounts.count()} accounts for {user.email}'
)

return Response({
'ad_accounts': AdAccountSerializer(accounts, many=True).data
})
```

**B. Fix frontend pentru permissions:**

Cand agency seteaza permissions, trebuie sa foloseasca ID-urile din `meta_ads_adaccount` table, nu direct de la
Meta API.

**Fisier:** `frontend/src/app/agency/dashboard/page.tsx`

Schimba sursa pentru `metaAdAccounts` state de la `api.getMetaAdAccounts()` la `api.getAgencyAdAccounts()`.

### Tasks Etapa 6
- [ ] 6.1 Adaugare logging debug in `client_ad_accounts()`
- [ ] 6.2 Testare si verificare loguri pentru a identifica cauza
- [ ] 6.3 Fix frontend - sursa ad accounts pentru permissions
- [ ] 6.4 Testare end-to-end: agency seteaza permissions, client vede accounts

---

## ETAPA 7: Testare Finala si Issues

### 7.1 Test Suite Complet

1. **Test Connect Meta:**
- [ ] Deconectare Meta
- [ ] Reconectare Meta
- [ ] Verificare token salvat in `meta_integrations`
- [ ] Verificare date in `meta_ads_*` tables
- [ ] Verificare loguri in `core_systemlog`

2. **Test Sync Insights:**
- [ ] Deschide sync modal
- [ ] Selecteaza ad accounts
- [ ] Seteaza date 01.01.2026 - azi
- [ ] Start sync
- [ ] Verificare date in `meta_ads_insight`
- [ ] Verificare loguri

3. **Test Client Flow:**
- [ ] Creeaza client nou
- [ ] Seteaza permissions pentru ad accounts
- [ ] Login ca client
- [ ] Verificare ad accounts vizibile
- [ ] Verificare date/metrici vizibile

### 7.2 Sectiune pentru Issues Live

| # | Descriere Issue | Status | Rezolvare |
|---|-----------------|--------|-----------|
| 1 | - | - | - |
| 2 | - | - | - |
| 3 | - | - | - |

---

## ETAPA 8: Actualizare MINDMAP.md

### 8.1 Sectiuni de Actualizat

Dupa ce toate functionalitatile sunt testate si functionale:

1. **Section 5.2 (Connect Meta Flow):**
- Adaugare pas pentru sync structural automat
- Mentionare logging

2. **Section 5.3 (Sync Meta Data Flow):**
- Detaliere modal selectie accounts
- Detaliere date range (de la 01.01.2026)
- Mentionare logging

3. **Section 7 (Data Models):**
- Confirmare ca `meta_ads_*` sunt tabelele principale
- Stergere referinte la tabele legacy daca e cazul

4. **Sectiune noua pentru Logging:**
- Explicare `core_systemlog`
- Categorii de loguri: meta.connect, meta.sync.structural, meta.sync.insights, meta.client

### Tasks Etapa 8
- [ ] 8.1 Actualizare sectiuni MINDMAP.md
- [ ] 8.2 Verificare ca nu exista referinte la work sessions sau planuri
- [ ] 8.3 Commit final

---

## Fisiere Critice

| Fisier | Scop | Modificari |
|--------|------|------------|
| `backend/integrations/services/meta_service.py` | OAuth si token exchange | Apel sync structural, logging |
| `backend/meta_ads/services/sync_service.py` | Sync structural si insights | Logging SystemLog |
| `backend/meta_ads/views.py` | Endpoints API | Logging debug client |
| `frontend/src/app/agency/dashboard/page.tsx` | Dashboard agency | Sync modal |
| `backend/core/models.py` | SystemLog model | (existent, doar utilizare) |

---

## Ordine Implementare Recomandata

1. **Etapa 6** - Fix client ad accounts (impact imediat)
2. **Etapa 2** - Connect Meta cu sync automat
3. **Etapa 3** - Sync Modal
4. **Etapa 4** - Verificare SyncState
5. **Etapa 5** - Testare creare client
6. **Etapa 1** - Curatare DB (la final, dupa confirmare ca totul merge)
7. **Etapa 7** - Testare finala
8. **Etapa 8** - Actualizare MINDMAP

---

*Plan creat: 25.01.2026*
*Ultima modificare: 25.01.2026*


If you need specific details from before exiting plan mode (like exact code snippets, error messages, or content
you generated), read the full transcript at: C:\Users\Andrei
Balan\.claude\projects\D--proiecte-personale-SmartAnalytics\97de3352-0873-4e04-9c76-96a79b054e82.jsonl