# 🔐 Vercel Environment Variables Setup for ClimaSense AI

## Quick Guide: Adding Clerk Authentication to Vercel

This guide walks you through adding the Clerk publishable key to your Vercel deployment.

---

## Prerequisites

- [ ] Vercel account with ClimaSense AI project deployed
- [ ] Clerk account with application created
- [ ] Clerk publishable key (from Clerk Dashboard)

---

## Step 1: Get Your Clerk Publishable Key

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Sign in to your account
3. Select your ClimaSense AI application
4. Click **"API Keys"** in the left sidebar
5. Copy the **Publishable Key** (starts with `pk_test_` or `pk_live_`)

**Example format:**
```
pk_test_YnJhdmUtYWxiYWNvcmUtNzEuY2xlcmsuYWNjb3VudHMuZGV2JA
```

**⚠️ Important:** 
- Use the **Publishable Key**, NOT the Secret Key
- The publishable key is safe to use in frontend code
- Never commit keys directly to your repository

---

## Step 2: Add Environment Variable to Vercel

### Method A: Via Vercel Dashboard (Recommended)

1. **Navigate to Project Settings**
   - Go to [vercel.com](https://vercel.com/)
   - Sign in and select your ClimaSense AI project
   - Click the **"Settings"** tab at the top

2. **Open Environment Variables**
   - Click **"Environment Variables"** in the left sidebar
   - You'll see a list of existing variables

3. **Add New Variable**
   - Click the **"Add New"** button
   - Fill in the form:

   **Key (Name):**
   ```
   VITE_CLERK_PUBLISHABLE_KEY
   ```

   **Value:**
   ```
   [Paste your Clerk publishable key here]
   ```

   **Environments:** Select ALL three checkboxes:
   - ✅ **Production** - For your live site
   - ✅ **Preview** - For pull request previews
   - ✅ **Development** - For local development via Vercel CLI

4. **Save the Variable**
   - Click **"Save"** button
   - Variable will appear in your list

### Method B: Via Vercel CLI

If you prefer using the command line:

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Login to Vercel
vercel login

# Navigate to your project directory
cd path/to/Clima-Sense-AI

# Add environment variable
vercel env add VITE_CLERK_PUBLISHABLE_KEY

# When prompted:
# 1. Paste your Clerk publishable key
# 2. Use arrow keys and spacebar to select all environments:
#    [x] Production
#    [x] Preview  
#    [x] Development
# 3. Press Enter to confirm
```

---

## Step 3: Redeploy Your Application

After adding the environment variable, you must redeploy for changes to take effect.

### Option A: Trigger Automatic Deployment (Recommended)

Push any change to your GitHub repository:

```bash
# Make an empty commit to trigger deployment
git commit --allow-empty -m "Add Clerk environment variable"
git push origin main
```

Vercel will automatically:
- Detect the push
- Build with new environment variables
- Deploy to production

### Option B: Manual Redeploy via Dashboard

1. Go to your project on Vercel
2. Click **"Deployments"** tab
3. Find the latest successful deployment
4. Click the three dots menu (**⋯**)
5. Select **"Redeploy"**
6. Click **"Redeploy"** to confirm

### Option C: Deploy via CLI

```bash
# Deploy to production
vercel --prod
```

---

## Step 4: Configure Clerk Production Domain

After your deployment completes, configure Clerk to work with your production URL.

1. **Add Production Domain to Clerk**
   - Go back to [Clerk Dashboard](https://dashboard.clerk.com/)
   - Select your application
   - Click **"Domains"** in the left sidebar
   - Click **"Add domain"** button
   - Enter your Vercel URL: `https://your-project.vercel.app`
   - Click **"Add domain"**

2. **Configure Redirect URLs**
   - In Clerk Dashboard, click **"Paths"** in the sidebar
   - Verify these settings:
     - **Sign-in URL:** `/sign-in`
     - **Sign-up URL:** `/sign-up`
     - **After sign-in URL:** `/dashboard`
     - **After sign-up URL:** `/dashboard`
   - Save if you made any changes

3. **Add Custom Domain (Optional)**
   - If you have a custom domain (e.g., `climasense.ai`):
   - Add it to Clerk Domains as well
   - Format: `https://climasense.ai`

---

## Step 5: Verify Configuration

### Check Environment Variable in Vercel

1. Go to **Settings → Environment Variables**
2. Verify `VITE_CLERK_PUBLISHABLE_KEY` is listed
3. Should show: "Production, Preview, Development"
4. Value should be partially masked: `pk_test_***...***`

### Test Authentication Flow

1. **Visit Your Deployed Site**
   - Open `https://your-project.vercel.app`
   - Clear browser cache (Ctrl+Shift+Delete)

2. **Test Sign-Up**
   - Click **"Get Started"** or **"Sign Up"**
   - Fill in email and password
   - Complete sign-up process
   - Should redirect to `/dashboard`

3. **Test Sign-In**
   - Sign out if logged in
   - Click **"Sign In"**
   - Enter credentials
   - Should redirect to `/dashboard`

4. **Test Protected Routes**
   - Sign out
   - Try to access `/dashboard` directly
   - Should redirect to `/sign-in`
   - After signing in, should access dashboard

5. **Check Browser Console**
   - Open Developer Tools (F12)
   - Go to Console tab
   - Should see no Clerk-related errors
   - Look for: "Clerk: Loaded successfully"

---

## Troubleshooting

### Error: "Clerk: Missing publishableKey"

**Cause:** Environment variable not set or incorrect name

**Solution:**
1. Verify variable name is exactly: `VITE_CLERK_PUBLISHABLE_KEY`
2. Check it's added to all environments
3. Redeploy the application
4. Clear browser cache and try again

### Error: "This domain is not allowed"

**Cause:** Production domain not added to Clerk

**Solution:**
1. Go to Clerk Dashboard → Domains
2. Add your Vercel URL: `https://your-project.vercel.app`
3. Wait 2-3 minutes for propagation
4. Clear browser cache and try again

### Authentication Works Locally But Not on Vercel

**Possible causes and solutions:**

1. **Environment variable not set in production**
   - Check Vercel Settings → Environment Variables
   - Ensure "Production" is checked
   - Redeploy

2. **Wrong Clerk key used**
   - Verify you're using the Publishable Key (not Secret Key)
   - Check the key starts with `pk_test_` or `pk_live_`

3. **Domain not configured in Clerk**
   - Add production domain to Clerk Dashboard
   - Wait a few minutes for DNS propagation

4. **Cache issues**
   - Clear browser cache completely
   - Try in incognito/private mode
   - Hard refresh (Ctrl+Shift+R)

### Deployment Succeeds But Changes Not Visible

**Solution:**
1. Check deployment logs in Vercel
2. Verify build completed successfully
3. Clear CDN cache:
   - Vercel Dashboard → Deployments
   - Click deployment → "..." menu
   - Select "Invalidate Cache"
4. Hard refresh browser (Ctrl+Shift+R)

---

## Complete Environment Variables Checklist

Ensure all these variables are set in Vercel:

### Required Variables

- [ ] `VITE_SUPABASE_URL` - Supabase project URL
- [ ] `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- [ ] `VITE_CLERK_PUBLISHABLE_KEY` - Clerk publishable key

### Optional Variables (Recommended)

- [ ] `VITE_GOOGLE_MAPS_API_KEY` - For map functionality
- [ ] `VITE_OPENWHEATHER_API_KEY` - For weather data
- [ ] `VITE_GEE_PROJECT_ID` - For satellite data

### API Endpoint Variables

- [ ] `VITE_AI_BACKEND_URL` - Set to `/api` for Vercel functions
- [ ] `VITE_GEE_SERVER_URL` - Set to `/api` for Vercel functions
- [ ] `VITE_AI_FORECAST_URL` - Set to `/api` for Vercel functions

---

## Security Best Practices

### ✅ DO:
- Use environment variables for all API keys
- Set variables in Vercel Dashboard, not in code
- Use the Clerk Publishable Key (safe for frontend)
- Keep the Clerk Secret Key secure (backend only)
- Regularly rotate API keys
- Use different keys for development and production

### ❌ DON'T:
- Commit `.env` files to Git
- Expose Secret Keys in frontend code
- Share API keys in public forums
- Use production keys in development
- Hardcode sensitive values in source code

---

## Quick Reference

### Vercel Dashboard URLs

- **Projects:** https://vercel.com/dashboard
- **Environment Variables:** `https://vercel.com/[username]/[project]/settings/environment-variables`
- **Deployments:** `https://vercel.com/[username]/[project]/deployments`

### Clerk Dashboard URLs

- **Main Dashboard:** https://dashboard.clerk.com/
- **API Keys:** https://dashboard.clerk.com/last-active?path=api-keys
- **Domains:** https://dashboard.clerk.com/last-active?path=domains
- **Paths:** https://dashboard.clerk.com/last-active?path=paths

### Environment Variable Format

```
Key:   VITE_CLERK_PUBLISHABLE_KEY
Value: pk_test_YnJhdmUtYWxiYWNvcmUtNzEuY2xlcmsuYWNjb3VudHMuZGV2JA
Envs:  ✅ Production  ✅ Preview  ✅ Development
```

---

## Final Checklist

Before considering this task complete:

- [ ] Clerk publishable key obtained from dashboard
- [ ] Environment variable added to Vercel with correct name
- [ ] All three environments selected (Production, Preview, Development)
- [ ] Application redeployed successfully
- [ ] Production domain added to Clerk Dashboard
- [ ] Redirect URLs configured in Clerk Paths
- [ ] Sign-up flow tested on live site
- [ ] Sign-in flow tested on live site
- [ ] Sign-out functionality tested
- [ ] Protected routes redirect correctly
- [ ] No console errors related to Clerk
- [ ] Documentation updated with deployment steps

---

## Additional Resources

- **Clerk Documentation:** https://clerk.com/docs
- **Vercel Documentation:** https://vercel.com/docs
- **ClimaSense Deployment Guide:** [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Clerk-Specific Setup:** [VERCEL_CLERK_CONFIG.md](./VERCEL_CLERK_CONFIG.md)
- **Complete Deployment Guide:** [VERCEL_DEPLOYMENT_COMPLETE.md](./VERCEL_DEPLOYMENT_COMPLETE.md)

---

**Estimated Time:** 10-15 minutes

**Difficulty:** Easy ⭐⭐☆☆☆

**Status:** Ready to Deploy 🚀

---

*Last Updated: November 2024*
