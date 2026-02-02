import React, { useState, useRef, useEffect } from 'react';
import { formatDuration, formatDisplayName } from '../utils/folderParser';
import DropdownMenu from './DropdownMenu';
import type { VideoSidebarProps } from '../types';

const VideoSidebar: React.FC<VideoSidebarProps> = ({
  videos,
  currentVideo,
  onSelectVideo,
  progress,
  lessonName,
  isOpen,
  onToggle,
  width = 320,
  onWidthChange,
  replaceUnderscore = true,
  onMarkVideoComplete,
  onResetVideoProgress,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeVideoRef = useRef<HTMLDivElement>(null);

  // Scroll to active video when it changes
  useEffect(() => {
    if (currentVideo && activeVideoRef.current) {
      // Small delay to ensure the element is rendered
      setTimeout(() => {
        activeVideoRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, [currentVideo?.id]);

  // Handle drag resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !onWidthChange) return;
      const newWidth = Math.max(200, Math.min(500, e.clientX));
      onWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, onWidthChange]);
  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={onToggle}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-lg hover:bg-gray-700"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        style={{ width: `${width}px` }}
        className={`
          fixed lg:relative inset-y-0 left-0 z-40
          bg-gray-800 border-r border-gray-700
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col flex-shrink-0 overflow-hidden
        `}
      >
        {/* Sticky Header - Title and Progress Bar */}
        <div className="flex-shrink-0 p-4 pb-3 border-b border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold line-clamp-2" title={lessonName}>{lessonName}</h2>
            <button
              onClick={onToggle}
              className="lg:hidden p-1 hover:bg-gray-700 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Lesson Progress Bar */}
          {(() => {
            const completedVideos = videos.filter(v => {
              const p = progress[v.id];
              return p && p.percentage > 90;
            }).length;
            const lessonProgress = videos.length > 0 ? Math.round((completedVideos / videos.length) * 100) : 0;

            // Calculate total and remaining duration
            const totalDuration = videos.reduce((sum, v) => sum + (v.duration || 0), 0);
            const watchedDuration = videos.reduce((sum, v) => {
              const p = progress[v.id];
              if (p && p.percentage > 90) {
                return sum + (v.duration || 0);
              }
              return sum;
            }, 0);
            const remainingDuration = totalDuration - watchedDuration;

            // Format duration as hours and minutes
            const formatHoursMinutes = (seconds: number): string => {
              const hours = Math.floor(seconds / 3600);
              const minutes = Math.floor((seconds % 3600) / 60);
              if (hours > 0) {
                return `${hours}h ${minutes}m`;
              }
              return `${minutes}m`;
            };

            return (
              <div className="mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          lessonProgress === 100 ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${lessonProgress}%` }}
                      />
                    </div>
                  </div>
                  <span className={`text-xs font-medium min-w-[2.5rem] text-right ${
                    lessonProgress === 100 ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    {lessonProgress}%
                  </span>
                </div>
                <p className={`text-[10px] mt-1 ${
                  lessonProgress === 100 ? 'text-green-400' : 'text-gray-500'
                }`}>
                  {lessonProgress === 100
                    ? `Completed • ${formatHoursMinutes(totalDuration)}`
                    : `${formatHoursMinutes(remainingDuration)} left of ${formatHoursMinutes(totalDuration)}`
                  }
                </p>
              </div>
            );
          })()}
        </div>

        {/* Scrollable Videos List */}
        <div className="flex-1 overflow-y-auto p-4 pt-2">
          <div className="space-y-1">
            {videos.map((video) => {
              const isActive = currentVideo?.id === video.id;
              const videoProgress = progress[video.id];
              const isCompleted = videoProgress && videoProgress.percentage > 90;
              const progressPercentage = videoProgress?.percentage || 0;

              return (
                <div
                  key={video.id}
                  ref={isActive ? activeVideoRef : null}
                  className={`
                    flex items-center rounded-lg transition-colors group/video
                    ${isActive
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-700 text-gray-300'
                    }
                  `}
                >
                  <button
                    onClick={() => onSelectVideo(video)}
                    className="flex-1 text-left px-3 py-3"
                  >
                    <div className="flex items-start gap-3">
                      {/* Play Icon or Checkmark */}
                      <div className="flex-shrink-0 mt-0.5">
                        {isCompleted ? (
                          <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg
                            className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                          </svg>
                        )}
                      </div>

                      {/* Video Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className="text-sm font-medium break-words"
                            title={video.numberPrefix ? `${video.numberPrefix}. ${formatDisplayName(video.name, replaceUnderscore)}` : formatDisplayName(video.name, replaceUnderscore)}
                          >
                            {video.numberPrefix && (
                              <span className="mr-1">
                                {video.numberPrefix}.
                              </span>
                            )}
                            {formatDisplayName(video.name, replaceUnderscore)}
                          </span>
                          {video.duration > 0 && (
                            <span className={`text-xs flex-shrink-0 mt-0.5 ${isActive ? 'text-blue-200' : 'text-gray-400'}`}>
                              {formatDuration(video.duration)}
                            </span>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div
                          className={`mt-1.5 w-full rounded-full h-1 transition-all duration-300 ${
                            progressPercentage > 0 && !isCompleted
                              ? `opacity-100 ${isActive ? 'bg-blue-400/30' : 'bg-gray-700'}`
                              : 'opacity-0 bg-transparent'
                          }`}
                        >
                          <div
                            className={`h-1 rounded-full transition-all duration-300 ${isActive ? 'bg-white' : 'bg-blue-500'}`}
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Video Options Menu */}
                  {onMarkVideoComplete && onResetVideoProgress && (
                    <div className="pr-2 flex-shrink-0 opacity-0 group-hover/video:opacity-100 transition-opacity">
                      <DropdownMenu
                        buttonClassName="p-1.5 bg-gray-900/70 hover:bg-gray-900/90 shadow-md"
                        iconColor="white"
                        items={[
                          {
                            label: 'Mark as complete',
                            icon: (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ),
                            onClick: () => onMarkVideoComplete(video),
                          },
                          {
                            label: 'Reset progress',
                            icon: (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            ),
                            onClick: () => onResetVideoProgress(video),
                            danger: true,
                          },
                        ]}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Drag handle for resizing */}
        <div
          onMouseDown={() => setIsDragging(true)}
          className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-blue-500 transition-colors hidden lg:block"
        />
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
        />
      )}
    </>
  );
};

export default VideoSidebar;
