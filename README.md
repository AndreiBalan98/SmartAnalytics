# SmartAnalytics

Marketing analytics platform for agencies. Connects Meta Ads, Google Ads, and GA4 to provide unified data and insights for agencies and their clients.

- **Backend:** Django + DRF (4 apps: users, oauth, meta, core)
- **Frontend:** Next.js 14 + TypeScript
- **Database:** PostgreSQL

See [DOCUMENTATION.md](DOCUMENTATION.md) for full details.

## Quick Start

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

# Frontend
cd frontend
npm install
npm run dev
```

Access frontend at http://localhost:3000, admin at http://localhost:8000/bigboss/

<img width="1919" height="1038" alt="image" src="https://github.com/user-attachments/assets/13a0f7ca-2dc6-4646-afc8-f45886850f0a" />
