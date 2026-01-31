# Deployment Guide

How to deploy LocalPlay so others can use it.

## Option 1: GitHub Pages (Free & Easy)

Perfect for open source projects.

### Steps:

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/localplay.git
git push -u origin main
```

2. **Update vite.config.js**

Add `base` property for GitHub Pages:

```javascript
export default defineConfig({
  base: '/localplay/', // Your repo name
  plugins: [
    // ... existing plugins
  ]
})
```

3. **Build and Deploy**

```bash
# Build
npm run build

# Install gh-pages (one time)
npm install -D gh-pages

# Add to package.json scripts:
"deploy": "gh-pages -d dist"

# Deploy
npm run deploy
```

4. **Configure GitHub Pages**
   - Go to Settings → Pages
   - Source: gh-pages branch
   - Your app: `https://yourusername.github.io/localplay/`

## Option 2: Netlify (Free, Automatic Deploys)

Best for continuous deployment.

### Steps:

1. **Push to GitHub** (same as above)

2. **Connect to Netlify**
   - Go to https://netlify.com
   - "New site from Git"
   - Choose your repository
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Deploy**
   - Netlify auto-deploys on every push
   - Get a URL like: `your-app.netlify.app`
   - Custom domain available (free HTTPS)

## Option 3: Vercel (Free, Very Fast)

Similar to Netlify, great performance.

### Steps:

1. **Push to GitHub**

2. **Deploy with Vercel**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deploy
vercel --prod
```

Or use the Vercel dashboard (import from GitHub).

## Option 4: Self-Hosted (Full Control)

For running on your own server.

### Requirements:
- Web server (Apache, Nginx, etc.)
- Node.js (for building)
- HTTPS (required for PWA features)

### Steps:

```bash
# Build
npm run build

# Copy 'dist' folder to your web server
# Example with nginx:
sudo cp -r dist/* /var/www/html/localplay/

# Configure nginx:
location /localplay {
    try_files $uri $uri/ /localplay/index.html;
}

# Restart nginx
sudo systemctl restart nginx
```

## Option 5: Electron Wrapper (Desktop App)

Convert to native desktop app.

### Steps:

1. **Install Electron dependencies**
```bash
npm install -D electron electron-builder
```

2. **Create electron/main.js**
```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load the built app
  win.loadFile(path.join(__dirname, '../dist/index.html'));
}

app.whenReady().then(createWindow);
```

3. **Update package.json**
```json
{
  "main": "electron/main.js",
  "scripts": {
    "electron": "electron .",
    "electron:build": "electron-builder"
  },
  "build": {
    "appId": "com.localplay.app",
    "files": ["dist/**/*", "electron/**/*"],
    "mac": {
      "category": "public.app-category.video"
    },
    "win": {
      "target": "nsis"
    }
  }
}
```

4. **Build installers**
```bash
npm run build
npm run electron:build
```

Creates `.exe` (Windows), `.dmg` (Mac), or `.AppImage` (Linux)

## Important Notes

### PWA Installation

Users can "install" LocalPlay directly from their browser:

**Chrome/Edge:**
1. Visit your deployed site
2. Click the install icon in address bar
3. Or Menu → Install LocalPlay

**Benefits of installed PWA:**
- Appears in app drawer/start menu
- Works offline
- No browser UI (cleaner experience)
- Auto-updates when you redeploy

### HTTPS Requirement

PWAs require HTTPS (except localhost). All the hosting options above provide free HTTPS automatically.

### File System Access API

Remember: Only works in Chrome, Edge, Opera. Include browser check in your app (already implemented in CourseGrid.jsx).

### Storage Considerations

LocalPlay stores folder handles in IndexedDB. These persist across browser sessions but:
- Users may need to re-grant permissions after browser updates
- Data is per-origin (different domains = different storage)

## Recommended Deployment Flow

For open source project:

```bash
# 1. Develop locally
npm run dev

# 2. Test production build
npm run build
npm run preview

# 3. Push to GitHub
git push

# 4. Deploy to Netlify/Vercel (auto-deploy)
# Users get updates automatically!

# 5. Optional: Create Electron build for offline installers
npm run electron:build
```

## Distribution

Once deployed, users can:

1. **Use online** - Visit your URL, install as PWA
2. **Download installer** - If you provide Electron builds
3. **Clone & build** - For developers (GitHub)

## Custom Domain

All free hosts support custom domains:

**Netlify/Vercel:**
- Add domain in dashboard
- Update DNS records
- Free HTTPS included

Your URL: `localplay.yourdomain.com`

---

**Choose your deployment method and get LocalPlay to your users!**
