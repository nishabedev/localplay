# LocalPlay - Project Context for Claude

## Project Overview

**LocalPlay** is a Progressive Web App (PWA) for organizing and watching video collections offline. Built with React 18 and TypeScript, it provides a desktop-first experience using the File System Access API to read video files directly from the user's local folders without uploading.

## Core Purpose

Users can select a folder containing videos, and LocalPlay will:

1. Parse the folder structure (including subfolders)
2. Organize videos by numbered prefixes (e.g., "01-", "02-")
3. Display them in a course/collection grid
4. Play videos with a custom player
5. Track progress and allow resuming
6. Store all data locally in IndexedDB

## Tech Stack

- **React 18** - UI framework with hooks
- **TypeScript** - Full type safety throughout
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **React Router v6** - Client-side routing
- **IndexedDB (via idb)** - Local storage
- **File System Access API** - Direct folder access (Chrome, Edge, Opera only)
- **Workbox** - Service Worker for PWA features

## Architecture

### File Structure

```
src/
├── components/           # React components
│   ├── CourseGrid.tsx   # Home screen with collection cards
│   ├── VideoPlayer.tsx  # Video player with controls
│   └── LessonSidebar.tsx # Lesson list navigation
├── hooks/               # Custom React hooks
│   ├── useFileSystem.ts # File System Access API wrapper
│   ├── useProgress.ts   # Progress tracking logic
│   └── useControls.ts   # Auto-hide controls behavior
├── utils/               # Utility functions
│   ├── storage.ts       # IndexedDB operations
│   └── folderParser.ts  # Folder structure parsing
├── types/               # TypeScript definitions
│   └── index.ts         # All type definitions
├── App.tsx              # Main app with routing
└── main.tsx             # Entry point
```

### Data Flow

1. **Folder Selection**: User clicks "Add Video Folder" → `useFileSystem.selectFolder()` → File System Access API shows picker
2. **Parsing**: `folderParser.parseFolderStructure()` walks directory tree → creates `Collection` object
3. **Storage**: `storage.saveCollection()` saves to IndexedDB with folder handle reference
4. **Display**: `CourseGrid` loads from IndexedDB → displays collection cards
5. **Playback**: `VideoPlayer` gets file handle → creates object URL → plays video
6. **Progress**: `useProgress.updateProgress()` saves every 5 seconds → stored in IndexedDB

## Type System

All types are defined in `src/types/index.ts`. Key interfaces:

### Core Data Types

```typescript
interface Collection {
  id: string; // Folder name
  title: string; // Cleaned folder name (no prefix)
  originalName: string; // Original folder name
  lessons: Lesson[]; // Array of videos
  totalLessons: number; // Count
  dirHandle: FileSystemDirectoryHandle; // Reference to folder
  lastAccessed?: number; // Timestamp
}

interface Lesson {
  id: string; // Unique ID: foldername-filename
  name: string; // Cleaned filename (no extension/prefix)
  filename: string; // Original filename with extension
  fileHandle: FileSystemFileHandle; // Reference to file
  size: number; // File size in bytes
  duration: number; // Video duration (set after load)
  sortOrder: number; // Extracted from number prefix
  section?: string; // If in subfolder
}

interface VideoProgress {
  id: string; // Lesson ID
  currentTime: number; // Current playback position
  duration: number; // Total video duration
  percentage: number; // Progress percentage (0-100)
  lastWatched: number; // Timestamp
}
```

### Hook Return Types

```typescript
interface UseFileSystemReturn {
  selectFolder: () => Promise<Collection | null>;
  verifyFolderAccess: (
    dirHandle: FileSystemDirectoryHandle,
  ) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  isSupported: boolean; // Check if File System Access API available
}

interface UseProgressReturn {
  currentProgress: VideoProgress | null;
  allProgress: Record<string, VideoProgress>;
  updateProgress: (
    id: string,
    currentTime: number,
    duration: number,
  ) => Promise<void>;
  getProgressPercentage: (id: string) => number;
  isCompleted: (id: string) => boolean;
  loadProgress: (id: string) => Promise<VideoProgress | null>;
  loadAllProgress: () => Promise<void>;
}

interface UseControlsReturn {
  showControls: boolean;
  handleActivity: () => void; // Call on mouse movement
}
```

