# LocalPlay - Quick Start Guide

Get LocalPlay running in 5 minutes!

## Step 1: Install Dependencies

```bash
cd localplay
npm install
```

This will install all required packages (React, Vite, Tailwind, etc.)

## Step 2: Start Development Server

```bash
npm run dev
```

The app will be available at: **http://localhost:5173**

## Step 3: Open in Browser

⚠️ **Important:** Use Chrome, Edge, or Opera (File System Access API required)

Open the URL in your browser: `http://localhost:5173`

## Step 4: Add Your First Collection

1. Click **"Add Video Folder"** button
2. Select a folder containing video files
3. Grant permission when prompted
4. Wait for parsing (usually instant for small collections)
5. Click the collection to start watching!

## Example Folder Structure

Create a test folder like this:

```
My Course/
├── 01-Introduction.mp4
├── 02-Getting Started.mp4
├── 03-Advanced Topics.mp4
└── 04-Conclusion.mp4
```

Or with subfolders:

```
My Course/
├── 01-Basics/
│   ├── 01-Intro.mp4
│   └── 02-Setup.mp4
└── 02-Advanced/
    ├── 01-Concepts.mp4
    └── 02-Practice.mp4
```

## Supported Video Formats

- MP4 (recommended)
- WebM
- OGG
- MOV
- AVI
- MKV
- M4V

## Troubleshooting

### "Browser Not Supported" Error

**Solution:** Use Chrome 86+, Edge 86+, or Opera 72+

### Videos Won't Play

**Check:**
1. Video format is supported
2. Video file isn't corrupted
3. Browser has permission to access the folder

### Permission Denied

**Solution:** Click "Add Video Folder" again and grant permission when prompted

## What's Next?

1. **Watch videos** - Click any lesson in the sidebar
2. **Track progress** - Progress saves automatically every 5 seconds
3. **Use shortcuts** - Press Space to play/pause, F for fullscreen
4. **Add more collections** - Build your video library

## Building for Production

When you're ready to deploy:

```bash
# Build optimized production files
npm run build

# Preview the production build
npm run preview

# Deploy the 'dist' folder to any static hosting
```

## Need Help?

- Check the main README.md for detailed documentation
- Open an issue on GitHub
- Read keyboard shortcuts in the README

**Enjoy LocalPlay! 🎬**
