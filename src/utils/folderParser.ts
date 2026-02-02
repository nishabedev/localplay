import type { Course, Lesson, Video, FileSystemDirectoryHandle, FileSystemFileHandle } from '../types';

// Supported video formats
const VIDEO_EXTENSIONS = [
  '.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv',
  '.m4v', '.flv', '.wmv', '.mpg', '.mpeg'
];

// Check if file is a video
const isVideoFile = (filename: string): boolean => {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return VIDEO_EXTENSIONS.includes(ext);
};

// Extract number prefix from filename/foldername (returns the number for sorting)
const extractNumber = (name: string): number => {
  const match = name.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : Infinity;
};

// Extract number prefix string from filename/foldername (returns the original string like "01", "02")
const extractNumberPrefix = (name: string): string => {
  const match = name.match(/^(\d+)/);
  return match ? match[1] : '';
};

// Remove number prefix from name
const cleanName = (name: string): string => {
  return name.replace(/^\d+[\s\-_.]*/, '').trim();
};

// Generate stable IDs
const generateCourseId = (folderName: string): string => {
  return `course-${folderName}`;
};

const generateLessonId = (courseName: string, lessonName: string): string => {
  return `lesson-${courseName}-${lessonName}`;
};

const generateVideoId = (courseName: string, lessonName: string, fileName: string): string => {
  return `video-${courseName}-${lessonName}-${fileName}`;
};

// Get video duration from file
const getVideoDuration = async (fileHandle: FileSystemFileHandle): Promise<number> => {
  return new Promise(async (resolve) => {
    try {
      const file = await fileHandle.getFile();
      const videoUrl = URL.createObjectURL(file);

      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        URL.revokeObjectURL(videoUrl);
        resolve(video.duration || 0);
      };

      video.onerror = () => {
        URL.revokeObjectURL(videoUrl);
        resolve(0);
      };

      // Timeout after 5 seconds
      setTimeout(() => {
        URL.revokeObjectURL(videoUrl);
        resolve(0);
      }, 5000);

      video.src = videoUrl;
      video.load();
    } catch (error) {
      console.error('Error getting video duration:', error);
      resolve(0);
    }
  });
};

// Generate thumbnail from video file (at 10s if video > 10s, else 10% or 2s)
const generateThumbnail = async (fileHandle: FileSystemFileHandle, duration: number): Promise<string> => {
  return new Promise(async (resolve) => {
    try {
      const file = await fileHandle.getFile();
      const videoUrl = URL.createObjectURL(file);

      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        // Seek to 10s if video > 10s, otherwise use 10% or 2s whichever is smaller
        const seekTime = duration > 10 ? 10 : Math.min(duration * 0.1, 2);
        video.currentTime = seekTime;
      };

      video.onseeked = () => {
        // Create canvas and draw the frame
        const canvas = document.createElement('canvas');
        const aspectRatio = video.videoWidth / video.videoHeight;

        // Set thumbnail size (max 320px width)
        canvas.width = 320;
        canvas.height = Math.round(320 / aspectRatio);

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          URL.revokeObjectURL(videoUrl);
          resolve(dataUrl);
        } else {
          URL.revokeObjectURL(videoUrl);
          resolve('');
        }
      };

      video.onerror = () => {
        URL.revokeObjectURL(videoUrl);
        resolve('');
      };

      // Timeout after 10 seconds
      setTimeout(() => {
        URL.revokeObjectURL(videoUrl);
        resolve('');
      }, 10000);

      video.src = videoUrl;
      video.load();
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      resolve('');
    }
  });
};

// Find subtitle file for a video in the subtitles folder
const findSubtitleForVideo = async (
  parentDirHandle: FileSystemDirectoryHandle,
  lessonName: string,
  videoFilename: string
): Promise<FileSystemFileHandle | undefined> => {
  try {
    // Look for a folder named {lessonName}_subtitles
    const subtitlesFolderName = `${lessonName}_subtitles`;
    const subtitlesDir = await parentDirHandle.getDirectoryHandle(subtitlesFolderName);

    // Get video name without extension
    const videoNameWithoutExt = videoFilename.replace(/\.[^/.]+$/, '');

    // Look for matching .srt file
    for await (const entry of subtitlesDir.values()) {
      if (entry.kind === 'file' && entry.name.toLowerCase().endsWith('.srt')) {
        const srtNameWithoutExt = entry.name.replace(/\.srt$/i, '');
        if (srtNameWithoutExt === videoNameWithoutExt) {
          return await subtitlesDir.getFileHandle(entry.name);
        }
      }
    }
  } catch {
    // Subtitle folder not found or other error - subtitles not available
  }
  return undefined;
};