## Important Concepts

### 1. File System Access API

**Browser Support**: Chrome 86+, Edge 86+, Opera 72+ (NOT Firefox or Safari)

**How it works**:

- User grants permission to access a folder
- Browser gives us a `FileSystemDirectoryHandle`
- We can read files but NOT write/delete
- Handles are stored in IndexedDB and persist between sessions
- Permission may need to be re-requested after browser updates

**Usage**:

```typescript
// Request folder access
const dirHandle = await window.showDirectoryPicker({ mode: "read" });

// Check permission
const permission = await dirHandle.queryPermission({ mode: "read" });

// Get file from folder
const fileHandle = await dirHandle.getFileHandle("video.mp4");
const file = await fileHandle.getFile();
const url = URL.createObjectURL(file);
```

### 2. IndexedDB Storage

We store three types of data:

1. **folders** - Folder handles with metadata
2. **collections** - Parsed collection structures
3. **progress** - Video progress for each lesson

**Key point**: We store REFERENCES (handles), not actual video files. Videos stay on disk.

### 3. Number Prefix System

Videos and folders are sorted by number prefixes:

- `01-Introduction.mp4` → sortOrder: 1, name: "Introduction"
- `02-Setup.mp4` → sortOrder: 2, name: "Setup"
- `Conclusion.mp4` → sortOrder: Infinity (no prefix, goes to end)

This is handled by `folderParser.extractNumber()` and `folderParser.cleanName()`.

### 4. Progress Tracking

- Progress saves every 5 seconds while playing
- Saved to IndexedDB with lesson ID as key
- Videos >90% watched are marked "completed"
- Progress resumes automatically when reopening a video

## Common Patterns

### Adding a New Component

```typescript
import React from 'react';
import type { Lesson, Collection } from '../types';

interface MyComponentProps {
  data: Collection;
  onSelect: (lesson: Lesson) => void;
}

const MyComponent: React.FC<MyComponentProps> = ({ data, onSelect }) => {
  // Component logic
  return <div>...</div>;
};

export default MyComponent;
```

### Creating a New Hook

```typescript
import { useState, useEffect } from "react";
import type { Lesson } from "../types";

interface UseMyHookReturn {
  data: Lesson | null;
  isLoading: boolean;
}

export const useMyHook = (lessonId: string): UseMyHookReturn => {
  const [data, setData] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Hook logic

  return { data, isLoading };
};
```

### Working with IndexedDB

```typescript
import { getCollection, saveCollection } from "../utils/storage";
import type { Collection } from "../types";

// Load
const collection = await getCollection(collectionId);
if (!collection) {
  // Handle not found
}

// Save
await saveCollection(myCollection);

// Update
const updated = { ...collection, title: "New Title" };
await saveCollection(updated);
```

### Accessing Video Files

```typescript
import { getVideoURL } from '../utils/folderParser';
import type { Lesson } from '../types';

const lesson: Lesson = getCurrentLesson();
const videoURL = await getVideoURL(lesson.fileHandle);

// Use with video element
<video src={videoURL} />

// Clean up when done
URL.revokeObjectURL(videoURL);
```

## Code Conventions

### Naming

- Components: `PascalCase.tsx` (e.g., `VideoPlayer.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useProgress.ts`)
- Utilities: `camelCase.ts` (e.g., `folderParser.ts`)
- Types: `PascalCase` interfaces (e.g., `Lesson`, `Collection`)

### File Organization

- One component per file
- Export default for components
- Named exports for utilities/hooks
- All types in `src/types/index.ts`

### TypeScript

- Always use explicit types for function parameters
- Use type inference for simple variables
- Prefer interfaces over types for objects
- Use `React.FC<Props>` for components

### Error Handling

```typescript
try {
  const result = await someAsyncOperation();
  // Handle success
} catch (err) {
  console.error("Operation failed:", err);
  // Show user-friendly error
}
```

## Key Files Reference

### Components

**CourseGrid.tsx**

- Home screen showing all collections
- Handles "Add Video Folder" button
- Displays collection cards with progress
- Manages collection deletion

**VideoPlayer.tsx**

