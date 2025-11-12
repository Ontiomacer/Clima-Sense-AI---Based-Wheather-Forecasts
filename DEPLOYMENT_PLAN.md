# 🚀 ClimaSense AI - Complete Deployment Plan

## Overview
This deployment plan ensures your ClimaSense AI application works exactly as it does on localhost, with all services properly configured and connected.

---

## 📊 Architecture Overview

Your application has **4 main components**:

1. **Frontend (React + Vite)** - Port 5170
2. **AI Backend (FastAPI + Python)** - Port 8000
3. **GEE Server (Node.js)** - Port 3001
4. **AI Forecast Server (Node.js)** - Port 3002

### Current Localhost Setup
```
Frontend (5170) → AI Backend (8000) → GraphCast + AgriBERT
                → GEE Server (3001) → Google Earth Engine
                → AI Forecast (3002) → NASA POWER API
```

---

## 🎯 Deployment Strategy

### Option 1: Full Cloud Deployment (Recommended)
**Best for**: Production use, scalability, reliability

| Component | Platform | Why |
|-----------|----------|-----|
| Frontend | Vercel | Free, auto-deploy, CDN, perfect for React |
| AI Backend | Railway/Render | Python support, persistent storage for models |
| GEE Server | Railway/Render | Node.js support, environment variables |
| AI Forecast | Railway/Render | Node.js support, API integration |
| Database | Supabase | Free tier, PostgreSQL, real-time features |

### Option 2: Hybrid Deployment
**Best for**: Testing, cost optimization

- Frontend: Vercel (free)
- All Backends: Single Railway instance with Docker
- Database: Supabase (free)

### Option 3: VPS Deployment
**Best for**: Full control, custom requirements

- Everything on single VPS (DigitalOcean, AWS EC2, etc.)
- Use Docker Compose for orchestration
- Nginx as reverse proxy

---

## 📝 Step-by-Step Deployment Guide

## Phase 1: Prepare Environment Variables

### 1.1 Frontend Environment Variables (.env)
```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here

# Google Services
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_GEE_PROJECT_ID=massive-hexagon-452605-m0

# API Endpoints (will be updated after backend deployment)
VITE_AI_BACKEND_URL=http://localhost:8000
VITE_GEE_SERVER_URL=http://localhost:3001
VITE_AI_FORECAST_URL=http://localhost:3002

# Weather APIs
VITE_OPENWHEATHER_API_KEY=your_openweather_key
VITE_NASA_API_KEY=your_nasa_key (optional)
```

### 1.2 AI Backend Environment Variables (ai-backend/.env)
```env
PORT=8000
ENVIRONMENT=production
CORS_ORIGINS=https://your-frontend.vercel.app
MODEL_CACHE_DIR=/app/models
LOG_LEVEL=INFO
PYTHONUNBUFFERED=1
```

### 1.3 GEE Server Environment Variables
```env
GEE_SERVER_PORT=3001
GEE_SERVICE_ACCOUNT_PATH=./massive-hexagon-452605-m0-8ada8fb9ccf6.json
VITE_GEE_PROJECT_ID=massive-hexagon-452605-m0
```

### 1.4 AI Forecast Server Environment Variables
```env
AI_FORECAST_PORT=3002
VITE_OPENWHEATHER_API_KEY=your_openweather_key
VITE_NASA_API_KEY=your_nasa_key (optional)
```

---

## Phase 2: Deploy Backend Services

### 2.1 Deploy AI Backend (Railway)

**Step 1: Create Railway Project**
1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your ClimaSense AI repository

**Step 2: Configure Service**
```yaml
Root Directory: ai-backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

**Step 3: Add Environment Variables**
- Go to Variables tab
- Add all variables from section 1.2
- Add: `PYTHON_VERSION=3.11`

**Step 4: Deploy**
- Railway will auto-deploy
- Note the URL: `https://your-ai-backend.railway.app`
- Test: `https://your-ai-backend.railway.app/health`

**Important Notes:**
- GraphCast models are large (~1GB). Railway provides persistent storage.
- First request will be slow (model loading). Consider warming up.
- Monitor memory usage (upgrade plan if needed).

### 2.2 Deploy GEE Server (Railway)

**Step 1: Create New Service**
1. In same Railway project, click "New Service"
2. Select "GitHub Repo" → Choose your repo again

