import { useState, useEffect, useCallback } from 'react';
import { saveProgress, getProgress, getAllProgress, deleteProgress, markVideoComplete, clearLastWatched } from '../utils/storage';
import type { VideoProgress, Lesson, Course, UseProgressReturn } from '../types';

export const useProgress = (videoId?: string): UseProgressReturn => {
  const [currentProgress, setCurrentProgress] = useState<VideoProgress | null>(null);
  const [allProgress, setAllProgress] = useState<Record<string, VideoProgress>>({});

  // Load progress for specific video
  useEffect(() => {
    if (videoId) {
      loadProgress(videoId);
    }
  }, [videoId]);

  // Load all progress data
  useEffect(() => {
    loadAllProgress();
  }, []);

  const loadProgress = async (id: string): Promise<VideoProgress | null> => {
    try {
      const progress = await getProgress(id);
      setCurrentProgress(progress || null);
      return progress || null;
    } catch (err) {
      console.error('Error loading progress:', err);
      return null;
    }
  };

  const loadAllProgress = useCallback(async (): Promise<void> => {
    try {
      const progressList = await getAllProgress();
      const progressMap = progressList.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {} as Record<string, VideoProgress>);
      setAllProgress(progressMap);
    } catch (err) {
      console.error('Error loading all progress:', err);
    }
  }, []);

  // Update progress (with debouncing)
  const updateProgress = useCallback(async (
    id: string,
    currentTime: number,
    duration: number
  ): Promise<void> => {
    try {
      await saveProgress(id, currentTime, duration);
      
      // Update local state
      const newProgress: VideoProgress = {
        id,
        currentTime,
        duration,
        percentage: (currentTime / duration) * 100,
        lastWatched: Date.now(),
      };
      
      setCurrentProgress(newProgress);
      setAllProgress(prev => ({
        ...prev,
        [id]: newProgress,
      }));
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  }, []);

  // Get progress percentage for a video
  const getProgressPercentage = useCallback((id: string): number => {
    return allProgress[id]?.percentage || 0;
  }, [allProgress]);

  // Check if video is completed (>95% watched OR less than 5 seconds remaining)
  const isCompleted = useCallback((id: string): boolean => {
    const progress = allProgress[id];
    if (!progress) return false;
    const remainingTime = progress.duration - progress.currentTime;
    return progress.percentage > 95 || remainingTime < 5;
  }, [allProgress]);

  // Calculate progress for a lesson (aggregate of videos)
  const getLessonProgress = useCallback((lesson: Lesson): number => {
    if (!lesson.videos || lesson.videos.length === 0) return 0;

    const completedVideos = lesson.videos.filter(video => {
      return isCompleted(video.id);
    }).length;

    return Math.round((completedVideos / lesson.videos.length) * 100);
  }, [isCompleted]);

  // Calculate progress for a course (aggregate of all videos across lessons)
  const getCourseProgress = useCallback((course: Course): number => {
    if (!course.lessons || course.totalVideos === 0) return 0;

    let completedVideos = 0;
    let totalVideos = 0;

    course.lessons.forEach(lesson => {
      // Skip lessons without videos array (old data structure)
      if (!lesson.videos) return;

      lesson.videos.forEach(video => {
        totalVideos++;
        if (isCompleted(video.id)) {
          completedVideos++;
        }
      });
    });

    if (totalVideos === 0) return 0;
    return Math.round((completedVideos / totalVideos) * 100);
  }, [allProgress, isCompleted]);

  // Reset progress for a lesson (all videos)
  const resetLessonProgress = useCallback(async (lesson: Lesson): Promise<void> => {
    try {
      for (const video of lesson.videos) {
        await deleteProgress(video.id);
      }
      // Refresh all progress
      await loadAllProgress();
    } catch (err) {
      console.error('Error resetting lesson progress:', err);
    }
  }, [loadAllProgress]);

  // Mark lesson as complete (all videos)
  const markLessonComplete = useCallback(async (lesson: Lesson): Promise<void> => {
    try {
      for (const video of lesson.videos) {
        await markVideoComplete(video.id, video.duration);
      }
      // Refresh all progress
      await loadAllProgress();
    } catch (err) {
      console.error('Error marking lesson complete:', err);
    }
  }, [loadAllProgress]);

  // Reset progress for a course (all lessons and videos)
  const resetCourseProgress = useCallback(async (course: Course): Promise<void> => {
    try {
      for (const lesson of course.lessons) {
        for (const video of lesson.videos) {
          await deleteProgress(video.id);
        }
      }
      // Refresh all progress
      await loadAllProgress();
    } catch (err) {
      console.error('Error resetting course progress:', err);
    }
  }, [loadAllProgress]);

  // Mark course as complete (all lessons and videos)
  const markCourseComplete = useCallback(async (course: Course): Promise<void> => {
    try {
      for (const lesson of course.lessons) {
        for (const video of lesson.videos) {
          await markVideoComplete(video.id, video.duration);
        }
      }
      // Refresh all progress
      await loadAllProgress();
    } catch (err) {
      console.error('Error marking course complete:', err);
    }
  }, [loadAllProgress]);

  // Remove lesson from recents (clears lastWatched but preserves progress)
  const removeFromRecents = useCallback(async (lesson: Lesson): Promise<void> => {
    try {
      for (const video of lesson.videos) {
        await clearLastWatched(video.id);
      }
      // Refresh all progress
      await loadAllProgress();
    } catch (err) {
      console.error('Error removing from recents:', err);
    }
  }, [loadAllProgress]);

  return {
    currentProgress,
    allProgress,
    updateProgress,
    getProgressPercentage,
    getLessonProgress,
    getCourseProgress,
    isCompleted,
    loadProgress,
    loadAllProgress,
    resetLessonProgress,
    markLessonComplete,
    resetCourseProgress,
    markCourseComplete,
    removeFromRecents,
  };
};
