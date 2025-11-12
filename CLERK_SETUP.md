# 🔐 Clerk Authentication Setup Guide

Complete guide for setting up Clerk authentication in ClimaSense AI.

## 📋 Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Production Setup](#production-setup)
- [Configuration](#configuration)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Overview

ClimaSense AI uses [Clerk](https://clerk.com) for authentication, providing:

- ✅ Secure user authentication
- ✅ Social login (Google, GitHub, etc.)
- ✅ Email/password authentication
- ✅ Session management
- ✅ User profile management
- ✅ Multi-factor authentication (optional)

---

## Getting Started

### 1. Create Clerk Account

1. Go to [https://dashboard.clerk.com/sign-up](https://dashboard.clerk.com/sign-up)
2. Sign up with your email or GitHub account
3. Verify your email address

### 2. Create Application

1. After signing in, click "Create Application"
2. Enter application name: **ClimaSense AI**
3. Select authentication methods:
   - ✅ Email
   - ✅ Google (recommended)
   - ✅ GitHub (optional)
4. Click "Create Application"

### 3. Get API Keys

1. In your Clerk Dashboard, go to "API Keys"
2. You'll see two keys:
   - **Publishable Key** (starts with `pk_test_` or `pk_live_`)
   - **Secret Key** (starts with `sk_test_` or `sk_live_`)

**Important:** 
- The Publishable Key is safe to use in frontend code
- The Secret Key should NEVER be exposed in frontend code

---

## Development Setup

### 1. Add Keys to .env File

Open your `.env` file and add:

```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
```

**Example:**
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YnJhdmUtYWxiYWNvcmUtNzEuY2xlcmsuYWNjb3VudHMuZGV2JA
```

### 2. Update .env.example

Make sure `.env.example` includes the Clerk variable:

```env
# Clerk Authentication (Required)
# Get from: https://dashboard.clerk.com/
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
```

### 3. Configure Development Domain

1. In Clerk Dashboard, go to "Domains"
2. Your development domain should already be configured:
   - `localhost:5173` (default Vite port)
3. If not, click "Add domain" and add `http://localhost:5173`

### 4. Test Locally

```bash
# Start the development server
npm run dev

# Visit http://localhost:5173
# You'll see the landing page
# Click "Get Started" or "Sign In"
# Complete the sign-up process
# You should be redirected to the dashboard
```

**Landing Page Features:**
- Professional hero section with animations
- Feature showcase
- "How It Works" section
- Statistics display
- Call-to-action buttons

---

## Production Setup

### 1. Add Keys to Vercel

#### Option A: Vercel Dashboard

1. Go to your project on [Vercel](https://vercel.com)
2. Navigate to: Settings → Environment Variables
3. Add new variable:
   - **Name:** `VITE_CLERK_PUBLISHABLE_KEY`
   - **Value:** Your Clerk publishable key (starts with `pk_test_` or `pk_live_`)
   - **Environment:** Production, Preview, Development (select all)
4. Click "Save"

#### Option B: Vercel CLI

```bash
# Set environment variable
vercel env add VITE_CLERK_PUBLISHABLE_KEY

# When prompted, paste your Clerk publishable key
# Select: Production, Preview, Development
```

### 2. Configure Production Domain

After deploying to Vercel:

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Select your application
3. Go to "Domains"
4. Click "Add domain"
5. Enter your Vercel URL: `https://your-project.vercel.app`
6. Click "Add domain"

**If using custom domain:**
```
https://climasense.ai
https://www.climasense.ai
```

### 3. Configure Redirect URLs

1. In Clerk Dashboard, go to "Paths"
2. Verify these settings:

```
Sign-in URL: /sign-in
Sign-up URL: /sign-up
Home URL: / (landing page)
After sign-in URL: /dashboard
After sign-up URL: /dashboard
After sign-out URL: / (landing page)
```

**Important:** The home URL (/) displays the public landing page, not the dashboard.

### 4. Redeploy

After adding environment variables:

```bash
# Trigger a new deployment
git commit --allow-empty -m "Trigger redeploy for Clerk config"
git push origin main
```

Or in Vercel Dashboard:
- Go to Deployments
- Click ⋯ on latest deployment
- Click "Redeploy"

---

## Configuration

### Authentication Methods

Configure which sign-in methods to enable:

1. Go to Clerk Dashboard → User & Authentication → Email, Phone, Username
2. Enable/disable methods:
   - **Email address** (recommended)
   - **Phone number** (optional)
   - **Username** (optional)

3. Go to Social Connections
4. Enable social providers:
   - **Google** (recommended)
   - **GitHub** (optional)
   - **Microsoft** (optional)

### Session Settings

1. Go to Clerk Dashboard → Sessions
2. Configure:
   - **Session lifetime:** 7 days (default)
   - **Inactivity timeout:** 30 minutes (default)
   - **Multi-session handling:** Allow multiple sessions

### User Profile

1. Go to Clerk Dashboard → User & Authentication → Personal Information
2. Configure required fields:
   - ✅ Email address (required)
   - ✅ First name (optional)
   - ✅ Last name (optional)
   - ✅ Profile picture (optional)

---

## Testing

### Test Authentication Flow

1. **Landing Page:**
   ```
   1. Visit your site (/)
   2. Should see professional landing page
   3. Verify hero section, features, and CTAs display correctly
   4. Test responsive design on mobile/tablet
   ```

2. **Sign Up:**
   ```
   1. Click "Get Started" or "Sign Up" on landing page
   2. Enter email and password
   3. Verify email (check inbox)
   4. Should redirect to /dashboard
   ```

3. **Sign In:**
   ```
   1. From landing page, click "Sign In"
   2. Enter credentials
   3. Should redirect to /dashboard
   ```

4. **Sign Out:**
   ```
   1. Click user menu in dashboard
   2. Click "Sign Out"
   3. Should redirect to landing page (/)
   ```

5. **Protected Routes:**
   ```
   1. Sign out (should be on landing page)
   2. Try to access /dashboard directly
   3. Should redirect to /sign-in
   4. After signing in, should redirect back to /dashboard
   5. All protected routes (/forecast, /map, /chat, /agriculture) should work
   ```

### Test Social Login

1. Click "Sign in with Google"
2. Select Google account
3. Grant permissions
4. Should redirect to /dashboard

### Test in Different Browsers

- ✅ Chrome
- ✅ Firefox
- ✅ Safari
- ✅ Edge

### Test on Mobile

- ✅ iOS Safari
- ✅ Android Chrome

---

## Troubleshooting

### Issue 1: "Clerk: Missing publishableKey"

**Symptoms:** Error in console, authentication doesn't work

**Solution:**
1. Check `.env` file has `VITE_CLERK_PUBLISHABLE_KEY`
2. Restart dev server: `npm run dev`
3. For production, check Vercel environment variables
4. Redeploy after adding variables

### Issue 2: "Clerk: Invalid publishableKey"

**Symptoms:** Authentication fails, invalid key error

**Solution:**
1. Verify key starts with `pk_test_` or `pk_live_`
2. Copy key directly from Clerk Dashboard
3. No extra spaces or quotes
4. Update and restart

### Issue 3: Redirect Loop

**Symptoms:** Keeps redirecting between sign-in and dashboard

**Solution:**
1. Check Clerk Dashboard → Paths
2. Verify "After sign-in URL" is `/dashboard`
3. Check ProtectedRoute component logic
4. Clear browser cookies and cache

### Issue 4: Domain Not Allowed

**Symptoms:** "This domain is not allowed" error

**Solution:**
1. Go to Clerk Dashboard → Domains
2. Add your domain:
   - Development: `http://localhost:5170`
   - Production: `https://your-project.vercel.app`
3. Wait a few minutes for changes to propagate
4. Clear browser cache

### Issue 5: Social Login Fails

**Symptoms:** Google/GitHub login doesn't work

**Solution:**
1. Check Clerk Dashboard → Social Connections
2. Verify provider is enabled
3. Check OAuth redirect URIs are configured
4. For Google: Verify OAuth consent screen is configured

### Issue 6: Session Expires Too Quickly

**Symptoms:** User gets signed out frequently

**Solution:**
1. Go to Clerk Dashboard → Sessions
2. Increase "Session lifetime" (default: 7 days)
3. Increase "Inactivity timeout" (default: 30 minutes)
4. Enable "Remember me" option

---

## Advanced Configuration

### Custom Sign-In/Sign-Up Pages

Already implemented in ClimaSense AI:

```typescript
// src/pages/SignInPage.tsx
import { SignIn } from '@clerk/clerk-react';

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignIn 
        routing="path" 
        path="/sign-in"
        signUpUrl="/sign-up"
        redirectUrl="/dashboard"
      />
    </div>
  );
}
```

### User Metadata

Store additional user data:

```typescript
import { useUser } from '@clerk/clerk-react';

function UserProfile() {
  const { user } = useUser();
  
  // Access user data
  console.log(user?.firstName);
  console.log(user?.emailAddresses[0].emailAddress);
  
  // Update user metadata
  await user?.update({
    unsafeMetadata: {
      preferredLanguage: 'hi',
      location: 'Pune, India'
    }
  });
}
```

### Webhooks (Optional)

Sync user data with your database:

1. Go to Clerk Dashboard → Webhooks
2. Click "Add Endpoint"
3. Enter your webhook URL: `https://your-api.com/webhooks/clerk`
4. Select events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
5. Copy signing secret
6. Implement webhook handler in your backend

---

## Security Best Practices

### ✅ Do's

- ✅ Use environment variables for keys
- ✅ Never commit `.env` to Git
- ✅ Use `pk_live_` keys in production
- ✅ Enable multi-factor authentication
- ✅ Configure session timeouts
- ✅ Use HTTPS in production
- ✅ Validate user sessions on backend

### ❌ Don'ts

- ❌ Never expose secret key in frontend
- ❌ Don't hardcode API keys
- ❌ Don't disable HTTPS in production
- ❌ Don't skip email verification
- ❌ Don't use test keys in production

---

## Migration from Supabase Auth

If migrating from Supabase authentication:

### 1. Export Users (Optional)

```sql
-- Export users from Supabase
SELECT email, created_at FROM auth.users;
```

### 2. Import to Clerk (Optional)

Use Clerk's user import API or manually invite users.

### 3. Update Code

Replace Supabase auth hooks with Clerk hooks:

```typescript
// Before (Supabase)
import { useAuth } from './hooks/useAuth';
const { user, signOut } = useAuth();

// After (Clerk)
import { useUser, useClerk } from '@clerk/clerk-react';
const { user } = useUser();
const { signOut } = useClerk();
```

---

## Support

### Clerk Resources

- **Documentation:** https://clerk.com/docs
- **Support:** https://clerk.com/support
- **Discord:** https://clerk.com/discord
- **Status:** https://status.clerk.com

### ClimaSense AI

- **GitHub Issues:** Your repository
- **Documentation:** See `/docs` folder

---

## Checklist

### Development Setup
- [ ] Clerk account created
- [ ] Application created in Clerk
- [ ] API keys obtained
- [ ] Keys added to `.env`
- [ ] Development domain configured
- [ ] Local testing completed

### Production Setup
- [ ] Keys added to Vercel
- [ ] Production domain added to Clerk
- [ ] Redirect URLs configured
- [ ] Social login tested
- [ ] Protected routes tested
- [ ] Sign-out tested

### Security
- [ ] Secret key not in frontend code
- [ ] Environment variables secured
- [ ] HTTPS enabled
- [ ] Session timeouts configured
- [ ] Email verification enabled

---

**Last Updated:** November 2024

**Clerk Version:** 4.30.0+

**Status:** ✅ Production Ready
