# 📸 ClimaSense AI - Screenshots Guide

## Overview

This document provides guidance on capturing and managing screenshots for ClimaSense AI documentation.

## Required Screenshots

### Landing Page

#### 1. Hero Section (Desktop)
- **Filename**: `landing-hero-desktop.png`
- **Size**: 1920x1080
- **Content**: Full hero section with headline, CTAs, and animated background
- **Location**: Save to `/docs/screenshots/`

#### 2. Features Section (Desktop)
- **Filename**: `landing-features-desktop.png`
- **Size**: 1920x1080
- **Content**: Feature grid showing all 6 features
- **Location**: Save to `/docs/screenshots/`

#### 3. Mobile View
- **Filename**: `landing-mobile.png`
- **Size**: 375x812 (iPhone X)
- **Content**: Full landing page on mobile
- **Location**: Save to `/docs/screenshots/`

### Authentication

#### 4. Sign-Up Page
- **Filename**: `auth-signup.png`
- **Size**: 1920x1080
- **Content**: Clerk sign-up interface
- **Location**: Save to `/docs/screenshots/`

#### 5. Sign-In Page
- **Filename**: `auth-signin.png`
- **Size**: 1920x1080
- **Content**: Clerk sign-in interface
- **Location**: Save to `/docs/screenshots/`

### Dashboard

#### 6. Main Dashboard
- **Filename**: `dashboard-main.png`
- **Size**: 1920x1080
- **Content**: Full dashboard with metrics and insights
- **Location**: Save to `/docs/screenshots/`

#### 7. Weather Forecast
- **Filename**: `forecast-page.png`
- **Size**: 1920x1080
- **Content**: 10-day forecast view
- **Location**: Save to `/docs/screenshots/`

#### 8. Interactive Map
- **Filename**: `map-page.png`
- **Size**: 1920x1080
- **Content**: Climate map with layers
- **Location**: Save to `/docs/screenshots/`

#### 9. AI Chat
- **Filename**: `chat-page.png`
- **Size**: 1920x1080
- **Content**: AI chat interface with sample conversation
- **Location**: Save to `/docs/screenshots/`

#### 10. Agriculture Analysis
- **Filename**: `agriculture-page.png`
- **Size**: 1920x1080
- **Content**: Agricultural analysis dashboard
- **Location**: Save to `/docs/screenshots/`

### Language Support

#### 11. Hindi Interface
- **Filename**: `interface-hindi.png`
- **Size**: 1920x1080
- **Content**: Dashboard in Hindi
- **Location**: Save to `/docs/screenshots/`

#### 12. Marathi Interface
- **Filename**: `interface-marathi.png`
- **Size**: 1920x1080
- **Content**: Dashboard in Marathi
- **Location**: Save to `/docs/screenshots/`

## How to Capture Screenshots

### Desktop Screenshots

**Windows:**
```
1. Press Windows + Shift + S
2. Select area to capture
3. Screenshot saved to clipboard
4. Paste into image editor
5. Save as PNG
```

**macOS:**
```
1. Press Cmd + Shift + 4
2. Select area to capture
3. Screenshot saved to desktop
4. Rename and move to /docs/screenshots/
```

**Browser DevTools:**
```
1. Open DevTools (F12)
2. Press Ctrl/Cmd + Shift + P
3. Type "screenshot"
4. Select "Capture full size screenshot"
5. Save to /docs/screenshots/
```

### Mobile Screenshots

**Using Browser DevTools:**
```
1. Open DevTools (F12)
2. Click device toolbar icon (Ctrl/Cmd + Shift + M)
3. Select device (iPhone X, Pixel 5, etc.)
4. Capture screenshot using method above
```

**Using Real Device:**
```
iOS:
- Press Side Button + Volume Up
- Screenshot saved to Photos

Android:
- Press Power + Volume Down
- Screenshot saved to Gallery
```

## Screenshot Guidelines

### Quality Standards

