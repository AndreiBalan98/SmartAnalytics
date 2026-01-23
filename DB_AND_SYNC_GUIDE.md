## 🧠 Core Design Principles

Before the schema:

- *Use the Meta object IDs as primary keys.* They’re guaranteed unique across all objects (e.g. `act_<ID>`, `<campaign_id>`, `<ad_id>`).
- *Relationships via foreign keys* (e.g., campaign → ad_account, adset → campaign).
- *Separate “static” metadata from metrics.* So your schema has tables for entities and separate tables for insight metric snapshots.
- *Use snapshots for insights* — store temporal metrics with `date_start`, `date_stop`, and granularity (daily, lifetime, etc.) because insights are time-series.
- *Store raw JSON in a column* for full flexibility, but also flatten key fields for indexing/querying performance.

---

## 📦 Tables & Columns

Here’s a full working schema template you can use. I’ll explain the main ones afterward.

---

### 1) **users** — the authenticated Meta user

```sql
CREATE TABLE users (
  user_id TEXTPRIMARY KEY,
  name TEXT,
  email TEXT,
  raw JSONB,
  created_atTIMESTAMPDEFAULT NOW()
);

```

---

### 2) **businesses**

```sql
CREATE TABLE businesses (
  business_id TEXTPRIMARY KEY,
  name TEXT,
  primary_owner_id TEXT,
  raw JSONB,
  created_atTIMESTAMPDEFAULT NOW(),
FOREIGN KEY (primary_owner_id)REFERENCES users(user_id)
);

```

---

### 3) **ad_accounts**

```sql
CREATE TABLE ad_accounts (
  ad_account_id TEXTPRIMARY KEY,
  business_id TEXT,
  name TEXT,
  account_statusINT,
  currency TEXT,
  timezone_name TEXT,
  raw JSONB,
  created_atTIMESTAMPDEFAULT NOW(),
FOREIGN KEY (business_id)REFERENCES businesses(business_id)
);

```

---

### 4) **campaigns**

```sql
CREATE TABLE campaigns (
  campaign_id TEXTPRIMARY KEY,
  ad_account_id TEXT,
  name TEXT,
  objective TEXT,
  status TEXT,
  buying_type TEXT,
  raw JSONB,
  created_atTIMESTAMPDEFAULT NOW(),
FOREIGN KEY (ad_account_id)REFERENCES ad_accounts(ad_account_id)
);

```

---

### 5) **ad_sets**

```sql
CREATE TABLE ad_sets (
  adset_id TEXTPRIMARY KEY,
  campaign_id TEXT,
  ad_account_id TEXT,
  name TEXT,
  daily_budgetBIGINT,
  lifetime_budgetBIGINT,
  optimization_goal TEXT,
  billing_event TEXT,
  status TEXT,
  start_timeTIMESTAMP,
  end_timeTIMESTAMP,
  raw JSONB,
  created_atTIMESTAMPDEFAULT NOW(),
FOREIGN KEY (campaign_id)REFERENCES campaigns(campaign_id),
FOREIGN KEY (ad_account_id)REFERENCES ad_accounts(ad_account_id)
);

```

---

### 6) **ads**

```sql
CREATE TABLE ads (
  ad_id TEXTPRIMARY KEY,
  adset_id TEXT,
  campaign_id TEXT,
  ad_account_id TEXT,
  name TEXT,
  status TEXT,
  effective_status TEXT,
  creative_id TEXT,
  raw JSONB,
  created_atTIMESTAMPDEFAULT NOW(),
FOREIGN KEY (adset_id)REFERENCES ad_sets(adset_id),
FOREIGN KEY (campaign_id)REFERENCES campaigns(campaign_id),
FOREIGN KEY (ad_account_id)REFERENCES ad_accounts(ad_account_id)
);

```

---

### 7) **ad_creatives**

