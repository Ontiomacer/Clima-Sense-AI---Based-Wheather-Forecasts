# 🚀 Quick Guide: Adding Clerk to Vercel

## Step-by-Step Instructions

### 1. Get Your Clerk Publishable Key

1. Go to [https://dashboard.clerk.com/](https://dashboard.clerk.com/)
2. Sign in to your account
3. Select your ClimaSense AI application
4. Click "API Keys" in the sidebar
5. Copy the **Publishable Key** (starts with `pk_test_` or `pk_live_`)

---

### 2. Add to Vercel Dashboard

#### Method A: Via Vercel Dashboard (Recommended)

1. Go to [https://vercel.com/](https://vercel.com/)
2. Sign in and select your ClimaSense AI project
3. Click "Settings" tab
4. Click "Environment Variables" in the sidebar
5. Click "Add New" button
6. Fill in:
   - **Key:** `VITE_CLERK_PUBLISHABLE_KEY`
   - **Value:** Paste your Clerk publishable key
   - **Environments:** Check all three boxes:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
7. Click "Save"

#### Method B: Via Vercel CLI

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Login to Vercel
vercel login

# Add environment variable
vercel env add VITE_CLERK_PUBLISHABLE_KEY

# When prompted:
# 1. Paste your Clerk publishable key
# 2. Select: Production, Preview, Development (use spacebar to select)
# 3. Press Enter
```

---

### 3. Redeploy Your Application

After adding the environment variable, you need to redeploy:

#### Option A: Automatic (Push to GitHub)

```bash
# Make any small change or use empty commit
git commit --allow-empty -m "Add Clerk environment variable"
git push origin main

# Vercel will automatically detect and redeploy
```

#### Option B: Manual (Vercel Dashboard)

1. Go to your project on Vercel
2. Click "Deployments" tab
3. Find the latest deployment
4. Click the three dots (⋯) menu
5. Click "Redeploy"
6. Confirm the redeployment

#### Option C: Vercel CLI

```bash
# Deploy from your local machine
vercel --prod
```

---

### 4. Configure Clerk Production Domain

After deployment completes:

1. Go back to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Select your application
3. Click "Domains" in the sidebar
4. Click "Add domain"
5. Enter your Vercel URL: `https://your-project.vercel.app`
   - Example: `https://clima-sense-ai.vercel.app`
6. Click "Add domain"

**If you have a custom domain:**
```
https://climasense.ai
https://www.climasense.ai
```

---

### 5. Verify Configuration

#### Check Environment Variable

1. In Vercel Dashboard → Settings → Environment Variables
2. Verify `VITE_CLERK_PUBLISHABLE_KEY` is listed
3. Should show: "Production, Preview, Development"

#### Test Authentication

1. Visit your deployed site: `https://your-project.vercel.app`
2. Click "Sign In" or "Get Started"
3. Try to sign up with a test account
4. Should successfully create account and redirect to dashboard

**If authentication fails:**
- Check browser console for errors
- Verify the Clerk key is correct
- Ensure domain is added in Clerk Dashboard
- Wait a few minutes for changes to propagate

---

## Troubleshooting

### Error: "Clerk: Missing publishableKey"

**Solution:**
1. Verify variable name is exactly: `VITE_CLERK_PUBLISHABLE_KEY`
2. Check it's added to all environments (Production, Preview, Development)
3. Redeploy the application
4. Clear browser cache

### Error: "This domain is not allowed"

**Solution:**
1. Go to Clerk Dashboard → Domains
2. Add your Vercel URL
3. Wait 2-3 minutes for DNS propagation
4. Try again

### Authentication Works Locally But Not on Vercel

**Solution:**
1. Check Vercel environment variables are set
2. Verify production domain is added to Clerk
3. Check you're using the correct Clerk key (not the secret key)
4. Redeploy after making changes

---

## Quick Reference

### Environment Variable Format

```
Key:   VITE_CLERK_PUBLISHABLE_KEY
Value: pk_test_YnJhdmUtYWxiYWNvcmUtNzEuY2xlcmsuYWNjb3VudHMuZGV2JA
Envs:  Production, Preview, Development
```

### Clerk Dashboard URLs

- Main Dashboard: https://dashboard.clerk.com/
- API Keys: https://dashboard.clerk.com/last-active?path=api-keys
- Domains: https://dashboard.clerk.com/last-active?path=domains
- Paths: https://dashboard.clerk.com/last-active?path=paths

### Vercel Dashboard URLs

- Projects: https://vercel.com/dashboard
- Environment Variables: https://vercel.com/[username]/[project]/settings/environment-variables
- Deployments: https://vercel.com/[username]/[project]/deployments

---

## Checklist

- [ ] Clerk publishable key obtained
- [ ] Environment variable added to Vercel
- [ ] All environments selected (Production, Preview, Development)
- [ ] Application redeployed
- [ ] Production domain added to Clerk
- [ ] Authentication tested on live site
- [ ] Sign-up flow works
- [ ] Sign-in flow works
- [ ] Sign-out works
- [ ] Protected routes redirect correctly

---

**Estimated Time:** 5-10 minutes

**Difficulty:** Easy ⭐☆☆☆☆

**Status:** Ready to Deploy 🚀
