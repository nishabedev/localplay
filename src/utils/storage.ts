import { openDB, IDBPDatabase } from 'idb';
import type { Collection, VideoProgress, FolderHandleData, FileSystemDirectoryHandle, UserPreferences } from '../types';

const DB_NAME = 'localplay-db';
const DB_VERSION = 3;

type LocalPlayDB = {
  folders: FolderHandleData;
  progress: VideoProgress;
  collections: Collection;
  preferences: UserPreferences;
};

// Initialize database
export const initDB = async (): Promise<IDBPDatabase<LocalPlayDB>> => {
  return openDB<LocalPlayDB>(DB_NAME, DB_VERSION, {
    upgrade(db, _oldVersion, _newVersion) {
      // Store for folder handles
      if (!db.objectStoreNames.contains('folders')) {
        db.createObjectStore('folders', { keyPath: 'id' });
      }

      // Store for video progress
      if (!db.objectStoreNames.contains('progress')) {
        db.createObjectStore('progress', { keyPath: 'id' });
      }

      // Store for collections (courses/series)
      if (!db.objectStoreNames.contains('collections')) {
        db.createObjectStore('collections', { keyPath: 'id' });
      }

      // Store for user preferences (added in version 2)
      if (!db.objectStoreNames.contains('preferences')) {
        db.createObjectStore('preferences', { keyPath: 'id' });
      }
    },
  });
};

// Folder Handle Operations
export const saveFolderHandle = async (
  id: string,
  handle: FileSystemDirectoryHandle,
  metadata: { title: string; totalLessons: number; totalVideos: number }
): Promise<void> => {
  const db = await initDB();
  await db.put('folders', { id, handle, metadata, timestamp: Date.now() });
};

export const getFolderHandle = async (id: string): Promise<FolderHandleData | undefined> => {
  const db = await initDB();
  return db.get('folders', id);
};

export const getAllFolderHandles = async (): Promise<FolderHandleData[]> => {
  const db = await initDB();
  return db.getAll('folders');
};

export const deleteFolderHandle = async (id: string): Promise<void> => {
  const db = await initDB();
  await db.delete('folders', id);
};

// Video Progress Operations
export const saveProgress = async (
  videoId: string,
  currentTime: number,
  duration: number
): Promise<void> => {
  const db = await initDB();
  await db.put('progress', {
    id: videoId,
    currentTime,
    duration,
    percentage: (currentTime / duration) * 100,
    lastWatched: Date.now(),
  });
};

export const getProgress = async (videoId: string): Promise<VideoProgress | undefined> => {
  const db = await initDB();
  return db.get('progress', videoId);
};

export const getAllProgress = async (): Promise<VideoProgress[]> => {
  const db = await initDB();
  return db.getAll('progress');
};

export const deleteProgress = async (videoId: string): Promise<void> => {
  const db = await initDB();
  await db.delete('progress', videoId);
};

export const markVideoComplete = async (videoId: string, duration: number): Promise<void> => {
  const db = await initDB();
  await db.put('progress', {
    id: videoId,
    currentTime: duration,
    duration,
    percentage: 100,
    lastWatched: Date.now(),
  });
};

export const clearLastWatched = async (videoId: string): Promise<void> => {
  const db = await initDB();
  const progress = await db.get('progress', videoId);
  if (progress) {
    await db.put('progress', {
      ...progress,
      lastWatched: 0,
    });
  }
};

// Collection Operations
export const saveCollection = async (collection: Collection): Promise<void> => {
  const db = await initDB();
  await db.put('collections', {
    ...collection,
    lastAccessed: Date.now(),
  });
};

export const getCollection = async (id: string): Promise<Collection | undefined> => {
  const db = await initDB();
  return db.get('collections', id);
};

export const getAllCollections = async (): Promise<Collection[]> => {
  const db = await initDB();
  return db.getAll('collections');
};

export const deleteCollection = async (id: string): Promise<void> => {
  const db = await initDB();
  await db.delete('collections', id);
};

// Alias functions for Course naming (Collection = Course)
export const saveCourse = saveCollection;
export const getCourse = getCollection;
export const getAllCourses = getAllCollections;
export const deleteCourse = deleteCollection;

// User Preferences Operations
export const getDefaultPreferences = (): UserPreferences => ({
  id: 'user-preferences',
  autoPlay: true,
  replaceUnderscoreWithColon: true,
  sidebarWidth: 320,
  sidebarVisible: true,
  defaultPlaybackRate: 1,
  defaultVolume: 1,
  theme: 'dark',
  subtitlesEnabled: true,
  lastUpdated: Date.now(),
});

export const savePreferences = async (preferences: Partial<UserPreferences>): Promise<void> => {
  const db = await initDB();
  const existing = await db.get('preferences', 'user-preferences');
  const updated: UserPreferences = {
    ...getDefaultPreferences(),
    ...existing,
    ...preferences,
    id: 'user-preferences',
    lastUpdated: Date.now(),
  };
  await db.put('preferences', updated);
};

export const getPreferences = async (): Promise<UserPreferences> => {
  const db = await initDB();
  const preferences = await db.get('preferences', 'user-preferences');
  return preferences || getDefaultPreferences();
};
