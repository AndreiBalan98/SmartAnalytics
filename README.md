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