```sql
CREATE TABLE ad_creatives (
  creative_id TEXTPRIMARY KEY,
  ad_account_id TEXT,
  name TEXT,
  object_story_spec JSONB,
  image_url TEXT,
  video_url TEXT,
  raw JSONB,
  created_atTIMESTAMPDEFAULT NOW(),
FOREIGN KEY (ad_account_id)REFERENCES ad_accounts(ad_account_id)
);

```

---

### 8) **insights_by_account**

```sql
CREATE TABLE insights_account (
  id SERIALPRIMARY KEY,
  ad_account_id TEXT,
  date_startDATE,
  date_stopDATE,
  metrics JSONB,
  raw JSONB,
  created_atTIMESTAMPDEFAULT NOW(),
FOREIGN KEY (ad_account_id)REFERENCES ad_accounts(ad_account_id)
);

```

---

### 9) **insights_by_campaign**

```sql
CREATE TABLE insights_campaign (
  id SERIALPRIMARY KEY,
  campaign_id TEXT,
  ad_account_id TEXT,
  date_startDATE,
  date_stopDATE,
  metrics JSONB,
  raw JSONB,
  created_atTIMESTAMPDEFAULT NOW(),
FOREIGN KEY (campaign_id)REFERENCES campaigns(campaign_id),
FOREIGN KEY (ad_account_id)REFERENCES ad_accounts(ad_account_id)
);

```

---

### 10) **insights_by_adset**

```sql
CREATE TABLE insights_adset (
  id SERIALPRIMARY KEY,
  adset_id TEXT,
  campaign_id TEXT,
  ad_account_id TEXT,
  date_startDATE,
  date_stopDATE,
  metrics JSONB,
  raw JSONB,
  created_atTIMESTAMPDEFAULT NOW(),
FOREIGN KEY (adset_id)REFERENCES ad_sets(adset_id),
FOREIGN KEY (campaign_id)REFERENCES campaigns(campaign_id),
FOREIGN KEY (ad_account_id)REFERENCES ad_accounts(ad_account_id)
);

```

---

### 11) **insights_by_ad**

```sql
CREATE TABLE insights_ad (
  id SERIALPRIMARY KEY,
  ad_id TEXT,
  adset_id TEXT,
  campaign_id TEXT,
  ad_account_id TEXT,
  date_startDATE,
  date_stopDATE,
  metrics JSONB,
  raw JSONB,
  created_atTIMESTAMPDEFAULT NOW(),
FOREIGN KEY (ad_id)REFERENCES ads(ad_id),
FOREIGN KEY (adset_id)REFERENCES ad_sets(adset_id),
FOREIGN KEY (campaign_id)REFERENCES campaigns(campaign_id),
FOREIGN KEY (ad_account_id)REFERENCES ad_accounts(ad_account_id)
);

```

---

## 📌 Why JSONB + Flattened Fields?

- **JSONB raw storage** lets you persist the *full API response* without losing data — so if Meta adds fields tomorrow, you already have them.
- **Flattened columns (`name, status, budgets` etc.)** give you *indexed, queryable fields* you’ll use in reports and joins.
- Insights tables store `metrics JSONB` because the dimension/metric combinations vary widely and are huge. You might request fields like `impressions`, `clicks`, `spend`, `ctr`, etc.

---

## 🧩 Relationships Quick Map

```
users
  └── businesses
        └── ad_accounts
              ├── campaigns
              │     └── ad_sets
              │           └── ads
              │                 └── ad_creatives
              └── insights (account/campaign/adset/ad)
```

That gives you a *natural join path* for queries like:

```sql
SELECT a.nameAS ad_name, c.nameAS campaign, i.metrics->>'impressions'
FROM insights_adAS i
JOIN adsAS aUSING(ad_id)
JOIN campaignsAS cUSING(campaign_id)
WHERE i.date_start='2026-01-01';
```

---

## ✅ 1) Ce date poți extrage din Meta Ads (exact, minimalist)

### 🟡 Autentificare / User

- **User ID**
- **Nume**
- **Email (dacă ai permisiunea)**
- **Permisiuni asociate token-ului**
- Scopul e doar să știi cine e conectat la OAuth.

