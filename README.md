# Meta Ads Integration MVP

Internal tool to connect Meta Ads, store tokens, and fetch insights.

## Structure
- `frontend/` - Next.js (TypeScript)
- `backend/` - Django + DRF

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your keys
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local with your keys
npm run dev
```

Access at http://localhost:3000
```

---

### 2. Backend Files

**`backend/requirements.txt`**
```
Django==5.0.1
djangorestframework==3.14.0
django-cors-headers==4.3.1
python-dotenv==1.0.0
requests==2.31.0
```

**`backend/.env.example`**
```
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_DEBUG=True
INTERNAL_API_KEY=dev-internal-key-123
MOCK_META=true

# Meta credentials (for Milestone 2)
META_APP_ID=
META_APP_SECRET=
META_REDIRECT_URI=http://localhost:3000/api/meta/callback