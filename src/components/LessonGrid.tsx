import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProgress } from '../hooks/useProgress';
import { usePreferences } from '../hooks/usePreferences';
import { getCourse } from '../utils/storage';
import { formatTotalDuration, formatDisplayName } from '../utils/folderParser';
import Settings from './Settings';
import Help from './Help';
import ConfirmDialog from './ConfirmDialog';
import DropdownMenu from './DropdownMenu';
import type { Course, Lesson } from '../types';

const LessonGrid: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { getLessonProgress, allProgress, resetLessonProgress, markLessonComplete, removeFromRecents } = useProgress();
  const { preferences, updatePreference } = usePreferences();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmStyle?: 'danger' | 'primary';
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const replaceUnderscore = preferences?.replaceUnderscoreWithColon ?? true;

  // Get recent lessons based on video progress timestamps
  const getRecentLessons = (): Lesson[] => {
    if (!course?.lessons) return [];

    // Get lessons with their most recent watch timestamp
    const lessonsWithTimestamp = course.lessons.map(lesson => {
      let mostRecentTimestamp = 0;

      if (lesson.videos) {
        lesson.videos.forEach(video => {
          const progress = allProgress[video.id];
          if (progress?.lastWatched && progress.lastWatched > mostRecentTimestamp) {
            mostRecentTimestamp = progress.lastWatched;
          }
        });
      }

      return { lesson, timestamp: mostRecentTimestamp };
    });

    // Filter lessons that have been watched and sort by most recent
    return lessonsWithTimestamp
      .filter(item => item.timestamp > 0)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 4) // Show up to 4 recent lessons
      .map(item => item.lesson);
  };

  const recentLessons = getRecentLessons();

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async (): Promise<void> => {
    if (!courseId) {
      navigate('/');
      return;
    }

    const c = await getCourse(courseId);
    if (!c) {
      navigate('/');
      return;
    }

    setCourse(c);
    setLoading(false);
  };

  const handleOpenLesson = (lessonId: string): void => {
    navigate(`/play/${courseId}/${lessonId}`);
  };

  const handleBack = (): void => {
    navigate('/');
  };

  if (loading || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-gray-400">Loading course...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with back and home buttons */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center">
            {/* Navigation buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="Back to courses"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="Home - All courses"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>
            </div>

            {/* Separator */}
            <div className="w-px h-8 bg-gray-700 mx-4"></div>

            {/* Title */}
            <div>
              <h1 className="text-3xl font-bold" title={formatDisplayName(course.title, replaceUnderscore)}>
                {formatDisplayName(course.title, replaceUnderscore)}
              </h1>
              <p className="text-gray-400">
                {course.totalLessons} lessons, {course.totalVideos} videos
                {course.totalDuration > 0 && ` • ${formatTotalDuration(course.totalDuration)}`}
              </p>
            </div>
          </div>

          {/* Help and Settings buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowHelp(true)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Help"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Settings"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Recent Section */}
        {recentLessons.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-gray-300 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Recent
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentLessons.map((lesson) => {
                const progress = getLessonProgress(lesson);

                return (
                  <LessonCard
                    key={`recent-${lesson.id}`}
                    lesson={lesson}
                    progress={progress}
                    onOpen={handleOpenLesson}
                    replaceUnderscore={replaceUnderscore}
                    compact
                    onRemoveFromRecents={() => {
                      setConfirmDialog({
                        isOpen: true,
                        title: 'Remove from Recents',
                        message: 'Remove this lesson from your recent list? Your progress will be preserved.',
                        confirmStyle: 'danger',
                        onConfirm: async () => {
                          await removeFromRecents(lesson);
                          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                        },
                      });
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* All Lessons Grid */}
        {course.lessons.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <h2 className="text-xl font-semibold mb-2 text-gray-300">No Lessons Found</h2>
            <p className="text-gray-500">This course doesn't have any lesson folders with videos.</p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-4 text-gray-300">All Lessons</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {course.lessons.map((lesson) => {
                const progress = getLessonProgress(lesson);

                return (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    progress={progress}
                    onOpen={handleOpenLesson}
                    replaceUnderscore={replaceUnderscore}
                    onMarkComplete={() => {
                      setConfirmDialog({
                        isOpen: true,
                        title: 'Mark Lesson Complete',
                        message: 'Mark all videos in this lesson as completed?',
                        confirmStyle: 'primary',
                        onConfirm: async () => {
                          await markLessonComplete(lesson);
                          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                        },
                      });
                    }}
                    onResetProgress={() => {
                      setConfirmDialog({
                        isOpen: true,
                        title: 'Reset Progress',
                        message: 'Reset progress for all videos in this lesson?',
                        confirmStyle: 'danger',
                        onConfirm: async () => {
                          await resetLessonProgress(lesson);
                          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                        },
                      });
                    }}
                  />
                );
              })}
            </div>
          </>
        )}
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

// LessonCard sub-component
interface LessonCardProps {
  lesson: Lesson;
  progress: number;
  onOpen: (lessonId: string) => void;
  replaceUnderscore: boolean;
  compact?: boolean;
  onMarkComplete?: () => void;
  onResetProgress?: () => void;
  onRemoveFromRecents?: () => void;
}

const LessonCard: React.FC<LessonCardProps> = ({ lesson, progress, onOpen, replaceUnderscore, compact = false, onMarkComplete, onResetProgress, onRemoveFromRecents }) => {
  const displayName = formatDisplayName(lesson.name, replaceUnderscore);
  return (
    <div
      onClick={() => onOpen(lesson.id)}
      className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 ring-blue-500 transition-all group"
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-green-900 to-teal-900 flex items-center justify-center relative overflow-hidden">
        {lesson.thumbnail ? (
          <img
            src={lesson.thumbnail}
            alt={lesson.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <svg className={`${compact ? 'w-12 h-12' : 'w-20 h-20'} text-white/30`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        )}

        {/* Lesson number badge */}
        {lesson.numberPrefix && (
          <div className={`absolute top-2 left-2 bg-black/70 px-2 py-1 rounded ${compact ? 'text-xs' : 'text-sm'} font-medium`}>
            {lesson.numberPrefix}
          </div>
        )}

        {/* Completed badge */}
        {progress === 100 && (
          <div className={`absolute ${compact ? 'top-1 right-1' : 'top-2 right-2'} bg-green-600 rounded-full ${compact ? 'p-0.5' : 'p-1'}`}>
            <svg className={`${compact ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {/* Options Menu - for non-compact cards */}
        {!compact && onMarkComplete && onResetProgress && progress !== 100 && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu
              buttonClassName="bg-gray-900/70 hover:bg-gray-900/90 shadow-md"
              iconColor="white"
              items={[
                {
                  label: 'Mark as complete',
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ),
                  onClick: onMarkComplete,
                },
                {
                  label: 'Reset progress',
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ),
                  onClick: onResetProgress,
                  danger: true,
                },
              ]}
            />
          </div>
        )}

        {/* Options Menu - for compact cards (Recent section) */}
        {compact && onRemoveFromRecents && (
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu
              buttonClassName="bg-gray-900/70 hover:bg-gray-900/90 shadow-md p-1.5"
              iconColor="white"
              items={[
                {
                  label: 'Remove from recents',
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ),
                  onClick: onRemoveFromRecents,
                  danger: true,
                },
              ]}
            />
          </div>
        )}

        {/* Play overlay on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <div className={`${compact ? 'w-10 h-10' : 'w-16 h-16'} bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center`}>
            <svg className={`${compact ? 'w-5 h-5' : 'w-8 h-8'} text-white ml-0.5`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Progress bar overlay at bottom for compact cards */}
        {compact && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-900/50">
            <div
              className={`h-full ${progress === 100 ? 'bg-green-600' : 'bg-blue-600'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Info */}
      <div className={compact ? 'p-2' : 'p-4'}>
        <h3
          className={`font-semibold ${compact ? 'text-sm' : 'text-lg'} mb-1 truncate`}
          title={lesson.numberPrefix ? `${lesson.numberPrefix}. ${displayName}` : displayName}
        >
          {lesson.numberPrefix && <span className="mr-1">{lesson.numberPrefix}.</span>}
          {displayName}
        </h3>
        {!compact && (
          <>
            <p className="text-sm text-gray-400 mb-3">
              {lesson.totalVideos} videos
              {lesson.totalDuration > 0 && ` • ${formatTotalDuration(lesson.totalDuration)}`}
            </p>

            {/* Progress Bar */}
            <div
              className={`transition-all duration-300 overflow-hidden ${
                progress > 0 ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0'
              }`}
            >
              <div className="flex justify-between text-xs text-gray-400 dark:text-gray-400 mb-1">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${progress === 100 ? 'bg-green-600' : 'bg-blue-600'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LessonGrid;
