# Design Document: Contact Form Email Integration

## Overview

This design implements email functionality for the ClimaSense contact form using a Vercel serverless function and a third-party email service. The solution will capture form submissions, validate the data, and send formatted emails to tt160705@gmail.com. We'll use Resend (a modern email API) as the email service provider due to its simplicity, reliability, and generous free tier.

## Architecture

### High-Level Flow

```
User fills form → Frontend validation → API call to /api/send-email → 
Email service (Resend) → Email delivered to tt160705@gmail.com → 
Success/Error response → User feedback (toast notification)
```

### Components

1. **Frontend (Contact.tsx)**
   - Form validation and submission handling
   - API communication
   - User feedback via toast notifications
   - Loading states

2. **Backend API (/api/send-email.js)**
   - Vercel serverless function
   - Input validation and sanitization
   - Rate limiting
   - Email formatting and sending via Resend
   - Error handling and logging

3. **Email Service (Resend)**
   - Third-party email delivery service
   - Handles SMTP complexities
   - Provides delivery tracking
   - Free tier: 100 emails/day, 3,000 emails/month

## Components and Interfaces

### Frontend Component Updates

**File: `src/components/Contact.tsx`**

Changes needed:
- Update `handleSubmit` function to call the email API
- Add proper error handling for API failures
- Implement form data collection
- Add loading state management
- Clear form on success

```typescript
interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface EmailAPIResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}
```

### Backend API Endpoint

**File: `api/send-email.js`**

New Vercel serverless function that:
- Accepts POST requests with form data
- Validates and sanitizes input
- Implements rate limiting (5 requests per IP per hour)
- Formats email content
- Sends email via Resend API
- Returns success/error response

```javascript
// Request body interface
{
  name: string,
  email: string,
  subject: string,
  message: string
}

// Response interface
{
  success: boolean,
  messageId?: string,  // Resend message ID for tracking
  error?: string
}
```

### Email Service Integration

**Service: Resend**

