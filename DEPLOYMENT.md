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
- [ ] **Clerk account (for authentication)** - [Sign up here](https://clerk.com)
- [ ] Vercel account (for frontend)
- [ ] Railway/Render account (for backend)
- [ ] Supabase account (for database)
- [ ] Google Cloud account (for Maps API)

**Priority Setup:** Start with Clerk authentication as it's required for the application to function.

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
# Clerk Authentication (Required)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key

# Supabase Database
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key

# Backend API
VITE_API_URL=https://your-backend.railway.app
```

**Note:** Clerk authentication is required. See [CLERK_SETUP.md](CLERK_SETUP.md) for detailed setup instructions.

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
   - **Required for Clerk Authentication:**
     - `VITE_CLERK_PUBLISHABLE_KEY` - Get from [Clerk Dashboard](https://dashboard.clerk.com/)
     - Select all environments: Production, Preview, Development
   - **📖 Detailed Instructions:** See [VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md) for step-by-step guide
   - **Quick Reference:** See [VERCEL_CLERK_CONFIG.md](./VERCEL_CLERK_CONFIG.md) for Clerk-specific setup

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your site will be live at `https://your-project.vercel.app`

5. **Configure Clerk for Production**
   - After deployment, go to [Clerk Dashboard](https://dashboard.clerk.com/)
   - Navigate to Domains section
   - Add your Vercel production URL: `https://your-project.vercel.app`
   - Configure redirect URLs in Paths section:
     - Sign-in URL: `/sign-in`
     - Sign-up URL: `/sign-up`
     - Home URL: `/` (landing page)
     - After sign-in: `/dashboard`
     - After sign-up: `/dashboard`
   - Test authentication flow on live site
   - **📖 See [CLERK_SETUP.md](CLERK_SETUP.md) for complete Clerk configuration guide**

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

- [ ] **Clerk authentication configured** (see [CLERK_SETUP.md](CLERK_SETUP.md))
- [ ] Environment variables set correctly
- [ ] Clerk publishable key added to Vercel
- [ ] Production domain added to Clerk dashboard
- [ ] CORS configured properly
- [ ] API keys not exposed in frontend
- [ ] HTTPS enabled (automatic)
- [ ] Database RLS policies enabled
- [ ] Rate limiting configured
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] XSS protection enabled
- [ ] Protected routes working correctly

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
# - Landing page loads correctly
# - Sign-up/Sign-in flow works
# - Protected routes redirect to sign-in
# - Navigation after authentication
# - API calls
# - Language switching
# - AI Chat
# - Map functionality
# - Sign-out functionality
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

### Pre-Deployment
- [ ] Repository pushed to GitHub
- [ ] **Clerk account created and configured** (see [CLERK_SETUP.md](CLERK_SETUP.md))
- [ ] Environment variables configured locally
- [ ] Local testing completed (landing page, auth flow, protected routes)

### Deployment
- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Railway
- [ ] Database setup on Supabase
- [ ] **Clerk publishable key added to Vercel**
- [ ] **Production domain added to Clerk dashboard**
- [ ] Custom domains configured
- [ ] SSL certificates active
- [ ] CORS configured correctly

### Post-Deployment
- [ ] **Authentication flow tested on live site**
- [ ] **Landing page displays correctly**
- [ ] **Protected routes working**
- [ ] **Sign-up/Sign-in/Sign-out tested**
- [ ] Monitoring setup
- [ ] Backup strategy in place
- [ ] Documentation updated
- [ ] Team notified

---

**Deployment Status**: Ready for Production 🚀

Last Updated: November 2024
