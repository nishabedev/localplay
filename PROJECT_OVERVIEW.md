# LocalPlay - Project Overview

## 🎯 What is LocalPlay?

LocalPlay is a Progressive Web App (PWA) designed to organize and play video collections stored locally on your computer. It's perfect for watching university courses, tutorials, movies, or any video content offline.

## ✨ Key Features

### 1. Folder-Based Organization
- Simply select a folder containing videos
- Automatic parsing of folder structure
- Supports numbered prefixes for ordering (01, 02, etc.)
- Handles subfolders as sections

### 2. Smart Video Player
- Custom controls with auto-hide
- Progress tracking (resume where you left off)
- Keyboard shortcuts for full control
- Playback speed control (0.5x to 2x)
- Fullscreen support

### 3. Progress Tracking
- Automatic progress saving every 5 seconds
- Visual progress bars on lessons and collections
- Mark lessons as completed (90%+ watched)
- Resume from last position

### 4. Responsive UI
- Clean course grid view
- Collapsible lesson sidebar
- Mobile-friendly (sidebar becomes overlay)
- Desktop-optimized layout

### 5. Privacy & Offline-First
- All data stays on your device
- No server uploads
- Works completely offline
- IndexedDB for local storage

## 🏗️ Technical Architecture

### Frontend Stack
```
React 18          - UI framework
Vite              - Build tool & dev server
Tailwind CSS      - Utility-first styling
React Router      - Client-side routing
```

### Browser APIs
```
File System Access API  - Folder access (Chrome, Edge, Opera)
IndexedDB              - Local data storage
Service Worker         - PWA & offline support
```

### File Structure
```
localplay/
├── src/
│   ├── components/
│   │   ├── CourseGrid.jsx       # Home screen with collections
│   │   ├── VideoPlayer.jsx      # Video player with controls
│   │   └── LessonSidebar.jsx    # Lesson navigation sidebar
│   ├── hooks/
│   │   ├── useFileSystem.js     # File System Access API wrapper
│   │   ├── useProgress.js       # Progress tracking logic
│   │   └── useControls.js       # Auto-hide controls behavior
│   ├── utils/
│   │   ├── folderParser.js      # Parse folder structure
│   │   └── storage.js           # IndexedDB operations
│   ├── App.jsx                  # Main app with routing
│   ├── main.jsx                 # Entry point
│   └── index.css                # Global styles
├── public/
│   └── icons/                   # PWA icons
├── index.html                   # HTML template
├── vite.config.js               # Vite configuration
├── tailwind.config.js           # Tailwind configuration
└── package.json                 # Dependencies & scripts
```

## 📊 Data Flow

### 1. Adding a Collection
```
User clicks "Add Folder"
    ↓
Browser shows folder picker
    ↓
User selects folder & grants permission
    ↓
folderParser.js parses structure
    ↓
storage.js saves to IndexedDB
    ↓
Collection appears in grid
```

### 2. Playing a Video
```
User clicks collection
    ↓
VideoPlayer loads collection from IndexedDB
    ↓
Folder handle verified/re-requested
    ↓
First video file accessed
    ↓
Video URL created (Blob URL)
    ↓
Progress loaded if exists
    ↓
Video plays, progress saves periodically
```

### 3. Progress Tracking
```
Video plays
    ↓
Every 5 seconds: save currentTime to IndexedDB
    ↓
On video end: mark as 100% complete
    ↓
Next video: load saved progress
    ↓
Progress bars update throughout UI
```

## 🔒 Security & Privacy

### What Gets Stored
- **Folder handles** - References to folders (not actual files)
- **Metadata** - Collection names, lesson names, durations
- **Progress** - Current time for each video

### What Doesn't Get Stored
- ❌ Actual video files (too large, already on disk)
- ❌ Video content or thumbnails
- ❌ User credentials or personal info

### Permissions
- User must explicitly grant folder access
- Permission persists between sessions (browser feature)
- Can be revoked by user anytime (browser settings)

## 🚀 Deployment Options

### 1. Web Hosting (Recommended)
- Deploy to Netlify, Vercel, or GitHub Pages
- Users access via URL, install as PWA
- Automatic updates on redeploy
- Free HTTPS included

### 2. Electron Wrapper
- Package as native desktop app
- Distribute .exe, .dmg, or .AppImage
- Larger file size but feels more "native"
- Users don't need specific browser

### 3. Self-Hosted
- Run on your own server
- Full control over hosting
- Requires HTTPS for PWA features

## 📱 PWA Installation

### Desktop
1. Visit the deployed site
2. Click install icon in address bar
3. App appears in OS app drawer
4. Works offline, auto-updates

### Mobile (Future)
Currently desktop-focused. Mobile support requires cloud storage integration (Phase 2).

## 🎨 UI/UX Design

### Home Screen (CourseGrid)
- Grid of collection cards
- Each card shows:
  - Collection thumbnail (gradient)
  - Title (cleaned from folder name)
  - Lesson count
  - Progress percentage (if started)
- "Add Video Folder" button prominent
- Empty state with helpful message

### Player Screen
- Three-column layout (desktop):
  - Left: Collapsible lesson sidebar
  - Center: Video player
  - Full width on mobile
- Top bar with back button and collection info
- Bottom controls with auto-hide:
  - Play/pause, previous/next
  - Progress bar (seekable)
  - Time display
  - Speed control
  - Fullscreen toggle

### Lesson Sidebar
- Grouped by sections (if subfolders)
- Each lesson shows:
  - Play icon (or checkmark if completed)
  - Lesson name
  - Duration
  - Progress bar (if partially watched)
- Active lesson highlighted
- Scrollable list

## 🎹 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Play/Pause |
| ← | Rewind 10s |
| → | Forward 10s |
| ↑ | Volume up |
| ↓ | Volume down |
| F | Fullscreen |
| M | Mute/Unmute |

## 🔮 Future Enhancements

### Phase 2 (Planned)
- iCloud Drive integration
- Google Drive / Dropbox support
- Mobile optimization
- Thumbnail generation from videos

### Phase 3 (Ideas)
- Playlist creation
- Bookmarks & notes
- Search functionality
- Subtitle support (.srt, .vtt)
- Video transcoding (for unsupported formats)
- Dark/light theme toggle
- Multi-language support
- Chromecast support

## 📈 Performance Considerations

### Optimizations
- Lazy loading of video URLs (only active video)
- Debounced progress saving (every 5s, not continuous)
- Efficient IndexedDB queries
- Service Worker caching of app shell
- Tailwind CSS purging in production

### Limitations
- Browser storage quota (usually 10GB+)
- Video file size (handled by browser, not stored)
- Number of collections (IndexedDB handles thousands)

## 🐛 Known Limitations

1. **Browser Support** - Only Chrome, Edge, Opera (File System Access API)
2. **Mobile** - Limited without cloud storage integration
3. **Video Formats** - Depends on browser codec support
4. **Permissions** - May need re-grant after browser updates

## 📚 Learning Resources

Built with:
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

## 🤝 Contributing

See CONTRIBUTING.md for guidelines.

Areas where help is welcome:
- Cloud storage integration
- Mobile improvements
- UI/UX enhancements
- Performance optimizations
- Documentation improvements

## 📄 License

MIT License - Free to use, modify, and distribute.

---

**LocalPlay - Your videos, your way, offline.** 🎬