**Step 2: Configure Service**
```yaml
Root Directory: server
Build Command: npm install
Start Command: node gee-server.js
```

**Step 3: Add Environment Variables**
- Add variables from section 1.3
- **CRITICAL**: Add Google Cloud credentials as secret

**Adding GEE Credentials:**
```bash
# Option A: Use Railway CLI
railway variables set GEE_SERVICE_ACCOUNT="$(cat massive-hexagon-452605-m0-8ada8fb9ccf6.json)"

# Option B: Use Railway Dashboard
# 1. Copy entire JSON content
# 2. Create variable: GEE_SERVICE_ACCOUNT
# 3. Paste JSON as value
```

**Step 4: Update Code to Use Environment Variable**
Create `server/gee-server-production.js`:
```javascript
// Load credentials from environment variable
const serviceAccount = process.env.GEE_SERVICE_ACCOUNT 
  ? JSON.parse(process.env.GEE_SERVICE_ACCOUNT)
  : JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
```

**Step 5: Deploy**
- Note URL: `https://your-gee-server.railway.app`
- Test: `https://your-gee-server.railway.app/health`

### 2.3 Deploy AI Forecast Server (Railway)

**Step 1: Create New Service**
1. Click "New Service" in Railway project
2. Select your GitHub repo

**Step 2: Configure Service**
```yaml
Root Directory: server
Build Command: npm install
Start Command: node ai-forecast-server.js
```

**Step 3: Add Environment Variables**
- Add variables from section 1.4

**Step 4: Deploy**
- Note URL: `https://your-ai-forecast.railway.app`
- Test: `https://your-ai-forecast.railway.app/health`

---

## Phase 3: Setup Database (Supabase)

### 3.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Wait for database initialization (~2 minutes)

### 3.2 Run Migrations

1. Go to SQL Editor in Supabase dashboard
2. Run your migration files:

```sql
-- From supabase/migrations/20251106040136_ba9a57bf-d62f-4e2c-bef6-8883676b5000.sql
-- Copy and paste content

-- From supabase/migrations/20251106040213_bb2359ab-2431-495b-bdcc-12eab2956a03.sql
-- Copy and paste content
```

### 3.3 Get API Keys

1. Go to Project Settings → API
2. Copy:
   - Project URL
   - `anon` public key
3. Save for frontend configuration

### 3.4 Configure Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecasts ENABLE ROW LEVEL SECURITY;

-- Add policies (adjust based on your needs)
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON forecasts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## Phase 4: Deploy Frontend (Vercel)

### 4.1 Update API URLs

Before deploying, update your frontend to use production URLs:

**Option A: Update .env**
```env
VITE_AI_BACKEND_URL=https://your-ai-backend.railway.app
VITE_GEE_SERVER_URL=https://your-gee-server.railway.app
VITE_AI_FORECAST_URL=https://your-ai-forecast.railway.app
```