### 🟡 Businesses (Business Manager)

- **business_id**
- **name**
- **primary_owner**
- Conține link-uri către ad_accounts.

### 🟡 Ad Accounts

- **ad_account_id**, **name**
- **account_status**, **currency**, **timezone**
- Lista campanii, adsets, ads asociate
- Roluri/permisiuni ale userului pe cont.

### 🟡 Campaigns

- **campaign_id**
- **name**, **objective**
- **status**, **buying_type**
- **spend_cap**, **budget info**
- Relaționează cu adsets, ads.

### 🟡 Ad Sets

- **adset_id**
- **campaign_id**, **budget (daily/lifetime)**
- **targeting settings**
- **bid strategy**, **optimization_goal**
- **schedule** (start/end dates)

### 🟡 Ads

- **ad_id**
- **adset_id**
- **name**, **status**, **effective_status**
- **creative_id**
- Stats summary (via insights)

### 🟡 Creatives

- **creative_id**
- **object_story_spec** (text, links)
- **image/video URLs**
- **type/format**

### 🟡 Insights (performanță) — foarte important

Poți trage metrici la nivel de:

- **ad account**
- **campaign**
- **adset**
- **ad**

Include metrici precum:

- **impressions**
- **clicks**
- **spend**
- **reach**
- **CPC/CPM**
- **actions (conversions)**
    
    și BREAKDOWNS (age, gender, placement etc.) dacă le specifici.
    

---

## 🔥 2) API Calls (exact ce endpoint îți trebuie)

> Structura generală: GET https://graph.facebook.com/v<version>/<object>/<edge>?fields=...
> 

### 👇 OAuth + acces

1. **OAuth Get Token**
    
    `GET https://www.facebook.com/vXX.0/dialog/oauth?client_id=...&redirect_uri=...&scope=ads_read,ads_management,business_management,...`
    
2. Exchange code → Access Token
    
    `GET https://graph.facebook.com/vXX.0/oauth/access_token?...`
    

---

### 🟦 Obiecte principale

| Data | API Endpoint |
| --- | --- |
| User | `GET /me?fields=id,name,email` |
| Businesses | `GET /me/businesses` |
| Ad Accounts | `GET /me/adaccounts` |
| Campaigns | `GET /act_<AD_ACCOUNT_ID>/campaigns?fields=...` |
| Ad Sets | `GET /<CAMPAIGN_ID>/adsets?fields=...` |
| Ads | `GET /<ADSET_ID>/ads?fields=...` |
| Creatives | `GET /act_<AD_ACCOUNT_ID>/adcreatives?fields=...` |
| Insights | `GET /<object_id>/insights?fields=...&level=<account/campaign/adset/ad>` |

🔹 Insights level poate fi: `account`, `campaign`, `adset`, `ad` — depinde de ce ID pui la `object_id`.

---

## 🧠 3) Baza de date (All tables succint)

Schema ți-am propus anterior, dar iată **lista completă a tabelelor** pe care îți recomand să le ai:

### 📌 Structural (metadata)

1. **users**
2. **businesses**
3. **ad_accounts**
4. **campaigns**
5. **ad_sets**
6. **ads**
7. **ad_creatives**

→ Asta acoperă toată structura logică a Meta-ads hierarchiei.

---

### 📊 Insights (metrici detaliați)

1. **insights_account**
2. **insights_campaign**
3. **insights_adset**
4. **insights_ad**

→ Fiecare pentru date de performanță la nivel diferit. (separate ca să nu amesteci metrici de la nivele diferite)

---

## 1️⃣ Principii clare (ca senior dev)

### 🔹 Folosește Meta IDs ca PRIMARY KEY

- NU `AutoField`
- TOATE obiectele Meta au ID stabil → `models.CharField(primary_key=True)`

### 🔹 Păstrează:

- câmpuri **flat** pentru query rapid
- **raw JSON** pentru viitor / debugging