Configuration:
- API Key stored in environment variable: `RESEND_API_KEY`
- From address: `onboarding@resend.dev` (Resend's default for testing)
- To address: `tt160705@gmail.com`
- Reply-to: User's email address

Email template structure:
```
Subject: [ClimaSense Contact] {subject_category}

From: {user_name} <{user_email}>
Subject: {subject_category}
Submitted: {timestamp}

Message:
{user_message}

---
This message was sent via the ClimaSense contact form.
Reply to this email to respond directly to the sender.
```

## Data Models

### Contact Form Submission

```typescript
interface ContactSubmission {
  name: string;           // Required, 2-100 characters
  email: string;          // Required, valid email format
  subject: string;        // Required, one of: "Data Request", "Partnership", "Feedback", "Other"
  message: string;        // Required, 10-2000 characters
  timestamp: string;      // ISO 8601 format
  ipAddress?: string;     // For rate limiting (not stored)
}
```

### Rate Limiting Store

```typescript
interface RateLimitEntry {
  ipAddress: string;
  submissions: number;
  windowStart: number;    // Unix timestamp
}
```

In-memory store (resets on function cold start):
```javascript
const rateLimitStore = new Map<string, RateLimitEntry>();
```

## Error Handling

### Frontend Error Scenarios

1. **Network Error**
   - Display: "Unable to send message. Please check your connection."
   - Action: Preserve form data, allow retry

2. **Validation Error (400)**
   - Display: "Please check your form inputs and try again."
   - Action: Highlight invalid fields

3. **Rate Limit Error (429)**
   - Display: "Too many requests. Please try again in an hour."
   - Action: Disable submit button temporarily

4. **Server Error (500)**
   - Display: "Something went wrong. Please try again later."
   - Action: Preserve form data, allow retry

### Backend Error Scenarios

1. **Missing/Invalid Input**
   - Return: 400 Bad Request
   - Log: Input validation failure details

2. **Rate Limit Exceeded**
   - Return: 429 Too Many Requests
   - Log: IP address and attempt count

3. **Email Service Failure**
   - Return: 500 Internal Server Error
   - Log: Resend API error details
   - Fallback: None (user must retry)

4. **Missing API Key**
   - Return: 500 Internal Server Error
   - Log: Configuration error

## Security Considerations

### Input Validation

1. **Name Field**
   - Trim whitespace
   - Length: 2-100 characters
   - Pattern: Letters, spaces, hyphens, apostrophes only
   - Sanitize: Remove HTML tags and special characters

2. **Email Field**
   - Validate format using regex
   - Convert to lowercase
   - Maximum length: 254 characters

3. **Subject Field**
   - Must match one of predefined options
   - No custom input allowed

4. **Message Field**
   - Trim whitespace
   - Length: 10-2000 characters
   - Sanitize: Remove HTML tags, preserve line breaks
   - Check for spam patterns (excessive links, repeated characters)

### Rate Limiting

- **Window**: 1 hour (3600 seconds)
- **Limit**: 5 submissions per IP address
- **Storage**: In-memory Map (resets on cold start)
- **Cleanup**: Remove expired entries every 100 requests

### CORS Configuration

- Allow origin: `*` (or specific domain in production)
- Allow methods: POST, OPTIONS
- Allow headers: Content-Type

### Environment Variables

Required in Vercel:
```
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

## Testing Strategy

### Unit Tests (Optional)

1. **Input Validation**
   - Test valid inputs
   - Test invalid inputs (empty, too long, malformed)
   - Test XSS attempts

2. **Rate Limiting**
   - Test within limit
   - Test exceeding limit
   - Test window expiration

### Integration Tests

1. **Email Sending**
   - Test successful email delivery
   - Test with invalid API key
   - Test with Resend service down

2. **API Endpoint**
   - Test successful POST request
   - Test OPTIONS request (CORS preflight)
   - Test invalid methods (GET, PUT, DELETE)

### Manual Testing Checklist

- [ ] Submit form with valid data
- [ ] Verify email received at tt160705@gmail.com
- [ ] Check email formatting and content
- [ ] Test reply-to functionality
- [ ] Submit 6 forms rapidly to trigger rate limit
- [ ] Test with invalid email addresses
- [ ] Test with empty fields
- [ ] Test with very long messages
- [ ] Test with special characters in name/message
- [ ] Test network error handling (disconnect internet)
- [ ] Verify toast notifications appear correctly
- [ ] Verify form clears after successful submission
- [ ] Verify form preserves data after error

## Implementation Steps

1. **Setup Resend Account**
   - Sign up at resend.com
   - Generate API key
   - Add to Vercel environment variables

2. **Create API Endpoint**
   - Create `api/send-email.js`
   - Implement input validation
   - Implement rate limiting
   - Integrate Resend SDK
   - Add error handling

3. **Update Frontend**
   - Modify `handleSubmit` in Contact.tsx
   - Add API call logic
   - Update error handling
   - Test loading states

4. **Deploy and Test**
   - Deploy to Vercel
   - Test with real email
   - Monitor Resend dashboard
   - Verify error scenarios

## Alternative Approaches Considered

### 1. Gmail SMTP Direct
- **Pros**: No third-party service needed
- **Cons**: Requires app password, less secure, Gmail may block, harder to debug
- **Decision**: Rejected due to security and reliability concerns

### 2. SendGrid
- **Pros**: Well-established, feature-rich
- **Cons**: More complex setup, overkill for simple use case
- **Decision**: Rejected in favor of simpler Resend

### 3. Nodemailer with Gmail
- **Pros**: Popular library, flexible
- **Cons**: Requires SMTP configuration, Gmail security issues
- **Decision**: Rejected due to complexity

### 4. FormSubmit / FormSpree
- **Pros**: No backend code needed
- **Cons**: Less control, external dependency, limited customization
- **Decision**: Rejected to maintain full control

## Deployment Considerations

### Vercel Configuration

No special configuration needed. Vercel automatically:
- Detects files in `/api` directory as serverless functions
- Provides environment variable management
- Handles CORS and routing

### Environment Variables

Set in Vercel dashboard:
```
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

### Monitoring

- Check Vercel function logs for errors
- Monitor Resend dashboard for delivery status
- Set up alerts for failed deliveries (optional)

### Cost Considerations

- **Resend Free Tier**: 100 emails/day, 3,000/month
- **Vercel Free Tier**: 100GB bandwidth, 100 serverless function invocations/day
- **Expected Usage**: ~10-50 emails/month
- **Conclusion**: Well within free tier limits

## Future Enhancements

1. **Email Templates**
   - Use Resend's React Email templates for better formatting
   - Add ClimaSense branding

2. **Auto-Reply**
   - Send confirmation email to user
   - Include ticket number for tracking

3. **Database Storage**
   - Store submissions in Supabase for record-keeping
   - Enable admin dashboard to view submissions

4. **Advanced Rate Limiting**
   - Use Redis or Vercel KV for persistent rate limiting
   - Implement per-email rate limiting

5. **Spam Detection**
   - Integrate with Akismet or similar service
   - Add honeypot field

6. **Analytics**
   - Track submission success rate
   - Monitor response times
   - Analyze common subjects/topics
