// Type definitions for LocalPlay

// File System Access API types
export interface FileSystemDirectoryHandle {
  kind: 'directory';
  name: string;
  getDirectoryHandle(name: string): Promise<FileSystemDirectoryHandle>;
  getFileHandle(name: string): Promise<FileSystemFileHandle>;
  values(): AsyncIterableIterator<FileSystemHandle>;
  queryPermission(descriptor?: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
  requestPermission(descriptor?: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
}

export interface FileSystemFileHandle {
  kind: 'file';
  name: string;
  getFile(): Promise<File>;
}

export type FileSystemHandle = FileSystemDirectoryHandle | FileSystemFileHandle;

// Video type (individual video file)
export interface Video {
  id: string;
  name: string;
  filename: string;
  fileHandle: FileSystemFileHandle;
  size: number;
  duration: number;
  sortOrder: number;
  numberPrefix: string;  // Original number prefix (e.g., "01", "02")
  subtitleFile?: FileSystemFileHandle;  // Associated .srt file
}

// Lesson type (subfolder containing videos)
export interface Lesson {
  id: string;
  name: string;
  originalName: string;
  videos: Video[];
  totalVideos: number;
  totalDuration: number;  // Total duration in seconds
  sortOrder: number;
  dirHandle: FileSystemDirectoryHandle;
  numberPrefix: string;  // Original number prefix (e.g., "01", "02")
  thumbnail?: string;    // Data URL of thumbnail image
}

// Course type (root folder containing lessons)
export interface Course {
  id: string;
  title: string;
  originalName: string;
  lessons: Lesson[];
  totalLessons: number;
  totalVideos: number;
  totalDuration: number;  // Total duration in seconds
  dirHandle: FileSystemDirectoryHandle;
  lastAccessed?: number;
}

// User preferences
export interface UserPreferences {
  id: string;
  autoPlay: boolean;
  replaceUnderscoreWithColon: boolean;
  sidebarWidth: number;
  sidebarVisible: boolean;
  defaultPlaybackRate: number;
  defaultVolume: number;
  theme: 'dark' | 'light';
  subtitlesEnabled: boolean;
  lastUpdated: number;
}

// Subtitle cue for SRT parsing
export interface SubtitleCue {
  id: number;
  startTime: number;  // in seconds
  endTime: number;    // in seconds
  text: string;
}

// Alias for backward compatibility
export type Collection = Course;

// Progress tracking types
export interface VideoProgress {
  id: string;
  currentTime: number;
  duration: number;
  percentage: number;
  lastWatched: number;
}

// Storage types
export interface FolderHandleData {
  id: string;
  handle: FileSystemDirectoryHandle;
  metadata: {
    title: string;
    totalLessons: number;
    totalVideos: number;
  };
  timestamp: number;
}

// Component prop types
export interface VideoSidebarProps {
  videos: Video[];
  currentVideo: Video | null;
  onSelectVideo: (video: Video) => void;
  progress: Record<string, VideoProgress>;
  lessonName: string;
  isOpen: boolean;
  onToggle: () => void;
  width: number;
  onWidthChange: (width: number) => void;
  replaceUnderscore: boolean;
  onMarkVideoComplete?: (video: Video) => void;
  onResetVideoProgress?: (video: Video) => void;
}

export interface LessonCardProps {
  lesson: Lesson;
  progress: number;
  onOpen: (lessonId: string) => void;
}

export interface CourseCardProps {
  course: Course;
  progress: number;
  onOpen: (id: string) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}

// Hook return types
export interface UseFileSystemReturn {
  selectFolder: () => Promise<Course | null>;
  verifyFolderAccess: (dirHandle: FileSystemDirectoryHandle) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  isSupported: boolean;
}

export interface UseProgressReturn {
  currentProgress: VideoProgress | null;
  allProgress: Record<string, VideoProgress>;
  updateProgress: (id: string, currentTime: number, duration: number) => Promise<void>;
  getProgressPercentage: (id: string) => number;
  getLessonProgress: (lesson: Lesson) => number;
  getCourseProgress: (course: Course) => number;
  isCompleted: (id: string) => boolean;
  loadProgress: (id: string) => Promise<VideoProgress | null>;
  loadAllProgress: () => Promise<void>;
  resetLessonProgress: (lesson: Lesson) => Promise<void>;
  markLessonComplete: (lesson: Lesson) => Promise<void>;
  resetCourseProgress: (course: Course) => Promise<void>;
  markCourseComplete: (course: Course) => Promise<void>;
  removeFromRecents: (lesson: Lesson) => Promise<void>;
}

export interface UseControlsReturn {
  showControls: boolean;
  handleActivity: () => void;
}

export interface UsePreferencesReturn {
  preferences: UserPreferences | null;
  isLoading: boolean;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
}

// Utility types
export type PermissionState = 'granted' | 'denied' | 'prompt';

// Window extensions for File System Access API
declare global {
  interface Window {
    showDirectoryPicker(options?: {
      mode?: 'read' | 'readwrite';
    }): Promise<FileSystemDirectoryHandle>;
  }
}