- **Format**: PNG (for UI screenshots)
- **Resolution**: High DPI (2x for retina displays)
- **Compression**: Optimize with tools like TinyPNG
- **File Size**: Keep under 500KB per image

### Content Guidelines

- **Clean State**: No personal data or test accounts
- **Representative Data**: Use realistic sample data
- **No Errors**: Ensure no error messages visible
- **Complete UI**: Show full interface, not cut off
- **Consistent Theme**: Use same theme (light/dark) throughout

### Privacy & Security

- **No Personal Info**: Remove any PII before capturing
- **No API Keys**: Ensure no keys visible in screenshots
- **No Sensitive Data**: Use placeholder data only
- **Anonymize Users**: Use generic usernames/emails

## Optimization

### Before Adding to Repo

1. **Resize**: Ensure correct dimensions
2. **Compress**: Use TinyPNG or similar
3. **Rename**: Use descriptive filenames
4. **Organize**: Place in correct folder

### Tools

- **TinyPNG**: https://tinypng.com/
- **ImageOptim**: https://imageoptim.com/
- **Squoosh**: https://squoosh.app/

## Usage in Documentation

### Markdown

```markdown
![Landing Page Hero](docs/screenshots/landing-hero-desktop.png)
*ClimaSense AI Landing Page - Hero Section*
```

### README

```markdown
## Screenshots

### Landing Page
![Landing Page](docs/screenshots/landing-hero-desktop.png)

### Dashboard
![Dashboard](docs/screenshots/dashboard-main.png)
```

### Documentation Sites

```html
<img src="docs/screenshots/landing-hero-desktop.png" 
     alt="ClimaSense Landing Page" 
     width="800" />
```

## Updating Screenshots

### When to Update

- Major UI changes
- New features added
- Branding updates
- Bug fixes affecting UI
- Quarterly review

### Update Process

1. Capture new screenshots
2. Optimize images
3. Replace old files
4. Update documentation references
5. Commit changes

## Screenshot Checklist

### Before Capturing
- [ ] Clear browser cache
- [ ] Use incognito/private mode
- [ ] Set browser to standard size
- [ ] Remove browser extensions
- [ ] Use clean test account
- [ ] Populate with sample data

### After Capturing
- [ ] Check image quality
- [ ] Verify no sensitive data
- [ ] Optimize file size
- [ ] Use correct filename
- [ ] Save to correct location
- [ ] Update documentation

### For Each Screenshot
- [ ] Correct dimensions
- [ ] Clear and readable
- [ ] No personal information
- [ ] Properly compressed
- [ ] Descriptive filename
- [ ] Added to documentation

## Folder Structure

```
docs/
└── screenshots/
    ├── landing/
    │   ├── landing-hero-desktop.png
    │   ├── landing-features-desktop.png
    │   └── landing-mobile.png
    ├── auth/
    │   ├── auth-signup.png
    │   └── auth-signin.png
    ├── dashboard/
    │   ├── dashboard-main.png
    │   ├── forecast-page.png
    │   ├── map-page.png
    │   ├── chat-page.png
    │   └── agriculture-page.png
    └── languages/
        ├── interface-hindi.png
        └── interface-marathi.png
```

## Automated Screenshots (Future)

Consider using tools for automated screenshot generation:

- **Playwright**: Browser automation
- **Puppeteer**: Headless Chrome
- **Percy**: Visual testing platform
- **Chromatic**: Storybook visual testing

Example Playwright script:

```javascript
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173');
  await page.screenshot({ 
    path: 'docs/screenshots/landing-hero-desktop.png',
    fullPage: true 
  });
  
  await browser.close();
})();
```

## Contributing

When contributing screenshots:

1. Follow guidelines above
2. Create PR with screenshots
3. Include description of changes
4. Reference related issues
5. Wait for review

---

**Note**: Screenshots should be captured from a clean, production-like environment with sample data only.

**Last Updated**: November 2024
