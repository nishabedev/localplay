import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CourseGrid from './components/CourseGrid';
import LessonGrid from './components/LessonGrid';
import VideoPlayer from './components/VideoPlayer';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CourseGrid />} />
        <Route path="/course/:courseId" element={<LessonGrid />} />
        <Route path="/play/:courseId/:lessonId" element={<VideoPlayer />} />
      </Routes>
    </Router>
  );
}

export default App;
