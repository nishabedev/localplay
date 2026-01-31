import { openDB, IDBPDatabase } from 'idb';
import type { Collection, VideoProgress, FolderHandleData, FileSystemDirectoryHandle } from '../types';

const DB_NAME = 'localplay-db';
const DB_VERSION = 1;

type LocalPlayDB = {
  folders: FolderHandleData;
  progress: VideoProgress;
  collections: Collection;
};

// Initialize database
export const initDB = async (): Promise<IDBPDatabase<LocalPlayDB>> => {
  return openDB<LocalPlayDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
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
