# SmartAnalytics

SmartAnalytics is a marketing analytics platform built for agencies. It connects to Meta Ads, Google Ads, and Google Analytics 4, pulls the data into a PostgreSQL database, and presents it through a dashboard that agencies can give their clients access to with fine-grained permissions.

The idea is straightforward: agencies often manage ad accounts on behalf of clients. Instead of giving clients raw access to ad manager interfaces they may not understand, SmartAnalytics syncs the data and presents it in a clean, controlled view. Agencies can decide exactly which accounts or properties each client can see.

---

## What it does

- Agencies connect their Meta Ads, Google Ads, and GA4 accounts via OAuth
- Data is synced on demand: campaign structure, ad sets, ads, daily metrics, and lead form submissions
- Agencies create client accounts and assign permissions per platform and per account
- Clients log in and see only what they have been given access to
- The dashboard shows performance metrics (spend, impressions, clicks, CPM, CPC, CTR) with charts and filterable tables

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Django 5 + Django REST Framework |
| Auth | JWT via SimpleJWT |
| Database | PostgreSQL |
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + Framer Motion |
| Charts | Recharts |
| Deployment | Render (backend) + Vercel (frontend) |

---

## Project structure

```
SmartAnalytics/
  backend/          Django project (6 apps: users, oauth, meta, google_ads, ga4, core)
  frontend/         Next.js app (App Router, TypeScript)
  DOCUMENTATION.md  Full technical reference
```

---

## Getting started

**Backend**

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in your credentials
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

**Frontend**

```bash
cd frontend
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL
npm run dev
```

Frontend runs on `http://localhost:3000`, Django admin is at `http://localhost:8000/bigboss/`.

---

## Documentation

- [Backend README](backend/README.md) — Django apps, models, API endpoints, OAuth and sync internals
- [Frontend README](frontend/README.md) — Next.js pages, components, auth flow, API client
- [DOCUMENTATION.md](DOCUMENTATION.md) — Full technical reference: schema, all endpoints, deployment, env vars

---

<img width="1919" height="1038" alt="image" src="https://github.com/user-attachments/assets/13a0f7ca-2dc6-4646-afc8-f45886850f0a" />