### 🔹 Insights = TIME SERIES

- insights **NU** sunt update, sunt **append**
- un rând = un interval de timp

---

## 2️⃣ Modelele Django (schema corectă)

> Creează o aplicație nouă:
> 

```bash
python manage.py startapp meta_ads

```

### `models.py`

### 👤 User Meta

```python
from django.dbimport models

classMetaUser(models.Model):
id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=255, null=True)
    email = models.EmailField(null=True)
    raw = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

```

---

### 🏢 Business Manager

```python
classBusiness(models.Model):
id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=255)
    owner = models.ForeignKey(
        MetaUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name="businesses"
    )
    raw = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

```

---

### 💳 Ad Account

```python
classAdAccount(models.Model):
id = models.CharField(max_length=50, primary_key=True)
    business = models.ForeignKey(
        Business,
        on_delete=models.SET_NULL,
        null=True,
        related_name="ad_accounts"
    )
    name = models.CharField(max_length=255)
    currency = models.CharField(max_length=10)
    timezone = models.CharField(max_length=50)
    account_status = models.IntegerField()
    raw = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

```

---

### 📢 Campaign

```python
classCampaign(models.Model):
id = models.CharField(max_length=50, primary_key=True)
    ad_account = models.ForeignKey(
        AdAccount,
        on_delete=models.CASCADE,
        related_name="campaigns"
    )
    name = models.CharField(max_length=255)
    objective = models.CharField(max_length=50)
    status = models.CharField(max_length=50)
    buying_type = models.CharField(max_length=50)
    raw = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

```

---

### 🎯 Ad Set

```python
classAdSet(models.Model):
id = models.CharField(max_length=50, primary_key=True)
    campaign = models.ForeignKey(
        Campaign,
        on_delete=models.CASCADE,
        related_name="ad_sets"
    )
    ad_account = models.ForeignKey(
        AdAccount,
        on_delete=models.CASCADE
    )
    name = models.CharField(max_length=255)
    daily_budget = models.BigIntegerField(null=True)
    lifetime_budget = models.BigIntegerField(null=True)
    optimization_goal = models.CharField(max_length=50)
    status = models.CharField(max_length=50)
    start_time = models.DateTimeField(null=True)
    end_time = models.DateTimeField(null=True)
    raw = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

```

---

### 🧱 Ad

```python
classAd(models.Model):
id = models.CharField(max_length=50, primary_key=True)
    adset = models.ForeignKey(AdSet, on_delete=models.CASCADE)
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE)
    ad_account = models.ForeignKey(AdAccount, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    status = models.CharField(max_length=50)
    effective_status = models.CharField(max_length=50)
    raw = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

```

---

### 🎨 Creative

```python
classAdCreative(models.Model):
id = models.CharField(max_length=50, primary_key=True)
    ad_account = models.ForeignKey(
        AdAccount,
        on_delete=models.CASCADE
    )
    name = models.CharField(max_length=255, null=True)
    object_story_spec = models.JSONField(null=True)
    raw = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

```

---

## 3️⃣ Insights (FOARTE IMPORTANT)

### Un singur model reutilizabil

```python
classInsight(models.Model):
    LEVEL_CHOICES = [
        ("account","Account"),
        ("campaign","Campaign"),
        ("adset","AdSet"),
        ("ad","Ad"),
    ]

    level = models.CharField(max_length=20, choices=LEVEL_CHOICES)
    object_id = models.CharField(max_length=50)

    ad_account = models.ForeignKey(
        AdAccount, on_delete=models.CASCADE
    )

    date_start = models.DateField()
    date_stop = models.DateField()

    metrics = models.JSONField()
    raw = models.JSONField()

    created_at = models.DateTimeField(auto_now_add=True)

classMeta:
        indexes = [
            models.Index(fields=["object_id","level"]),
            models.Index(fields=["date_start","date_stop"]),
        ]

```

👉 **Asta e mai bine** decât 4 tabele separate.

---

