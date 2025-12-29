# Security Best Practices for Flow Task Tracker

## 🔴 CRITICAL: API Key Security

### Current Issue
The OpenAI API key is currently stored in environment variables and bundled into the client-side code. This means:
- ❌ Anyone can view the API key in browser DevTools
- ❌ The key is exposed in the built JavaScript bundle
- ❌ Your API key can be stolen and misused

### ✅ Recommended Solution

**Option 1: Remove AI Features (Quickest)**
If you're not actively using AI suggestions, comment out the API key requirement:

```typescript
// In src/utils/aiHelpers.ts line 26
const apiKey = ''; // Disable AI features
```

**Option 2: Use a Backend Proxy (Most Secure)**
Create a simple backend server that:
1. Stores the API key securely (never in client code)
2. Receives requests from your app
3. Forwards them to OpenAI with your key
4. Returns results to your app

Example backend (Node.js + Express):
```javascript
// server.js
const express = require('express');
const app = express();

app.post('/api/ai-suggest', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY; // Server-side only!
  const { taskName } = req.body;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({...})
  });

  res.json(await response.json());
});

app.listen(3001);
```

Then update your client to call your backend:
```typescript
// Instead of calling OpenAI directly
const response = await fetch('/api/ai-suggest', {
  method: 'POST',
  body: JSON.stringify({ taskName })
});
```

**Option 3: Use Vercel/Netlify Serverless Functions**
Create an API route that runs server-side only.

## 🛡️ Input Sanitization

### Current Issue
User input (task names, notes, homework resources) is not sanitized, creating XSS vulnerabilities.

### Solution
Install DOMPurify:
```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

Then sanitize all user input before storing:
```typescript
import DOMPurify from 'dompurify';

const sanitizedName = DOMPurify.sanitize(taskName);
```

## 🔒 localStorage Security

### Current Issue
- No validation of data loaded from localStorage
- No encryption of sensitive data
- No integrity checks

### Solutions

**1. Add Zod Validation**
Already installed in your project! Use it:

```typescript
import { z } from 'zod';

const TaskSchema = z.object({
  id: z.string(),
  name: z.string().max(200),
  type: z.enum(['duration', 'count', 'completion', 'homework']),
  // ... rest of schema
});

// When loading from localStorage
try {
  const data = JSON.parse(localStorage.getItem('tasks') || '[]');
  const validatedTasks = data.map(t => TaskSchema.parse(t));
} catch (error) {
  // Invalid data - reset to safe state
  console.error('Corrupted data detected');
}
```

**2. Add Integrity Checks**
Use a hash to detect tampering:
```typescript
import crypto from 'crypto';

const saveWithIntegrity = (key: string, data: any) => {
  const json = JSON.stringify(data);
  const hash = crypto.createHash('sha256').update(json).digest('hex');
  localStorage.setItem(key, json);
  localStorage.setItem(`${key}_hash`, hash);
};
```

## 🌐 URL Validation

### Current Issue
Homework resources can contain malicious URLs (javascript:, data:, etc.)

### Solution
```typescript
const isValidURL = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    // Only allow http and https
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

// When adding homework resources
const validResources = resources.filter(isValidURL);
```

## 📝 Content Security Policy

### For Electron App
Add to main process:
```javascript
session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': [
        "default-src 'self'; " +
        "script-src 'self'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self' https://api.openai.com"
      ]
    }
  });
});
```

### For Web App
Add to index.html:
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'; connect-src 'self' https://api.openai.com">
```

## 📊 Security Checklist

- [ ] Move API key to backend or disable AI features
- [ ] Install and implement DOMPurify for input sanitization
- [ ] Add Zod schemas for localStorage validation
- [ ] Implement URL validation for resources
- [ ] Add Content Security Policy
- [ ] Add rate limiting for API calls (prevent abuse)
- [ ] Implement data encryption for sensitive notes
- [ ] Add session timeout for sensitive operations
- [ ] Regular security audits with `npm audit`
- [ ] Keep dependencies updated

## 🚨 Immediate Actions Required

1. **TODAY**: Check if your OpenAI API key is still valid. If this app is public, regenerate it immediately.
2. **THIS WEEK**: Implement Option 1 or 2 for API key security
3. **THIS MONTH**: Add input sanitization and data validation

## 📞 Security Contact

If you discover a security vulnerability, please:
1. Do NOT open a public GitHub issue
2. Email the maintainer directly
3. Allow reasonable time for a fix before disclosure

---

Last Updated: 2025-12-22











