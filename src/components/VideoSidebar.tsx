import React from 'react';
import { formatDuration } from '../utils/folderParser';
import type { VideoSidebarProps } from '../types';

const VideoSidebar: React.FC<VideoSidebarProps> = ({
  videos,
  currentVideo,
  onSelectVideo,
  progress,
  lessonName,
  isOpen,
  onToggle
}) => {
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
        className={`
          fixed lg:relative inset-y-0 left-0 z-40
          w-80 bg-gray-800 border-r border-gray-700
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          overflow-y-auto
        `}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold truncate">{lessonName}</h2>
            <button
              onClick={onToggle}
              className="lg:hidden p-1 hover:bg-gray-700 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Videos List */}
          <div className="space-y-1">
            {videos.map((video) => {
              const isActive = currentVideo?.id === video.id;
              const videoProgress = progress[video.id];
              const isCompleted = videoProgress && videoProgress.percentage > 90;
              const progressPercentage = videoProgress?.percentage || 0;

              return (
                <button
                  key={video.id}
                  onClick={() => onSelectVideo(video)}
                  className={`
                    w-full text-left px-3 py-3 rounded-lg transition-colors
                    ${isActive
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-700 text-gray-300'
                    }
                  `}
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
                        <span className="text-sm font-medium truncate">
                          {video.numberPrefix && (
                            <span className={`mr-2 ${isActive ? 'text-blue-200' : 'text-blue-400'}`}>
                              {video.numberPrefix}.
                            </span>
                          )}
                          {video.name}
                        </span>
                        {video.duration > 0 && (
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {formatDuration(video.duration)}
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {progressPercentage > 0 && !isCompleted && (
                        <div className="mt-1.5 w-full bg-gray-700 rounded-full h-1">
                          <div
                            className="bg-blue-500 h-1 rounded-full transition-all"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
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
