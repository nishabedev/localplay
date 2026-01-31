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

// Generate thumbnail from video file
const generateThumbnail = async (fileHandle: FileSystemFileHandle): Promise<string> => {
  return new Promise(async (resolve) => {
    try {
      const file = await fileHandle.getFile();
      const videoUrl = URL.createObjectURL(file);

      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        // Seek to 10% of the video or 2 seconds, whichever is smaller
        video.currentTime = Math.min(video.duration * 0.1, 2);
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

// Parse a lesson folder (subfolder containing videos)
const parseLessonFolder = async (
  dirHandle: FileSystemDirectoryHandle,
  courseName: string
): Promise<Lesson> => {
  const videos: Video[] = [];

  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file' && isVideoFile(entry.name)) {
      const fileHandle = await dirHandle.getFileHandle(entry.name);
      const file = await fileHandle.getFile();

      videos.push({
        id: generateVideoId(courseName, dirHandle.name, entry.name),
        name: cleanName(entry.name.replace(/\.[^/.]+$/, '')), // Remove extension
        filename: entry.name,
        fileHandle,
        size: file.size,
        duration: 0, // Will be set when video loads
        sortOrder: extractNumber(entry.name),
        numberPrefix: extractNumberPrefix(entry.name),
      });
    }
  }

  // Sort videos by number prefix
  videos.sort((a, b) => a.sortOrder - b.sortOrder);

  // Generate thumbnail from first video
  let thumbnail = '';
  if (videos.length > 0) {
    thumbnail = await generateThumbnail(videos[0].fileHandle);
  }

  return {
    id: generateLessonId(courseName, dirHandle.name),
    name: cleanName(dirHandle.name),
    originalName: dirHandle.name,
    videos,
    totalVideos: videos.length,
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

  // Iterate through directory entries
  for await (const entry of dirHandle.values()) {
    // Only process subdirectories as lessons (ignore loose video files at root)
    if (entry.kind === 'directory') {
      const lessonDirHandle = await dirHandle.getDirectoryHandle(entry.name);
      const lesson = await parseLessonFolder(lessonDirHandle, dirHandle.name);

      // Only add lessons that have videos
      if (lesson.videos.length > 0) {
        lessons.push(lesson);
        totalVideos += lesson.totalVideos;
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
