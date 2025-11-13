# Implementation Plan

- [x] 1. Set up Resend email service








  - Create Resend account at resend.com
  - Generate API key from Resend dashboard
  - Add RESEND_API_KEY to Vercel environment variables
  - Test API key with a simple curl request
  - _Requirements: 3.2_

- [x] 2. Create email API endpoint





  - Create new file `api/send-email.js` as Vercel serverless function
  - Implement CORS headers for cross-origin requests
  - Add request method validation (POST and OPTIONS only)

  - _Requirements: 1.1, 3.5_

- [x] 2.1 Implement input validation and sanitization

  - Add validation for name field (2-100 chars, letters/spaces/hyphens only)
  - Add validation for email field (valid email format, max 254 chars)
  - Add validation for subject field (must match predefined options)
  - Add validation for message field (10-2000 chars, sanitize HTML)
  - Return 400 error for invalid inputs with descriptive messages
  - _Requirements: 3.1, 3.5_


- [x] 2.2 Implement rate limiting logic




  - Create in-memory Map to store IP addresses and submission counts
  - Implement 1-hour sliding window with 5 submissions limit per IP
  - Extract IP address from request headers (x-forwarded-for or x-real-ip)
  - Return 429 error when rate limit exceeded
  - Add cleanup logic to remove expired entries
  - _Requirements: 3.3_


- [x] 2.3 Integrate Resend API for email sending




  - Make HTTP POST request to Resend API endpoint
  - Set authorization header with API key from environment variable
  - Format email body with user details (name, email, subject, message, timestamp)
  - Set from address to Resend's default (onboarding@resend.dev)
  - Set to address to tt160705@gmail.com
  - Set reply-to address to user's email for easy responses
  - Include timestamp in email body

  - _Requirements: 1.2, 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2.4 Add error handling and logging




  - Wrap email sending in try-catch block
  - Log errors to console without exposing sensitive data
  - Return 500 error for email service failures
  - Return 500 error if RESEND_API_KEY is missing
  - Return success response with message ID on successful send
  - _Requirements: 3.4, 3.5_

- [x] 3. Update Contact form component





  - Modify handleSubmit function in `src/components/Contact.tsx`
  - Collect form data (name, email, subject, message) into object
  - Make POST request to `/api/send-email` endpoint with form data
  - Handle loading state by disabling submit button during API call
  - _Requirements: 1.1, 1.5, 4.5_


- [x] 3.1 Implement success handling

  - Display success toast notification when API returns success
  - Clear all form fields after successful submission
  - Keep success message visible for at least 3 seconds
  - Re-enable submit button after completion
  - _Requirements: 1.3, 4.1, 4.2_



- [x] 3.2 Implement error handling





  - Display appropriate error toast for different error types (400, 429, 500, network)
  - Preserve form data when submission fails
  - Re-enable submit button to allow retry
  - Show specific messages for validation errors, rate limits, and server errors

  - _Requirements: 1.4, 4.3_

-

- [x] 3.3 Add client-side validation




  - Add HTML5 validation attributes (required, type="email", minlength, maxlength)
  - Add visual feedback for invalid fields
  - Prevent submission if required fields are empty
  - _Requirements: 1.1_

- [-] 4. Deploy and verify



  - Commit changes to Git repository
  - Push to GitHub to trigger Vercel deployment
  - Verify RESEND_API_KEY is set in Vercel environment variables
  - Test form submission on deployed site
  - Verify email is received at tt160705@gmail.com
  - Check email formatting and reply-to functionality
  - _Requirements: 1.2, 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 4.1 Test error scenarios
  - Test rate limiting by submitting 6 forms rapidly
  - Test with invalid email addresses
  - Test with empty fields
  - Test with very long messages (>2000 chars)
  - Test with special characters and HTML in message
  - Verify appropriate error messages appear
  - _Requirements: 1.4, 3.1, 3.3, 3.5, 4.3_

- [ ] 4.2 Monitor and validate
  - Check Vercel function logs for any errors
  - Monitor Resend dashboard for delivery status
  - Verify no errors in browser console
  - Test on different browsers (Chrome, Firefox, Safari)
  - Test on mobile devices
  - _Requirements: 3.4, 4.4_
