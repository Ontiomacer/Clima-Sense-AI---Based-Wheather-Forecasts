// Vercel serverless function for sending contact form emails via Resend
// Rate limiting store (in-memory, resets on cold start)
const rateLimitStore = new Map();

// Cleanup expired rate limit entries
function cleanupRateLimits() {
  const now = Date.now();
  const oneHour = 3600000; // 1 hour in milliseconds
  
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now - entry.windowStart > oneHour) {
      rateLimitStore.delete(ip);
    }
  }
}

// Extract IP address from request
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() || 
         req.headers['x-real-ip'] || 
         'unknown';
}

// Check rate limit for IP address
function checkRateLimit(ip) {
  const now = Date.now();
  const oneHour = 3600000;
  const maxSubmissions = 5;
  
  // Cleanup old entries periodically
  if (rateLimitStore.size > 100) {
    cleanupRateLimits();
  }
  
  const entry = rateLimitStore.get(ip);
  
  if (!entry) {
    // First submission from this IP
    rateLimitStore.set(ip, {
      submissions: 1,
      windowStart: now
    });
    return { allowed: true };
  }
  
  // Check if window has expired
  if (now - entry.windowStart > oneHour) {
    // Reset window
    rateLimitStore.set(ip, {
      submissions: 1,
      windowStart: now
    });
    return { allowed: true };
  }
  
  // Check if limit exceeded
  if (entry.submissions >= maxSubmissions) {
    return { 
      allowed: false, 
      retryAfter: Math.ceil((entry.windowStart + oneHour - now) / 1000)
    };
  }
  
  // Increment submission count
  entry.submissions++;
  return { allowed: true };
}

// Validate and sanitize name field
function validateName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name is required' };
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length < 2 || trimmed.length > 100) {
    return { valid: false, error: 'Name must be between 2 and 100 characters' };
  }
  
  // Allow letters, spaces, hyphens, and apostrophes
  const namePattern = /^[a-zA-Z\s\-']+$/;
  if (!namePattern.test(trimmed)) {
    return { valid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }
  
  return { valid: true, value: trimmed };
}

// Validate email field
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }
  
  const trimmed = email.trim().toLowerCase();
  
  if (trimmed.length > 254) {
    return { valid: false, error: 'Email address is too long' };
  }
  
  // Email validation regex
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  return { valid: true, value: trimmed };
}

// Validate subject field
function validateSubject(subject) {
  if (!subject || typeof subject !== 'string') {
    return { valid: false, error: 'Subject is required' };
  }
  
  const validSubjects = ['Data Request', 'Partnership', 'Feedback', 'Other'];
  
  if (!validSubjects.includes(subject)) {
    return { valid: false, error: 'Invalid subject. Must be one of: Data Request, Partnership, Feedback, Other' };
  }
  
  return { valid: true, value: subject };
}

// Validate and sanitize message field
function validateMessage(message) {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Message is required' };
  }
  
  const trimmed = message.trim();
  
  if (trimmed.length < 10 || trimmed.length > 2000) {
    return { valid: false, error: 'Message must be between 10 and 2000 characters' };
  }
  
  // Remove HTML tags for security
  const sanitized = trimmed.replace(/<[^>]*>/g, '');
  
  return { valid: true, value: sanitized };
}

// Send email via Resend API
async function sendEmail(name, email, subject, message) {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    console.error('Configuration error: RESEND_API_KEY environment variable is not set');
    throw new Error('Email service is not configured');
  }
  
  const timestamp = new Date().toISOString();
  
  const emailBody = `From: ${name} <${email}>
Subject: ${subject}
Submitted: ${timestamp}

Message:
${message}

---
This message was sent via the ClimaSense contact form.
Reply to this email to respond directly to the sender.`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'onboarding@resend.dev',
      to: 'tt160705@gmail.com',
      reply_to: email,
      subject: `[ClimaSense Contact] ${subject}`,
      text: emailBody
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`Resend API error: Status ${response.status}`, errorData);
    throw new Error(`Email service error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.id; // Return message ID
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Only POST requests are accepted.' 
    });
  }
  
  try {
    // Extract client IP for rate limiting
    const clientIP = getClientIP(req);
    
    // Check rate limit
    const rateLimitResult = checkRateLimit(clientIP);
    if (!rateLimitResult.allowed) {
      console.log(`Rate limit exceeded for IP: ${clientIP}`);
      return res.status(429).json({
        success: false,
        error: `Too many requests. Please try again in ${Math.ceil(rateLimitResult.retryAfter / 60)} minutes.`
      });
    }
    
    // Validate input fields
    const { name, email, subject, message } = req.body;
    
    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
      return res.status(400).json({ success: false, error: nameValidation.error });
    }
    
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ success: false, error: emailValidation.error });
    }
    
    const subjectValidation = validateSubject(subject);
    if (!subjectValidation.valid) {
      return res.status(400).json({ success: false, error: subjectValidation.error });
    }
    
    const messageValidation = validateMessage(message);
    if (!messageValidation.valid) {
      return res.status(400).json({ success: false, error: messageValidation.error });
    }
    
    // Send email via Resend
    const messageId = await sendEmail(
      nameValidation.value,
      emailValidation.value,
      subjectValidation.value,
      messageValidation.value
    );
    
    console.log(`Email sent successfully. Message ID: ${messageId}`);
    
    return res.status(200).json({
      success: true,
      messageId
    });
    
  } catch (error) {
    // Log error without exposing sensitive data
    console.error('Email sending failed:', {
      message: error.message,
      timestamp: new Date().toISOString()
    });
    
    // Return generic error message to client
    return res.status(500).json({
      success: false,
      error: 'Failed to send email. Please try again later.'
    });
  }
}