- Full video player with custom controls
- Progress tracking
- Keyboard shortcuts (Space, arrows, F, M)
- Auto-hide controls after 3 seconds of inactivity
- Auto-play next lesson on video end

**LessonSidebar.tsx**

- Displays lesson list
- Shows progress bars
- Indicates completed lessons (checkmark)
- Groups lessons by section if subfolders exist
- Collapsible on mobile

### Hooks

**useFileSystem.ts**

- Wraps File System Access API
- Handles folder selection
- Verifies permissions
- Checks browser support

**useProgress.ts**

- Loads/saves progress from IndexedDB
- Calculates percentages
- Determines completion status
- Manages progress for all lessons

**useControls.ts**

- Auto-hide/show controls based on activity
- Uses timeout to hide after 3 seconds
- Shows controls when paused

### Utils

**storage.ts**

- All IndexedDB operations
- CRUD for collections, progress, folder handles
- Uses `idb` library for promise-based API

**folderParser.ts**

- Parses folder structure into Collection
- Extracts number prefixes for sorting
- Cleans names (removes prefixes/extensions)
- Handles nested folders as sections
- Formats file sizes and durations

## Development Commands

```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Build for production (includes type check)
npm run preview      # Preview production build
npm run type-check   # Check TypeScript types without building
```

## Common Tasks

### Adding a New Feature

1. Define types in `src/types/index.ts` if needed
2. Create component/hook in appropriate directory
3. Import types: `import type { Lesson } from '../types'`
4. Use existing hooks/utils where possible
5. Update parent components to integrate

### Debugging Issues

1. Check browser console for errors
2. Verify browser support (Chrome/Edge/Opera only)
3. Check if folder permissions are granted
4. Run `npm run type-check` for TypeScript errors
5. Check IndexedDB in DevTools → Application tab

### Testing Video Formats

Supported: MP4, WebM, OGG, MOV, AVI, MKV, M4V

- Check `folderParser.ts` → `VIDEO_EXTENSIONS` array
- Browser support varies by codec

## Important Notes

### Browser Limitations

- File System Access API only in Chrome-based browsers
- Safari and Firefox not supported (yet)
- Mobile requires cloud storage integration (Phase 2)

### Storage Considerations

- Folder handles persist in IndexedDB
- No actual video data stored (only references)
- Progress data is small (~100 bytes per video)
- Can handle thousands of videos easily

### Performance

- Object URLs are created on-demand, not stored
- Progress saves are debounced (every 5 seconds)
- Folder parsing is fast (<1 second for 100s of files)

### Security

- Users must explicitly grant folder access
- We only request 'read' permission, never 'readwrite'
- No server communication - everything local
- No analytics or tracking

## Future Enhancements (Phase 2)

- Cloud storage integration (iCloud, Google Drive)
- Mobile optimization
- Thumbnail generation from videos
- Subtitle support (.srt, .vtt)
- Playlist creation
- Search functionality
- Bookmarks/notes per lesson

## Troubleshooting

### "File System Access API not supported"

→ User needs Chrome 86+, Edge 86+, or Opera 72+

### "Permission denied to access folder"

→ User needs to grant permission or re-select folder

### Videos won't play

→ Check video codec support in browser
→ Try MP4 with H.264 codec (most compatible)

### Progress not saving

→ Check IndexedDB permissions
→ Verify lesson ID is consistent

### Types not working in IDE

→ Run `npm install` to get TypeScript types
→ Restart IDE/TypeScript server

## Getting Help

When asking Claude Code for help:

**Good context to provide**:

- "I'm working on [component name] in src/components/"
- "I want to add [feature] using [existing hook/util]"
- "The types are in src/types/index.ts"
- "I'm getting a TypeScript error in [file]"

**Files to reference**:

- Types: `src/types/index.ts`
- Storage: `src/utils/storage.ts`
- Parsing: `src/utils/folderParser.ts`

## Project Philosophy

1. **Type Safety First** - Everything is typed
2. **Browser Native** - Use web APIs, minimize dependencies
3. **Privacy Focused** - No servers, no tracking
4. **Performance** - Lazy loading, efficient storage
5. **User Control** - Users own their data and files

---

**This context file helps Claude understand LocalPlay's architecture, conventions, and patterns for effective assistance with development tasks.**
