import { useState, useEffect, useCallback, useRef } from 'react';
import type { UseControlsReturn } from '../types';

export const useControls = (isPlaying: boolean, timeout: number = 3000): UseControlsReturn => {
  const [showControls, setShowControls] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Show controls and reset timeout
  const handleActivity = useCallback(() => {
    setShowControls(true);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only hide if video is playing
    if (isPlaying) {
      timeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, timeout);
    }
  }, [isPlaying, timeout]);

  // Show controls when video is paused
  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    } else {
      handleActivity();
    }
  }, [isPlaying, handleActivity]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    showControls,
    handleActivity,
  };
};
