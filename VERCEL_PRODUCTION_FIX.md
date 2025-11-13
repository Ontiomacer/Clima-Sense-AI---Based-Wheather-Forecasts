# 🚀 Vercel Production Deployment - Fix Guide

## Current Issue

Your Vercel deployment at https://clima-sense-ai-based-wheather-forec.vercel.app/ is showing a 404 error when trying to access Clerk authentication routes like `/sign-in/factor-one`.

## Root Cause

The Clerk authentication is not properly configured for your production domain. Clerk needs to know about your Vercel domain to allow authentication flows.

---

## ✅ Step-by-Step Fix

### Step 1: Configure Clerk Production Domain

1. **Go to Clerk Dashboard**
   - Visit: https://dashboard.clerk.com/
   - Sign in to your account
   - Select your ClimaSense AI application

2. **Add Production Domain**
   - Click **"Domains"** in the left sidebar
   - Click **"Add domain"** button
   - Enter your Vercel URL:
     ```
     https://clima-sense-ai-based-wheather-forec.vercel.app
     ```
   - Click **"Add domain"**
   - ✅ Clerk will automatically verify and configure the domain

3. **Verify Redirect URLs**
   - In Clerk Dashboard, click **"Paths"** in the left sidebar
   - Ensure these settings are correct:
     - **Sign-in URL:** `/sign-in`
     - **Sign-up URL:** `/sign-up`
     - **After sign-in URL:** `/dashboard`
     - **After sign-up URL:** `/dashboard`
   - Click **"Save"** if you made any changes

---

### Step 2: Configure Vercel Environment Variables

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your ClimaSense AI project
   - Click **"Settings"** tab
   - Click **"Environment Variables"** in the sidebar

2. **Add/Verify These Variables**

   Check if these variables exist. If not, add them:

   | Variable Name | Value | Environments |
   |---------------|-------|--------------|
   | `VITE_CLERK_PUBLISHABLE_KEY` | `pk_test_YnJhdmUtYWxiYWNvcmUtNzEuY2xlcmsuYWNjb3VudHMuZGV2JA` | ✅ Production, ✅ Preview, ✅ Development |
   | `VITE_SUPABASE_URL` | `https://qnkhldedvyjmgvqmtfdu.supabase.co` | ✅ All |
   | `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | ✅ All |
   | `VITE_GOOGLE_MAPS_API_KEY` | `AIzaSyAiqZEqvgijQW7jO5KxwF3SHbWbkva-IdM` | ✅ All |
   | `VITE_GEE_PROJECT_ID` | `massive-hexagon-452605-m0` | ✅ All |
   | `VITE_OPENWHEATHER_API_KEY` | `c3b76295e4ab7f884c4318ab2d53b954` | ✅ All |
   | `VITE_NASA_API_KEY` | `Shpps7bhf2kUTMs080BAsghCyrt0CCCTP1d5bp3q` | ✅ All |
   | `VITE_AI_BACKEND_URL` | `/api` | ✅ All |
   | `VITE_GEE_SERVER_URL` | `/api` | ✅ All |
   | `VITE_AI_FORECAST_URL` | `/api` | ✅ All |

3. **Important Notes:**
   - For production, API URLs should be `/api` (relative paths)
   - Make sure to select all three environments when adding variables
   - Vercel will automatically redeploy when you add/change environment variables

---

### Step 3: Redeploy to Vercel

After configuring Clerk and environment variables:

1. **Trigger Redeploy**
   - Option A: Push a commit to GitHub
     ```bash
     git commit --allow-empty -m "Trigger Vercel redeploy with Clerk config"
     git push origin main
     ```
   
   - Option B: Manual redeploy in Vercel Dashboard
     - Go to **"Deployments"** tab
     - Click the three dots (**⋯**) on the latest deployment
     - Click **"Redeploy"**
     - Confirm the redeployment

2. **Wait for Deployment**
   - Deployment usually takes 2-5 minutes
   - Watch the deployment logs for any errors
   - Wait for "Ready" status with green checkmark

---

### Step 4: Test Authentication

Once deployment is complete:

1. **Clear Browser Cache**
   - Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
   - Clear cached images and files
   - Or use Incognito/Private mode

2. **Test Sign-Up Flow**
   - Visit: https://clima-sense-ai-based-wheather-forec.vercel.app/
   - Click **"Get Started"** or **"Sign Up"**
   - Fill in email and password
   - Complete sign-up process
   - Should redirect to `/dashboard`

3. **Test Sign-In Flow**
   - Sign out if logged in
   - Click **"Sign In"**
   - Enter credentials
   - Should redirect to `/dashboard`

4. **Test Protected Routes**
   - Try accessing `/dashboard` while signed out
   - Should redirect to `/sign-in`
   - After signing in, should access dashboard

---

## 🐛 Troubleshooting

### Issue: Still Getting 404 on `/sign-in/factor-one`

**Possible Causes:**

1. **Clerk domain not added**
   - Solution: Double-check Clerk Dashboard → Domains
   - Ensure your Vercel URL is listed

2. **Environment variable not set**
   - Solution: Verify `VITE_CLERK_PUBLISHABLE_KEY` in Vercel
   - Must be set for Production environment

3. **Cache issues**
   - Solution: Clear browser cache completely
   - Try in incognito/private mode
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

4. **Deployment not complete**
   - Solution: Wait for Vercel deployment to finish
   - Check deployment logs for errors

---

### Issue: "Missing Clerk Publishable Key" Error

**Solution:**
1. Go to Vercel Settings → Environment Variables
2. Add `VITE_CLERK_PUBLISHABLE_KEY` with your key
3. Select all three environments (Production, Preview, Development)
4. Redeploy

---

### Issue: Authentication Works But Shows Development Warning

**This is expected!** You're using test keys (`pk_test_...`).

**To fix (optional):**
1. In Clerk Dashboard, switch to Production instance
2. Get production publishable key (`pk_live_...`)
3. Update `VITE_CLERK_PUBLISHABLE_KEY` in Vercel
4. Redeploy

---

## 📋 Verification Checklist

Before marking as complete, verify:

- [ ] Clerk domain added: `https://clima-sense-ai-based-wheather-forec.vercel.app`
- [ ] Clerk redirect URLs configured: `/sign-in`, `/sign-up`, `/dashboard`
- [ ] `VITE_CLERK_PUBLISHABLE_KEY` set in Vercel (all environments)
- [ ] All other environment variables set in Vercel
- [ ] Vercel deployment completed successfully (green checkmark)
- [ ] Landing page loads without errors
- [ ] Sign-up flow works (can create account)
- [ ] Sign-in flow works (can log in)
- [ ] Sign-out works (redirects to landing page)
- [ ] Protected routes require authentication
- [ ] Dashboard accessible after sign-in
- [ ] No 404 errors on authentication routes

