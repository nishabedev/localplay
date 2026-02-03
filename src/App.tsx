import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CourseGrid from './components/CourseGrid';
import LessonGrid from './components/LessonGrid';
import VideoPlayer from './components/VideoPlayer';
import { usePreferences } from './hooks/usePreferences';

function AppContent() {
  const { preferences } = usePreferences();

  // Apply theme to document
  useEffect(() => {
    const theme = preferences?.theme || 'dark';

    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    } else {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    }
  }, [preferences?.theme]);

  return (
    <Routes>
      <Route path="/" element={<CourseGrid />} />
      <Route path="/course/:courseId" element={<LessonGrid />} />
      <Route path="/play/:courseId/:lessonId" element={<VideoPlayer />} />
    </Routes>
  );
}

function App() {
  return (
    <Router basename="/projects/localplay">
      <AppContent />
    </Router>
  );
}

export default App;
