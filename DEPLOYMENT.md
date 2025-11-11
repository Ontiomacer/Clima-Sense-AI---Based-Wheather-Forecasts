# 🚀 ClimaSense AI - Deployment Guide

Complete guide for deploying ClimaSense AI to production.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Frontend Deployment](#frontend-deployment)
- [Backend Deployment](#backend-deployment)
- [Database Setup](#database-setup)
- [Domain Configuration](#domain-configuration)
- [Monitoring](#monitoring)

## Prerequisites

### Required Accounts
- [ ] GitHub account
- [ ] Vercel account (for frontend)
- [ ] Railway/Render account (for backend)
- [ ] Supabase account (for database)
- [ ] Google Cloud account (for Maps API)

### Required Tools
- Git
- Node.js 18+
- Python 3.11+
- npm or yarn

## 🌍 Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/Ontiomacer/Clima-Sense-AI---Based-Wheather-Forecasts.git
cd Clima-Sense-AI---Based-Wheather-Forecasts
```

### 2. Create Environment Files

**Frontend (.env):**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_API_URL=https://your-backend.railway.app
```

**Backend (ai-backend/.env):**
```env
PORT=8000
ENVIRONMENT=production
CORS_ORIGINS=https://your-frontend.vercel.app
MODEL_CACHE_DIR=/app/models
LOG_LEVEL=INFO
```

## 🎨 Frontend Deployment (Vercel)

### Option 1: Vercel Dashboard

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Build Settings**
   ```
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

3. **Add Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env`

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your site will be live at `https://your-project.vercel.app`

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Custom Domain

1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Wait for SSL certificate (automatic)

## 🐍 Backend Deployment (Railway)

### 1. Create New Project

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository

### 2. Configure Service

**Root Directory:** `ai-backend`

**Build Command:**
```bash
pip install -r requirements.txt
```

**Start Command:**
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

### 3. Environment Variables

Add in Railway dashboard:
```env
PORT=8000
ENVIRONMENT=production
PYTHON_VERSION=3.11
CORS_ORIGINS=https://your-frontend.vercel.app
```

### 4. Deploy

- Railway will automatically deploy on push to main branch
- Monitor logs in Railway dashboard
- Backend will be available at `https://your-project.railway.app`

## 🗄️ Database Setup (Supabase)

### 1. Create Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Wait for database to initialize

### 2. Run Migrations

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create forecasts table
CREATE TABLE forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  location TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecasts ENABLE ROW LEVEL SECURITY;
```

### 3. Get API Keys

1. Go to Project Settings → API
2. Copy `URL` and `anon public` key
3. Add to frontend environment variables

## 🌐 Domain Configuration

### Frontend Domain

1. **Vercel:**
   - Add custom domain in project settings
   - Update DNS:
     ```
     Type: CNAME
     Name: @
     Value: cname.vercel-dns.com
     ```

2. **SSL:**
   - Automatic via Vercel
   - Certificate renews automatically

### Backend Domain

1. **Railway:**
   - Add custom domain in project settings
   - Update DNS:
     ```
     Type: CNAME
     Name: api
     Value: your-project.railway.app
     ```

2. **CORS Update:**
   - Update `CORS_ORIGINS` in backend env
   - Redeploy backend

## 📊 Monitoring

### Frontend (Vercel)

- **Analytics:** Built-in Vercel Analytics
- **Logs:** Vercel Dashboard → Deployments → Logs
- **Performance:** Vercel Speed Insights

### Backend (Railway)

- **Logs:** Railway Dashboard → Deployments → Logs
- **Metrics:** Railway Dashboard → Metrics
- **Alerts:** Configure in Railway settings

### Custom Monitoring

**Add Sentry (Optional):**

```bash
npm install @sentry/react @sentry/vite-plugin
```

```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
});
```

## 🔒 Security Checklist

- [ ] Environment variables set correctly
- [ ] CORS configured properly
- [ ] API keys not exposed in frontend
- [ ] HTTPS enabled (automatic)
- [ ] Database RLS policies enabled
- [ ] Rate limiting configured
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] XSS protection enabled

## 🧪 Pre-Deployment Testing

### 1. Build Locally

```bash
# Frontend
npm run build
npm run preview

# Backend
cd ai-backend
python -m pytest
```

### 2. Test Production Build

```bash
# Serve production build
npx serve dist

# Test all features
# - Navigation
# - API calls
# - Language switching
# - AI Chat
# - Map functionality
```

### 3. Performance Testing

```bash
# Lighthouse audit
npx lighthouse http://localhost:4173 --view

# Check bundle size
npm run build -- --analyze
```

## 📦 CI/CD Setup (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: pip install -r ai-backend/requirements.txt
      - run: pytest ai-backend/tests
```

## 🔄 Update Process

### Frontend Updates

```bash
git add .
git commit -m "Update: description"
git push origin main
```

Vercel will automatically:
1. Detect push
2. Build new version
3. Deploy to production
4. Update live site

### Backend Updates

```bash
git add .
git commit -m "Update: description"
git push origin main
```

Railway will automatically:
1. Detect push
2. Build new image
3. Deploy to production
4. Zero-downtime deployment

## 🐛 Troubleshooting

### Build Failures

**Frontend:**
```bash
# Clear cache
rm -rf node_modules dist
npm install
npm run build
```

**Backend:**
```bash
# Clear Python cache
find . -type d -name __pycache__ -exec rm -r {} +
pip install -r requirements.txt --force-reinstall
```

### CORS Errors

1. Check `CORS_ORIGINS` in backend env
2. Ensure frontend URL is correct
3. Redeploy backend after changes

### Database Connection Issues

1. Check Supabase project status
2. Verify API keys are correct
3. Check RLS policies
4. Review connection logs

## 📈 Scaling

### Frontend
- Vercel automatically scales
- CDN distribution worldwide
- Edge functions for API routes

### Backend
- Railway: Upgrade plan for more resources
- Add horizontal scaling
- Implement caching (Redis)
- Use load balancer

### Database
- Supabase: Upgrade plan
- Add read replicas
- Implement connection pooling
- Optimize queries

## 💰 Cost Estimation

### Free Tier (Development)
- **Vercel**: Free (Hobby plan)
- **Railway**: $5/month (500 hours)
- **Supabase**: Free (500MB database)
- **Total**: ~$5/month

### Production (Small Scale)
- **Vercel**: $20/month (Pro plan)
- **Railway**: $20/month (Pro plan)
- **Supabase**: $25/month (Pro plan)
- **Total**: ~$65/month

### Production (Medium Scale)
- **Vercel**: $20/month
- **Railway**: $50/month (scaled)
- **Supabase**: $25/month
- **CDN**: $10/month
- **Total**: ~$105/month

## 📞 Support

- **Documentation**: See `/docs` folder
- **Issues**: GitHub Issues
- **Email**: support@climasense.ai

## ✅ Deployment Checklist

- [ ] Repository pushed to GitHub
- [ ] Environment variables configured
- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Railway
- [ ] Database setup on Supabase
- [ ] Custom domains configured
- [ ] SSL certificates active
- [ ] CORS configured correctly
- [ ] Monitoring setup
- [ ] Backup strategy in place
- [ ] Documentation updated
- [ ] Team notified

---

**Deployment Status**: Ready for Production 🚀

Last Updated: November 2024
