# 🚀 Deploy ClimaSense AI - Quick Guide

Your repository is ready! Follow these steps to deploy.

## 📦 Repository

**GitHub**: https://github.com/Ontiomacer/Clima-Sense-AI---Based-Wheather-Forecasts

## ⚡ Quick Deploy Steps

### 1. Frontend Deployment (Vercel) - 5 minutes

#### Option A: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Ontiomacer/Clima-Sense-AI---Based-Wheather-Forecasts)

#### Option B: Manual Deploy

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import: `https://github.com/Ontiomacer/Clima-Sense-AI---Based-Wheather-Forecasts`
4. Configure:
   ```
   Framework: Vite
   Build Command: npm run build
   Output Directory: dist
   ```
5. Add Environment Variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
   ```
6. Click "Deploy"

**Result**: Your frontend will be live at `https://your-project.vercel.app`

### 2. Backend Deployment (Railway) - 5 minutes

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select: `Ontiomacer/Clima-Sense-AI---Based-Wheather-Forecasts`
4. Configure:
   - **Root Directory**: `ai-backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variables:
   ```
   PORT=8000
   ENVIRONMENT=production
   CORS_ORIGINS=https://your-frontend.vercel.app
   ```
6. Deploy

**Result**: Your backend will be live at `https://your-project.railway.app`

### 3. Database Setup (Supabase) - 3 minutes

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to SQL Editor and run:
   ```sql
   CREATE TABLE users (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     email TEXT UNIQUE NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );
   
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ```
4. Copy API keys from Settings → API
5. Add to Vercel environment variables

### 4. Update Frontend with Backend URL

1. Go to Vercel project settings
2. Add environment variable:
   ```
   VITE_API_URL=https://your-backend.railway.app
   ```
3. Redeploy

### 5. Update Backend CORS

1. Go to Railway project settings
2. Update environment variable:
   ```
   CORS_ORIGINS=https://your-frontend.vercel.app
   ```
3. Redeploy

## ✅ Verification

### Test Frontend
- Visit: `https://your-project.vercel.app`
- Check: Dashboard loads
- Test: Language switching
- Verify: Map displays

### Test Backend
- Visit: `https://your-backend.railway.app/api/health`
- Should return: `{"status": "healthy"}`

### Test Integration
- Open frontend
- Go to AI Chat
- Send a message
- Should get AI response

## 🎯 Post-Deployment

### Custom Domain (Optional)

**Frontend:**
1. Vercel → Settings → Domains
2. Add your domain
3. Update DNS records

**Backend:**
1. Railway → Settings → Domains
2. Add your domain
3. Update DNS records

### Monitoring

**Vercel:**
- Analytics: Built-in
- Logs: Deployments → Logs

**Railway:**
- Metrics: Dashboard → Metrics
- Logs: Deployments → Logs

## 🔧 Troubleshooting

### Build Fails

**Frontend:**
```bash
# Test locally first
npm run build
```

**Backend:**
```bash
# Test locally first
cd ai-backend
pip install -r requirements.txt
python main.py
```

### CORS Errors

1. Check `CORS_ORIGINS` in Railway
2. Ensure it matches your Vercel URL
3. Redeploy backend

### Environment Variables Missing

1. Double-check all variables are set
2. No typos in variable names
3. Redeploy after adding variables

## 📊 Deployment Status

- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Railway
- [ ] Database setup on Supabase
- [ ] Environment variables configured
- [ ] CORS configured
- [ ] Custom domain added (optional)
- [ ] SSL certificates active
- [ ] Monitoring setup

## 🎉 Success!

Once all steps are complete:
- ✅ Frontend: Live and accessible
- ✅ Backend: API responding
- ✅ Database: Connected
- ✅ Features: All working
- ✅ Languages: English, Hindi, Marathi

## 📞 Need Help?

- **Issues**: https://github.com/Ontiomacer/Clima-Sense-AI---Based-Wheather-Forecasts/issues
- **Discussions**: https://github.com/Ontiomacer/Clima-Sense-AI---Based-Wheather-Forecasts/discussions
- **Documentation**: See README.md

---

**Estimated Total Time**: 15-20 minutes

**Cost**: Free tier available for all services

**Status**: Ready to Deploy! 🚀
