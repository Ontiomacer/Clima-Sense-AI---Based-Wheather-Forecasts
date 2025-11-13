# Resend Email Service Setup Guide

This guide will help you complete the setup of Resend email service for the ClimaSense contact form.

## Step 1: Create Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Click "Sign Up" or "Get Started"
3. Create an account using your email or GitHub
4. Verify your email address

## Step 2: Generate API Key

1. Log in to your Resend dashboard
2. Navigate to **API Keys** section (left sidebar)
3. Click **"Create API Key"**
4. Give it a name (e.g., "ClimaSense Contact Form")
5. Select permissions: **"Sending access"** (default)
6. Click **"Create"**
7. **IMPORTANT**: Copy the API key immediately (it starts with `re_`)
   - You won't be able to see it again!
   - It should look like: `re_123abc456def789ghi`

## Step 3: Add API Key to Local Environment

1. Open your `.env` file in the project root
2. Find the line: `RESEND_API_KEY=your_resend_api_key_here`
3. Replace `your_resend_api_key_here` with your actual API key
4. Save the file

Example:
```env
RESEND_API_KEY=re_123abc456def789ghi
```

## Step 4: Test API Key Locally

Run the test script to verify your API key works:

```bash
node test-resend-api.js
```

**Expected output:**
```
✅ Success! Email sent successfully.
📧 Message ID: abc123-def456-ghi789
📬 Check tt160705@gmail.com for the test email.
```

**If you see an error:**
- **401 Unauthorized**: Check that you copied the API key correctly
- **422 Validation Error**: You may need to verify your domain (see below)
- **Network Error**: Check your internet connection

## Step 5: Add API Key to Vercel

For production deployment, add the API key to Vercel:

### Option A: Via Vercel Dashboard (Recommended)

1. Go to [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your ClimaSense project
3. Go to **Settings** → **Environment Variables**
4. Click **"Add New"**
5. Enter:
   - **Name**: `RESEND_API_KEY`
   - **Value**: Your Resend API key (starts with `re_`)
   - **Environment**: Select all (Production, Preview, Development)
6. Click **"Save"**
7. Redeploy your application for changes to take effect

### Option B: Via Vercel CLI

```bash
vercel env add RESEND_API_KEY
# Paste your API key when prompted
# Select all environments (Production, Preview, Development)
```

## Step 6: Verify Email Delivery

1. Check the inbox at **tt160705@gmail.com**
2. Look for the test email from "onboarding@resend.dev"
3. Verify the email content is formatted correctly
4. Test the reply-to functionality (optional)

## Domain Verification (Optional but Recommended)

For production use, you should verify your own domain:

1. In Resend dashboard, go to **Domains**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `climasense.com`)
4. Add the DNS records provided by Resend to your domain registrar
5. Wait for verification (usually 5-30 minutes)
6. Once verified, update the "from" address in your email code

**Benefits of domain verification:**
- Emails sent from your own domain (e.g., `contact@climasense.com`)
- Better deliverability and trust
- No "via resend.dev" in email headers
- Higher sending limits

## Troubleshooting

### API Key Not Working

1. Verify the key is copied correctly (no extra spaces)
2. Check that the key starts with `re_`
3. Ensure the key hasn't been revoked in Resend dashboard
4. Try creating a new API key

### Emails Not Received

1. Check spam/junk folder
2. Verify the recipient email is correct
3. Check Resend dashboard for delivery logs
4. Ensure you're within the free tier limits (100 emails/day)

### Rate Limiting

Free tier limits:
- **100 emails per day**
- **3,000 emails per month**

If you exceed these, you'll need to upgrade your Resend plan.

## Next Steps

Once you've completed this setup:

1. ✅ Resend account created
2. ✅ API key generated
3. ✅ API key added to `.env` file
4. ✅ API key tested locally
5. ✅ API key added to Vercel
6. ✅ Test email received

**You're ready to proceed to Task 2: Create email API endpoint**

## Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend API Reference](https://resend.com/docs/api-reference/emails/send-email)
- [Resend Dashboard](https://resend.com/dashboard)
- [Domain Verification Guide](https://resend.com/docs/dashboard/domains/introduction)

## Support

If you encounter issues:
- Check [Resend Status Page](https://status.resend.com/)
- Visit [Resend Discord](https://resend.com/discord)
- Email Resend support: support@resend.com