---

## 🔗 Quick Links

### Clerk Dashboard
- **Main Dashboard:** https://dashboard.clerk.com/
- **Domains:** https://dashboard.clerk.com/last-active?path=domains
- **Paths:** https://dashboard.clerk.com/last-active?path=paths
- **API Keys:** https://dashboard.clerk.com/last-active?path=api-keys

### Vercel Dashboard
- **Your Project:** https://vercel.com/dashboard
- **Environment Variables:** Go to Settings → Environment Variables
- **Deployments:** Go to Deployments tab

---

## 📝 Additional Notes

### For Local Development

Keep your `.env` file configured for localhost:

```env
VITE_AI_BACKEND_URL=http://localhost:8000
VITE_GEE_SERVER_URL=http://localhost:3001
VITE_AI_FORECAST_URL=http://localhost:3002
```

### For Production (Vercel)

Environment variables should use relative paths:

```env
VITE_AI_BACKEND_URL=/api
VITE_GEE_SERVER_URL=/api
VITE_AI_FORECAST_URL=/api
```

**Important:** The `.env` file is NOT deployed to Vercel. You must set environment variables in the Vercel Dashboard.

---

## ⏱️ Expected Timeline

- **Clerk Configuration:** 5 minutes
- **Vercel Environment Variables:** 5 minutes
- **Deployment:** 2-5 minutes
- **Testing:** 5 minutes
- **Total:** ~15-20 minutes

---

## 🎉 Success Criteria

Your deployment is successful when:

1. ✅ Landing page loads at your Vercel URL
2. ✅ Users can sign up for new accounts
3. ✅ Users can sign in with existing accounts
4. ✅ Protected routes require authentication
5. ✅ Dashboard and all features work correctly
6. ✅ No 404 errors on any authentication routes
7. ✅ No console errors related to Clerk

---

**Status:** Awaiting Manual Configuration 🔧

**Last Updated:** November 2024

