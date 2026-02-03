import React from 'react';

interface HelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const Help: React.FC<HelpProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50"
        onClick={onClose}
      />

      {/* Help Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white dark:bg-gray-800 z-50 shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Help</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Help Content */}
        <div className="p-4 space-y-6 text-gray-700 dark:text-gray-300">

          {/* Getting Started */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Getting Started
            </h3>
            <p className="text-sm mb-2">
              LocalPlay lets you watch video courses from your local folders. Click <strong>"Add Video Folder"</strong> to select a course folder from your computer.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Your browser will ask for read-only access to the selected folder. No files are modified or uploaded - everything stays on your device.
            </p>
          </section>

          {/* Folder Structure */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Folder Structure
            </h3>
            <p className="text-sm mb-3">Organize your videos in this structure: <strong>Course → Lessons → Videos</strong></p>
            <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-3 text-xs font-mono">
              <div>Course Folder/</div>
              <div className="ml-4">01. Lesson One/</div>
              <div className="ml-8">01. Video.mp4</div>
              <div className="ml-8">02. Video.mp4</div>
              <div className="ml-4">02. Lesson Two/</div>
              <div className="ml-8">01. Video.mp4</div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Think of it like a TV show: Course = Series, Lesson = Season, Video = Episode
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Tip: Prefix folders/files with numbers (01, 02) to maintain order.
            </p>
          </section>

          {/* Subtitles */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Adding Subtitles
            </h3>
            <p className="text-sm mb-3">
              Place <code className="bg-gray-100 dark:bg-gray-900 px-1 rounded">.srt</code> files in a <code className="bg-gray-100 dark:bg-gray-900 px-1 rounded">_subtitles</code> folder next to your lesson:
            </p>
            <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-3 text-xs font-mono">
              <div>01. Lesson One/</div>
              <div className="ml-4">01. Video.mp4</div>
              <div>01. Lesson One_subtitles/</div>
              <div className="ml-4">01. Video.srt</div>
            </div>
          </section>

          {/* Install as App */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Install as App
            </h3>
            <p className="text-sm mb-2">
              LocalPlay is a Progressive Web App (PWA). Install it for a native app experience that works fully offline:
            </p>
            <ul className="text-sm space-y-2 ml-4 list-disc">
              <li><strong>Chrome/Edge:</strong> Click the install icon in the address bar, or Menu → "Install LocalPlay"</li>
              <li><strong>Safari (Mac):</strong> File → "Add to Dock"</li>
              <li><strong>iOS:</strong> Tap Share → "Add to Home Screen"</li>
              <li><strong>Android:</strong> Tap Menu → "Add to Home Screen"</li>
            </ul>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Once installed, LocalPlay works completely offline - no internet required.
            </p>
          </section>

          {/* Features */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Features
            </h3>
            <ul className="text-sm space-y-2 ml-4 list-disc">
              <li><strong>Progress Tracking:</strong> Your watch progress is saved automatically</li>
              <li><strong>Auto-play:</strong> Automatically plays the next video when enabled</li>
              <li><strong>Resume:</strong> Continue from where you left off</li>
              <li><strong>Resizable Sidebar:</strong> Drag the sidebar edge to resize</li>
              <li><strong>Keyboard:</strong> Space to play/pause, arrow keys to seek</li>
            </ul>
          </section>

          {/* Supported Formats */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Supported Formats
            </h3>
            <p className="text-sm">
              <strong>Video:</strong> MP4, WebM, MOV, MKV (browser dependent)<br />
              <strong>Subtitles:</strong> SRT
            </p>
          </section>

          {/* Privacy */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Privacy
            </h3>
            <p className="text-sm">
              All data stays on your device. No files are uploaded to any server. Your progress and preferences are stored locally in your browser.
            </p>
          </section>

        </div>
      </div>
    </>
  );
};

export default Help;
