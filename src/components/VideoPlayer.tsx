import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getVideoURL, formatDuration, formatDisplayName } from '../utils/folderParser';
import { getCourse, getFolderHandle, markVideoComplete, deleteProgress } from '../utils/storage';
import { useProgress } from '../hooks/useProgress';
import { useControls } from '../hooks/useControls';
import { usePreferences } from '../hooks/usePreferences';
import VideoSidebar from './VideoSidebar';
import Settings from './Settings';
import Help from './Help';
import ConfirmDialog from './ConfirmDialog';
import type { Course, Lesson, Video, SubtitleCue } from '../types';

const VideoPlayer: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default visible on desktop
  const [loading, setLoading] = useState(true);
  const [subtitles, setSubtitles] = useState<SubtitleCue[]>([]);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [initialVideoSet, setInitialVideoSet] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmStyle?: 'danger' | 'primary';
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const { updateProgress, allProgress, loadProgress, loadAllProgress } = useProgress(currentVideo?.id);
  const { showControls, handleActivity } = useControls(isPlaying);
  const { preferences, updatePreference } = usePreferences();

  // Initialize from preferences - track if we've done initial setup
  const [prefsInitialized, setPrefsInitialized] = useState(false);

  useEffect(() => {
    if (preferences && !prefsInitialized) {
      setVolume(preferences.defaultVolume);
      setPlaybackRate(preferences.defaultPlaybackRate);
      setSidebarWidth(preferences.sidebarWidth);
      setSidebarOpen(preferences.sidebarVisible);
      setShowSubtitles(preferences.subtitlesEnabled ?? true);
      if (videoRef.current) {
        videoRef.current.volume = preferences.defaultVolume;
        videoRef.current.playbackRate = preferences.defaultPlaybackRate;
      }
      setPrefsInitialized(true);
    }
  }, [preferences, prefsInitialized]);

  // Load course and lesson
  useEffect(() => {
    setInitialVideoSet(false); // Reset when lesson changes
    loadCourseAndLesson();
  }, [courseId, lessonId]);

  // Set initial video once lesson and progress are loaded
  useEffect(() => {
    if (!currentLesson || initialVideoSet || currentLesson.videos.length === 0) return;

    // Find the most recently watched video in this lesson
    let mostRecentVideo = currentLesson.videos[0];
    let mostRecentTimestamp = 0;

    currentLesson.videos.forEach(video => {
      const progress = allProgress[video.id];
      if (progress?.lastWatched && progress.lastWatched > mostRecentTimestamp) {
        mostRecentTimestamp = progress.lastWatched;
        mostRecentVideo = video;
      }
    });

    setCurrentVideo(mostRecentVideo);
    setInitialVideoSet(true);
  }, [currentLesson, allProgress, initialVideoSet]);

  // Load video when current video changes
  useEffect(() => {
    if (currentVideo) {
      loadVideo();
      loadSubtitles();
    }
  }, [currentVideo]);

  // Update current subtitle based on time
  useEffect(() => {
    if (!showSubtitles || subtitles.length === 0) {
      setCurrentSubtitle('');
      return;
    }

    const cue = subtitles.find(
      (s) => currentTime >= s.startTime && currentTime <= s.endTime
    );
    setCurrentSubtitle(cue?.text || '');
  }, [currentTime, subtitles, showSubtitles]);

  // Update progress periodically
  useEffect(() => {
    if (!currentVideo || !isPlaying) return;

    const interval = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        updateProgress(
          currentVideo.id,
          videoRef.current.currentTime,
          videoRef.current.duration
        );
      }
    }, 2000); // Save every 2 seconds

    return () => clearInterval(interval);
  }, [currentVideo, isPlaying, updateProgress]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!videoRef.current) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skip(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skip(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          changeVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          changeVolume(-0.1);
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const loadCourseAndLesson = async (): Promise<void> => {
    try {
      if (!courseId || !lessonId) {
        navigate('/');
        return;
      }

      const c = await getCourse(courseId);
      if (!c) {
        navigate('/');
        return;
      }

      // Verify folder access
      const folderData = await getFolderHandle(courseId);
      if (folderData) {
        c.dirHandle = folderData.handle;
      }

      setCourse(c);

      // Find the lesson
      const lesson = c.lessons.find(l => l.id === lessonId);
      if (!lesson) {
        navigate(`/course/${courseId}`);
        return;
      }

      setCurrentLesson(lesson);
      // Video selection is handled by the separate useEffect that considers allProgress

      setLoading(false);
    } catch (err) {
      console.error('Error loading course:', err);
      navigate('/');
    }
  };

  const loadVideo = async (): Promise<void> => {
    if (!currentVideo) return;

    setLoading(true);

    try {
      const url = await getVideoURL(currentVideo.fileHandle);
      if (url) {
        setVideoURL(url);

        // Load saved progress
        const progress = await loadProgress(currentVideo.id);
        if (progress && videoRef.current) {
          videoRef.current.currentTime = progress.currentTime;
        }
      }
    } catch (err) {
      console.error('Error loading video:', err);
    } finally {
      setLoading(false);
    }
  };

  // Parse SRT content into SubtitleCue array
  const parseSRT = (content: string): SubtitleCue[] => {
    const cues: SubtitleCue[] = [];

    // Normalize line endings (handle Windows \r\n and old Mac \r)
    const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const blocks = normalizedContent.trim().split(/\n\n+/);

    for (const block of blocks) {
      const lines = block.split('\n').map(line => line.trim());
      if (lines.length < 3) continue;

      const idMatch = lines[0].match(/^\d+$/);
      if (!idMatch) continue;

      const timeMatch = lines[1].match(
        /(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/
      );
      if (!timeMatch) continue;

      const startTime =
        parseInt(timeMatch[1]) * 3600 +
        parseInt(timeMatch[2]) * 60 +
        parseInt(timeMatch[3]) +
        parseInt(timeMatch[4]) / 1000;

      const endTime =
        parseInt(timeMatch[5]) * 3600 +
        parseInt(timeMatch[6]) * 60 +
        parseInt(timeMatch[7]) +
        parseInt(timeMatch[8]) / 1000;

      const text = lines.slice(2).join('\n').trim();

      cues.push({
        id: parseInt(idMatch[0]),
        startTime,
        endTime,
        text,
      });
    }

    return cues;
  };

  const loadSubtitles = async (): Promise<void> => {
    setSubtitles([]);
    setCurrentSubtitle('');

    if (!currentVideo?.subtitleFile) {
      return;
    }

    try {
      const file = await currentVideo.subtitleFile.getFile();
      const content = await file.text();
      const parsed = parseSRT(content);
      setSubtitles(parsed);
    } catch {
      // Error loading subtitles - subtitles not available
    }
  };

  const restartVideo = (): void => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const skipSeconds = (seconds: number): void => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        0,
        Math.min(videoRef.current.duration, videoRef.current.currentTime + seconds)
      );
    }
  };

  const togglePlayPause = (): void => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const skip = (seconds: number): void => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const changeVolume = (delta: number): void => {
    if (videoRef.current) {
      const newVolume = Math.max(0, Math.min(1, volume + delta));
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  };

  const toggleMute = (): void => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setVolume(videoRef.current.muted ? 0 : 1);
    }
  };

  const toggleFullscreen = (): void => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleSelectVideo = (video: Video, autoPlay: boolean = false): void => {
    // Save current progress before switching
    if (currentVideo && videoRef.current) {
      updateProgress(
        currentVideo.id,
        videoRef.current.currentTime,
        videoRef.current.duration
      );
    }

    // Set flag to auto-play when video is ready
    setShouldAutoPlay(autoPlay);
    setCurrentVideo(video);

    // Close sidebar on mobile only
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleCanPlay = (): void => {
    if (shouldAutoPlay && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay might be blocked by browser
      });
      setShouldAutoPlay(false);
    }
  };

  const playNextVideo = (): void => {
    if (!currentLesson || !currentVideo) return;

    const currentIndex = currentLesson.videos.findIndex(v => v.id === currentVideo.id);
    if (currentIndex < currentLesson.videos.length - 1) {
      handleSelectVideo(currentLesson.videos[currentIndex + 1], true);
    }
  };

  const playPreviousVideo = (): void => {
    if (!currentLesson || !currentVideo) return;

    const currentIndex = currentLesson.videos.findIndex(v => v.id === currentVideo.id);
    if (currentIndex > 0) {
      handleSelectVideo(currentLesson.videos[currentIndex - 1]);
    }
  };

  const handleTimeUpdate = (): void => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = (): void => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);

      // Update video duration if not set
      if (currentVideo && currentVideo.duration === 0) {
        currentVideo.duration = videoRef.current.duration;
      }

      // Apply current playback rate to new video
      videoRef.current.playbackRate = playbackRate;
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>): void => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    if (videoRef.current) {
      videoRef.current.currentTime = pos * duration;
    }
  };

  const handleEnded = (): void => {
    // Mark as completed
    if (currentVideo) {
      updateProgress(currentVideo.id, duration, duration);
    }

    // Auto-play next video if enabled
    if (preferences?.autoPlay !== false) {
      playNextVideo();
    }
  };

  const handleMarkVideoComplete = (video: Video): void => {
    setConfirmDialog({
      isOpen: true,
      title: 'Mark as Complete',
      message: `Mark "${formatDisplayName(video.name, preferences?.replaceUnderscoreWithColon ?? true)}" as completed?`,
      confirmStyle: 'primary',
      onConfirm: async () => {
        await markVideoComplete(video.id, video.duration || 0);
        // Refresh all progress data for sidebar
        await loadAllProgress();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleResetVideoProgress = (video: Video): void => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reset Progress',
      message: `Reset progress for "${formatDisplayName(video.name, preferences?.replaceUnderscoreWithColon ?? true)}"?`,
      confirmStyle: 'danger',
      onConfirm: async () => {
        await deleteProgress(video.id);
        // Refresh all progress data for sidebar
        await loadAllProgress();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  if (!course || !currentLesson || !currentVideo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const replaceUnderscore = preferences?.replaceUnderscoreWithColon ?? true;

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar - hidden on desktop by default */}
      {sidebarOpen && (
        <VideoSidebar
          videos={currentLesson.videos}
          currentVideo={currentVideo}
          onSelectVideo={handleSelectVideo}
          progress={allProgress}
          lessonName={formatDisplayName(currentLesson.name, replaceUnderscore)}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          width={sidebarWidth}
          onWidthChange={setSidebarWidth}
          replaceUnderscore={replaceUnderscore}
          onMarkVideoComplete={handleMarkVideoComplete}
          onResetVideoProgress={handleResetVideoProgress}
        />
      )}

      {/* Main Player Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex-shrink-0">
          <div className="flex items-center">
            {/* Navigation buttons */}
            <div className="flex items-center gap-1">
              {/* Toggle sidebar button - hamburger icon */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              {/* Back to lessons */}
              <button
                onClick={() => navigate(`/course/${courseId}`)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="Back to lessons"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              {/* Home button */}
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="Home - All courses"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>
            </div>

            {/* Separator */}
            <div className="w-px h-6 bg-gray-600 mx-3"></div>

            {/* Title */}
            <div className="min-w-0 flex-1">
              <h1
                className="font-semibold truncate"
                title={formatDisplayName(course.title, replaceUnderscore)}
              >
                {formatDisplayName(course.title, replaceUnderscore)}
              </h1>
              <p
                className="text-sm text-gray-400 truncate"
                title={`${formatDisplayName(currentLesson.name, replaceUnderscore)} / ${formatDisplayName(currentVideo.name, replaceUnderscore)}`}
              >
                {formatDisplayName(currentLesson.name, replaceUnderscore)} / {formatDisplayName(currentVideo.name, replaceUnderscore)}
              </p>
            </div>

            {/* Help button */}
            <button
              onClick={() => setShowHelp(true)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors ml-2"
              title="Help"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            {/* Settings button */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Video Player Container */}
        <div
          ref={containerRef}
          className="flex-1 bg-black relative"
          onMouseMove={handleActivity}
          onClick={togglePlayPause}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          )}

          <video
            ref={videoRef}
            src={videoURL || undefined}
            className="w-full h-full"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onCanPlay={handleCanPlay}
            onEnded={handleEnded}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Subtitle Overlay */}
          {showSubtitles && currentSubtitle && (
            <div className="absolute bottom-32 left-0 right-0 flex justify-center pointer-events-none">
              <div className="subtitle-overlay bg-black/80 text-white px-6 py-3 rounded-lg text-2xl max-w-4xl text-center font-medium">
                {currentSubtitle}
              </div>
            </div>
          )}

          {/* Controls Overlay */}
          <div
            className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-6 video-controls ${showControls ? '' : 'hidden'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Progress Bar */}
            <div
              className="w-full bg-gray-700 h-1.5 rounded-full cursor-pointer mb-4 group"
              onClick={handleSeek}
            >
              <div
                className="bg-blue-600 h-1.5 rounded-full relative group-hover:h-2 transition-all"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100"></div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              {/* Left Controls */}
              <div className="flex items-center gap-2">
                {/* Restart */}
                <button onClick={restartVideo} className="p-2 hover:bg-white/10 rounded-lg" title="Restart">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>

                {/* Skip Buttons Group */}
                <div className="flex items-center bg-white/5 rounded-lg">
                  {/* Skip -5s */}
                  <button
                    onClick={() => skipSeconds(-5)}
                    className="px-2 py-1.5 hover:bg-white/10 rounded-l-lg flex items-center gap-1 transition-colors"
                    title="Back 5s"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="text-xs font-medium">5s</span>
                  </button>
                  {/* Skip +5s */}
                  <button
                    onClick={() => skipSeconds(5)}
                    className="px-2 py-1.5 hover:bg-white/10 rounded-r-lg flex items-center gap-1 transition-colors border-l border-white/10"
                    title="Forward 5s"
                  >
                    <span className="text-xs font-medium">5s</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Previous */}
                <button onClick={playPreviousVideo} className="p-2 hover:bg-white/10 rounded-lg" title="Previous video">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
                  </svg>
                </button>

                {/* Play/Pause */}
                <button onClick={togglePlayPause} className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full" title={isPlaying ? 'Pause' : 'Play'}>
                  {isPlaying ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>

                {/* Next */}
                <button onClick={playNextVideo} className="p-2 hover:bg-white/10 rounded-lg" title="Next video">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
                  </svg>
                </button>

                {/* Time Display */}
                <div className="text-sm ml-2">
                  {formatDuration(currentTime)} / {formatDuration(duration)}
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-3">
                {/* Auto-play Toggle - YouTube style */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-300">Autoplay</span>
                  <button
                    onClick={() => updatePreference('autoPlay', !preferences?.autoPlay)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      preferences?.autoPlay !== false ? 'bg-blue-600' : 'bg-gray-600'
                    }`}
                    title={preferences?.autoPlay !== false ? 'Auto-play: On' : 'Auto-play: Off'}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        preferences?.autoPlay !== false ? 'left-5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* CC (Subtitles) - always visible, disabled when no subtitles */}
                <button
                  onClick={() => {
                    if (currentVideo?.subtitleFile) {
                      const newValue = !showSubtitles;
                      setShowSubtitles(newValue);
                      updatePreference('subtitlesEnabled', newValue);
                    }
                  }}
                  disabled={!currentVideo?.subtitleFile}
                  className={`p-2 rounded-lg ${
                    !currentVideo?.subtitleFile
                      ? 'opacity-50 cursor-not-allowed'
                      : showSubtitles
                        ? 'bg-blue-600'
                        : 'hover:bg-white/10'
                  }`}
                  title={
                    !currentVideo?.subtitleFile
                      ? 'No subtitles available'
                      : showSubtitles
                        ? 'Hide subtitles'
                        : 'Show subtitles'
                  }
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </button>

                {/* Speed */}
                <select
                  value={playbackRate}
                  onChange={(e) => {
                    const rate = parseFloat(e.target.value);
                    setPlaybackRate(rate);
                    if (videoRef.current) videoRef.current.playbackRate = rate;
                    updatePreference('defaultPlaybackRate', rate);
                  }}
                  className="bg-white/10 px-2 py-1 rounded text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="2">2x</option>
                  <option value="1.75">1.75x</option>
                  <option value="1.5">1.5x</option>
                  <option value="1.25">1.25x</option>
                  <option value="1">1x</option>
                  <option value="0.75">0.75x</option>
                  <option value="0.5">0.5x</option>
                </select>

                {/* Fullscreen */}
                <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 rounded-lg" title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
                  {isFullscreen ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        preferences={preferences}
        onUpdatePreference={updatePreference}
      />

      {/* Help Panel */}
      <Help isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmStyle={confirmDialog.confirmStyle}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default VideoPlayer;