**Option B: Update vercel.json (Recommended)**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    }
  ],
  "routes": [
    {
      "src": "/api/gee-data",
      "dest": "https://your-gee-server.railway.app/api/gee-data"
    },
    {
      "src": "/api/ai-forecast",
      "dest": "https://your-ai-forecast.railway.app/api/ai-forecast"
    },
    {
      "src": "/api/(.*)",
      "dest": "https://your-ai-backend.railway.app/api/$1"
    },
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

### 4.2 Deploy to Vercel

**Method 1: Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

5. Add Environment Variables:
   - Add all variables from section 1.1
   - Update API URLs to production URLs

6. Click "Deploy"

**Method 2: Vercel CLI**
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Follow prompts to configure
```

### 4.3 Test Deployment

1. Visit your Vercel URL: `https://your-project.vercel.app`
2. Test all features:
   - ✅ Homepage loads
   - ✅ Navigation works
   - ✅ Language switching works
   - ✅ Dashboard displays data
   - ✅ Map shows satellite data
   - ✅ AI Chat responds
   - ✅ Forecast generates

---

## Phase 5: Update CORS Settings

### 5.1 Update AI Backend CORS

Update `ai-backend/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-project.vercel.app",
        "https://your-custom-domain.com",  # if you have one
        "http://localhost:5170"  # keep for local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Commit and push to trigger Railway redeploy.

### 5.2 Update GEE Server CORS

Update `server/gee-server.js`:
```javascript
app.use(cors({
  origin: [
    'https://your-project.vercel.app',
    'https://your-custom-domain.com',
    'http://localhost:5170'
  ],
  credentials: true
}));
```

### 5.3 Update AI Forecast Server CORS

Update `server/ai-forecast-server.js`:
```javascript
app.use(cors({
  origin: [
    'https://your-project.vercel.app',
    'https://your-custom-domain.com',
    'http://localhost:5170'
  ],
  credentials: true
}));
```

---

## Phase 6: Configure Custom Domain (Optional)

### 6.1 Frontend Domain (Vercel)

1. Go to Vercel Project Settings → Domains
2. Add your domain: `climasense.ai`
3. Update DNS records:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```
4. Wait for SSL certificate (automatic)

### 6.2 Backend Domains (Railway)

1. Go to each Railway service → Settings → Domains
2. Add custom domains:
   - `api.climasense.ai` → AI Backend
   - `gee.climasense.ai` → GEE Server
   - `forecast.climasense.ai` → AI Forecast

3. Update DNS:
   ```
   Type: CNAME
   Name: api
   Value: your-ai-backend.railway.app
   
   Type: CNAME
   Name: gee
   Value: your-gee-server.railway.app
   
   Type: CNAME
   Name: forecast
   Value: your-ai-forecast.railway.app
   ```

4. Update frontend environment variables with new URLs

---

## Phase 7: Testing & Validation

### 7.1 Automated Testing Checklist

```bash
# Test AI Backend
curl https://your-ai-backend.railway.app/health
curl -X POST https://your-ai-backend.railway.app/api/agri_analysis \
  -H "Content-Type: application/json" \
  -d '{"text": "My crops are showing yellow leaves"}'

# Test GEE Server
curl https://your-gee-server.railway.app/health

# Test AI Forecast
curl https://your-ai-forecast.railway.app/health
curl -X POST https://your-ai-forecast.railway.app/api/ai-forecast \
  -H "Content-Type: application/json" \
  -d '{"lat": 18.5204, "lon": 73.8567, "location": "Pune"}'
```

### 7.2 Manual Testing Checklist

- [ ] Homepage loads correctly
- [ ] All navigation links work
- [ ] Language selector switches between EN/HI/MR
- [ ] Dashboard displays weather data
- [ ] Map shows satellite imagery
- [ ] AI Chat responds in selected language
- [ ] Forecast page generates predictions
- [ ] Agriculture page shows metrics
- [ ] Contact form works
- [ ] Mobile responsive design works
- [ ] Dark/Light theme toggle works

### 7.3 Performance Testing

```bash
# Install Lighthouse
npm install -g lighthouse

# Run audit
lighthouse https://your-project.vercel.app --view

# Check for:
# - Performance > 80
# - Accessibility > 90
# - Best Practices > 90
# - SEO > 90
```

---

## Phase 8: Monitoring & Maintenance

### 8.1 Setup Monitoring

**Vercel Analytics** (Built-in)
- Automatically enabled
- View in Vercel Dashboard → Analytics

**Railway Metrics** (Built-in)
- View in Railway Dashboard → Metrics
- Monitor CPU, Memory, Network

**Sentry (Optional - Error Tracking)**
```bash
npm install @sentry/react @sentry/vite-plugin
```

```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
  tracesSampleRate: 1.0,
});
```

### 8.2 Setup Alerts

**Railway Alerts:**
1. Go to Project Settings → Notifications
2. Add email/Slack webhook
3. Configure alerts for:
   - Service crashes
   - High memory usage
   - Deployment failures

**Uptime Monitoring:**
- Use [UptimeRobot](https://uptimerobot.com) (free)
- Monitor all endpoints every 5 minutes
- Get email alerts on downtime

### 8.3 Backup Strategy

**Database Backups (Supabase):**
- Automatic daily backups (Pro plan)
- Manual backups: Database → Backups → Create backup

**Code Backups:**
- Already on GitHub
- Consider GitHub Actions for automated backups

---

## 🔧 Troubleshooting Guide

### Issue 1: CORS Errors

**Symptoms:** "Access to fetch blocked by CORS policy"

**Solution:**
1. Check backend CORS configuration
2. Ensure frontend URL is in `allow_origins`
3. Redeploy backend after changes
4. Clear browser cache

### Issue 2: AI Backend Timeout

**Symptoms:** 504 Gateway Timeout on first request

**Solution:**
1. GraphCast model loading takes time (~30s)
2. Implement health check warming:
   ```bash
   # Add to Railway startup
   curl https://your-ai-backend.railway.app/health
   ```
3. Consider keeping service warm with cron job

### Issue 3: GEE Authentication Failed

**Symptoms:** "Earth Engine authentication failed"

**Solution:**
1. Verify service account JSON is correct
2. Check GEE project permissions
3. Ensure service account has Earth Engine API enabled
4. Test locally first

### Issue 4: Environment Variables Not Loading

**Symptoms:** "undefined" or "null" values

**Solution:**
1. Verify variables are set in platform dashboard
2. Check variable names match exactly (case-sensitive)
3. Restart service after adding variables
4. For Vite: Variables must start with `VITE_`

### Issue 5: Build Failures

**Symptoms:** Deployment fails during build

**Solution:**
```bash
# Test build locally
npm run build

# Check for:
# - TypeScript errors
# - Missing dependencies
# - Environment variable issues

# Fix and redeploy
git add .
git commit -m "Fix build issues"
git push
```

---

## 💰 Cost Estimation

### Free Tier (Development/Testing)
- **Vercel**: Free (Hobby plan)
  - 100GB bandwidth
  - Unlimited deployments
  
- **Railway**: $5/month credit (500 hours)
  - 3 services × ~$1.67/month each
  
- **Supabase**: Free
  - 500MB database
  - 50,000 monthly active users
  
**Total: ~$5/month**

### Production (Small Scale)
- **Vercel**: $20/month (Pro plan)
  - Custom domains
  - Advanced analytics
  
- **Railway**: $20-40/month
  - AI Backend: $15/month (2GB RAM)
  - GEE Server: $5/month (512MB RAM)
  - AI Forecast: $5/month (512MB RAM)
  
- **Supabase**: $25/month (Pro plan)
  - 8GB database
  - Daily backups
  
**Total: ~$65-85/month**

### Production (Medium Scale)
- **Vercel**: $20/month
- **Railway**: $60-100/month (scaled services)
- **Supabase**: $25/month
- **CDN**: $10/month (Cloudflare Pro)

**Total: ~$115-155/month**

---

## 📋 Pre-Deployment Checklist

### Code Preparation
- [ ] All sensitive data removed from code
- [ ] Environment variables documented
- [ ] .gitignore includes credentials
- [ ] Build succeeds locally
- [ ] All tests pass
- [ ] TypeScript compiles without errors

### Service Configuration
- [ ] Supabase project created
- [ ] Railway projects created
- [ ] Vercel project created
- [ ] All environment variables set
- [ ] CORS configured correctly
- [ ] API keys obtained

### Security
- [ ] Google Cloud credentials secured
- [ ] API keys not in code
- [ ] RLS policies configured
- [ ] HTTPS enforced
- [ ] Rate limiting considered

### Testing
- [ ] Local build tested
- [ ] All features work locally
- [ ] API endpoints tested
- [ ] Mobile responsive checked
- [ ] Cross-browser tested

---

## 🚀 Quick Deploy Commands

```bash
# 1. Commit latest changes
git add .
git commit -m "Prepare for deployment"
git push origin main

# 2. Deploy frontend (if using Vercel CLI)
vercel --prod

# 3. Railway will auto-deploy on push

# 4. Test all endpoints
curl https://your-project.vercel.app
curl https://your-ai-backend.railway.app/health
curl https://your-gee-server.railway.app/health
curl https://your-ai-forecast.railway.app/health
```

---

## 📞 Support & Resources

### Documentation
- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Supabase Docs](https://supabase.com/docs)
- [FastAPI Docs](https://fastapi.tiangolo.com)

### Community
- GitHub Issues: Your repository
- Discord: Railway, Supabase communities
- Stack Overflow: Tag with relevant technologies

---

## ✅ Post-Deployment Tasks

1. **Update README.md** with live URLs
2. **Add status badge** to repository
3. **Setup monitoring** and alerts
4. **Document API endpoints** for team
5. **Create backup schedule**
6. **Plan scaling strategy**
7. **Setup CI/CD pipeline**
8. **Monitor costs** and optimize

---

**Deployment Status**: Ready to Deploy 🚀

**Estimated Time**: 2-3 hours for full deployment

**Next Steps**: Start with Phase 1 - Environment Variables
