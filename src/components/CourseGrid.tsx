import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFileSystem } from '../hooks/useFileSystem';
import { useProgress } from '../hooks/useProgress';
import { usePreferences } from '../hooks/usePreferences';
import { getAllCourses, deleteCourse, deleteFolderHandle } from '../utils/storage';
import { formatTotalDuration, formatDisplayName } from '../utils/folderParser';
import Settings from './Settings';
import Help from './Help';
import ConfirmDialog from './ConfirmDialog';
import DropdownMenu from './DropdownMenu';
import type { Course } from '../types';

const CourseGrid: React.FC = () => {
  const navigate = useNavigate();
  const { selectFolder, isLoading, error, isSupported } = useFileSystem();
  const { getCourseProgress, resetCourseProgress, markCourseComplete } = useProgress();
  const { preferences, updatePreference } = usePreferences();
  const [courses, setCourses] = useState<Course[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmStyle?: 'danger' | 'primary';
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async (): Promise<void> => {
    const c = await getAllCourses();
    // Filter out old-format courses that don't have the new structure
    const validCourses = c.filter(course =>
      course.lessons &&
      course.lessons.length > 0 &&
      course.lessons[0].videos !== undefined
    );
    setCourses(validCourses);
  };

  const handleAddFolder = async (): Promise<void> => {
    const course = await selectFolder();
    if (course) {
      await loadCourses();
    }
  };

  const handleOpenCourse = (courseId: string): void => {
    navigate(`/course/${courseId}`);
  };

  const handleDeleteCourse = async (course: Course): Promise<void> => {
    // Clear progress data for all videos in the course
    await resetCourseProgress(course);
    await deleteCourse(course.id);
    await deleteFolderHandle(course.id);
    await loadCourses();
  };

  if (!isSupported) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-400">Browser Not Supported</h1>
          <p className="text-gray-400 mb-4">
            LocalPlay requires the File System Access API, which is available in:
          </p>
          <ul className="text-gray-300 mb-6 space-y-2">
            <li>✓ Chrome 86+</li>
            <li>✓ Edge 86+</li>
            <li>✓ Opera 72+</li>
          </ul>
          <p className="text-sm text-gray-500">
            Please open LocalPlay in one of these browsers to continue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">LocalPlay</h1>
            <p className="text-gray-400">Your offline video collections</p>
          </div>
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

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {/* Add Folder Button */}
        <button
          onClick={handleAddFolder}
          disabled={isLoading}
          className="mb-8 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Video Folder
            </>
          )}
        </button>

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <h2 className="text-xl font-semibold mb-2 text-gray-300">No Courses Yet</h2>
            <p className="text-gray-500">Click "Add Video Folder" to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const progress = getCourseProgress(course);

              return (
                <div
                  key={course.id}
                  onClick={() => handleOpenCourse(course.id)}
                  className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 ring-blue-500 transition-all group"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center relative">
                    {/* Default icon (faded) */}
                    <svg className="w-20 h-20 text-white/20" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                    </svg>

                    {/* Play overlay on hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>

                    {/* Options Menu */}
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
                            onClick: () => {
                              setConfirmDialog({
                                isOpen: true,
                                title: 'Mark Course Complete',
                                message: 'Mark all videos in this course as completed?',
                                confirmStyle: 'primary',
                                onConfirm: async () => {
                                  await markCourseComplete(course);
                                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                },
                              });
                            },
                          },
                          {
                            label: 'Reset progress',
                            icon: (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            ),
                            onClick: () => {
                              setConfirmDialog({
                                isOpen: true,
                                title: 'Reset Progress',
                                message: 'Reset progress for all videos in this course?',
                                confirmStyle: 'danger',
                                onConfirm: async () => {
                                  await resetCourseProgress(course);
                                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                },
                              });
                            },
                            danger: true,
                          },
                          {
                            label: 'Remove course',
                            icon: (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            ),
                            onClick: () => {
                              setConfirmDialog({
                                isOpen: true,
                                title: 'Remove Course',
                                message: 'Remove this course from your library? Your files will not be deleted.',
                                confirmStyle: 'danger',
                                onConfirm: async () => {
                                  await handleDeleteCourse(course);
                                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                },
                              });
                            },
                            danger: true,
                          },
                        ]}
                      />
                    </div>

                    {/* Completed badge */}
                    {progress === 100 && (
                      <div className="absolute top-2 left-2 bg-green-600 rounded-full p-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3
                      className="font-semibold text-lg mb-1 truncate"
                      title={formatDisplayName(course.title, preferences?.replaceUnderscoreWithColon ?? true)}
                    >
                      {formatDisplayName(course.title, preferences?.replaceUnderscoreWithColon ?? true)}
                    </h3>
                    <p className="text-sm text-gray-400 mb-3">
                      {course.totalLessons} lessons, {course.totalVideos} videos
                      {course.totalDuration > 0 && ` • ${formatTotalDuration(course.totalDuration)}`}
                    </p>

                    {/* Progress Bar */}
                    <div
                      className={`transition-all duration-300 overflow-hidden ${
                        progress > 0 ? 'opacity-100 max-h-20 mt-0' : 'opacity-0 max-h-0'
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
                  </div>
                </div>
              );
            })}
          </div>
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

export default CourseGrid;
