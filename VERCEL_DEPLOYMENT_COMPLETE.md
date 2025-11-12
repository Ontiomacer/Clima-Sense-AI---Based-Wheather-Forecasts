# 🚀 ClimaSense AI - Complete Vercel Deployment Guide

## ✅ What We'll Deploy (100% Free)

1. **Frontend** (React/Vite) → Vercel
2. **AI Forecast API** → Vercel Serverless Function
3. **GEE Data API** → Vercel Serverless Function  
4. **Agricultural Analysis API** → Vercel Serverless Function
5. **Database** → Supabase (Already done! ✅)

**Total Cost: $0/month**

---

## 📋 Pre-Deployment Checklist

### ✅ Already Completed:
- [x] Supabase database setup
- [x] Database migrations run
- [x] Local .env file created
- [x] Lovable branding removed

### 🔧 What We Need:
- [ ] Clerk Publishable Key (required, for authentication)
- [ ] Google Maps API Key (optional, for maps)
- [ ] OpenWeather API Key (optional, for current weather)

---

## 🚀 Step-by-Step Deployment

### STEP 1: Prepare Environment Variables

Before deploying, we need to gather API keys:

#### 1.1 Clerk Publishable Key (Required)
1. Go to: https://dashboard.clerk.com/
2. Sign up or log in to your account
3. Create a new application or select existing one
4. Go to "API Keys" in the sidebar
5. Copy the "Publishable Key" (starts with `pk_test_` or `pk_live_`)
6. **Important:** Also note your domain settings for later configuration

#### 1.2 Google Maps API Key (Optional)
1. Go to: https://console.cloud.google.com/apis/credentials
2. Create credentials → API Key
3. Restrict to "Maps JavaScript API"
4. Copy the key

#### 1.3 OpenWeather API Key (Optional)
1. Go to: https://openweathermap.org/api
2. Sign up for free account
3. Get your API key from dashboard
4. Copy the key

**Note:** If you skip the optional keys, the app will still work with limited features.

---

### STEP 2: Update Environment Variables

Update your `.env` file with any keys you obtained:

```env
# Supabase (Already configured ✅)
VITE_SUPABASE_URL=https://qnkhldedvyjmgvqmtfdu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Services (Add if you have them)
VITE_GOOGLE_MAPS_API_KEY=your_key_here_or_leave_empty
VITE_GEE_PROJECT_ID=massive-hexagon-452605-m0

# API Endpoints (Will use Vercel's built-in routing)
VITE_AI_BACKEND_URL=/api
VITE_GEE_SERVER_URL=/api
VITE_AI_FORECAST_URL=/api

# Weather APIs (Add if you have them)
VITE_OPENWHEATHER_API_KEY=your_key_here_or_leave_empty
```

---

### STEP 3: Test Build Locally

Before deploying, let's make sure everything builds:

```bash
# Install dependencies (if not already done)
npm install

# Build the project
npm run build

# Test the build
npm run preview
```

**Expected Result:** 
- Build completes without errors
- Preview server starts at http://localhost:4173
- Website loads and works

**If build fails:** Check the error message and fix before proceeding.

---

### STEP 4: Deploy to Vercel

#### 4.1 Sign Up / Sign In
1. Go to: https://vercel.com
2. Click "Sign Up" or "Log In"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub

#### 4.2 Import Project
1. Click "Add New..." → "Project"
2. Find your repository: `Clima-Sense-AI---Based-Wheather-Forecasts`
3. Click "Import"

#### 4.3 Configure Project
Vercel will auto-detect Vite. Configure as follows:

**Framework Preset:** Vite
**Root Directory:** `./` (leave as is)
**Build Command:** `npm run build`
**Output Directory:** `dist`
**Install Command:** `npm install`

#### 4.4 Add Environment Variables
Click "Environment Variables" and add each one:

