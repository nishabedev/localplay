import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllCourses } from '../utils/storage';
import { formatDisplayName } from '../utils/folderParser';
import { parseSRT } from '../utils/subtitleParser';
import { usePreferences } from '../hooks/usePreferences';
import type { Course, Video } from '../types';

interface SearchResult {
  course: Course;
  lessonId: string;
  lessonName: string;
  video: Video;
  matchType: 'title' | 'subtitle';
  snippet?: string;
  seekTime?: number;
}

const Search: React.FC = () => {
  const navigate = useNavigate();
  const { preferences } = usePreferences();
  const [query, setQuery] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const replaceUnderscore = preferences?.replaceUnderscoreWithColon ?? true;

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    const all = await getAllCourses();
    const valid = all.filter(
      c => c.lessons && c.lessons.length > 0 && c.lessons[0].videos !== undefined
    );
    setCourses(valid);
  };

  // Find the seek time for a subtitle match by parsing the SRT cues
  const findSeekTime = async (video: Video, queryLower: string): Promise<number | undefined> => {
    if (!video.subtitleFile) return undefined;
    try {
      const file = await video.subtitleFile.getFile();
      const content = await file.text();
      const cues = parseSRT(content);
      const match = cues.find(cue => cue.text.toLowerCase().includes(queryLower));
      return match?.startTime;
    } catch {
      return undefined;
    }
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const matches: SearchResult[] = [];

    for (const course of courses) {
      for (const lesson of course.lessons) {
        for (const video of lesson.videos) {
          const titleMatch = video.name.toLowerCase().includes(q);
          const subtitleMatch = video.subtitleText?.toLowerCase().includes(q);

          if (titleMatch) {
            matches.push({
              course,
              lessonId: lesson.id,
              lessonName: lesson.name,
              video,
              matchType: 'title',
            });
          }

          if (subtitleMatch && video.subtitleText) {
            const text = video.subtitleText;
            const idx = text.toLowerCase().indexOf(q);
            const start = Math.max(0, idx - 30);
            const end = Math.min(text.length, idx + q.length + 30);
            let snippet = '';
            if (start > 0) snippet += '...';
            snippet += text.slice(start, end);
            if (end < text.length) snippet += '...';

            matches.push({
              course,
              lessonId: lesson.id,
              lessonName: lesson.name,
              video,
              matchType: 'subtitle',
              snippet,
            });
          }
        }
      }
    }

    return matches;
  }, [query, courses]);

  // Group results by course > lesson
  const grouped = useMemo(() => {
    const map = new Map<string, Map<string, SearchResult[]>>();

    for (const result of results) {
      if (!map.has(result.course.id)) {
        map.set(result.course.id, new Map());
      }
      const courseMap = map.get(result.course.id)!;
      if (!courseMap.has(result.lessonId)) {
        courseMap.set(result.lessonId, []);
      }
      courseMap.get(result.lessonId)!.push(result);
    }

    return map;
  }, [results]);

  const handleResultClick = async (result: SearchResult) => {
    let url = `/play/${result.course.id}/${result.lessonId}?videoId=${encodeURIComponent(result.video.id)}`;

    if (result.matchType === 'subtitle') {
      const seekTime = await findSeekTime(result.video, query.trim().toLowerCase());
      if (seekTime !== undefined) {
        url += `&t=${seekTime}`;
      }
    }

    navigate(url);
  };

  const highlightMatch = (text: string, q: string) => {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="bg-yellow-400/30 text-yellow-200 rounded px-0.5">{text.slice(idx, idx + q.length)}</span>
        {text.slice(idx + q.length)}
      </>
    );
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Back"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold">Search</h1>
        </div>

        {/* Search input */}
        <div className="relative mb-6">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search videos and subtitles..."
            className="w-full pl-12 pr-4 py-3.5 bg-gray-800 border border-gray-700 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
            autoFocus
          />
        </div>

        {/* No results */}
        {query && results.length === 0 && (
          <div className="text-center text-gray-500 py-16">
            <svg className="w-10 h-10 mx-auto mb-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="font-semibold">No results for "{query}"</p>
          </div>
        )}

        {/* Results grouped by course > lesson */}
        {Array.from(grouped.entries()).map(([courseId, lessonMap]) => {
          const firstResult = lessonMap.values().next().value;
          const courseName = firstResult ? formatDisplayName(firstResult[0].course.title, replaceUnderscore) : '';

          return (
            <div key={courseId} className="mb-6">
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  {courseName}
                </h3>
              </div>

              {Array.from(lessonMap.entries()).map(([lessonId, lessonResults]) => (
                <div key={lessonId} className="mb-4">
                  <div className="px-1 mb-1">
                    <span className="text-xs text-gray-500 font-medium">
                      {formatDisplayName(lessonResults[0].lessonName, replaceUnderscore)}
                    </span>
                  </div>
                  <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50">
                    {lessonResults.map((result, i) => (
                      <button
                        key={`${result.video.id}-${result.matchType}-${i}`}
                        onClick={() => handleResultClick(result)}
                        className={`block w-full text-left px-4 py-3 hover:bg-gray-700/50 transition-colors ${
                          i > 0 ? 'border-t border-gray-700/50' : ''
                        } ${i === 0 ? 'rounded-t-2xl' : ''} ${i === lessonResults.length - 1 ? 'rounded-b-2xl' : ''}`}
                      >
                        <span className="text-sm font-semibold text-gray-200">
                          {highlightMatch(formatDisplayName(result.video.name, replaceUnderscore), query.trim())}
                        </span>
                        {result.matchType === 'subtitle' && result.snippet && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                            <svg className="w-3 h-3 inline mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                            {highlightMatch(result.snippet, query.trim())}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })}

        {/* Empty state */}
        {!query && (
          <div className="text-center text-gray-600 py-16">
            <svg className="w-10 h-10 mx-auto mb-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="font-semibold">Search across all videos and subtitles</p>
            <p className="text-sm text-gray-700 mt-1">Find any video by title or subtitle content</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
