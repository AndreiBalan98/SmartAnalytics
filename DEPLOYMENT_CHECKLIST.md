# Deployment Checklist

Use this checklist when deploying SmartAnalytics to production.

---

## Pre-Deployment

### Local Validation
- [ ] Run `python validate_production.py` - All checks pass
- [ ] Run `python backend/test_meta_ads.py` - 7/7 tests pass
- [ ] Run `cd backend && python manage.py check --deploy` - No critical issues
- [ ] Run `cd frontend && npm run build` - Build succeeds
- [ ] Git commit all changes
- [ ] Push to GitHub main branch

### Accounts Setup
- [ ] Create Render account (https://render.com)
- [ ] Create Vercel account (https://vercel.com)
- [ ] Verify GitHub connected to both services

---

## Backend Deployment (Render)

### Database Setup
- [ ] Create PostgreSQL database on Render
- [ ] Name: `smartanalytics-db`
- [ ] Plan: Free or Starter
- [ ] Copy Internal Database URL

### Web Service Setup
- [ ] Create new Web Service on Render
- [ ] Connect GitHub repository
- [ ] Name: `smartanalytics-backend`
- [ ] Root Directory: `backend`
- [ ] Build Command: `./build.sh`
- [ ] Start Command: `gunicorn config.wsgi:application`
- [ ] Plan: Free or Starter

### Environment Variables
Add these in Render dashboard:

- [ ] `DJANGO_SECRET_KEY` - Generate with Django
- [ ] `DJANGO_DEBUG` - Set to `False`
- [ ] `DATABASE_URL` - Paste from database (Internal URL)
- [ ] `FRONTEND_URL` - Will add after Vercel deployment
- [ ] `META_APP_ID` - From Meta Developer Console
- [ ] `META_APP_SECRET` - From Meta Developer Console
- [ ] `RENDER_EXTERNAL_HOSTNAME` - Your .onrender.com URL

### Deploy Backend
- [ ] Click "Create Web Service"
- [ ] Wait for build to complete (~5 minutes)
- [ ] Check logs for errors
- [ ] Test health endpoint: `https://your-app.onrender.com/health/`
- [ ] Should return: `{"status": "ok"}`

---

## Frontend Deployment (Vercel)

### Project Setup
- [ ] Import GitHub repository to Vercel
- [ ] Framework: Next.js
- [ ] Root Directory: `frontend`
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `.next`

### Environment Variables
Add in Vercel dashboard:

- [ ] `NEXT_PUBLIC_API_URL` - Your Render backend URL

### Deploy Frontend
- [ ] Click "Deploy"
- [ ] Wait for build (~2 minutes)
- [ ] Copy Vercel deployment URL

### Update Backend CORS
- [ ] Go back to Render
- [ ] Add environment variable: `FRONTEND_URL` = Your Vercel URL
- [ ] Redeploy backend

---

## Meta App Configuration

### Update OAuth Settings
- [ ] Go to https://developers.facebook.com/apps/
- [ ] Select your app
- [ ] Go to Settings → Basic
- [ ] Add App Domains:
  - [ ] Your Vercel domain (e.g., `your-app.vercel.app`)
  - [ ] Your Render domain (e.g., `your-app.onrender.com`)

### Update OAuth Redirect URIs
- [ ] Go to Products → Facebook Login → Settings
- [ ] Add Valid OAuth Redirect URI:
  - [ ] `https://your-app.vercel.app/agency/meta-callback`
- [ ] Save changes
- [ ] Switch app to Live mode (if not already)

---

## Post-Deployment Testing

### Backend Health
- [ ] `curl https://your-backend.onrender.com/health/`
- [ ] Returns: `{"status": "ok"}`
- [ ] `curl https://your-backend.onrender.com/api/meta/sync/status/`
- [ ] Returns 401 (authentication required) - Good!

### Frontend Access
- [ ] Open `https://your-app.vercel.app`
- [ ] Landing page loads correctly
- [ ] Agency signup page accessible
- [ ] Agency login page accessible
- [ ] Client login page accessible

### End-to-End Flow

**Agency Flow:**
- [ ] Sign up as new agency
- [ ] Email received (if email configured)
- [ ] Login successful
- [ ] Dashboard loads
- [ ] Click "Connect Meta"
- [ ] OAuth popup opens (not redirect)
- [ ] Complete OAuth
- [ ] Popup closes
- [ ] Integration status shows "Connected"
- [ ] Click "Sync Data" → Structural sync
- [ ] Check logs on Render - no errors
- [ ] Sync completes successfully
- [ ] Create test client
- [ ] Assign ad account permissions to client

**Client Flow:**
- [ ] Login as client (with temp password)
- [ ] Dashboard loads
- [ ] 3-panel layout displays
- [ ] Left panel shows ad accounts
- [ ] Click ad account - selects correctly
- [ ] Right panel navigation works
- [ ] Click "Campaigns" - data displays
- [ ] Click "Insights" - summary cards show
- [ ] No permission errors
- [ ] Data loads correctly

---

## Security Verification

### SSL/HTTPS
- [ ] Backend URL uses HTTPS
- [ ] Frontend URL uses HTTPS
- [ ] No mixed content warnings

### Authentication
- [ ] Cannot access dashboard without login
- [ ] Token expiration works
- [ ] Refresh token works
- [ ] Logout clears session

### Authorization
- [ ] Client cannot access other client's data
- [ ] Agency can only access their own data
- [ ] Permission filtering works correctly
- [ ] No data leakage in API responses

---

## Monitoring Setup

### Render Monitoring
- [ ] Enable email notifications
- [ ] Check "Metrics" tab for resource usage
- [ ] Enable automatic backups for PostgreSQL
- [ ] Set up uptime monitoring (optional)

### Vercel Monitoring
- [ ] Check Analytics dashboard
- [ ] Review function logs
- [ ] Check for build errors
- [ ] Enable preview deployments for PRs

### Application Monitoring
- [ ] Check `meta_ads_syncstate` for failed syncs
- [ ] Monitor database size growth
- [ ] Check error logs regularly
- [ ] Consider adding Sentry (optional)

---

## Performance Checks

### Backend Performance
- [ ] Health check responds in < 500ms
- [ ] API endpoints respond in < 2s
- [ ] Database queries optimized
- [ ] Static files loading correctly

### Frontend Performance
- [ ] Landing page loads in < 2s
- [ ] Dashboard loads in < 3s
- [ ] Images optimized
- [ ] No console errors

---

## Documentation Updates

- [ ] Update README.md with production URLs
- [ ] Document environment variables
- [ ] Update Meta OAuth callback URLs in docs
- [ ] Add troubleshooting section for common issues

---

## Backup & Recovery

### Database Backups
- [ ] Verify automatic backups enabled (Render)
- [ ] Test database restore process
- [ ] Document backup schedule
- [ ] Store backup of environment variables

### Code Backups
- [ ] GitHub repository up to date
- [ ] All branches pushed
- [ ] Tags created for releases
- [ ] .env.example files committed

---

## Custom Domain (Optional)

### Backend Custom Domain
- [ ] Purchase domain
- [ ] Add CNAME record to Render
- [ ] Verify SSL certificate issued
- [ ] Update environment variables

### Frontend Custom Domain
- [ ] Add domain to Vercel project
- [ ] Update DNS records
- [ ] Verify SSL certificate issued
- [ ] Update Meta app domains

---

## Final Verification

- [ ] All checklist items completed
- [ ] No critical errors in logs
- [ ] Test account works end-to-end
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Monitoring active
- [ ] Team notified of deployment
- [ ] Documentation updated

---

## Rollback Plan

If deployment fails:

1. **Backend Issues:**
   - Check Render logs
   - Verify environment variables
   - Redeploy previous working commit
   - Check database migrations

2. **Frontend Issues:**
   - Check Vercel build logs
   - Verify environment variables
   - Redeploy previous working commit
   - Check API connectivity

3. **Database Issues:**
   - Restore from backup
   - Check connection string
   - Verify migrations applied
   - Check resource limits

---

## Support Contacts

- **Render Support:** https://render.com/docs
- **Vercel Support:** https://vercel.com/support
- **Meta Developer Support:** https://developers.facebook.com/support

---

**Deployment Status:**

- [ ] Ready to deploy
- [ ] Deployed to staging
- [ ] Deployed to production
- [ ] Verified working
- [ ] Documented

**Date Deployed:** _______________

**Deployed By:** _______________

**Production URLs:**
- Backend: _______________
- Frontend: _______________
