import { useState, useCallback } from 'react';
import { parseFolderStructure } from '../utils/folderParser';
import { saveFolderHandle, saveCourse } from '../utils/storage';
import type { Course, UseFileSystemReturn, FileSystemDirectoryHandle } from '../types';

export const useFileSystem = (): UseFileSystemReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if File System Access API is supported
  const isSupported = 'showDirectoryPicker' in window;

  // Request folder access
  const selectFolder = useCallback(async (): Promise<Course | null> => {
    if (!isSupported) {
      setError('File System Access API is not supported in this browser. Please use Chrome, Edge, or Opera.');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Show directory picker
      const dirHandle = await window.showDirectoryPicker({
        mode: 'read',
      });

      // Verify we have permission
      const permission = await dirHandle.queryPermission({ mode: 'read' });
      if (permission !== 'granted') {
        const newPermission = await dirHandle.requestPermission({ mode: 'read' });
        if (newPermission !== 'granted') {
          throw new Error('Permission denied to access folder');
        }
      }

      // Parse folder structure (3-level hierarchy)
      const course = await parseFolderStructure(dirHandle);

      // Validate that course has lessons with videos
      if (course.lessons.length === 0) {
        setError('No lesson subfolders with videos found. Please select a course folder that contains lesson subfolders with video files.');
        setIsLoading(false);
        return null;
      }

      // Save to IndexedDB
      await saveFolderHandle(course.id, dirHandle, {
        title: course.title,
        totalLessons: course.totalLessons,
        totalVideos: course.totalVideos,
      });

      await saveCourse(course);

      setIsLoading(false);
      return course;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User cancelled
        setError(null);
      } else {
        console.error('Error selecting folder:', err);
        setError(err instanceof Error ? err.message : 'Failed to access folder');
      }
      setIsLoading(false);
      return null;
    }
  }, [isSupported]);

  // Verify folder access (for saved folders)
  const verifyFolderAccess = useCallback(async (dirHandle: FileSystemDirectoryHandle): Promise<boolean> => {
    try {
      const permission = await dirHandle.queryPermission({ mode: 'read' });
      if (permission === 'granted') {
        return true;
      }
      
      // Request permission again
      const newPermission = await dirHandle.requestPermission({ mode: 'read' });
      return newPermission === 'granted';
    } catch (err) {
      console.error('Error verifying folder access:', err);
      return false;
    }
  }, []);

  return {
    selectFolder,
    verifyFolderAccess,
    isLoading,
    error,
    isSupported,
  };
};
