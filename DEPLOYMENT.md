# Flow - Deployment Guide

This guide covers deploying Flow as a web application, PWA, and desktop application.

## Table of Contents

- [Web Application Deployment](#web-application-deployment)
  - [Vercel](#vercel-recommended)
  - [Netlify](#netlify)
  - [GitHub Pages](#github-pages)
- [PWA Setup](#pwa-setup)
- [Desktop Application (Electron)](#desktop-application-electron)
- [Environment Configuration](#environment-configuration)

---

## Web Application Deployment

### Vercel (Recommended)

Vercel provides the easiest deployment for Vite applications with automatic builds and HTTPS.

#### Method 1: Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Build your application:
```bash
npm run build
```

3. Deploy:
```bash
vercel
```

4. For production deployment:
```bash
vercel --prod
```

#### Method 2: GitHub Integration

1. Push your code to GitHub
2. Visit [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Configure build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Click "Deploy"

**Custom Domain:**
```bash
vercel --prod
vercel domains add yourdomain.com
```

---

### Netlify

#### Method 1: Netlify CLI

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Build your application:
```bash
npm run build
```

3. Deploy:
```bash
netlify deploy --prod --dir=dist
```

#### Method 2: Drag & Drop

1. Build your application:
```bash
npm run build
```

2. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
3. Drag the `dist` folder

#### Method 3: GitHub Integration

1. Push code to GitHub
2. Go to [app.netlify.com](https://app.netlify.com)
3. Click "New site from Git"
4. Select your repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Click "Deploy site"

**netlify.toml Configuration:**

Create `netlify.toml` in your project root:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### GitHub Pages

1. Install `gh-pages`:
```bash
npm install --save-dev gh-pages
```

2. Add to `package.json`:
```json
{
  "homepage": "https://yourusername.github.io/flow",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

3. Update `vite.config.ts`:
```typescript
export default defineConfig({
  base: '/flow/', // Replace with your repo name
  // ... rest of config
})
```

4. Deploy:
```bash
npm run deploy
```

5. Enable GitHub Pages in repository settings:
   - Go to Settings → Pages
   - Source: `gh-pages` branch
   - Save

---

## PWA Setup

Flow is already configured as a PWA with `vite-plugin-pwa`.

### Prerequisites

1. **HTTPS**: PWAs require HTTPS (automatic on Vercel/Netlify)
2. **Icons**: Generated via `npm run generate-icons`
3. **Manifest**: Configured in `vite.config.ts`

### Verification

After deploying, verify PWA functionality:

1. Open your site in Chrome
2. Open DevTools → Application tab
3. Check:
   - ✓ Manifest
   - ✓ Service Worker
   - ✓ Installability

### Installation

**Desktop (Chrome/Edge):**
1. Visit your deployed site
2. Look for install icon in address bar
3. Click "Install Flow"

**Mobile (iOS):**
1. Open in Safari
2. Tap Share button
3. Select "Add to Home Screen"

**Mobile (Android):**
1. Open in Chrome
2. Tap menu (3 dots)
3. Select "Add to Home Screen"

### Updating PWA

Service worker auto-updates are configured. After deployment:
- Users will receive update prompt on next visit
- Changes apply after page refresh

---

## Desktop Application (Electron)

### Building for macOS

1. Build the web app:
```bash
npm run build
```

2. Build macOS DMG:
```bash
npm run build:mac
```

Output: `release/Flow-1.0.0-arm64.dmg` and `release/Flow-1.0.0-x64.dmg`

### Building for Windows

Update `package.json`:
```json
{
  "build": {
    "win": {
      "target": ["nsis", "portable"],
      "icon": "build/icon.ico"
    }
  }
}
```

Build:
```bash
npm run build:electron -- --win
```

### Building for Linux

Update `package.json`:
```json
{
  "build": {
    "linux": {
      "target": ["AppImage", "deb"],
      "category": "Utility"
    }
  }
}
```

Build:
```bash
npm run build:electron -- --linux
```

### Code Signing (macOS)

For distribution outside App Store:

1. Get Apple Developer ID certificate
2. Update `package.json`:
```json
{
  "build": {
    "mac": {
      "identity": "Developer ID Application: Your Name (XXXXXXXXXX)"
    }
  }
}
```

3. Build:
```bash
CSC_NAME="Developer ID Application" npm run build:mac
```

### Auto-Updates

To enable auto-updates, integrate `electron-updater`:

```bash
npm install electron-updater
```

Configure in `electron/main.cjs`:
```javascript
const { autoUpdater } = require('electron-updater');

app.on('ready', () => {
  autoUpdater.checkForUpdatesAndNotify();
});
```

---

## Environment Configuration

### Gist Sync (Optional)

For GitHub Gist backup functionality:

1. Create `.env.local`:
```env
VITE_GIST_TOKEN=your_github_token_here
```

2. **Never commit `.env.local` to git**

3. For production, set environment variables in hosting platform:

**Vercel:**
```bash
vercel env add VITE_GIST_TOKEN
```

**Netlify:**
- Go to Site settings → Build & deploy → Environment
- Add `VITE_GIST_TOKEN`

### Environment Variables

Available environment variables:

- `VITE_GIST_TOKEN`: GitHub Personal Access Token for backup
- `VITE_API_URL`: (Future) Backend API URL
- `NODE_ENV`: Set automatically (`development`/`production`)

---

## Performance Optimization

### Build Optimization

Already configured in `vite.config.ts`:
- ✓ Code splitting
- ✓ Tree shaking
- ✓ Minification
- ✓ Asset optimization

### CDN Integration (Optional)

For better performance, serve static assets via CDN:

1. Build with public path:
```typescript
// vite.config.ts
export default defineConfig({
  base: 'https://cdn.example.com/',
})
```

2. Upload `dist/assets/` to CDN
3. Deploy

### Caching Headers

**Vercel** - Create `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

**Netlify** - Create `netlify.toml`:
```toml
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

---

## Monitoring & Analytics

### Error Tracking

Integrate Sentry for error tracking:

```bash
npm install @sentry/react
```

```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: import.meta.env.MODE,
});
```

### Analytics

Add Google Analytics or Plausible:

```html
<!-- index.html -->
<script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
```

---

## Troubleshooting

### Build Failures

**Issue**: `npm run build` fails
**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### PWA Not Installing

**Issue**: Install prompt doesn't appear
**Check**:
1. Site is served over HTTPS
2. Valid service worker
3. Valid manifest
4. Visit in incognito/private mode

### Electron Build Fails

**Issue**: `electron-builder` fails
**Solution**:
```bash
npm rebuild
npm run build:electron
```

**macOS Issue**: Code signing fails
**Solution**: Skip code signing for testing:
```bash
CSC_IDENTITY_AUTO_DISCOVERY=false npm run build:mac
```

---

## Deployment Checklist

Before deploying to production:

- [ ] Update version in `package.json`
- [ ] Test build locally (`npm run build && npm run preview`)
- [ ] Verify all features work in production build
- [ ] Check PWA manifest and icons
- [ ] Test on mobile devices
- [ ] Set up analytics (optional)
- [ ] Configure custom domain (optional)
- [ ] Set up error tracking (optional)
- [ ] Update README with live URL
- [ ] Create GitHub release (optional)

---

## Support & Maintenance

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update all dependencies
npm update

# Update to latest versions
npx npm-check-updates -u
npm install
```

### Security Audits

```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix
```

---

## Additional Resources

- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [Electron Builder Documentation](https://www.electron.build)
- [PWA Best Practices](https://web.dev/pwa-checklist/)

---

Built with ♥ by **MazadiaS**