## 4️⃣ Migrations (pe Render)

```bash
python manage.py makemigrations
python manage.py migrate

```

Render rulează exact la fel ca local.

---

## 5️⃣ Upsert (pattern corect)

### Meta returnează aceleași ID-uri → folosești `update_or_create`

```python
Campaign.objects.update_or_create(
id=campaign["id"],
    defaults={
"ad_account": ad_account,
"name": campaign["name"],
"objective": campaign["objective"],
"status": campaign["status"],
"buying_type": campaign["buying_type"],
"raw": campaign,
    }
)

```

### Insights → DOAR CREATE

```python
Insight.objects.create(
    level="ad",
    object_id=ad_id,
    ad_account=ad_account,
    date_start=row["date_start"],
    date_stop=row["date_stop"],
    metrics=row,
    raw=row,
)

```

❌ NU update insights

✔ append only

---

## 6️⃣ Ce NU faci (greșeli comune)

❌ NU:

- stoca insights în campaign/ad tables
- folosi AutoField
- arunca JSON-ul brut
- face JOIN-uri grele pe insights fără index

✔ DA:

- păstrează raw JSON
- index pe `object_id + level`
- batch API + batch DB inserts

---

## 🧠 Concluzie

Ai acum:

- schemă **100% compatibilă Meta Ads**
- modele Django curate
- performanță bună
- flexibilitate totală pentru viitor

---

# 1️⃣ Ordinea corectă de gândire (asta e cheia)

Ordinea corectă NU e:

> “Ce modele fac în Django?”
> 

Ordinea corectă este:

1. **Cum arată datele în realitate (Meta)**
2. **Cum curg datele (sync / update / append)**
3. **Cum le interoghez (queries reale)**
4. **Abia apoi: tabele & modele**

Noi suntem acum între **2 și 3**.

---

# 2️⃣ Tipuri de date Meta (clasificare corectă)

Meta îți dă DOAR două tipuri fundamentale de date:

## A) Date STRUCTURALE (state-based)

👉 Se **modifică în timp**, dar există **o singură versiune curentă**

Ex:

- user
- business
- ad_account
- campaign
- adset
- ad
- creative

📌 **Regulă:**

→ `UPSERT`

→ 1 rând / obiect Meta

→ PK = Meta ID

---

## B) Date DE PERFORMANȚĂ (event / time-series)

👉 Se **adună în timp**, nu se suprascriu

Ex:

- insights (impressions, clicks, spend etc.)

📌 **Regulă:**

→ `APPEND ONLY`

→ multe rânduri / obiect

→ cheie = (object_id, level, date_start, date_stop, breakdowns)

---

👉 **Această separare este CORECTĂ și definitivă.**

---

# 3️⃣ Validarea deciziei: 4 tabele insights vs 1 tabel insights

Inițial:

- insights_account
- insights_campaign
- insights_adset
- insights_ad

Acum:

- **1 singur tabel `insights` cu `level`**

### 🔍 Analiză REALĂ (nu teorie)

### Varianta A — 4 tabele

❌ Probleme:

- cod duplicat
- queries complicate când vrei “toate insights”
- adaugi logică extra în backend
- greu de extins (ex: breakdowns, placement)

✔ Singur avantaj:

- puțin mai simple FK-uri (dar nu merită)

---

### Varianta B — 1 tabel insights (ce ai acum)

✔ Avantaje:

- **schema mai simplă**
- **queries uniforme**
- suport natural pentru:
    - account / campaign / adset / ad
    - breakdowns
    - time ranges
- scaling mai ușor
- indexing mai eficient

❌ Dezavantaj:

- nu ai FK direct pe fiecare nivel
    
    👉 **DAR asta e perfect OK** pentru time-series
    

📌 **Verdict senior:**

✅ **1 singur tabel `Insight` este soluția CORECTĂ și mai eficientă**

---

# 4️⃣ Validarea structurii tabelului `Insight`

Forma corectă (conceptual):

