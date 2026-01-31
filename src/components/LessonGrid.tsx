import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProgress } from '../hooks/useProgress';
import { getCourse } from '../utils/storage';
import type { Course, Lesson } from '../types';

const LessonGrid: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { getLessonProgress } = useProgress();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

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
        {/* Header with back button */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold">{course.title}</h1>
            <p className="text-gray-400">
              {course.totalLessons} lessons, {course.totalVideos} videos
            </p>
          </div>
        </div>

        {/* Lessons Grid */}
        {course.lessons.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <h2 className="text-xl font-semibold mb-2 text-gray-300">No Lessons Found</h2>
            <p className="text-gray-500">This course doesn't have any lesson folders with videos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {course.lessons.map((lesson) => {
              const progress = getLessonProgress(lesson);

              return (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  progress={progress}
                  onOpen={handleOpenLesson}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// LessonCard sub-component
interface LessonCardProps {
  lesson: Lesson;
  progress: number;
  onOpen: (lessonId: string) => void;
}

const LessonCard: React.FC<LessonCardProps> = ({ lesson, progress, onOpen }) => {
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
          <svg className="w-20 h-20 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        )}

        {/* Lesson number badge */}
        {lesson.numberPrefix && (
          <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-sm font-medium">
            {lesson.numberPrefix}
          </div>
        )}

        {/* Completed badge */}
        {progress === 100 && (
          <div className="absolute top-2 right-2 bg-green-600 rounded-full p-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {/* Play overlay on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
          </svg>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 truncate">
          {lesson.numberPrefix && <span className="text-blue-400 mr-2">{lesson.numberPrefix}.</span>}
          {lesson.name}
        </h3>
        <p className="text-sm text-gray-400 mb-3">{lesson.totalVideos} videos</p>

        {/* Progress Bar */}
        {progress > 0 && (
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${progress === 100 ? 'bg-green-600' : 'bg-blue-600'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonGrid;