// Parse a lesson folder (subfolder containing videos)
const parseLessonFolder = async (
  dirHandle: FileSystemDirectoryHandle,
  courseName: string,
  parentDirHandle: FileSystemDirectoryHandle
): Promise<Lesson> => {
  const videos: Video[] = [];

  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file' && isVideoFile(entry.name)) {
      const fileHandle = await dirHandle.getFileHandle(entry.name);
      const file = await fileHandle.getFile();

      // Get video duration
      const duration = await getVideoDuration(fileHandle);

      // Find subtitle file for this video
      const subtitleFile = await findSubtitleForVideo(
        parentDirHandle,
        dirHandle.name,
        entry.name
      );

      videos.push({
        id: generateVideoId(courseName, dirHandle.name, entry.name),
        name: cleanName(entry.name.replace(/\.[^/.]+$/, '')), // Remove extension
        filename: entry.name,
        fileHandle,
        size: file.size,
        duration,
        sortOrder: extractNumber(entry.name),
        numberPrefix: extractNumberPrefix(entry.name),
        subtitleFile,
      });
    }
  }

  // Sort videos by number prefix
  videos.sort((a, b) => a.sortOrder - b.sortOrder);

  // Calculate total duration
  const totalDuration = videos.reduce((sum, video) => sum + video.duration, 0);

  // Generate thumbnail from first video (at 10s if duration > 10s)
  let thumbnail = '';
  if (videos.length > 0) {
    thumbnail = await generateThumbnail(videos[0].fileHandle, videos[0].duration);
  }

  return {
    id: generateLessonId(courseName, dirHandle.name),
    name: cleanName(dirHandle.name),
    originalName: dirHandle.name,
    videos,
    totalVideos: videos.length,
    totalDuration,
    sortOrder: extractNumber(dirHandle.name),
    dirHandle,
    numberPrefix: extractNumberPrefix(dirHandle.name),
    thumbnail,
  };
};

// Parse a course folder structure (3-level hierarchy)
// Root folder = Course, Subfolders = Lessons, Video files in subfolders = Videos
export const parseFolderStructure = async (dirHandle: FileSystemDirectoryHandle): Promise<Course> => {
  const lessons: Lesson[] = [];
  let totalVideos = 0;
  let totalDuration = 0;

  // Iterate through directory entries
  for await (const entry of dirHandle.values()) {
    // Only process subdirectories as lessons (ignore loose video files at root and _subtitles folders)
    if (entry.kind === 'directory' && !entry.name.endsWith('_subtitles')) {
      const lessonDirHandle = await dirHandle.getDirectoryHandle(entry.name);
      const lesson = await parseLessonFolder(lessonDirHandle, dirHandle.name, dirHandle);

      // Only add lessons that have videos
      if (lesson.videos.length > 0) {
        lessons.push(lesson);
        totalVideos += lesson.totalVideos;
        totalDuration += lesson.totalDuration;
      }
    }
  }

  // Sort lessons by number prefix
  lessons.sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    id: generateCourseId(dirHandle.name),
    title: cleanName(dirHandle.name),
    originalName: dirHandle.name,
    lessons,
    totalLessons: lessons.length,
    totalVideos,
    totalDuration,
    dirHandle,
  };
};

// Get video URL from file handle
export const getVideoURL = async (fileHandle: FileSystemFileHandle): Promise<string | null> => {
  try {
    const file = await fileHandle.getFile();
    return URL.createObjectURL(file);
  } catch (error) {
    console.error('Error getting video URL:', error);
    return null;
  }
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Format duration (seconds to HH:MM:SS)
export const formatDuration = (seconds: number): string => {
  if (!seconds || seconds === 0) return '0:00';

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// Format total duration as "1h 23m" or "45m" or "5m 30s"
export const formatTotalDuration = (seconds: number): string => {
  if (!seconds || seconds === 0) return '0m';

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  if (m > 0) {
    return s > 0 && m < 10 ? `${m}m ${s}s` : `${m}m`;
  }
  return `${s}s`;
};

// Format display name (replace underscores with spaces if enabled)
export const formatDisplayName = (name: string, replaceUnderscore: boolean): string => {
  if (!replaceUnderscore) return name;
  return name.replace(/_/g, ' ');
};