```
Insight
├─ level (account | campaign | adset | ad)
├─ object_id (Meta ID)
├─ ad_account_id
├─ date_start
├─ date_stop
├─ metrics (JSON)
├─ breakdowns (implicit în metrics)

```

### De ce e corect?

- Meta Insights API funcționează EXACT așa
- același endpoint, doar `level` diferit
- breakdowns sunt dinamice → JSON

### Ce NU faci:

❌ câmp separat pentru clicks, impressions etc.

❌ FK strict către Campaign / AdSet / Ad

👉 Pentru analytics **JSON + index** bate FK rigid.

---

# 5️⃣ Indexing (aici se câștigă performanța)

Pentru `Insight`, indexurile CORECTE sunt:

1️⃣ acces rapid pe obiect:

```
(level, object_id)

```

2️⃣ acces temporal:

```
(date_start, date_stop)

```

3️⃣ acces pe cont:

```
(ad_account_id)

```

👉 Asta acoperă **95% din queries reale**.

---

# 6️⃣ Validarea modelelor STRUCTURALE

Pentru:

- Business
- AdAccount
- Campaign
- AdSet
- Ad
- Creative

Decizia de:

- PK = Meta ID
- raw JSON
- câmpuri flat esențiale

✅ **Este corectă**

✅ **Este best practice**

✅ **Este exact ce fac tool-uri gen Segment / Fivetran**

---

# 7️⃣ Fluxul real de implementare (end-to-end)

Acesta e fluxul CORECT, fără improvizații:

### 1️⃣ OAuth

- user → token
- token → permissions

### 2️⃣ Structural sync (UPSERT)

Ordine FIXĂ:

```
User
→ Businesses
→ AdAccounts
→ Campaigns
→ AdSets
→ Ads
→ Creatives

```

### 3️⃣ Insights sync (APPEND)

- per ad_account
- per level
- per interval de timp
- fără update

---

# 8️⃣ Verificare finală: lipsește ceva?

### ❌ Ce NU lipsește:

- insights breakdown tables → NU
- metrics flat → NU
- 4 tabele insights → NU
- creative variants separate → NU

### ✅ Ce e optional, dar util:

- `sync_state` (last_synced_at per account)
- `api_request_log`
- `rate_limit_state`

Dar astea sunt **operational**, nu schema core.

---

# 9️⃣ Concluzie finală (clar, ferm)

✔ Schema gândită este **corectă**

✔ Decizia de **1 singur tabel Insights** este **mai bună**

✔ Implementarea în Django este:

- coerentă
- scalabilă
- aliniată 100% cu Meta API
- pregătită pentru analytics serioase

---

# 1️⃣ Problema REALĂ (reformulată corect)

Tu NU vrei:

- să “verifici dacă există date”
- să faci `SELECT *` peste tot
- să compari manual tabele

Tu vrei:

> Backend-ul să știe exact: ce știu deja, ce e incomplet, ce trebuie cerut de la Meta, fără să scanez DB inutil
> 

Asta NU se rezolvă cu:

❌ joins grele

❌ count-uri

❌ verificări ad-hoc

Se rezolvă cu **STATE MANAGEMENT**.

---

# 2️⃣ Concept-cheie: „source of truth” pentru sync

👉 **Baza de date NU trebuie interogată ca să afli ce lipsește.**

👉 **Trebuie să știi dinainte ce lipsește.**

Asta înseamnă:

- ȚII STARE DE SYNC
- NU deduci stare din date

---

# 3️⃣ Ce tipuri de sync ai (clasificare critică)

Pentru Meta ai DOAR 3 tipuri de sync:

## A) Initial structural sync

- prima conectare a unui token
- iei TOT ce userul vede

## B) Incremental structural sync

- pot apărea:
    - ad accounts noi
    - campaigns noi
    - ads noi
- NU iei tot din nou

## C) Insights sync (periodic)

- daily / hourly
- append only
- incremental by date

📌 **Fiecare are logică diferită.**