**Required (Already have):**
```
VITE_SUPABASE_URL = https://qnkhldedvyjmgvqmtfdu.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFua2hsZGVkdnlqbWd2cW10ZmR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NDUxNDIsImV4cCI6MjA3ODUyMTE0Mn0.n2L8REmAXNci3RZNyoWW2boyegfE_vzHQ_6UiadD7N0
VITE_CLERK_PUBLISHABLE_KEY = pk_test_your_clerk_publishable_key_here
```

**Important:** For each environment variable:
- Select all three environments: ✅ Production, ✅ Preview, ✅ Development
- This ensures authentication works in all deployment contexts

**Optional (Add if you have them):**
```
VITE_GOOGLE_MAPS_API_KEY = your_key_or_leave_empty
VITE_OPENWHEATHER_API_KEY = your_key_or_leave_empty
```

**API Endpoints (Use these exactly):**
```
VITE_AI_BACKEND_URL = /api
VITE_GEE_SERVER_URL = /api
VITE_AI_FORECAST_URL = /api
```

**Other:**
```
VITE_GEE_PROJECT_ID = massive-hexagon-452605-m0
```

#### 4.5 Deploy!
1. Click "Deploy"
2. Wait 2-3 minutes for build
3. You'll see "Congratulations!" when done

---

### STEP 5: Test Your Deployment

#### 5.1 Get Your URL
Vercel will give you a URL like: `https://your-project.vercel.app`

#### 5.2 Test Each Feature

**Homepage:**
- [ ] Loads without errors
- [ ] Navigation works
- [ ] Theme toggle works

**Dashboard:**
- [ ] Weather data displays
- [ ] Charts render
- [ ] No console errors

**Map Page:**
- [ ] Map loads
- [ ] Satellite data toggles work
- [ ] Date range selector works

**AI Chat:**
- [ ] Chat interface loads
- [ ] Can send messages
- [ ] Receives responses
- [ ] Language switching works

**Forecast Page:**
- [ ] Forecast generates
- [ ] Charts display
- [ ] Data is reasonable

**Agriculture Page:**
- [ ] Metrics display
- [ ] Analysis works
- [ ] Recommendations show

#### 5.3 Check API Endpoints

Open browser console (F12) and test:

```javascript
// Test AI Forecast
fetch('/api/ai-forecast', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({lat: 18.5204, lon: 73.8567, location: 'Pune'})
}).then(r => r.json()).then(console.log)

// Test Agricultural Analysis
fetch('/api/agri-analysis', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({text: 'My crops are showing yellow leaves'})
}).then(r => r.json()).then(console.log)

// Test GEE Data
fetch('/api/gee-data', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({dataset: 'rainfall', startDate: '2024-01-01', endDate: '2024-01-31'})
}).then(r => r.json()).then(console.log)
```

**Expected:** All should return JSON responses without errors.

---

### STEP 6: Configure Clerk for Production

After your site is deployed, you need to configure Clerk with your production domain.

**📖 For detailed step-by-step instructions, see [VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md)**

#### 6.1 Add Production Domain to Clerk

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Select your application
3. Go to "Domains" in the sidebar
4. Click "Add domain"
5. Enter your Vercel URL: `https://your-project.vercel.app`
6. Click "Add domain"

#### 6.2 Configure Redirect URLs

1. In Clerk Dashboard, go to "Paths"
2. Verify these paths are set:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in URL: `/dashboard`
   - After sign-up URL: `/dashboard`

#### 6.3 Test Authentication

1. Visit your deployed site
2. Click "Sign In" or "Get Started"
3. Complete the sign-up process
4. Verify you're redirected to the dashboard
5. Test sign-out functionality

**Troubleshooting:**
- If authentication fails, check that your domain is added in Clerk Dashboard
- Verify the `VITE_CLERK_PUBLISHABLE_KEY` matches your Clerk application
- Check browser console for any Clerk-related errors
- See [VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md) for comprehensive troubleshooting guide

---

### STEP 7: Configure Custom Domain (Optional)

#### 6.1 Add Domain
1. Go to Project Settings → Domains
2. Click "Add"
3. Enter your domain (e.g., `climasense.ai`)

