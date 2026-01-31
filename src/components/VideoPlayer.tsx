import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getVideoURL, formatDuration } from '../utils/folderParser';
import { getCourse, getFolderHandle } from '../utils/storage';
import { useProgress } from '../hooks/useProgress';
import { useControls } from '../hooks/useControls';
import VideoSidebar from './VideoSidebar';
import type { Course, Lesson, Video } from '../types';

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  const { updateProgress, allProgress, loadProgress } = useProgress(currentVideo?.id);
  const { showControls, handleActivity } = useControls(isPlaying);

  // Load course and lesson
  useEffect(() => {
    loadCourseAndLesson();
  }, [courseId, lessonId]);

  // Load video when current video changes
  useEffect(() => {
    if (currentVideo) {
      loadVideo();
    }
  }, [currentVideo]);

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
    }, 5000); // Save every 5 seconds

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

      // Load the first video or resume from last watched
      if (lesson.videos.length > 0) {
        setCurrentVideo(lesson.videos[0]);
      }

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

  const handleSelectVideo = (video: Video): void => {
    // Save current progress before switching
    if (currentVideo && videoRef.current) {
      updateProgress(
        currentVideo.id,
        videoRef.current.currentTime,
        videoRef.current.duration
      );
    }

    setCurrentVideo(video);
    setSidebarOpen(false); // Close on mobile
  };

  const playNextVideo = (): void => {
    if (!currentLesson || !currentVideo) return;

    const currentIndex = currentLesson.videos.findIndex(v => v.id === currentVideo.id);
    if (currentIndex < currentLesson.videos.length - 1) {
      handleSelectVideo(currentLesson.videos[currentIndex + 1]);
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

    // Auto-play next video
    playNextVideo();
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

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <VideoSidebar
        videos={currentLesson.videos}
        currentVideo={currentVideo}
        onSelectVideo={handleSelectVideo}
        progress={allProgress}
        lessonName={currentLesson.name}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Player Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/course/${courseId}`)}
                className="p-2 hover:bg-gray-700 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="font-semibold">{course.title}</h1>
                <p className="text-sm text-gray-400">
                  {currentLesson.name} / {currentVideo.name}
                </p>
              </div>
            </div>
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
            onEnded={handleEnded}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

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
              <div className="flex items-center gap-4">
                <button onClick={playPreviousVideo} className="p-2 hover:bg-white/10 rounded-lg">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
                  </svg>
                </button>

                <button onClick={togglePlayPause} className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full">
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

                <button onClick={playNextVideo} className="p-2 hover:bg-white/10 rounded-lg">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
                  </svg>
                </button>

                <div className="text-sm">
                  {formatDuration(currentTime)} / {formatDuration(duration)}
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-4">
                {/* Speed */}
                <select
                  value={playbackRate}
                  onChange={(e) => {
                    const rate = parseFloat(e.target.value);
                    setPlaybackRate(rate);
                    if (videoRef.current) videoRef.current.playbackRate = rate;
                  }}
                  className="bg-white/10 px-2 py-1 rounded text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="0.5">0.5x</option>
                  <option value="0.75">0.75x</option>
                  <option value="1">1x</option>
                  <option value="1.25">1.25x</option>
                  <option value="1.5">1.5x</option>
                  <option value="2">2x</option>
                </select>

                <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 rounded-lg">
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
    </div>
  );
};

export default VideoPlayer;