---

# 4️⃣ Soluția corectă: TABEL DE SYNC STATE

Ai nevoie de **UN SINGUR TABEL** care spune:

> “pentru acest token / ad account / nivel, până unde am sincronizat”
> 

---

## 🔑 `sync_state` (conceptual)

```
SyncState
├─ provider ="meta"
├─ entity_type ="business" |"ad_account" |"campaign" |"adset" |"ad" |"insights"
├─ entity_id (ex: ad_account_id)
├─ last_synced_at (timestamp)
├─ last_insight_date (date)
├─status = success |running | failed
├─ metadata (JSON)

```

👉 **Ăsta este creierul sistemului tău.**

---

# 5️⃣ Cum decurge flow-ul când apeși “Sync Data”

Hai exact ce ai cerut: **pas cu pas, backend logic**

---

## 🟢 PAS 1: Agency apasă “Sync Data”

Frontend:

```
POST /api/meta/sync

```

Backend primește:

- agency_id
- user_id
- token_id

---

## 🟢 PAS 2: Backend citește DOAR sync_state (nu tabelele mari)

Ex:

```sql
SELECT*FROM sync_state
WHERE provider='meta'
AND owner_id=<agency_id>;

```

👉 Aici afli:

- ce ad accounts sunt deja sincronizate
- până unde (time-wise)
- ce a eșuat

❌ NU verifici campaigns, ads etc.

---

## 🟢 PAS 3: Determini ce trebuie cerut de la Meta

### Pentru STRUCTURAL:

| Situație | Ce faci |
| --- | --- |
| nu există sync_state | full sync |
| există sync_state | fetch doar new objects |

👉 Meta suportă asta prin:

- `since` timestamps
- comparație ID-uri
- pagination cu upsert

---

### Pentru INSIGHTS:

```
last_insight_date = 2024-12-31
today = 2025-01-23

```

→ ceri doar:

```
date_start=2025-01-01
date_stop=2025-01-22

```

---

## 🟢 PAS 4: Rulezi API calls DOAR pentru ce lipsește

Important:

- două agenții pot cere același ad_account
- **NU contează**

Pentru că:

- structural = upsert
- insights = append + dedupe logic

👉 **ID-urile Meta sunt globale** → DB-ul tău rezolvă coliziunile.

---

## 🟢 PAS 5: Update sync_state (NU datele)

După fiecare batch:

```
sync_state.last_synced_at = now()
sync_state.last_insight_date = date_stop
sync_state.status = success

```

Dacă eșuează:

```
status = failed
error = rate_limit

```

---

# 6️⃣ De ce NU vrei să „verifici DB-ul”

### Problema DB-driven sync:

- O(n) scan
- join-uri grele
- race conditions
- imposibil de paralelizat

### Avantaj state-driven sync:

✔ O(1) lookup

✔ deterministic

✔ retry safe

✔ scale friendly

👉 **Toate sistemele mari (Stripe, Google Ads, Shopify) funcționează așa.**

---

# 7️⃣ Agenții multiple, acces shared — problema ta cheie

### Situația:

- Agency A și B au acces la același ad_account

### Soluția:

- **sync_state este per ad_account, nu per agency**

👉 Agenția doar DECLANȘEAZĂ sync, nu “deține” datele.

Datele sunt:

- globale
- normalizate
- reutilizabile

---

# 8️⃣ Ce trebuie să existe minim în DB (nou)

Pe lângă ce ai deja:

### 🔹 `sync_state`

- 1 rând / (provider + entity_type + entity_id)

### 🔹 `access_control`

(opțional, dar recomandat)

- cine vede ce ad_account
- NU afectează sync

---

# 9️⃣ Rezumat ultra-scurt

✔ NU întrebi DB-ul “ce lipsește”

✔ ȚII STARE DE SYNC

✔ Sync-ul e determinist

✔ 1 tabel insights e corect

✔ Shared ad accounts nu sunt problemă

✔ Agenția declanșează, nu deține