#### 6.2 Update DNS
Add these records to your domain provider:

```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

#### 6.3 Wait for SSL
Vercel automatically provisions SSL certificate (5-10 minutes)

---

## 🔧 Troubleshooting

### Issue 1: Build Fails

**Error:** "Module not found" or "Cannot find module"

**Solution:**
```bash
# Locally, delete and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

Then commit and push changes.

---

### Issue 2: Environment Variables Not Working

**Symptoms:** API calls fail, "undefined" in console

**Solution:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Verify all variables are set
3. Make sure they start with `VITE_`
4. Redeploy: Deployments → ⋯ → Redeploy

---

### Issue 3: API Functions Timeout

**Symptoms:** "Function execution timed out"

**Solution:**
- This is expected for heavy AI operations
- The lightweight versions we created should work
- If persistent, consider Render.com for AI backend

---

### Issue 4: CORS Errors

**Symptoms:** "Access blocked by CORS policy"

**Solution:**
- Our serverless functions already have CORS headers
- Clear browser cache
- Try incognito mode
- Check browser console for specific error

---

### Issue 5: Supabase Connection Fails

**Symptoms:** "Failed to fetch" or auth errors

**Solution:**
1. Verify Supabase URL and key in Vercel env variables
2. Check Supabase project is active
3. Verify RLS policies allow public access where needed

---

## 📊 Performance Optimization

### After Deployment:

1. **Enable Vercel Analytics**
   - Go to Analytics tab
   - Enable Web Analytics (free)

2. **Check Lighthouse Score**
   ```bash
   npx lighthouse https://your-project.vercel.app --view
   ```
   Target: 80+ on all metrics

3. **Monitor Function Logs**
   - Go to Deployments → Functions
   - Check for errors or slow functions

---

## 🔄 Continuous Deployment

### Auto-Deploy on Git Push

Vercel automatically deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Vercel automatically:
# 1. Detects push
# 2. Builds project
# 3. Deploys to production
# 4. Updates live site
```

### Preview Deployments

Every pull request gets a preview URL:
- Create branch: `git checkout -b feature-name`
- Push changes: `git push origin feature-name`
- Create PR on GitHub
- Vercel creates preview URL
- Test before merging

---

## ✅ Post-Deployment Checklist

- [ ] All pages load without errors
- [ ] API endpoints respond correctly
- [ ] Database connections work
- [ ] Authentication works (if implemented)
- [ ] Mobile responsive design works
- [ ] All features tested
- [ ] Performance is acceptable
- [ ] No console errors
- [ ] Analytics enabled
- [ ] Custom domain configured (optional)

---

## 🎉 Success Criteria

Your deployment is successful when:

1. ✅ Website loads at your Vercel URL
2. ✅ All navigation works
3. ✅ Dashboard shows data
4. ✅ AI Chat responds
5. ✅ Forecast generates
6. ✅ Map displays
7. ✅ No critical errors in console
8. ✅ Mobile version works

---

## 📞 Need Help?

### Vercel Support:
- Docs: https://vercel.com/docs
- Discord: https://vercel.com/discord
- GitHub Issues: Your repository

### Common Resources:
- Vercel Status: https://vercel-status.com
- Supabase Status: https://status.supabase.com

---

## 🚀 Next Steps After Deployment

1. **Share Your Project**
   - Add live URL to README
   - Share on social media
   - Add to portfolio

2. **Monitor Usage**
   - Check Vercel Analytics
   - Monitor Supabase usage
   - Watch for errors

3. **Gather Feedback**
   - Share with users
   - Collect bug reports
   - Plan improvements

4. **Scale If Needed**
   - Upgrade Vercel plan for more bandwidth
   - Upgrade Supabase for more storage
   - Add CDN for global performance

---

**Deployment Time Estimate:** 15-20 minutes

**Difficulty:** Easy ⭐⭐☆☆☆

**Cost:** $0/month (100% Free!)

---

Ready to deploy? Start with STEP 1! 🚀
