# 🚀 OAuth Quick Start - Primii Pași

## ⏱️ Setup Rapid (5 minute)

### 1️⃣ Database (1 minut)

```bash
# Deschide pgAdmin
# Click dreapta pe database → Query Tool
# Deschide: backend/sql/create_oauth_tables.sql
# Rulează scriptul (F5)
```

**Verificare:**
```sql
SELECT COUNT(*) FROM oauth_states;    -- 0
SELECT COUNT(*) FROM meta_tokens;     -- 0
SELECT COUNT(*) FROM google_tokens;   -- 0
SELECT COUNT(*) FROM ga4_tokens;      -- 0
```

---

### 2️⃣ Backend (2 minute)

```bash
cd backend

# Rulează migration
python manage.py migrate integrations 0004_add_oauth_models

# Pornește server
python manage.py runserver
```

**Verificare:**
- Accesează: http://localhost:8000/admin/integrations/
- Ar trebui să vezi: `OAuth States`, `Meta Tokens`, `Google Tokens`, `GA4 Tokens`

---

### 3️⃣ Frontend (2 minute)

```bash
cd frontend

# Pornește frontend
npm run dev
```

**Verificare:**
- Accesează: http://localhost:3000/agency/dashboard
- Ar trebui să vezi cele 3 carduri: Meta, Google Ads, GA4

---

## 🧪 Testare Rapidă (2 minute)

### Test 1: Meta OAuth

1. Login: http://localhost:3000/login
2. Dashboard: http://localhost:3000/agency/dashboard
3. Click "Connect Meta"
4. Pop-up se deschide → Login Facebook
5. Pop-up se închide automat
6. Card Meta afișează "✅ Connected"

**Verificare Database:**
```sql
SELECT user_id, name, meta_user_id, expiry_date
FROM meta_tokens;
```

---

## ❌ Dacă Întâmpini Probleme

### Problema: Pop-up blocat
**Soluție:** Permite pop-up-uri pentru localhost:3000 în browser settings

### Problema: "Invalid state"
**Soluție:** Șterge state-urile vechi:
```sql
DELETE FROM oauth_states WHERE expires_at < NOW();
```

### Problema: CORS errors
**Soluție:** Verifică `backend/config/settings.py`:
```python
CORS_ALLOWED_ORIGINS = ['http://localhost:3000']
FRONTEND_URL = 'http://localhost:3000'
```

---

## 📚 Documentație Completă

Pentru detalii complete, consultă:

1. **Setup Complet:** `OAUTH_REFACTORING_GUIDE.md`
2. **Rezumat Implementare:** `OAUTH_IMPLEMENTATION_SUMMARY.md`

---

## ✅ Checklist Minim

- [ ] SQL script rulat în pgAdmin
- [ ] `python manage.py migrate` rulat
- [ ] Backend pornit pe localhost:8000
- [ ] Frontend pornit pe localhost:3000
- [ ] Pop-up-uri permise în browser

---

**🎉 Gata! Acum poți testa OAuth flows!**
